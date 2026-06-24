/**
 * Gestion des GROUPES (ex-organisations) :
 *  - createGroup   : crée un groupe, y rattache le créateur, partage ses données
 *  - generateCode  : (chef uniquement) génère un code d'invitation valable 30 min
 *  - joinGroup     : rejoint un groupe via un code valide ; partage les données du membre
 *  - leaveGroup    : quitte le groupe ; les données du membre redeviennent privées
 *
 * Le partage se fait en marquant organization_id = id du groupe sur toutes les
 * entités créées par l'utilisateur. On utilise le rôle service pour lire le
 * groupe par code (un non-membre n'y a pas accès via RLS) et migrer les données.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Entités possédant un champ organization_id (donc partageables dans le groupe).
const SHARED = [
  "Player", "Club", "Contact", "ClubContact", "WatchList", "Reminder", "Transfer",
  "PlayerNote", "PlayerCareerHistory", "PlayerMarketValue", "PlayerSeasonStats",
  "Team", "TeamPlayer", "Match", "AgentInsight", "Commission", "Document",
  "Mandate", "Opportunity", "Pipeline", "PlayerVideo", "TransferNegociation",
];

const CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Code lisible : 6 caractères, sans caractères ambigus (0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(): string {
  let c = "";
  for (let i = 0; i < 6; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return c;
}

// Marque (ou démarque, orgId=null) toutes les données de l'utilisateur.
// Renvoie un détail par entité + les erreurs (diagnostic, ne les avale plus).
async function stampUserData(svc: any, userId: string, orgId: string | null) {
  let updated = 0;
  const perEntity: Record<string, number> = {};
  const errors: string[] = [];
  for (const ent of SHARED) {
    try {
      const records = await svc.entities[ent].filter({ created_by_id: userId });
      let n = 0;
      for (const r of records) {
        if ((r.organization_id ?? null) !== orgId) {
          await svc.entities[ent].update(r.id, { organization_id: orgId });
          n++;
        }
      }
      if (n > 0) perEntity[ent] = n;
      updated += n;
    } catch (e: any) {
      errors.push(`${ent}: ${e?.message || "erreur"}`);
    }
  }
  return { updated, perEntity, errors };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const svc = base44.asServiceRole;

    const { action, nom, code } = await req.json();

    // ── Liste des membres du groupe (visible par TOUS les membres) ────────────
    // User.list() est réservé aux admins → on passe par le rôle service pour
    // que chaque membre puisse voir qui est dans le groupe et qui est le chef.
    if (action === "getMembers") {
      if (!user.organization_id) return Response.json({ ok: true, members: [], org: null });
      const org = (await svc.entities.Organization.filter({ id: user.organization_id }))[0] || null;
      const users = await svc.entities.User.filter({ organization_id: user.organization_id });
      const members = (users || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name || null,
        email: u.email || null,
        role_metier: u.role_metier || null,
        isChef: !!org && org.created_by_id === u.id,
      }));
      return Response.json({
        ok: true,
        members,
        org: org ? { id: org.id, nom: org.nom, created_by_id: org.created_by_id, invite_code: org.invite_code, invite_code_expires: org.invite_code_expires } : null,
      });
    }

    // ── Créer un groupe ──────────────────────────────────────────────────────
    if (action === "createGroup") {
      // Seul un CEO peut créer un groupe.
      if (user.role_metier !== "CEO") {
        return Response.json({ ok: false, error: "Seul un CEO peut créer un groupe." });
      }
      if (!nom?.trim()) return Response.json({ ok: false, error: "Nom du groupe requis." });
      const invite = genCode();
      const expires = new Date(Date.now() + CODE_TTL_MS).toISOString();
      const org = await base44.entities.Organization.create({
        nom: nom.trim(), invite_code: invite, invite_code_expires: expires,
      });
      await base44.auth.updateMe({ organization_id: org.id });
      const res = await stampUserData(svc, user.id, org.id);
      return Response.json({ ok: true, group: { id: org.id, nom: org.nom, invite_code: invite, invite_code_expires: expires }, stamped: res.updated, details: res.perEntity, errors: res.errors });
    }

    // ── (Chef) (re)générer un code d'invitation ──────────────────────────────
    if (action === "generateCode") {
      if (!user.organization_id) return Response.json({ ok: false, error: "Vous n'êtes dans aucun groupe." });
      const org = (await svc.entities.Organization.filter({ id: user.organization_id }))[0];
      if (!org) return Response.json({ ok: false, error: "Groupe introuvable." });
      if (org.created_by_id !== user.id) return Response.json({ ok: false, error: "Seul le créateur du groupe peut générer un code." });
      const invite = genCode();
      const expires = new Date(Date.now() + CODE_TTL_MS).toISOString();
      await svc.entities.Organization.update(org.id, { invite_code: invite, invite_code_expires: expires });
      return Response.json({ ok: true, invite_code: invite, invite_code_expires: expires });
    }

    // ── Rejoindre un groupe via un code ──────────────────────────────────────
    if (action === "joinGroup") {
      if (!code?.trim()) return Response.json({ ok: false, error: "Code requis." });
      const matches = await svc.entities.Organization.filter({ invite_code: code.trim().toUpperCase() });
      const org = matches[0];
      if (!org) return Response.json({ ok: false, error: "Code invalide." });
      if (!org.invite_code_expires || new Date(org.invite_code_expires).getTime() < Date.now()) {
        return Response.json({ ok: false, error: "Ce code a expiré. Demandez-en un nouveau au chef du groupe." });
      }
      // PARTAGE TOTAL : rejoindre = rattacher l'utilisateur au groupe ET partager
      // ses données existantes (stampées avec l'organization_id du groupe). Les
      // futures données sont partagées automatiquement via withOrg. La RLS donne
      // à tout le groupe l'accès lecture/écriture.
      await base44.auth.updateMe({ organization_id: org.id });
      const res = await stampUserData(svc, user.id, org.id);
      return Response.json({ ok: true, group: { id: org.id, nom: org.nom }, stamped: res.updated });
    }

    // ── Quitter le groupe ────────────────────────────────────────────────────
    if (action === "leaveGroup") {
      if (!user.organization_id) return Response.json({ ok: false, error: "Vous n'êtes dans aucun groupe." });
      // Les données que le membre avait choisi de partager redeviennent privées.
      await stampUserData(svc, user.id, null);
      await base44.auth.updateMe({ organization_id: null });
      return Response.json({ ok: true });
    }

    // ── Partager MES données existantes avec le groupe (opt-in à l'inscription) ─
    // Le membre accepte de partager ce qu'il avait → on marque ses données avec
    // l'organization_id du groupe. Choix volontaire (popup côté front).
    if (action === "shareMyData") {
      if (!user.organization_id) return Response.json({ ok: false, error: "Vous n'êtes dans aucun groupe." });
      const res = await stampUserData(svc, user.id, user.organization_id);
      return Response.json({ ok: true, stamped: res.updated, details: res.perEntity, errors: res.errors });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("groupManager:", err?.message);
    return Response.json({ ok: false, error: err?.message || "Erreur serveur" });
  }
});
