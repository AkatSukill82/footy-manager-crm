import { base44 } from "@/api/base44Client";
import { BRAND_NAME } from "./brand";

/**
 * Envoie un e-mail PERSONNALISÉ depuis l'app (au nom de la marque).
 * Contourne les templates système Base44 (non modifiables).
 * Corps en texte simple uniquement (pas de HTML/logo dans le corps).
 *
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendEmail({ to, subject, body }) {
  if (!to || !subject || !body) return { ok: false, error: "Champs e-mail manquants." };
  try {
    await base44.integrations.Core.SendEmail({ to: to.trim(), subject, body, from_name: BRAND_NAME });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "Échec de l'envoi de l'e-mail." };
  }
}
