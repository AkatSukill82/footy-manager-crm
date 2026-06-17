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

// Recherche Google ciblée sur un domaine
const google = (site, name, extra = "") =>
  `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${name} ${extra}`.trim())}`;

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
    {
      label: "BeSoccer",
      color: "text-emerald-700 border-emerald-200 hover:bg-emerald-50",
      url: player.besoccer_url || google("besoccer.com", name, "futbolista"),
      direct: !!player.besoccer_url,
    },
    {
      label: "SofaScore",
      color: "text-purple-700 border-purple-200 hover:bg-purple-50",
      url: player.sofascore_url || google("sofascore.com", name, "football player"),
      direct: !!player.sofascore_url,
    },
    {
      label: "FotMob",
      color: "text-orange-700 border-orange-200 hover:bg-orange-50",
      url: player.fotmob_url || google("fotmob.com", name),
      direct: !!player.fotmob_url,
    },
  ];
}
