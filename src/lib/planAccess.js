// Verrouillage par formule (Standard / Pro / Sur-mesure).
//
// Pages réservées à la formule PRO (et au-delà). Un compte Standard ne les voit
// pas dans le menu. Les noms correspondent aux clés de pages (pages.config) et
// au champ `name` des items de navigation.
export const PRO_PAGES = new Set([
  "TransferManagement", // Simulateur de transfert (FIFA)
  "Finance",            // Finance & rentabilité
  "Teams",              // Projection d'effectif
  "Reports",            // Rapports
  "PredictiveDashboard",// IA prédictive
  "Marketplace",        // Marketplace
  "ScoutingReports",    // Scouting
]);

// Accès à une page selon la formule de l'utilisateur.
// Règles : admin = tout ; compte SANS formule = accès complet (grandfather des
// comptes existants) ; pro / sur-mesure = tout ; standard = tout sauf PRO_PAGES.
export function canAccessPage(user, pageName) {
  if (!user) return true;                  // en cours de chargement → ne rien masquer
  if (user.role === "admin") return true;  // admin → accès complet
  const plan = user.plan;
  if (!plan || plan === "pro" || plan === "surmesure") return true;
  return !PRO_PAGES.has(pageName);         // standard
}
