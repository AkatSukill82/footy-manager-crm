/**
 * API-Football (api-sports.io) — utilisé UNIQUEMENT pour la recherche de joueurs.
 * C'est la seule source qui fonctionne depuis les IPs cloud de Base44 car c'est
 * une vraie API avec clé (pas du scraping bloqué par IP).
 *
 * Seule action active : searchPlayer
 */

const API_KEY = "69289700a254963331e0a79b901c56da";
const BASE    = "https://v3.football.api-sports.io";

const afGet = async (path: string) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": API_KEY },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`API-Football HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0)
    throw new Error(`API-Football: ${JSON.stringify(json.errors)}`);
  return json;
};

const POSTES: Record<string, string> = {
  "Goalkeeper": "Gardien",
  "Defender":   "Défenseur central",
  "Midfielder": "Milieu central",
  "Attacker":   "Attaquant",
};

Deno.serve(async (req) => {
  try {
    const { action, name } = await req.json();

    if (action === "searchPlayer") {
      if (!name?.trim()) return Response.json({ ok: false, error: "name requis" });

      const q = encodeURIComponent(name.trim());

      // Essaie les 3 dernières saisons pour trouver le joueur
      for (const season of [2025, 2024, 2023]) {
        const data = await afGet(`/players?search=${q}&season=${season}`);
        const entries = data.response || [];
        if (entries.length === 0) continue;

        const players = entries.slice(0, 10).map((e: any) => {
          const p  = e.player;
          const st = e.statistics?.[0];
          return {
            af_id:       p.id,
            nom:         p.name || `${p.firstname || ""} ${p.lastname || ""}`.trim(),
            age:         p.age  || null,
            nationalite: p.nationality || null,
            photo_url:   p.photo || null,
            poste:       POSTES[st?.games?.position] || null,
            club_actuel: st?.team?.name  || null,
            ligue:       st?.league?.name || null,
          };
        });

        return Response.json({ ok: true, total: players.length, players });
      }

      return Response.json({ ok: true, total: 0, players: [] });
    }

    return Response.json({ ok: false, error: `Action non supportée: ${action}` });

  } catch (err: any) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
});
