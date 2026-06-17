import React, { useState } from "react";
import { invokeFn } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Loader2, RefreshCw, ExternalLink, AlertCircle, Star } from "lucide-react";

const slugify = (name) =>
  (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Cell({ value, highlight, suffix }) {
  if (value == null || value === "") return <td className="px-3 py-2 text-center text-slate-300 text-sm">—</td>;
  return (
    <td className={`px-3 py-2 text-center text-sm font-semibold ${highlight ? "text-green-700" : "text-slate-700"}`}>
      {value}{suffix || ""}
    </td>
  );
}

function RatingCell({ value }) {
  if (value == null) return <td className="px-3 py-2 text-center text-slate-300 text-sm">—</td>;
  const color = value >= 7.5 ? "text-green-700" : value >= 6.5 ? "text-amber-600" : "text-red-600";
  return (
    <td className={`px-3 py-2 text-center text-sm font-bold ${color}`}>{value.toFixed(2)}</td>
  );
}

export default function PlayerSofaStats({ player }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ssId = player?.sofascore_id;
  if (!ssId) return null;

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invokeFn("proxySofaApi", {
        path: `/player/${ssId}/statistics/season`,
      });
      if (res?.error) throw new Error(res.error);
      const rows = res?.statistics;
      if (!Array.isArray(rows) || rows.length === 0)
        throw new Error("Aucune stat trouvée pour ce joueur");
      // Trier par saison décroissante
      rows.sort((a, b) => (b.season?.year ?? 0) - (a.season?.year ?? 0));
      setStats(rows);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des stats");
    } finally {
      setLoading(false);
    }
  };

  const slug = slugify(player.nom);
  const sofaUrl = `https://www.sofascore.com/football/player/${slug}/${ssId}`;

  const totals = stats
    ? stats.reduce(
        (acc, r) => {
          const st = r.statistics || {};
          return {
            appearances:   (acc.appearances   || 0) + (st.appearances   || 0),
            goals:         (acc.goals         || 0) + (st.goals         || 0),
            assists:       (acc.assists       || 0) + (st.assists        || 0),
            yellowCards:   (acc.yellowCards   || 0) + (st.yellowCards    || 0),
            redCards:      (acc.redCards      || 0) + (st.redCards       || 0),
            minutesPlayed: (acc.minutesPlayed || 0) + (st.minutesPlayed  || 0),
          };
        },
        {}
      )
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-orange-500" />
            Stats SofaScore
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats && (
              <Button onClick={fetchStats} disabled={loading} variant="ghost" size="sm" className="h-7 w-7 p-0">
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
            <a
              href={sofaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-500 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Voir sur SofaScore
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!stats && !loading && !error && (
          <div className="text-center py-6 px-4">
            <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 mb-3">
              Statistiques par saison issues de SofaScore
            </p>
            <Button onClick={fetchStats} size="sm" variant="outline" className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50">
              <BarChart2 className="w-3.5 h-3.5" />
              Charger les stats
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            <span className="text-sm">Chargement depuis SofaScore…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-b-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <Button onClick={fetchStats} size="sm" variant="ghost" className="h-7 gap-1 text-red-500 hover:text-red-700">
              <RefreshCw className="w-3 h-3" /> Réessayer
            </Button>
          </div>
        )}

        {stats && !loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Saison</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Compétition</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Club</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-500">MJ</th>
                  <th className="px-3 py-2 text-center font-semibold text-amber-500">★</th>
                  <th className="px-3 py-2 text-center font-semibold text-green-600">⚽</th>
                  <th className="px-3 py-2 text-center font-semibold text-blue-600">🅰</th>
                  <th className="px-3 py-2 text-center font-semibold text-purple-500">xG</th>
                  <th className="px-3 py-2 text-center font-semibold text-yellow-500">🟨</th>
                  <th className="px-3 py-2 text-center font-semibold text-red-500">🟥</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-500">Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.map((row, i) => {
                  const st = row.statistics || {};
                  const seasonLabel = row.season?.name || (row.season?.year ? `${row.season.year}/${row.season.year + 1}` : "—");
                  const competition = row.tournament?.uniqueTournament?.name || row.tournament?.name || "—";
                  const club = row.team?.name || "—";
                  const xg = st.expectedGoals != null ? Math.round(st.expectedGoals * 100) / 100 : null;
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{seasonLabel}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[120px] truncate" title={competition}>{competition}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[110px] truncate" title={club}>{club}</td>
                      <Cell value={st.appearances} />
                      <RatingCell value={st.rating != null ? Math.round(st.rating * 100) / 100 : null} />
                      <Cell value={st.goals} highlight />
                      <Cell value={st.assists} />
                      <Cell value={xg} />
                      <Cell value={st.yellowCards} />
                      <Cell value={st.redCards} />
                      <Cell value={st.minutesPlayed} />
                    </tr>
                  );
                })}
              </tbody>
              {stats.length > 1 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                    <td className="px-3 py-2 text-slate-700 text-xs" colSpan={3}>Total</td>
                    <td className="px-3 py-2 text-center text-sm text-slate-700">{totals.appearances || "—"}</td>
                    <td className="px-3 py-2 text-center text-sm text-slate-400">—</td>
                    <td className="px-3 py-2 text-center text-sm text-green-700">{totals.goals || "—"}</td>
                    <td className="px-3 py-2 text-center text-sm text-slate-700">{totals.assists || "—"}</td>
                    <td className="px-3 py-2 text-center text-sm text-slate-400">—</td>
                    <td className="px-3 py-2 text-center text-sm text-yellow-600">{totals.yellowCards || "—"}</td>
                    <td className="px-3 py-2 text-center text-sm text-red-600">{totals.redCards || "—"}</td>
                    <td className="px-3 py-2 text-center text-sm text-slate-700">{totals.minutesPlayed ? `${totals.minutesPlayed}'` : "—"}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
