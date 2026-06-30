import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { withOrg } from "@/lib/org";
import { Newspaper, Settings2, RefreshCw, Loader2, ExternalLink, Plus, X, UserPlus, Check } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const NW = {
  fr: { journal: "Journal", configSources: "Configurer mes sources", refresh: "Actualiser", mySources: "Mes médias / sources (nom ou URL collée)", sourcePh: "Ex: L'Équipe  ou  https://www.lequipe.fr/Football/", noSources: "Aucune → sources par défaut (L'Équipe, Sky, Fabrizio Romano…)", newsTypes: "Types d'actualités", keywords: "Mots-clés (joueur, club, championnat, agence…)", keywordPh: "Ex: Mbappé, Ligue 1, OL…", searching: "Recherche des actualités…", empty: "Aucune actualité. Configure tes sources (⚙️) puis actualise.", addPlayer: "+ joueur", linked: "Associé à un joueur", linkPlayer: "Associer à un joueur", cats: { transfert: "Transferts / Mercato", contrat: "Contrats", performance: "Performances / Résultats", blessure: "Blessures", rumeur: "Rumeurs" } },
  en: { journal: "News", configSources: "Configure my sources", refresh: "Refresh", mySources: "My media / sources (name or pasted URL)", sourcePh: "e.g. BBC Sport  or  https://www.bbc.com/sport/football", noSources: "None → default sources (L'Équipe, Sky, Fabrizio Romano…)", newsTypes: "News types", keywords: "Keywords (player, club, league, agency…)", keywordPh: "e.g. Mbappé, Premier League…", searching: "Searching the news…", empty: "No news. Configure your sources (⚙️) then refresh.", addPlayer: "+ player", linked: "Linked to a player", linkPlayer: "Link to a player", cats: { transfert: "Transfers / Market", contrat: "Contracts", performance: "Performance / Results", blessure: "Injuries", rumeur: "Rumors" } },
  es: { journal: "Noticias", configSources: "Configurar mis fuentes", refresh: "Actualizar", mySources: "Mis medios / fuentes (nombre o URL pegada)", sourcePh: "Ej: Marca  o  https://www.marca.com/futbol.html", noSources: "Ninguna → fuentes por defecto (L'Équipe, Sky, Fabrizio Romano…)", newsTypes: "Tipos de noticias", keywords: "Palabras clave (jugador, club, liga, agencia…)", keywordPh: "Ej: Mbappé, LaLiga…", searching: "Buscando noticias…", empty: "Sin noticias. Configura tus fuentes (⚙️) y actualiza.", addPlayer: "+ jugador", linked: "Vinculado a un jugador", linkPlayer: "Vincular a un jugador", cats: { transfert: "Fichajes / Mercado", contrat: "Contratos", performance: "Rendimiento / Resultados", blessure: "Lesiones", rumeur: "Rumores" } },
};

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
const DEFAULT_PREFS = { sources: [], categories: ["transfert"], keywords: [] };

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
  const kwLine = prefs.keywords?.length
    ? `\nPriorise les articles mentionnant ces mots-clés : ${prefs.keywords.join(", ")}.`
    : "";
  const data = await base44.integrations.Core.InvokeLLM({
    prompt: `Tu es un agrégateur de news football. Nous sommes le ${today}.
Cherche les vrais articles publiés aujourd'hui ou cette semaine, UNIQUEMENT depuis ces médias/sources : ${sources}.
Ne retiens QUE les actualités de ces types : ${catLabels}.${kwLine}
Pour chaque article : "titre" (exact, sans reformuler), "source_nom", "source_url" (URL https complète et VALIDE), "categorie".
RÈGLE ABSOLUE : uniquement des articles réels avec une URL exacte valide. 6 à 10 articles max, du plus récent au plus ancien.`,
    add_context_from_internet: true,
    response_json_schema: SCHEMA,
  });
  return data?.articles || [];
}

