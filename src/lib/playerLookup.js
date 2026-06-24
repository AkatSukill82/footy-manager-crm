import { invokeFn } from "@/api/base44Client";
import { ageFromDob } from "@/lib/transferCalc";

/**
 * Récupération de données joueur depuis un lien (Transfermarkt / FotMob) ou un nom.
 * Passe par la fonction serverless `transfermarktProxy` (riche en identité,
 * club, contrat et valeur marchande). Pour un lien FotMob, on extrait le nom du
 * slug puis on cherche sur Transfermarkt.
 */

// Lien FotMob → nom lisible ; sinon le texte tel quel (nom ou URL TM).
function toQuery(s) {
  const fm = s.match(/fotmob\.com\/(?:players|player|playerData)\/\d+\/([^/?#]+)/i);
  if (fm) return decodeURIComponent(fm[1]).replace(/[-_]+/g, " ").trim();
  return s;
}

/** Renvoie l'objet `player` du proxy (ou null). */
export async function fetchPlayerFromLink(input) {
  const s = String(input || "").trim();
  if (!s) return null;
  try {
    if (/transfermarkt\./i.test(s)) {
      const res = await invokeFn("transfermarktProxy", { action: "getPlayer", transfermarkt_url: s });
      if (res?.ok && res.player) return res.player;
    }
    const res = await invokeFn("transfermarktProxy", { action: "searchAndGet", query: toQuery(s) });
    return res?.ok ? res.player : null;
  } catch {
    return null;
  }
}

const str = (v) => (v != null && v !== "" ? String(v) : "");

/** Mappe une fiche joueur (proxy/moteur) vers les champs du formulaire majeur. */
export function playerToMajorFields(p = {}) {
  const ageVal = p.age != null && p.age !== "" ? p.age : ageFromDob(p.date_naissance);
  const st = p.stats_saison || {};
  return {
    name: p.nom || p.name || "",
    age: str(ageVal),
    positions: p.poste || p.position || "",
    nationalite: p.nationalite || "",
    taille: str(p.taille),
    pied: p.pied_fort || p.pied || "",
    club: p.club_actuel || p.club || "",
    country: p.pays || "",
    division: p.ligue || p.division || "",
    contract_end: p.contrat_fin || "",
    market_value: str(p.valeur_marchande),
    // Stats saison (depuis le moteur de recherche multi-sources)
    matches: str(st.matchs_joues),
    minutes: str(st.minutes_jouees),
    goals: str(st.buts),
    assists: str(st.passes_decisives),
  };
}
