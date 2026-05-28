/**
 * Enrichit un joueur depuis API-Football (api-sports.io).
 *
 * Retourne : nom, âge, nationalité, taille, poids, photo, club, ligue,
 *            poste, buts, passes, cartons, minutes, tirs, dribbles,
 *            tacles, interceptions, fautes, arrêts, penaltys…
 *
 * Usage :
 *   base44.functions.invoke("enrichPlayerFromAPI", { playerName: "Kylian Mbappé" })
 */

const AF_KEY  = "69289700a254963331e0a79b901c56da";
const AF_BASE = "https://v3.football.api-sports.io";

const AF_POS: Record<string, string> = {
  "Goalkeeper": "Gardien",
  "Defender":   "Défenseur central",
  "Midfielder": "Milieu central",
  "Attacker":   "Attaquant",
};

const parseCm = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const n = parseInt(String(s).replace(/\D/g, ""));
  return isNaN(n) ? null : n;
};

const afGet = async (path: string) => {
  const res = await fetch(`${AF_BASE}${path}`, {
    headers: { "x-apisports-key": AF_KEY },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`AF HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0)
    throw new Error(`AF error: ${JSON.stringify(json.errors)}`);
  return json;
};

function extractAFPlayer(entry: any, out: Record<string, unknown>) {
  const pl = entry?.player;
  const st = entry?.statistics?.[0];
  if (!pl) return;

  const w = (k: string, v: unknown) => { if (v != null && v !== "") out[k] = v; };

  // Identité
  if (pl.firstname && pl.lastname) {
    w("prenom", pl.firstname);
    w("nom",    pl.lastname);
  } else if (pl.name) {
    w("nom", pl.name);
  }
  w("age",            pl.age);
  w("date_naissance", pl.birth?.date  || null);
  w("lieu_naissance", pl.birth?.place || null);
  w("nationalite",    pl.nationality  || null);
  w("photo_url",      pl.photo        || null);
  w("taille",         parseCm(pl.height));
  w("poids",          parseCm(pl.weight));

  // Club & ligue
  if (st) {
    w("club_actuel",  st.team?.name     || null);
    w("ligue",        st.league?.name   || null);
    w("pays_ligue",   st.league?.country|| null);
    const pos = AF_POS[st.games?.position];
    if (pos) w("poste", pos);
    w("numero_maillot", st.games?.number || null);

    // Stats de performance
    w("matchs_joues",     st.games?.appearences ?? null);
    w("titularisations",  st.games?.lineups      ?? null);
    w("minutes_jouees",   st.games?.minutes      ?? null);
    w("buts",             st.goals?.total        ?? null);
    w("passes_decisives", st.goals?.assists      ?? null);
    w("cartons_jaunes",   st.cards?.yellow       ?? null);
    w("cartons_rouges",   st.cards?.red          ?? null);
    w("tirs",             st.shots?.total        ?? null);
    w("tirs_cadres",      st.shots?.on           ?? null);
    w("passes_cles",      st.passes?.key         ?? null);
    w("dribbles_reussis", st.dribbles?.success   ?? null);
    w("dribbles_tentes",  st.dribbles?.attempts  ?? null);
    w("tacles",           st.tackles?.total      ?? null);
    w("interceptions",    st.tackles?.interceptions ?? null);
    w("fautes_commises",  st.fouls?.committed    ?? null);
    w("fautes_subies",    st.fouls?.drawn        ?? null);
    w("arrets",           st.goals?.saves        ?? null);
    w("buts_encaisses",   st.goals?.conceded     ?? null);
    w("penaltys_marques", st.penalty?.scored     ?? null);

    if (st.shots?.total != null && st.shots?.on != null && st.shots.total > 0)
      out.tirs_cadres_pct = Math.round((st.shots.on / st.shots.total) * 100);
    if (st.dribbles?.success != null && st.dribbles?.attempts != null && st.dribbles.attempts > 0)
      out.dribbles_pct = Math.round((st.dribbles.success / st.dribbles.attempts) * 100);
  }
}

const safe = async <T>(fn: () => Promise<T>, label: string, errs: string[]): Promise<T | null> => {
  try { return await fn(); } catch (e: any) { errs.push(`${label}: ${e.message}`); return null; }
};

Deno.serve(async (req) => {
  try {
    const { playerName } = await req.json();
    if (!playerName)
      return Response.json({ error: "playerName requis" }, { status: 400 });

    const out: Record<string, unknown> = {};
    const sources: string[] = [];
    const errors: string[] = [];

    // Cherche les 3 dernières saisons disponibles
    const q = encodeURIComponent((playerName || "").trim());
    let entry: any = null;

    for (const season of [2025, 2024, 2023]) {
      const data = await safe(
        () => afGet(`/players?search=${q}&season=${season}`),
        `AF saison ${season}`,
        errors,
      );
      if (data?.response?.length > 0) {
        entry = data.response[0];
        break;
      }
    }

    if (entry) {
      extractAFPlayer(entry, out);
      sources.push("API-Football");
    }

    const fieldsFound = Object.keys(out).filter(k => out[k] != null && out[k] !== "").length;
    return Response.json({
      success: true,
      fieldsFound,
      sources,
      data: out,
      ...(errors.length ? { errors } : {}),
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
