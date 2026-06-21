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
async function stampUserData(svc: any, userId: string, orgId: string | null) {
  let updated = 0;
  for (const ent of SHARED) {
    try {
      const records = await svc.entities[ent].filter({ created_by_id: userId });
      for (const r of records) {
        if ((r.organization_id ?? null) !== orgId) {
          await svc.entities[ent].update(r.id, { organization_id: orgId });
          updated++;
        }
      }
    } catch { /* entité absente / non filtrable → on ignore */ }
  }
  return updated;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const svc = base44.asServiceRole;

    const { action, nom, code } = await req.json();

    // ── Créer un groupe ──────────────────────────────────────────────────────
    if (action === "createGroup") {
      if (!nom?.trim()) return Response.json({ ok: false, error: "Nom du groupe requis." });
      const invite = genCode();
      const expires = new Date(Date.now() + CODE_TTL_MS).toISOString();
      const org = await base44.entities.Organization.create({
        nom: nom.trim(), invite_code: invite, invite_code_expires: expires,
      });
      await base44.auth.updateMe({ organization_id: org.id });
      const stamped = await stampUserData(svc, user.id, org.id);
      return Response.json({ ok: true, group: { id: org.id, nom: org.nom, invite_code: invite, invite_code_expires: expires }, stamped });
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
      await base44.auth.updateMe({ organization_id: org.id });
      const stamped = await stampUserData(svc, user.id, org.id);
      return Response.json({ ok: true, group: { id: org.id, nom: org.nom }, stamped });
    }

    // ── Quitter le groupe ────────────────────────────────────────────────────
    if (action === "leaveGroup") {
      if (!user.organization_id) return Response.json({ ok: false, error: "Vous n'êtes dans aucun groupe." });
      // Les données du membre redeviennent privées.
      await stampUserData(svc, user.id, null);
      await base44.auth.updateMe({ organization_id: null });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("groupManager:", err?.message);
    return Response.json({ ok: false, error: err?.message || "Erreur serveur" });
  }
});
