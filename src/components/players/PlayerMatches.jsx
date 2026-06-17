import React from "react";
import { invokeFn } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, History, Loader2, Star, Clock, Goal } from "lucide-react";

function ratingColor(n) {
  if (n == null) return "text-slate-400";
  if (n >= 7.5) return "text-green-700";
  if (n >= 6.5) return "text-amber-600";
  return "text-red-600";
}

function LastMatch({ m }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Dernier match</span>
        {m.note != null && (
          <span className={`text-lg font-bold ${ratingColor(m.note)}`}>{m.note.toFixed(1)}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-slate-900 text-sm">vs {m.adversaire || "?"}</span>
        {m.score && <Badge className="bg-slate-800 text-white text-xs">{m.score}</Badge>}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5">
        {[m.competition, m.date].filter(Boolean).join(" · ")}
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        {m.minutes != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{m.minutes}'</span>}
        {m.buts != null && <span className="flex items-center gap-1"><Goal className="w-3 h-3 text-green-500" />{m.buts} but{m.buts > 1 ? "s" : ""}</span>}
        {m.passes != null && <span>🅰 {m.passes}</span>}
      </div>
    </div>
  );
}

export default function PlayerMatches({ player }) {
  // Matchs récents via FotMob (fiable depuis le cloud)
  const { data: fm, isLoading } = useQuery({
    queryKey: ["player-matches", player.id, player.nom],
    queryFn: () => player.fotmob_id
      ? invokeFn("fotmobProxy", { action: "getMatches", fotmob_id: player.fotmob_id })
      : invokeFn("fotmobProxy", { action: "searchAndGetMatches", query: player.nom, club: player.club_actuel }),
    enabled: !!player.nom,
    staleTime: 1000 * 60 * 30,
  });

  // Prochains matchs via SofaScore (best-effort, nécessite sofascore_id)
  const { data: nextData } = useQuery({
    queryKey: ["player-next", player.sofascore_id],
    queryFn: () => invokeFn("proxySofaApi", { path: `/player/${player.sofascore_id}/events/next/0` }),
    enabled: !!player.sofascore_id,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const matches  = fm?.ok ? (fm.matches || []) : [];
  const played   = matches.filter(m => m.a_joue);
  const last     = played[0] || matches[0] || null;
  const recent   = matches.slice(0, 6);

  const nextEvents = Array.isArray(nextData?.events)
    ? nextData.events.slice(0, 5).map(e => ({
        date: e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString().split("T")[0] : null,
        home: e.homeTeam?.name, away: e.awayTeam?.name,
        competition: e.tournament?.name,
      }))
    : [];

  if (isLoading) {
    return (
      <Card><CardContent className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></CardContent></Card>
    );
  }

  if (matches.length === 0 && nextEvents.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-blue-500" /> Matchs
          <span className="ml-auto text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">FotMob</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Dernier match */}
        {last && <LastMatch m={last} />}

        {/* Matchs récents */}
        {recent.length > 1 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Matchs récents</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left py-1.5 pr-2 font-medium">Date</th>
                    <th className="text-left py-1.5 pr-2 font-medium">Adversaire</th>
                    <th className="text-center py-1.5 font-medium">Score</th>
                    <th className="text-center py-1.5 font-medium">Min</th>
                    <th className="text-center py-1.5 font-medium">⚽</th>
                    <th className="text-center py-1.5 font-medium">🅰</th>
                    <th className="text-center py-1.5 font-medium">★</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((m, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-1.5 pr-2 text-slate-500 whitespace-nowrap">{m.date || "—"}</td>
                      <td className="py-1.5 pr-2 text-slate-700 truncate max-w-[120px]" title={m.adversaire}>{m.adversaire || "—"}</td>
                      <td className="py-1.5 text-center text-slate-600">{m.score || "—"}</td>
                      <td className="py-1.5 text-center text-slate-500">{m.minutes ?? "—"}</td>
                      <td className="py-1.5 text-center font-semibold text-green-600">{m.buts ?? "—"}</td>
                      <td className="py-1.5 text-center font-semibold text-blue-600">{m.passes ?? "—"}</td>
                      <td className={`py-1.5 text-center font-bold ${ratingColor(m.note)}`}>{m.note != null ? m.note.toFixed(1) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prochains matchs */}
        {nextEvents.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" /> Prochains matchs
            </p>
            <div className="space-y-1.5">
              {nextEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 w-20 flex-shrink-0">{e.date || "—"}</span>
                  <span className="text-slate-700 truncate flex-1">{e.home} <span className="text-slate-300">vs</span> {e.away}</span>
                  {e.competition && <span className="text-[10px] text-slate-400 truncate max-w-[90px]">{e.competition}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
