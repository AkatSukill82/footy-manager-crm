/**
 * Demandes d'accès (site vitrine → app).
 *  - submit    : PUBLIC (pas d'auth) — crée la demande via le rôle service.
 *  - list      : admin — liste les demandes.
 *  - setStatut : admin — valide / refuse une demande.
 * L'e-mail d'invitation (lien /register) est envoyé côté front après validation.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { action, data, id, statut } = await req.json();

    // ── Soumission PUBLIQUE (formulaire vitrine, visiteur non connecté) ──
    if (action === "submit") {
      const d = data || {};
      if (!d.email || !/.+@.+\..+/.test(String(d.email))) {
        return Response.json({ ok: false, error: "E-mail invalide." }, { status: 400 });
      }
      await svc.entities.AccessRequest.create({
        nom: (d.nom || "").trim(),
        prenom: (d.prenom || "").trim(),
        email: String(d.email).trim(),
        telephone: (d.telephone || "").trim(),
        societe: (d.societe || "").trim(),
        formule: ["standard", "pro", "surmesure"].includes(d.formule) ? d.formule : "standard",
        message: (d.message || "").trim(),
        statut: "en_attente",
      });
      // Notifie l'admin (best-effort, n'échoue pas si l'intégration n'est pas dispo côté serveur).
      try {
        await base44.integrations.Core.SendEmail({
          to: "support@football-dm.com",
          subject: `Nouvelle demande d'accès — ${(d.prenom || "")} ${(d.nom || "")}`.trim(),
          body: `Nouvelle demande d'accès FDM :\n\nNom : ${d.prenom || ""} ${d.nom || ""}\nEmail : ${d.email}\nTél : ${d.telephone || "-"}\nSociété : ${d.societe || "-"}\nFormule : ${d.formule || "standard"}\nMessage : ${d.message || "-"}\n\n→ Valide-la dans l'app (Demandes d'accès).`,
        });
      } catch { /* ignore */ }
      return Response.json({ ok: true });
    }

    // ── Actions ADMIN ──
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ ok: false, error: "Réservé à l'administrateur." }, { status: 403 });

    if (action === "list") {
      const rows = await svc.entities.AccessRequest.filter({}, "-created_date", 300);
      return Response.json({ ok: true, requests: rows });
    }

    if (action === "setStatut") {
      if (!id || !["en_attente", "valide", "refuse"].includes(statut)) {
        return Response.json({ ok: false, error: "Paramètres invalides." }, { status: 400 });
      }
      await svc.entities.AccessRequest.update(id, { statut });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "Action inconnue." }, { status: 400 });
  } catch (err: any) {
    console.error("accessRequest:", err?.message);
    return Response.json({ ok: false, error: err?.message || "Erreur serveur" }, { status: 500 });
  }
});
