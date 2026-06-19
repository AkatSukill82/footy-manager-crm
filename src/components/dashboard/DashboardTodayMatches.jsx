import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const SCHEMA = {
  type: "object",
  properties: {
    matchs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          club: { type: "string", description: "Le club (parmi la liste fournie) qui joue aujourd'hui" },
          adversaire: { type: "string" },
          heure: { type: "string", description: "Heure locale HH:MM, vide si inconnue" },
          competition: { type: "string" },
          domicile: { type: "boolean" },
        },
        required: ["club", "adversaire"],
      },
    },
  },
};

async function fetchTodayMatches(clubs) {
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const data = await base44.integrations.Core.InvokeLLM({
    prompt: `Nous sommes le ${today}. Parmi ces clubs de football : ${clubs.join(", ")}.
Lesquels jouent un match OFFICIEL AUJOURD'HUI ? Pour chacun : le club concerné (exactement tel qu'écrit dans la liste), l'adversaire, l'heure locale, la compétition, et s'il joue à domicile.
RÈGLE : ne retourne que des matchs réellement programmés aujourd'hui. Si aucun, retourne une liste vide. N'invente jamais.`,
    add_context_from_internet: true,
    response_json_schema: SCHEMA,
  });
  return data?.matchs || [];
}

export default function DashboardTodayMatches({ players = [] }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  // Clubs distincts des joueurs du CRM (max 25 pour borner le prompt).
  const clubs = [...new Set(players.map((p) => p.club_actuel).filter(Boolean))].slice(0, 25);

  const { data: matchs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashToday", clubs.slice().sort().join("|")],
    queryFn: () => fetchTodayMatches(clubs),
    enabled: clubs.length > 0,
    staleTime: 1000 * 60 * 60 * 3,
    gcTime: 1000 * 60 * 60 * 6,
    retry: false,
  });

  if (clubs.length === 0) return null;

  // Associe chaque match aux joueurs du CRM de ce club.
  const playersByClub = (clubNom) => players.filter((p) => norm(p.club_actuel) === norm(clubNom));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-green-600" /> {t(lang, "session.dash.todayTitle")}
        </p>
        <button onClick={() => refetch()} disabled={isFetching}
          className="text-slate-400 hover:text-slate-600 disabled:opacity-50" title={t(lang, "session.dash.refresh")}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-5 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "session.dash.todayLoading")}
        </div>
      ) : matchs.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">{t(lang, "session.dash.todayNone")}</p>
      ) : (
        <div className="space-y-2">
          {matchs.map((m, i) => {
            const concerned = playersByClub(m.club);
            return (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 w-11 flex-shrink-0">{m.heure || "—"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {m.domicile ? "🏠" : "✈️"} {m.club} <span className="text-slate-400">vs</span> {m.adversaire}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {m.competition && <span className="text-[10px] text-slate-400">{m.competition}</span>}
                    {concerned.map((p) => (
                      <button key={p.id} onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${p.id}`)}
                        className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-1.5 py-0.5 hover:bg-green-100">
                        {p.nom}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
