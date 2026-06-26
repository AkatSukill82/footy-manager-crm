import { base44 } from "@/api/base44Client";
import { withOrg } from "@/lib/org";
import { ensureClubForPlayer } from "@/lib/ensureClub";

/**
 * Ajoute un joueur repéré (profil du moteur de recherche) à la liste comme
 * PROSPECT : crée la fiche Player (priorite_recrutement="Veille"), l'ajoute à la
 * watchlist et crée son club. Anti-doublon par nom.
 * @returns { id, nom } si créé · { exists, nom } si déjà présent · { error }
 */
const KEEP = [
  "nom", "age", "date_naissance", "lieu_naissance", "poste", "poste_secondaire",
  "nationalite", "nationalite_secondaire", "club_actuel", "valeur_marchande",
  "photo_url", "taille", "poids", "pied_fort", "contrat_fin", "agent", "agence",
  "numero_maillot", "ligue", "pays_ligue", "transfermarkt_id", "sofascore_id",
  "fotmob_id", "besoccer_id", "matchs_joues", "minutes_jouees", "buts",
  "passes_decisives", "note_moyenne",
];
const norm = (x) => (x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export async function addPlayerAsProspect(found) {
  if (!found?.nom) return { error: "Joueur invalide." };
  try {
    const existing = await base44.entities.Player.filter({});
    if ((existing || []).some((p) => norm(p.nom) === norm(found.nom))) {
      return { exists: true, nom: found.nom };
    }
    const payload = {};
    for (const k of KEEP) { if (found[k] != null && found[k] !== "") payload[k] = found[k]; }
    payload.priorite_recrutement = "Veille"; // prospect
    const created = await base44.entities.Player.create(withOrg(payload));
    try { await base44.entities.WatchList.create(withOrg({ player_id: created.id, player_nom: found.nom })); } catch { /* ignore */ }
    if (payload.club_actuel) ensureClubForPlayer(payload.club_actuel).catch(() => {});
    return { id: created.id, nom: found.nom, created };
  } catch (e) {
    return { error: e?.message || "Ajout impossible." };
  }
}
