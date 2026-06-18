/**
 * Proxy FotMob — recherche joueurs + stats saison.
 *
 * IMPORTANT — structure réelle de l'endpoint suggest :
 *   FotMob retourne un ARRAY, pas un objet.
 *   Exemple : [{title:{key:"all"}, suggestions:[{type:"player", id:"30893", name:"Ronaldo", teamName:"Al Nassr", teamId:101918}]}]
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FM_BASE = "https://www.fotmob.com/api/data";

// MD5 pur JS (sans dépendance runtime) — sortie hex minuscule. Validé identique à node:crypto.
function md5(str: string): string {
  const rl = (n: number, c: number) => (n << c) | (n >>> (32 - c));
  const au = (x: number, y: number) => {
    const l = (x & 0xFFFF) + (y & 0xFFFF), m = (x >> 16) + (y >> 16) + (l >> 16);
    return (m << 16) | (l & 0xFFFF);
  };
  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => au(rl(au(au(a, q), au(x, t)), s), b);
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => cmn(c ^ (b | ~d), a, b, x, s, t);
  const s = unescape(encodeURIComponent(str));
  const x: number[] = [];
  for (let i = 0; i < s.length * 8; i += 8) x[i >> 5] |= (s.charCodeAt(i / 8) & 0xFF) << (i % 32);
  const len = s.length * 8;
  x[len >> 5] |= 0x80 << (len % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < x.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d;
    a = ff(a, b, c, d, x[i] | 0, 7, -680876936); d = ff(d, a, b, c, x[i + 1] | 0, 12, -389564586); c = ff(c, d, a, b, x[i + 2] | 0, 17, 606105819); b = ff(b, c, d, a, x[i + 3] | 0, 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4] | 0, 7, -176418897); d = ff(d, a, b, c, x[i + 5] | 0, 12, 1200080426); c = ff(c, d, a, b, x[i + 6] | 0, 17, -1473231341); b = ff(b, c, d, a, x[i + 7] | 0, 22, -45705983);
    a = ff(a, b, c, d, x[i + 8] | 0, 7, 1770035416); d = ff(d, a, b, c, x[i + 9] | 0, 12, -1958414417); c = ff(c, d, a, b, x[i + 10] | 0, 17, -42063); b = ff(b, c, d, a, x[i + 11] | 0, 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12] | 0, 7, 1804603682); d = ff(d, a, b, c, x[i + 13] | 0, 12, -40341101); c = ff(c, d, a, b, x[i + 14] | 0, 17, -1502002290); b = ff(b, c, d, a, x[i + 15] | 0, 22, 1236535329);
    a = gg(a, b, c, d, x[i + 1] | 0, 5, -165796510); d = gg(d, a, b, c, x[i + 6] | 0, 9, -1069501632); c = gg(c, d, a, b, x[i + 11] | 0, 14, 643717713); b = gg(b, c, d, a, x[i] | 0, 20, -373897302);
    a = gg(a, b, c, d, x[i + 5] | 0, 5, -701558691); d = gg(d, a, b, c, x[i + 10] | 0, 9, 38016083); c = gg(c, d, a, b, x[i + 15] | 0, 14, -660478335); b = gg(b, c, d, a, x[i + 4] | 0, 20, -405537848);
    a = gg(a, b, c, d, x[i + 9] | 0, 5, 568446438); d = gg(d, a, b, c, x[i + 14] | 0, 9, -1019803690); c = gg(c, d, a, b, x[i + 3] | 0, 14, -187363961); b = gg(b, c, d, a, x[i + 8] | 0, 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13] | 0, 5, -1444681467); d = gg(d, a, b, c, x[i + 2] | 0, 9, -51403784); c = gg(c, d, a, b, x[i + 7] | 0, 14, 1735328473); b = gg(b, c, d, a, x[i + 12] | 0, 20, -1926607734);
    a = hh(a, b, c, d, x[i + 5] | 0, 4, -378558); d = hh(d, a, b, c, x[i + 8] | 0, 11, -2022574463); c = hh(c, d, a, b, x[i + 11] | 0, 16, 1839030562); b = hh(b, c, d, a, x[i + 14] | 0, 23, -35309556);
    a = hh(a, b, c, d, x[i + 1] | 0, 4, -1530992060); d = hh(d, a, b, c, x[i + 4] | 0, 11, 1272893353); c = hh(c, d, a, b, x[i + 7] | 0, 16, -155497632); b = hh(b, c, d, a, x[i + 10] | 0, 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13] | 0, 4, 681279174); d = hh(d, a, b, c, x[i] | 0, 11, -358537222); c = hh(c, d, a, b, x[i + 3] | 0, 16, -722521979); b = hh(b, c, d, a, x[i + 6] | 0, 23, 76029189);
    a = hh(a, b, c, d, x[i + 9] | 0, 4, -640364487); d = hh(d, a, b, c, x[i + 12] | 0, 11, -421815835); c = hh(c, d, a, b, x[i + 15] | 0, 16, 530742520); b = hh(b, c, d, a, x[i + 2] | 0, 23, -995338651);
    a = ii(a, b, c, d, x[i] | 0, 6, -198630844); d = ii(d, a, b, c, x[i + 7] | 0, 10, 1126891415); c = ii(c, d, a, b, x[i + 14] | 0, 15, -1416354905); b = ii(b, c, d, a, x[i + 5] | 0, 21, -57434055);
    a = ii(a, b, c, d, x[i + 12] | 0, 6, 1700485571); d = ii(d, a, b, c, x[i + 3] | 0, 10, -1894986606); c = ii(c, d, a, b, x[i + 10] | 0, 15, -1051523); b = ii(b, c, d, a, x[i + 1] | 0, 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8] | 0, 6, 1873313359); d = ii(d, a, b, c, x[i + 15] | 0, 10, -30611744); c = ii(c, d, a, b, x[i + 6] | 0, 15, -1560198380); b = ii(b, c, d, a, x[i + 13] | 0, 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4] | 0, 6, -145523070); d = ii(d, a, b, c, x[i + 11] | 0, 10, -1120210379); c = ii(c, d, a, b, x[i + 2] | 0, 15, 718787259); b = ii(b, c, d, a, x[i + 9] | 0, 21, -343485551);
    a = au(a, oa); b = au(b, ob); c = au(c, oc); d = au(d, od);
  }
  const hex = (num: number) => { let o = ""; for (let j = 0; j < 4; j++) o += ("0" + ((num >> (j * 8)) & 0xFF).toString(16)).slice(-2); return o; };
  return [a, b, c, d].map(hex).join("");
}

const FM_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.fotmob.com/",
  "Origin": "https://www.fotmob.com",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "Cache-Control": "no-cache",
};

const fmGet = async (path: string) => {
  const res = await fetch(`${FM_BASE}${path}`, {
    headers: FM_HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`FotMob HTTP ${res.status} — ${path}`);
  return res.json();
};

// ── Parse la réponse suggest (array de sections) ──────────────────────────────

const parseSuggest = (json: any): any[] => {
  // FotMob retourne un array : [{title:{key:"all"}, suggestions:[...]}, {title:{key:"players"}, suggestions:[...]}]
  if (Array.isArray(json)) {
    // Prend la section "all" en priorité, sinon la première section
    const section = json.find((s: any) => s.title?.key === "all") ?? json[0];
    return section?.suggestions ?? [];
  }
  // Fallback si la structure change un jour
  return json.all ?? json.results ?? json.suggestions ?? [];
};

// ── Matcher d'identité : score nom + club, n'accepte qu'au-dessus d'un seuil ───

const STOP = new Set(["fc", "cf", "sc", "ac", "afc", "cd", "club", "de", "the", "us", "ss", "as", "ud", "rc", "sv", "if"]);
const norm = (s: string): string =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const toks = (s: string): Set<string> =>
  new Set(norm(s).split(" ").filter((t) => t.length > 1 && !STOP.has(t)));
const overlap = (a: string, b: string): number => {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
};

interface Hint { name: string; club?: string; }

// ── Recherche joueur interne ───────────────────────────────────────────────────

const searchPlayer = async (name: string, hint: Hint): Promise<{ id: number; name: string; confidence: number } | null> => {
  const json    = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(name)}`);
  const all     = parseSuggest(json);
  const players = all.filter((r: any) => r.type === "player" && !r.isCoach);
  if (players.length === 0) return null;

  let best: any = null, bestScore = -1, bestNameSim = 0;
  for (const p of players) {
    const nameSim = overlap(p.name ?? "", hint.name);
    if (nameSim < 0.5) continue;                        // le nom DOIT correspondre
    let score = nameSim * 4;
    if (hint.club && p.teamName) score += overlap(p.teamName, hint.club) * 3;
    if (score > bestScore) { bestScore = score; best = p; bestNameSim = nameSim; }
  }
  if (!best) return null;
  const confidence = Math.min(1, bestNameSim * 0.6 + (bestScore - bestNameSim * 4) / 3 * 0.4 + 0.1);
  return { id: parseInt(best.id), name: best.name, confidence: Math.round(confidence * 100) / 100 };
};

// ── Stats joueur ──────────────────────────────────────────────────────────────

// Titres FotMob (EN) → champs entité Player. Plusieurs libellés possibles par
// champ selon les versions de l'API ; on prend le premier présent.
const STAT_MAP: Record<string, string> = {
  // Synthèse
  "Matches":              "matchs_joues",
  "Appearances":          "matchs_joues",
  "Started":              "titularisations",
  "Minutes played":       "minutes_jouees",
  "Rating":               "note_fotmob",
  "FotMob rating":        "note_fotmob",
  // Offensif
  "Goals":                "buts",
  "Assists":              "passes_decisives",
  "xG":                   "xg",
  "Expected goals (xG)":  "xg",
  "xA":                   "xa",
  "Expected assists (xA)":"xa",
  "Shots":                "tirs",
  "Shots on target":      "tirs_cadres",
  "Big chances missed":   "grandes_chances_manquees",
  "Penalties scored":     "penaltys_marques",
  // Passes / création
  "Key passes":           "passes_cles",
  "Chances created":      "passes_cles",
  "Big chances created":  "grandes_chances",
  "Accurate passes":      "passes_reussies",
  "Successful crosses":   "centres",
  // Dribbles / possession
  "Dribbles":             "dribbles_reussis",
  "Successful dribbles":  "dribbles_reussis",
  "Touches":              "touches_balle",
  "Dispossessed":         "pertes_balle",
  // Défensif
  "Tackles":              "tacles",
  "Tackles won":          "tacles",
  "Interceptions":        "interceptions",
  "Recoveries":           "recuperations",
  "Clearances":           "degagements",
  "Blocks":               "tirs_bloques",
  // Discipline
  "Yellow cards":         "cartons_jaunes",
  "Red cards":            "cartons_rouges",
  "Fouls":                "fautes_commises",
  "Was fouled":           "fautes_subies",
  "Offsides":             "hors_jeu",
  // Gardien
  "Saves":                "arrets",
  "Goals conceded":       "buts_encaisses",
  "Clean sheets":         "clean_sheets",
  // ── Stats avancées (granularité fiche FotMob) ──
  "Non-penalty xG":                       "xg_hors_penalty",
  "Non-penalty expected goals (xG)":      "xg_hors_penalty",
  "Expected goals (xG) excluding penalties": "xg_hors_penalty",
  "xGOT":                                 "xgot",
  "Expected goals on target":             "xgot",
  "Expected goals on target (xGOT)":      "xgot",
  "Accurate long balls":                  "passes_longues",
  "Successful long balls":                "passes_longues",
  "Touches in opposition box":            "touches_surface_adverse",
  "Touches in opp. box":                  "touches_surface_adverse",
  "Penalty area touches":                 "touches_surface_adverse",
  "Duels won":                            "duels_gagnes",
  "Ground duels won":                     "duels_gagnes",
  "Defensive actions":                    "actions_defensives",
  "Dribbled past":                        "dribbles_subis",
  "Was dribbled past":                    "dribbles_subis",
  "Dribbles attempted":                   "dribbles_tentes",
  "Possession lost":                      "pertes_balle",
  "Goals conceded while on pitch":        "buts_encaisses_terrain",
  "Goals conceded on pitch":              "buts_encaisses_terrain",
  "Goals conceded (team)":                "buts_encaisses_terrain",
  "Expected goals conceded":              "xg_concede_terrain",
  "Expected goals conceded (xGC)":        "xg_concede_terrain",
  "xG conceded while on pitch":           "xg_concede_terrain",
  "xGC":                                  "xg_concede_terrain",
};

// Titres dont la valeur FotMob contient un pourcentage à extraire (ex: "8 (80.5%)").
// Le champ "compte" reste géré par STAT_MAP ci-dessus.
const STAT_PCT_MAP: Record<string, string> = {
  "Accurate passes":       "passes_reussies_pct",
  "Pass accuracy":         "passes_reussies_pct",
  "Accurate long balls":   "passes_longues_pct",
  "Successful long balls": "passes_longues_pct",
  "Successful crosses":    "centres_reussis_pct",
  "Accurate crosses":      "centres_reussis_pct",
  "Shots on target":       "tirs_cadres_pct",
  "Duels won":             "duels_gagnes_pct",
  "Ground duels won":      "duels_gagnes_pct",
  "Successful dribbles":   "dribbles_pct",
  "Dribbles":              "dribbles_pct",
  "Tackles won":           "tacles_reussis_pct",
};

// Champs cumulables sur plusieurs compétitions (compteurs). Les % et notes ne se
// somment pas : ils ne sont pris que sur la ligue principale.
const NO_SUM = new Set([
  "note_fotmob", "note_moyenne",
  "tirs_cadres_pct", "passes_reussies_pct", "passes_longues_pct",
  "centres_reussis_pct", "duels_gagnes_pct", "dribbles_pct", "tacles_reussis_pct",
]);

// Extrait la valeur numérique principale + un éventuel pourcentage.
// FotMob renvoie selon la stat : un nombre, une string "8 (80.5%)" ou "80.5%",
// ou un objet { value, total, percent }.
const parseStatValue = (raw: any): { num: number | null; pct: number | null } => {
  if (raw == null) return { num: null, pct: null };
  if (typeof raw === "number") return { num: Number.isFinite(raw) ? raw : null, pct: null };
  if (typeof raw === "object") {
    const inner = parseStatValue(raw.value ?? raw.statValue ?? raw.total ?? raw.num ?? null);
    const pctRaw = raw.percent ?? raw.percentage ?? null;
    const pct = typeof pctRaw === "number" ? pctRaw : parseStatValue(pctRaw).num;
    return { num: inner.num, pct: pct ?? inner.pct };
  }
  const s = String(raw);
  const pctM = s.match(/([\d.]+)\s*%/);
  const pct = pctM ? parseFloat(pctM[1]) : null;
  // Premier nombre en dehors d'une parenthèse de pourcentage
  const numM = s.replace(/\([^)]*\)/g, " ").match(/-?\d+(?:\.\d+)?/);
  const num = numM ? parseFloat(numM[0]) : null;
  return { num: Number.isFinite(num as number) ? num : null, pct };
};

// Applique une stat (compte + %) dans l'accumulateur.
// sum=true : autres compétitions, on additionne les compteurs uniquement.
const applyStat = (stats: Record<string, any>, title: string, raw: any, sum: boolean) => {
  const field    = STAT_MAP[title];
  const pctField = STAT_PCT_MAP[title];
  if (!field && !pctField) return;
  const { num, pct } = parseStatValue(raw);
  if (field && num != null) {
    if (sum) { if (!NO_SUM.has(field)) stats[field] = (stats[field] ?? 0) + num; }
    else stats[field] = num;
  }
  // Pourcentages : ligue principale uniquement (la somme n'a pas de sens).
  if (pctField && pct != null && !sum && stats[pctField] == null) stats[pctField] = pct;
};

// Position FotMob (label EN) → poste entité Player (FR)
const POS_MAP: Record<string, string> = {
  "Goalkeeper": "Gardien",
  "Centre Back": "Défenseur central", "Center Back": "Défenseur central",
  "Right Back": "Latéral droit", "Left Back": "Latéral gauche",
  "Right Wing Back": "Latéral droit", "Left Wing Back": "Latéral gauche",
  "Defensive Midfield": "Milieu défensif", "Defensive Midfielder": "Milieu défensif",
  "Central Midfield": "Milieu central", "Central Midfielder": "Milieu central",
  "Midfielder": "Milieu central",
  "Attacking Midfield": "Milieu offensif", "Attacking Midfielder": "Milieu offensif",
  "Right Winger": "Ailier droit", "Right Wing": "Ailier droit",
  "Left Winger": "Ailier gauche", "Left Wing": "Ailier gauche",
  "Striker": "Attaquant", "Centre Forward": "Attaquant", "Center Forward": "Attaquant",
  "Forward": "Attaquant", "Attacker": "Attaquant",
};

const mapFotmobPos = (label: string | null | undefined): string | null => {
  if (!label) return null;
  return POS_MAP[label] ?? null;
};

// ── Deep stats (panneau "Performances de la saison" de FotMob) ────────────────
// Les stats détaillées ne sont PAS dans playerData ; elles viennent de
//   pub.fotmob.com/beta/db/api/player/{id}/stats/stage/{stageId}
// qui exige le header signé "fotmob-client" = md5(yyyyMMdd_UTC + "nnarbfotmob") MAJ.
// Le stageId (compétition principale) provient du profil data.fotmob.com.

const fotmobClient = (): string => {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");   // yyyyMMdd UTC
  return md5(ymd + "nnarbfotmob").toUpperCase();
};

// localizedTitleId FotMob → champ entité Player (clés stables, indépendantes de la langue).
const LID_MAP: Record<string, string> = {
  // Tir
  goals:                       "buts",
  expected_goals:              "xg",
  expected_goals_on_target:    "xgot",
  non_penalty_xg:              "xg_hors_penalty",
  shots:                       "tirs",
  ShotsOnTarget:               "tirs_cadres",
  // Passes
  assists:                     "passes_decisives",
  expected_assists:            "xa",
  successful_passes:           "passes_reussies",
  successful_passes_accuracy:  "passes_reussies_pct",
  long_balls_accurate:         "passes_longues",
  long_ball_succeeeded_accuracy: "passes_longues_pct",
  chances_created:             "passes_cles",
  big_chance_created_team_title:"grandes_chances",
  accurate_crosses:            "centres",
  accurate_crosses_accuracy:   "centres_reussis_pct",
  // Possession
  dribbles_succeeded:          "dribbles_reussis",
  won_contest_subtitle:        "dribbles_pct",
  duel_won:                    "duels_gagnes",
  duel_won_percent:            "duels_gagnes_pct",
  aerials_won_percent:         "duels_aeriens_pct",
  touches:                     "touches_balle",
  touches_opp_box:             "touches_surface_adverse",
  dispossessed:                "pertes_balle",
  fouls_won:                   "fautes_subies",
  penalty_won_title:           "penaltys_provoques",
  // Défense
  defensive_actions:           "actions_defensives",
  "matchstats.headers.tackles":"tacles",
  interceptions:               "interceptions",
  fouls:                       "fautes_commises",
  recoveries:                  "recuperations",
  dribbled_past:               "dribbles_subis",
  goals_conceded_while_on_pitch:"buts_encaisses_terrain",
  expected_goals_against_while_on_pitch: "xg_concede_terrain",
  // Gardien
  saves:                       "arrets",
  save_percentage:             "arrets_pct",
  goals_conceded:              "buts_encaisses",
  clean_sheet:                 "clean_sheets",
  clean_sheet_team_title:      "clean_sheets",
  keeper_high_claim:           "sorties_reussies",
  // Discipline
  yellow_cards:                "cartons_jaunes",
  red_cards:                   "cartons_rouges",
};

const toNum = (v: any): number | null => {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

// Récupère le profil (data.fotmob.com) puis les deep stats de la compétition
// principale (PrimaryStageId). Best-effort : renvoie {} si quoi que ce soit échoue.
const getDeepStats = async (playerId: number): Promise<Record<string, any>> => {
  const out: Record<string, any> = {};
  try {
    const pRes = await fetch(`https://data.fotmob.com/webcl/profiles/players/${playerId}.json`, {
      headers: FM_HEADERS, signal: AbortSignal.timeout(10000),
    });
    if (!pRes.ok) return out;
    const profile = await pRes.json();

    // Bonus identité/valeur depuis le profil.
    if (typeof profile?.TransferValue === "number" && profile.TransferValue > 0) {
      out.valeur_marchande = Math.round(profile.TransferValue / 1e6 * 100) / 100;  // M€
    }
    if (profile?.Height) out.taille = toNum(profile.Height);
    if (profile?.Weight) out.poids  = toNum(profile.Weight);
    if (profile?.Foot)   out.pied_fort = profile.Foot === "left" ? "Gauche" : profile.Foot === "right" ? "Droit" : "Les deux";

    const stageId = profile?.PrimaryStageId;
    if (!stageId) return out;

    const dRes = await fetch(`https://pub.fotmob.com/beta/db/api/player/${playerId}/stats/stage/${stageId}`, {
      headers: { ...FM_HEADERS, "fotmob-client": fotmobClient() },
      signal: AbortSignal.timeout(10000),
    });
    if (!dRes.ok) return out;
    const deep = await dRes.json();

    for (const group of (deep?.statsSection?.items ?? [])) {
      for (const it of (group.items ?? [])) {
        const field = LID_MAP[it.localizedTitleId];
        if (!field) continue;
        const n = toNum(it.statValue);
        if (n != null) out[field] = n;
      }
    }
  } catch (_) { /* deep stats best-effort */ }
  return out;
};

