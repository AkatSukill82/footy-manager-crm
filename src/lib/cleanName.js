/**
 * Nettoie un nom de joueur capté par scraping/recherche :
 * - retire un numéro de maillot en tête ("#10", "10", "N°7"…)
 * - réduit espaces/retours-ligne multiples à un seul espace
 * - trim
 * Renvoie une chaîne propre (jamais null).
 */
export function cleanPlayerName(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/\s+/g, " ")                 // \n, tabs, espaces multiples → un espace
    .replace(/^\s*(?:#|n[°ºo.]?\s*)?\d{1,3}\s+(?=\D)/i, "") // numéro de maillot en tête
    .replace(/\s+/g, " ")
    .trim();
}
