import { invokeFn } from "@/api/base44Client";
import { getCache, setCache, normalizeQuery } from "@/lib/searchCache";

/**
 * Moteur de recherche joueur multi-sources — MÊME logique que la page Joueurs
 * (PlayerSearch) : recherche FotMob → BeSoccer → Transfermarkt, puis profil
 * complet fusionné Transfermarkt + BeSoccer + FotMob + SofaScore.
 * Extrait ici pour être réutilisé (ex. module Recrutement).
 */

// Champs de stats pris EN BLOC depuis une seule source (cohérence de périmètre).
const STAT_FIELDS = [
  "matchs_joues", "titularisations", "minutes_jouees", "buts", "passes_decisives",
  "cartons_jaunes", "cartons_rouges", "note_moyenne",
  "xg", "xa", "xg_hors_penalty", "xgot", "tirs", "tirs_cadres", "tirs_cadres_pct",
  "grandes_chances", "grandes_chances_manquees", "penaltys_marques",
  "passes_reussies", "passes_reussies_pct", "passes_cles", "passes_longues", "passes_longues_pct",
  "centres", "centres_reussis_pct",
  "dribbles_reussis", "dribbles_tentes", "dribbles_pct", "dribbles_subis",
  "touches_balle", "touches_surface_adverse", "pertes_balle",
  "duels_gagnes", "duels_gagnes_pct", "duels_aeriens_pct",
  "actions_defensives", "tacles", "interceptions", "degagements", "recuperations",
  "buts_encaisses_terrain", "xg_concede_terrain",
  "fautes_commises", "fautes_subies", "hors_jeu",
  "arrets", "buts_encaisses", "clean_sheets",
];
const statSourceHasData = (s) =>
  !!s && (s.matchs_joues != null || s.buts != null || s.minutes_jouees != null);

function mergeStats(ss, fm, bs) {
  if (!ss && !fm && !bs) return null;
  if (fm && fm.note_moyenne == null && fm.note_fotmob != null) fm.note_moyenne = fm.note_fotmob;
  const primary = statSourceHasData(ss) ? ss : statSourceHasData(fm) ? fm : statSourceHasData(bs) ? bs : null;
  const primaryName = primary === ss ? "SofaScore" : primary === fm ? "FotMob" : primary === bs ? "BeSoccer" : null;
  const out = {};
  if (primary) for (const k of STAT_FIELDS) out[k] = primary[k] ?? null;
  out.besoccer_elo = bs?.besoccer_elo ?? null;
  out.sofascore_id = ss?.sofascore_id ?? null;
  out.fotmob_id = fm?.fotmob_id ?? null;
  out.saison = primary?.saison ?? null;
  out.sources = primaryName ? [primaryName] : [];
  return out;
}

function mergePersonal(tm, tdb, bs, candidate) {
  const t = tm || {}, d = tdb || {}, b = bs || {}, c = candidate || {};
  const nom = t.nom || d.nom || b.nom || c.nom || "";
  return {
    nom,
    nom_complet: t.nom || d.nom_complet || d.nom || c.nom,
    age: d.age || null,
    date_naissance: t.date_naissance || d.date_naissance || c.date_naissance,
    lieu_naissance: t.lieu_naissance || null,
    nationalite: t.nationalite || d.nationalite || b.nationalite || c.nationalite,
    taille: t.taille || d.taille || b.taille,
    poids: t.poids || d.poids,
    pied_fort: t.pied_fort || d.pied_fort || b.pied_fort,
    poste: t.poste || d.poste || b.poste || c.poste,
    club_actuel: t.club_actuel || b.club_actuel || d.club_actuel || c.club_actuel,
    ligue: b.ligue || null,
    valeur_marchande: t.valeur_marchande || b.valeur_marchande,
    contrat_fin: t.contrat_fin || b.contrat_fin,
    agent: t.agent || null,
    transfermarkt_id: t.transfermarkt_id || null,
    besoccer_id: b.besoccer_id || null,
    photo_url: c.photo_url || t.photo_url || b.photo_url,
    transfermarkt_url: t.transfermarkt_url || null,
    besoccer_url: b.besoccer_url || null,
    sources_perso: [tm && "Transfermarkt", bs && "BeSoccer"].filter(Boolean),
  };
}