const getPlayerStats = async (playerId: number): Promise<Record<string, any>> => {
  const json  = await fmGet(`/playerData?id=${playerId}`);
  const stats: Record<string, any> = {};

  // Ligue principale : valeurs de référence (compteurs + pourcentages).
  for (const item of (json.mainLeague?.stats ?? [])) {
    applyStat(stats, item.title, item.value, false);
  }

  // Autres compétitions : on additionne uniquement les compteurs (cf. NO_SUM).
  for (const league of (json.otherLeagues ?? [])) {
    for (const item of (league.stats ?? [])) {
      applyStat(stats, item.title, item.value, true);
    }
  }

  // Poste depuis playerData (fiable depuis le cloud, sert de filet pour le champ requis)
  const posLabel = json?.positionDescription?.primaryPosition?.label
                ?? json?.origin?.positionDesc?.primaryPosition?.label
                ?? null;
  const poste = mapFotmobPos(posLabel);
  if (poste) stats.poste = poste;

  // Infos perso basiques disponibles dans playerData (fallback si TM/BeSoccer bloqués)
  if (json?.name) stats.nom = json.name;
  if (json?.birthDate?.utcTime) {
    stats.date_naissance = String(json.birthDate.utcTime).split("T")[0];
  }
  if (json?.primaryTeam?.teamName) stats.club_actuel = json.primaryTeam.teamName;

  // Deep stats (panneau détaillé FotMob) — overlay des stats granulaires de la
  // compétition principale. Best-effort : si indisponible, on garde le résumé.
  const deep = await getDeepStats(playerId);
  Object.assign(stats, deep);

  stats.source    = "FotMob";
  // Périmètre : saison en cours, ligue principale + autres compétitions (cf. boucles ci-dessus).
  if (json?.mainLeague?.season) stats.saison = String(json.mainLeague.season);
  stats.fotmob_id = String(playerId);
  return stats;
};

