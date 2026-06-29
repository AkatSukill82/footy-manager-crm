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
      // Notifie l'admin par e-mail HTML professionnel.
      const prenom = (d.prenom || "").trim();
      const nom = (d.nom || "").trim();
      const fullNom = `${prenom} ${nom}`.trim() || "—";
      const email = String(d.email).trim();
      const tel = (d.telephone || "").trim() || "—";
      const societe = (d.societe || "").trim() || "—";
      const formuleMap: Record<string, { label: string; price: string }> = {
        standard: { label: "Standard", price: "50 €/mois" },
        pro: { label: "Pro", price: "100 €/mois" },
        surmesure: { label: "Sur-mesure", price: "Sur devis" },
      };
      const formule = formuleMap[d.formule] || formuleMap.standard;
      const message = (d.message || "").trim().replace(/\n/g, "<br/>") || "—";
      const now = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

      const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0f1626;border:1px solid #1f2a3d;border-radius:20px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="padding:28px 40px;border-bottom:1px solid #1f2a3d;background:linear-gradient(135deg,#0f1626,#0a1410);">
          <table role="presentation" width="100%"><tr>
            <td style="vertical-align:middle;">
              <span style="display:inline-block;width:38px;height:38px;line-height:38px;text-align:center;background:linear-gradient(135deg,#34d399,#10b981);color:#06210f;border-radius:11px;font-size:20px;font-weight:800;">⚽</span>
              <span style="margin-left:12px;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.01em;">Football Data <span style="color:#34d399;">Management</span></span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="display:inline-block;background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.3);border-radius:999px;padding:6px 14px;font-size:11px;font-weight:700;letter-spacing:.04em;">NOUVELLE DEMANDE</span>
            </td>
          </tr></table>
        </tr>

        <!-- Title -->
        <tr><td style="padding:36px 40px 8px;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;">Nouvelle demande d'accès</h1>
          <p style="margin:10px 0 0;color:#94a3b8;font-size:14px;line-height:1.6;">Un nouveau prospect a rempli le formulaire du site vitrine. Voici le récapitulatif de sa demande. Valide-la dans l'app pour lui envoyer son invitation.</p>
        </td></tr>

        <!-- Contact card -->
        <tr><td style="padding:24px 40px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;border:1px solid #1f2a3d;border-radius:14px;">
            <tr><td style="padding:22px 26px;">
              <table role="presentation" width="100%"><tr>
                <td style="vertical-align:middle;width:56px;">
                  <span style="display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;background:linear-gradient(135deg,#34d399,#10b981);color:#06210f;border-radius:12px;font-size:18px;font-weight:800;">${(fullNom[0] || "?").toUpperCase()}</span>
                </td>
                <td style="vertical-align:middle;padding-left:14px;">
                  <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">${fullNom}</div>
                  <div style="color:#64748b;font-size:12px;margin-top:3px;">Reçu le ${now}</div>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Details -->
        <tr><td style="padding:20px 40px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">E-mail</div>
                <div style="color:#e2e8f0;font-size:14px;margin-top:6px;word-break:break-all;">${email}</div>
              </td>
              <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">Téléphone</div>
                <div style="color:#e2e8f0;font-size:14px;margin-top:6px;">${tel}</div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">Société / Agence / Club</div>
                <div style="color:#e2e8f0;font-size:14px;margin-top:6px;">${societe}</div>
              </td>
              <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">Formule souhaitée</div>
                <div style="margin-top:6px;"><span style="display:inline-block;background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.3);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:700;">${formule.label}</span> <span style="color:#94a3b8;font-size:13px;margin-left:6px;">${formule.price}</span></div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Message -->
        <tr><td style="padding:8px 40px 28px;">
          <div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;">Message du prospect</div>
          <div style="background:#0a0e1a;border:1px solid #1f2a3d;border-left:3px solid #34d399;border-radius:10px;padding:16px 18px;color:#e2e8f0;font-size:14px;line-height:1.65;">${message}</div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 32px;" align="center">
          <a href="/" style="display:inline-block;background:linear-gradient(135deg,#34d399,#10b981);color:#06210f;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;letter-spacing:-0.01em;">Valider la demande dans l'app →</a>
          <p style="margin:14px 0 0;color:#475569;font-size:12px;">Rendez-vous dans « Demandes d'accès » pour valider et envoyer l'invitation.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;background:#0a0e1a;border-top:1px solid #1f2a3d;">
          <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;text-align:center;">E-mail automatique envoyé depuis le site vitrine <span style="color:#64748b;">Football Data Management</span>.<br/>Ne pas répondre à ce message.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

      let notified = false, notifyError: string | null = null;
      try {
        await base44.integrations.Core.SendEmail({
          to: "support@football-dm.com",
          from_name: "Football Data Management",
          subject: `Nouvelle demande d'accès — ${fullNom}`,
          body: html,
        });
        notified = true;
      } catch (e: any) { notifyError = e?.message || String(e); }
      return Response.json({ ok: true, notified, notifyError });
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