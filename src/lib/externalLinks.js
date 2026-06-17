/**
 * Liens externes vers les plateformes de données football.
 *
 * Transfermarkt expose un vrai endpoint de recherche serveur (schnellsuche) → lien direct fiable.
 * BeSoccer / SofaScore / FotMob ont une recherche rendue en JS sans URL stable
 * (elles renvoient des 404 en accès direct) → on passe par une recherche Google
 * `site:` qui ne tombe jamais en 404 et mène droit au profil du joueur.
 *
 * Si un identifiant / une URL directe a été récupéré, on l'utilise en priorité.
 */

const enc = (s) => encodeURIComponent((s || "").trim());

// Recherche Google « nom du site + prénom nom » → tombe directement sur le profil
// sans dépendre d'un ID/slug interne (souvent périmé ou en 404).
const googleByName = (siteLabel, name) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${siteLabel} ${name}`.trim())}`;

export function playerExternalLinks(player = {}) {
  const name = (player.nom_complet || player.nom || "").trim();
  const q = enc(name);

  return [
    {
      label: "Transfermarkt",
      color: "text-blue-700 border-blue-200 hover:bg-blue-50",
      url: player.transfermarkt_url || (player.transfermarkt_id
        ? `https://www.transfermarkt.com/x/profil/spieler/${player.transfermarkt_id}`
        : `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${q}`),
      direct: !!(player.transfermarkt_url || player.transfermarkt_id),
    },
    // SofaScore / FotMob / BeSoccer : recherche par nom uniquement (pas d'ID),
    // car leurs URLs directes à base de numéro sont instables / en 404.
    {
      label: "BeSoccer",
      color: "text-emerald-700 border-emerald-200 hover:bg-emerald-50",
      url: googleByName("Besoccer", name),
      direct: false,
    },
    {
      label: "SofaScore",
      color: "text-purple-700 border-purple-200 hover:bg-purple-50",
      url: googleByName("Sofascore", name),
      direct: false,
    },
    {
      label: "FotMob",
      color: "text-orange-700 border-orange-200 hover:bg-orange-50",
      url: googleByName("Fotmob", name),
      direct: false,
    },
  ];
}