// Matchs récents + performance du joueur (depuis playerData.recentMatches)
const mapRecentMatches = (json: any): any[] => {
  const list: any[] = json?.recentMatches ?? json?.lastMatches ?? [];
  return list.slice(0, 8).map((m: any) => {
    const r = m.ratingProps?.rating ?? m.rating ?? null;
    return {
      date:        m.matchDate ? String(m.matchDate).split("T")[0] : (m.date ?? null),
      competition: m.leagueName ?? m.tournamentName ?? null,
      adversaire:  m.opponentTeamName ?? m.opponentName ?? null,
      domicile:    m.home ?? m.isHome ?? null,
      score:       (m.homeScore != null && m.awayScore != null) ? `${m.homeScore}-${m.awayScore}` : null,
      minutes:     m.minutesPlayed ?? null,
      buts:        m.goals ?? null,
      passes:      m.assists ?? null,
      note:        r != null ? Number(r) : null,
      a_joue:      (m.minutesPlayed ?? 0) > 0,
    };
  });
};

// ── Recherche équipe ──────────────────────────────────────────────────────────

const searchTeam = async (name: string): Promise<any[]> => {
  const json = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(name)}`);
  const all  = parseSuggest(json);
  return all
    .filter((r: any) => r.type === "team")
    .slice(0, 10)
    .map((r: any) => ({
      id:   r.id,
      nom:  r.name,
      pays: r.ccode ?? r.countryCode ?? null,
      logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${r.id}.png`,
    }));
};

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { action, query, club, fotmob_id } = await req.json();
    const hint: Hint = { name: (query ?? "").trim(), club };

    // ── Recherche candidats joueurs ──────────────────────────────────────────
    if (action === "searchPlayer") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const json    = await fmGet(`/search/suggest?hits=20&lang=en&term=${encodeURIComponent(query.trim())}`);
      const all     = parseSuggest(json);
      const players = all
        .filter((r: any) => r.type === "player" && !r.isCoach)
        .slice(0, 10)
        .map((r: any) => ({
          fotmob_id:   String(r.id),
          nom:         r.name,
          club_actuel: r.teamName ?? null,
          photo_url:   `https://images.fotmob.com/image_resources/playerimages/${r.id}.png`,
        }));
      return Response.json({ ok: true, total: players.length, players });
    }

    // ── Stats + recherche en un appel ────────────────────────────────────────
    if (action === "searchAndGetStats") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const player = await searchPlayer(query.trim(), hint);
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur FotMob (aucun candidat fiable)." });
      const stats = await getPlayerStats(player.id);
      return Response.json({ ok: true, player_name: player.name, confidence: player.confidence, stats });
    }

    // ── Stats depuis ID connu ────────────────────────────────────────────────
    if (action === "getStats") {
      if (!fotmob_id) return Response.json({ ok: false, error: "fotmob_id requis" });
      const stats = await getPlayerStats(parseInt(fotmob_id));
      return Response.json({ ok: true, stats });
    }

    // ── Matchs récents + performance (recherche par nom) ─────────────────────
    if (action === "searchAndGetMatches") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const player = await searchPlayer(query.trim(), hint);
      if (!player) return Response.json({ ok: false, error: "Joueur non trouvé sur FotMob (aucun candidat fiable)." });
      const json    = await fmGet(`/playerData?id=${player.id}`);
      const matches = mapRecentMatches(json);
      return Response.json({ ok: true, player_name: player.name, fotmob_id: String(player.id), matches });
    }

    // ── Matchs récents depuis ID connu ───────────────────────────────────────
    if (action === "getMatches") {
      if (!fotmob_id) return Response.json({ ok: false, error: "fotmob_id requis" });
      const json    = await fmGet(`/playerData?id=${parseInt(fotmob_id)}`);
      const matches = mapRecentMatches(json);
      return Response.json({ ok: true, matches });
    }

    // ── Recherche équipe ─────────────────────────────────────────────────────
    if (action === "searchTeam") {
      if (!query?.trim()) return Response.json({ ok: false, error: "query requis" });
      const teams = await searchTeam(query.trim());
      return Response.json({ ok: true, total: teams.length, teams });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` });

  } catch (err: any) {
    console.error("fotmobProxy:", err.message);
    // HTTP 200 obligatoire : le SDK Base44 throw sur tout status >= 400,
    // ce qui masque le vrai message d'erreur côté client.
    return Response.json({ ok: false, error: err.message });
  }
});