export default function DashboardNews() {
  const { lang } = useLanguage();
  const T = NW[lang] || NW.fr;
  const [prefs, setPrefs] = useState(loadPrefs);
  const [showSettings, setShowSettings] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [linked, setLinked] = useState({}); // index article → true quand associé à un joueur

  const { data: articles = [], isFetching, refetch } = useQuery({
    queryKey: ["dashNews", prefs.sources, prefs.categories, prefs.keywords],
    queryFn: () => fetchNews(prefs),
    staleTime: 1000 * 60 * 30,   // 30 min — appel LLM coûteux
    refetchInterval: false,      // surtout PAS le polling global 10 s
    retry: false,
  });

  // Joueurs (pour associer une news à un joueur).
  const { data: players = [] } = useQuery({
    queryKey: ["players-news"],
    queryFn: () => base44.entities.Player.filter({}, "-created_date", 500),
    staleTime: 1000 * 60 * 10,
  });

  const apply = (p) => { setPrefs(p); savePrefs(p); };
  const addSource = () => {
    const s = newSource.trim(); if (!s) return;
    apply({ ...prefs, sources: [...(prefs.sources || []), s] }); setNewSource("");
  };
  const removeSource = (i) => apply({ ...prefs, sources: prefs.sources.filter((_, idx) => idx !== i) });
  const addKeyword = () => {
    const k = newKeyword.trim(); if (!k) return;
    apply({ ...prefs, keywords: [...(prefs.keywords || []), k] }); setNewKeyword("");
  };
  const removeKeyword = (i) => apply({ ...prefs, keywords: prefs.keywords.filter((_, idx) => idx !== i) });
  const toggleCat = (id) => {
    const has = prefs.categories?.includes(id);
    apply({ ...prefs, categories: has ? prefs.categories.filter((c) => c !== id) : [...(prefs.categories || []), id] });
  };

  // Associe un article à un joueur → crée une note (PlayerNote) partagée au groupe.
  const associate = async (article, playerId, idx) => {
    if (!playerId) return;
    try {
      await base44.entities.PlayerNote.create(withOrg({
        player_id: playerId,
        note: `📰 ${article.titre}${article.source_nom ? ` (${article.source_nom})` : ""}${article.source_url ? `\n${article.source_url}` : ""}`,
        date_observation: new Date().toISOString().split("T")[0],
      }));
      setLinked((l) => ({ ...l, [idx]: true }));
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-slate-800 text-sm">{T.journal}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings((s) => !s)} title={T.configSources} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Settings2 className="w-4 h-4" /></button>
          <button onClick={() => refetch()} disabled={isFetching} title={T.refresh} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /></button>
        </div>
      </div>

      {showSettings && (
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">{T.mySources}</p>
            <div className="flex gap-1.5 mb-2">
              <input value={newSource} onChange={(e) => setNewSource(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSource()}
                placeholder={T.sourcePh} className="flex-1 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5" />
              <button onClick={addSource} className="px-2.5 rounded-lg bg-slate-900 text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(prefs.sources || []).length === 0 && <span className="text-[11px] text-slate-400">{T.noSources}</span>}
              {(prefs.sources || []).map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600 max-w-[200px]">
                  <span className="truncate">{s}</span>
                  <button onClick={() => removeSource(i)} className="text-slate-300 hover:text-red-500 flex-shrink-0"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">{T.newsTypes}</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const on = prefs.categories?.includes(c.id);
                return <button key={c.id} onClick={() => toggleCat(c.id)} className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${on ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{T.cats[c.id] || c.label}</button>;
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">{T.keywords}</p>
            <div className="flex gap-1.5 mb-2">
              <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                placeholder={T.keywordPh} className="flex-1 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5" />
              <button onClick={addKeyword} className="px-2.5 rounded-lg bg-slate-900 text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(prefs.keywords || []).map((k, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">
                  {k}<button onClick={() => removeKeyword(i)} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-3">
        {isFetching && articles.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> {T.searching}</div>
        ) : articles.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">{T.empty}</p>
        ) : (
          <div className="space-y-1">
            {articles.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 group">
                <a href={a.source_url || "#"} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 leading-snug line-clamp-2 group-hover:text-green-700">{a.titre}</p>
                  {a.source_nom && <span className="text-[10px] font-semibold text-slate-400">{a.source_nom}</span>}
                </a>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {linked[i] ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600" title={T.linked}><Check className="w-3.5 h-3.5" /></span>
                  ) : (
                    <select defaultValue="" onChange={(e) => associate(a, e.target.value, i)} title={T.linkPlayer}
                      className="text-[10px] border border-slate-200 rounded px-1 py-0.5 text-slate-500 max-w-[92px]">
                      <option value="">{T.addPlayer}</option>
                      {players.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                    </select>
                  )}
                  <a href={a.source_url || "#"} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-600" /></a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
