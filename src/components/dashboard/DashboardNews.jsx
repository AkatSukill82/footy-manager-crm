import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Newspaper, Settings2, RefreshCw, Loader2, ExternalLink, Plus, X } from "lucide-react";

/**
 * Journal d'actualités configurable sur le dashboard.
 * L'utilisateur choisit ses MÉDIAS/SOURCES (nom ou URL collée) et les TYPES
 * d'actu voulus. Les préférences sont stockées en localStorage (par navigateur).
 * Les articles sont récupérés via InvokeLLM (recherche web) en contraignant le
 * prompt aux sources + types choisis.
 */
const PREFS_KEY = "fdm_news_prefs";
const DEFAULT_SOURCES = ["L'Équipe", "RMC Sport", "Sky Sports", "BBC Sport", "Fabrizio Romano", "Transfermarkt"];
const CATEGORIES = [
  { id: "transfert",   label: "Transferts / Mercato" },
  { id: "contrat",     label: "Contrats" },
  { id: "performance", label: "Performances / Résultats" },
  { id: "blessure",    label: "Blessures" },
  { id: "rumeur",      label: "Rumeurs" },
];
const DEFAULT_PREFS = { sources: [], categories: ["transfert"] };

function loadPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") }; }
  catch { return DEFAULT_PREFS; }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

const SCHEMA = {
  type: "object",
  properties: { articles: { type: "array", items: { type: "object", properties: {
    titre: { type: "string" }, source_nom: { type: "string" }, source_url: { type: "string" }, categorie: { type: "string" },
  } } } },
};

async function fetchNews(prefs) {
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sources = (prefs.sources?.length ? prefs.sources : DEFAULT_SOURCES).join(", ");
  const catLabels = (prefs.categories?.length ? prefs.categories : ["transfert"])
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label || id).join(", ");
  const data = await base44.integrations.Core.InvokeLLM({
    prompt: `Tu es un agrégateur de news football. Nous sommes le ${today}.
Cherche les vrais articles publiés aujourd'hui ou cette semaine, UNIQUEMENT depuis ces médias/sources : ${sources}.
Ne retiens QUE les actualités de ces types : ${catLabels}.
Pour chaque article : "titre" (exact, sans reformuler), "source_nom", "source_url" (URL https complète et VALIDE), "categorie".
RÈGLE ABSOLUE : uniquement des articles réels avec une URL exacte valide. 6 à 10 articles max, du plus récent au plus ancien.`,
    add_context_from_internet: true,
    response_json_schema: SCHEMA,
  });
  return data?.articles || [];
}

export default function DashboardNews() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const [showSettings, setShowSettings] = useState(false);
  const [newSource, setNewSource] = useState("");

  const { data: articles = [], isFetching, refetch } = useQuery({
    queryKey: ["dashNews", prefs.sources, prefs.categories],
    queryFn: () => fetchNews(prefs),
    staleTime: 1000 * 60 * 30,   // 30 min — appel LLM coûteux
    refetchInterval: false,      // surtout PAS le polling global 10 s
    retry: false,
  });

  const apply = (p) => { setPrefs(p); savePrefs(p); };
  const addSource = () => {
    const s = newSource.trim(); if (!s) return;
    apply({ ...prefs, sources: [...(prefs.sources || []), s] }); setNewSource("");
  };
  const removeSource = (i) => apply({ ...prefs, sources: prefs.sources.filter((_, idx) => idx !== i) });
  const toggleCat = (id) => {
    const has = prefs.categories?.includes(id);
    apply({ ...prefs, categories: has ? prefs.categories.filter((c) => c !== id) : [...(prefs.categories || []), id] });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-slate-800 text-sm">Journal</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings((s) => !s)} title="Configurer mes sources" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Settings2 className="w-4 h-4" /></button>
          <button onClick={() => refetch()} disabled={isFetching} title="Actualiser" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /></button>
        </div>
      </div>

      {showSettings && (
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Mes médias / sources (nom ou URL collée)</p>
            <div className="flex gap-1.5 mb-2">
              <input value={newSource} onChange={(e) => setNewSource(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSource()}
                placeholder="Ex: L'Équipe  ou  https://www.lequipe.fr/Football/" className="flex-1 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5" />
              <button onClick={addSource} className="px-2.5 rounded-lg bg-slate-900 text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(prefs.sources || []).length === 0 && <span className="text-[11px] text-slate-400">Aucune → sources par défaut (L'Équipe, Sky, Fabrizio Romano…)</span>}
              {(prefs.sources || []).map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600 max-w-[200px]">
                  <span className="truncate">{s}</span>
                  <button onClick={() => removeSource(i)} className="text-slate-300 hover:text-red-500 flex-shrink-0"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Types d'actualités</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const on = prefs.categories?.includes(c.id);
                return <button key={c.id} onClick={() => toggleCat(c.id)} className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${on ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{c.label}</button>;
              })}
            </div>
          </div>
        </div>
      )}

      <div className="p-3">
        {isFetching && articles.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Recherche des actualités…</div>
        ) : articles.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Aucune actualité. Configure tes sources (⚙️) puis actualise.</p>
        ) : (
          <div className="space-y-1">
            {articles.slice(0, 10).map((a, i) => (
              <a key={i} href={a.source_url || "#"} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 group">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 leading-snug line-clamp-2 group-hover:text-green-700">{a.titre}</p>
                  {a.source_nom && <span className="text-[10px] font-semibold text-slate-400">{a.source_nom}</span>}
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-600 flex-shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