/** Recherche des candidats (hommes) : FotMob → BeSoccer → Transfermarkt. */
export async function searchPlayerCandidates(query) {
  const q = String(query || "").trim();
  if (!q) return { list: [], source: null };

  const cacheKey = `search:H:${normalizeQuery(q)}`;
  const cached = getCache(cacheKey);
  if (cached?.fresh && Array.isArray(cached.data) && cached.data.length) {
    return { list: cached.data, source: cached.source || null };
  }

  let result = { list: [], source: null };
  try {
    const body = await invokeFn("fotmobProxy", { action: "searchPlayer", query: q });
    const list = Array.isArray(body?.players) ? body.players : [];
    if (list.length) result = { list, source: "FotMob" };
  } catch { /* source suivante */ }

  if (!result.list.length) {
    try {
      const body = await invokeFn("besoccerProxy", { action: "searchPlayer", query: q });
      const list = Array.isArray(body?.players) ? body.players : [];
      if (list.length) result = { list, source: "BeSoccer" };
    } catch { /* source suivante */ }
  }

  if (!result.list.length) {
    try {
      const body = await invokeFn("transfermarktProxy", { action: "searchAndGet", query: q });
      const p = body?.ok ? body.player : null;
      if (p?.nom) result = {
        list: [{
          nom: p.nom, poste: p.poste ?? null, nationalite: p.nationalite ?? null,
          club_actuel: p.club_actuel ?? null, photo_url: p.photo_url ?? null,
          date_naissance: p.date_naissance ?? null, transfermarkt_id: p.transfermarkt_id ?? null,
        }],
        source: "Transfermarkt",
      };
    } catch { /* aucune source */ }
  }

  if (result.list.length) { const c = getCache(cacheKey) || {}; setCache(cacheKey, result.list); c.source = result.source; }
  return result;
}

/** Profil complet fusionné (TM + BeSoccer + FotMob + SofaScore) pour un candidat. */
export async function fetchPlayerProfile(candidate) {
  const nom = candidate?.nom;
  const club = candidate?.club_actuel;
  if (!nom) return null;

  const profileKey = `profile:${candidate.fotmob_id || normalizeQuery(nom)}`;
  const cachedProfile = getCache(profileKey);
  if (cachedProfile?.fresh && cachedProfile.data) return cachedProfile.data;

  try {
    const [tm, bs, fmS, ssS] = await Promise.allSettled([
      invokeFn("transfermarktProxy", { action: "searchAndGet", query: nom }),
      invokeFn("besoccerProxy", { action: "searchAndGetPlayer", query: nom }),
      invokeFn("fotmobProxy", { action: "searchAndGetStats", query: nom, club }),
      invokeFn("sofascoreProxy", { action: "searchAndGetStats", query: nom, club }),
    ]);
    const v = (r) => (r.status === "fulfilled" ? r.value : null);
    const tmV = v(tm), bsV = v(bs), fmV = v(fmS), ssV = v(ssS);
    const tmData = tmV?.ok ? tmV.player : null;
    const bsData = bsV?.ok ? bsV.player : null;
    const fmStats = fmV?.ok ? fmV.stats : null;
    const ssStats = ssV?.ok ? ssV.stats : null;

    const personal = mergePersonal(tmData, null, bsData, candidate);
    const stats = mergeStats(ssStats, fmStats, bsData);
    if (!personal.poste && fmStats?.poste) personal.poste = fmStats.poste;
    if (!personal.nom && fmStats?.nom) personal.nom = fmStats.nom;
    if (!personal.date_naissance && fmStats?.date_naissance) personal.date_naissance = fmStats.date_naissance;
    if (!personal.club_actuel && fmStats?.club_actuel) personal.club_actuel = fmStats.club_actuel;

    const full = { ...personal, stats_saison: stats };
    if (personal.poste || stats) setCache(profileKey, full);
    return full;
  } catch {
    return { nom: candidate.nom, club_actuel: candidate.club_actuel, photo_url: candidate.photo_url, stats_saison: null };
  }
}
