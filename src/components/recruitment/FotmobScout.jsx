import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { invokeFn } from "@/api/base44Client";
import { Loader2, AlertCircle, BarChart2, Activity, Sparkles } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";
import {
  FOTMOB_FAMILIES, FAMILY_LABEL, FAMILY_STATS, FAMILY_STAT_SUFFIX, pctColor, buildScoutAnalysis,
} from "../../lib/scoutAnalysis";

const UI = {
  fr: { title: "Stats FotMob (vs même poste)", load: "Charger les stats FotMob", loading: "Chargement des stats…", none: "Pas de stats comparatives FotMob pour ce joueur.", detail: "Détail FotMob par famille", analysis: "Analyse", noData: "Renseigne un nom (ou lance une recherche) puis charge les stats." },
  en: { title: "FotMob stats (vs same position)", load: "Load FotMob stats", loading: "Loading stats…", none: "No comparative FotMob stats for this player.", detail: "FotMob detail by family", analysis: "Analysis", noData: "Enter a name (or run a search) then load the stats." },
  es: { title: "Stats FotMob (vs mismo puesto)", load: "Cargar stats FotMob", loading: "Cargando estadísticas…", none: "Sin estadísticas comparativas de FotMob.", detail: "Detalle FotMob por familia", analysis: "Análisis", noData: "Indica un nombre (o busca) y luego carga las estadísticas." },
};

/**
 * Récupère les stats FotMob d'un joueur (détail + percentiles par famille) via
 * le proxy. `auto` déclenche le chargement dès qu'une identité stable existe
 * (joueur issu de la recherche) ; sinon `load()` lance à la demande.
 */
export function useFotmobScout({ name = "", club = "", fotmobId = null, auto = false }) {
  const [triggered, setTriggered] = useState(false);
  const key = fotmobId || name || "";
  useEffect(() => { if (auto && key) setTriggered(true); }, [auto, key]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fotmobScout", String(fotmobId || ""), name || "", club || ""],
    queryFn: async () => {
      const res = fotmobId
        ? await invokeFn("fotmobProxy", { action: "getStats", fotmob_id: fotmobId })
        : await invokeFn("fotmobProxy", { action: "searchAndGetStats", query: name, club });
      if (!res?.ok) throw new Error(res?.error || "no_stats");
      const s = { ...res.stats };
      if (s.note_moyenne == null && s.note_fotmob != null) s.note_moyenne = s.note_fotmob;
      return s;
    },
    enabled: triggered && !!key,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  return {
    stats: data || null,
    percentiles: data?.stat_percentiles || null,
    loading: triggered && isLoading,
    error: error ? (error.message || "error") : null,
    triggered,
    load: () => { setTriggered(true); if (triggered) refetch(); },
  };
}

// ── Diagramme : barres horizontales des 4 familles (percentile 0..100) ────────
export function FotmobFamilyBars({ percentiles, loading, onLoad }) {
  const { lang } = useLanguage();
  const U = UI[lang] || UI.fr;
  const FL = FAMILY_LABEL[lang] || FAMILY_LABEL.fr;
  const has = percentiles && FOTMOB_FAMILIES.some((k) => Number.isFinite(Number(percentiles[k])));

  return (
    <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        <Activity className="w-3.5 h-3.5 text-orange-500" /> {U.title}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-orange-500" /><span className="text-sm">{U.loading}</span></div>
      ) : !has ? (
        <div className="text-center py-4">
          <p className="text-xs text-slate-400 mb-2">{U.none}</p>
          {onLoad && <button type="button" onClick={onLoad} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50"><BarChart2 className="w-3.5 h-3.5" /> {U.load}</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {FOTMOB_FAMILIES.map((k) => {
            const v = Number(percentiles[k]);
            const val = Number.isFinite(v) ? Math.round(v) : null;
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 w-24 flex-shrink-0">{FL[k]}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  {val != null && <div className="h-full rounded-full" style={{ width: `${Math.max(3, val)}%`, backgroundColor: pctColor(val) }} />}
                </div>
                <span className="text-xs font-semibold text-slate-700 w-8 text-right tabular-nums">{val != null ? val : "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Deux div : détail complet par famille (gauche) + analyse en phrases (droite) ─
export function FotmobScoutDetail({ stats, percentiles, loading, error, onLoad }) {
  const { lang } = useLanguage();
  const U = UI[lang] || UI.fr;
  const FL = FAMILY_LABEL[lang] || FAMILY_LABEL.fr;
  const analysis = buildScoutAnalysis(percentiles || {}, stats || {}, { lang });

  if (loading) {
    return <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-center py-8 gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-orange-500" /><span className="text-sm">{U.loading}</span></div>;
  }
  if (!stats) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
        <p className="text-xs text-slate-400 mb-2">{error ? U.none : U.noData}</p>
        {onLoad && <button type="button" onClick={onLoad} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50"><BarChart2 className="w-3.5 h-3.5" /> {U.load}</button>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Gauche : stats FotMob détaillées par famille */}
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          <Activity className="w-3.5 h-3.5 text-orange-500" /> {U.detail}
        </div>
        <div className="space-y-3">
          {FOTMOB_FAMILIES.map((fam) => {
            const items = FAMILY_STATS[fam].filter((k) => stats[k] != null && stats[k] !== "");
            if (!items.length) return null;
            return (
              <div key={fam}>
                <div className="text-[11px] font-semibold text-slate-400 mb-1">{FL[fam]}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map((k) => (
                    <div key={k} className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 truncate">{t(lang, `session.fotmob.l.${k}`)}</span>
                      <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">{stats[k]}{FAMILY_STAT_SUFFIX[k] || ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Droite : analyse auto-générée en phrases */}
      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" /> {U.analysis}
        </div>
        {analysis ? (
          <div className="space-y-2">
            {analysis.sentences.map((s, i) => (
              <p key={i} className={`text-sm leading-relaxed ${i === 0 ? "text-slate-800 font-medium" : "text-slate-600"}`}>{s}</p>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-2 text-xs text-slate-400"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{U.none}</span></div>
        )}
      </div>
    </div>
  );
}
