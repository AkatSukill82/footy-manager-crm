import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Loader2, RefreshCw, Activity, CalendarClock, Users } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const SCHEMA = {
  type: "object",
  properties: {
    classement: {
      type: "object",
      properties: {
        competition: { type: "string" }, position: { type: "number" },
        points: { type: "number" }, joues: { type: "number" },
        victoires: { type: "number" }, nuls: { type: "number" }, defaites: { type: "number" },
      },
    },
    forme: { type: "array", items: { type: "string", description: "W (victoire), D (nul), L (défaite)" } },
    derniers_resultats: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" }, adversaire: { type: "string" },
          domicile: { type: "boolean" }, score: { type: "string" },
          resultat: { type: "string", description: "W, D ou L" },
        },
      },
    },
    prochain: {
      type: "object",
      properties: { date: { type: "string" }, adversaire: { type: "string" }, domicile: { type: "boolean" }, competition: { type: "string" } },
    },
    staff: {
      type: "array",
      items: { type: "object", properties: { nom: { type: "string" }, role: { type: "string", description: "ex: Entraîneur, Adjoint, Entraîneur des gardiens, Préparateur physique, Médecin" } } },
    },
  },
};

async function fetchOverview(club) {
  return await base44.integrations.Core.InvokeLLM({
    prompt: `Pour le club de football "${club}", aujourd'hui, donne (sources fiables : SofaScore, FotMob, Transfermarkt, site officiel) :
- classement : compétition principale, position, points, matchs joués, victoires (victoires), nuls, défaites
- forme : les 5 derniers résultats sous forme de lettres W/D/L (du plus ancien au plus récent)
- derniers_resultats : les 5 derniers matchs (date, adversaire, domicile true/false, score, resultat W/D/L)
- prochain : prochain match programmé (date, adversaire, domicile, compétition)
- staff : encadrement actuel (entraîneur, adjoints, entraîneur des gardiens, préparateur physique, médecin si connus) — nom + rôle
RÈGLE : ne retourne que des informations sûres et actuelles, sinon null / liste vide. N'invente jamais.`,
    add_context_from_internet: true,
    response_json_schema: SCHEMA,
  });
}

const RES_STYLE = { W: "bg-green-100 text-green-700", D: "bg-slate-100 text-slate-500", L: "bg-red-100 text-red-700" };
const resLetter = (lang, r) => t(lang, r === "W" ? "session.clubInfo.win" : r === "L" ? "session.clubInfo.loss" : "session.clubInfo.draw");

export default function ClubOverview({ club }) {
  const { lang } = useLanguage();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["clubOverview", club?.nom],
    queryFn: () => fetchOverview(club.nom),
    enabled: !!club?.nom,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
  });

  if (!club?.nom) return null;

  const cl = data?.classement;
  const forme = (data?.forme || []).filter((r) => ["W", "D", "L"].includes(r)).slice(-5);
  const results = (data?.derniers_resultats || []).slice(0, 5);
  const next = data?.prochain;
  const staff = (data?.staff || []).filter((s) => s?.nom);
  const empty = !cl && forme.length === 0 && results.length === 0 && !next?.adversaire && staff.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" /> {club.nom}
        </p>
        <button onClick={() => refetch()} disabled={isFetching}
          className="text-slate-400 hover:text-slate-600 disabled:opacity-50" title={t(lang, "session.clubInfo.refresh")}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "session.clubInfo.loading")}
        </div>
      ) : isError ? (
        <p className="text-sm text-slate-400 text-center py-4">{t(lang, "session.clubInfo.error")}</p>
      ) : empty ? (
        <p className="text-sm text-slate-400 text-center py-4">{t(lang, "session.clubInfo.none")}</p>
      ) : (
        <div className="space-y-4">
          {/* Classement + Forme */}
          {(cl?.position != null || forme.length > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {cl?.position != null && (
                <div className="text-sm text-slate-700">
                  <Trophy className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-amber-500" />
                  {cl.competition ? `${cl.competition} — ` : ""}<span className="font-bold">{cl.position}ᵉ</span>
                  {cl.points != null && <span className="text-slate-500"> · {cl.points} {t(lang, "session.clubInfo.pts")}</span>}
                  {(cl.victoires != null) && <span className="text-xs text-slate-400"> ({cl.victoires}{t(lang, "session.clubInfo.win")} {cl.nuls ?? 0}{t(lang, "session.clubInfo.draw")} {cl.defaites ?? 0}{t(lang, "session.clubInfo.loss")})</span>}
                </div>
              )}
              {forme.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1">{t(lang, "session.clubInfo.form")}</span>
                  {forme.map((r, i) => (
                    <span key={i} className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${RES_STYLE[r]}`}>{resLetter(lang, r)}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prochain match (mis en avant) */}
          {next?.adversaire && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
              <CalendarClock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-[11px] text-indigo-500 font-semibold uppercase tracking-wide mr-2">{t(lang, "session.clubInfo.nextMatch")}</span>
                <span className="font-medium text-slate-800">{next.domicile ? "🏠" : "✈️"} {next.adversaire}</span>
                <span className="text-xs text-slate-500">{next.date ? ` · ${next.date}` : ""}{next.competition ? ` · ${next.competition}` : ""}</span>
              </div>
            </div>
          )}

          {/* Derniers résultats */}
          {results.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t(lang, "session.clubInfo.lastResults")}</p>
              <div className="space-y-1">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${RES_STYLE[r.resultat] || "bg-slate-100 text-slate-500"}`}>{resLetter(lang, r.resultat)}</span>
                    <span className="text-slate-600 flex-1 truncate">{r.domicile ? "🏠" : "✈️"} {r.adversaire}</span>
                    {r.score && <span className="font-semibold text-slate-800">{r.score}</span>}
                    {r.date && <span className="text-slate-400 w-20 text-right">{r.date}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff */}
          {staff.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> {t(lang, "session.clubInfo.staff")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {staff.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-800 truncate">{s.nom}</span>
                    {s.role && <span className="text-[10px] text-slate-400 whitespace-nowrap">{s.role}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
