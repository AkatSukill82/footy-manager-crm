import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper, Loader2, RefreshCw, TrendingUp, ArrowRightLeft,
  FileText, Eye, Star, Clock, AlertCircle, ChevronRight,
  Calendar, Zap, Trophy, Users, DollarSign, X
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES = [
  { key: "all", label: "Tout", icon: Newspaper, color: "bg-slate-700 text-white" },
  { key: "transfert", label: "Transferts", icon: ArrowRightLeft, color: "bg-blue-600 text-white" },
  { key: "contrat", label: "Contrats", icon: FileText, color: "bg-orange-500 text-white" },
  { key: "performance", label: "Performances", icon: TrendingUp, color: "bg-green-600 text-white" },
  { key: "alerte", label: "À surveiller", icon: Eye, color: "bg-purple-600 text-white" },
  { key: "palmares", label: "Résultats", icon: Trophy, color: "bg-amber-500 text-white" },
];

const CATEGORY_STYLES = {
  transfert: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", icon: ArrowRightLeft, iconColor: "text-blue-600" },
  contrat: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-800", icon: FileText, iconColor: "text-orange-600" },
  performance: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-800", icon: TrendingUp, iconColor: "text-green-600" },
  alerte: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800", icon: Star, iconColor: "text-purple-600" },
  palmares: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", icon: Trophy, iconColor: "text-amber-600" },
  default: { bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-700", icon: Newspaper, iconColor: "text-slate-500" },
};

const URGENCY_CONFIG = {
  haute: { label: "Urgent", color: "bg-red-500 text-white" },
  moyenne: { label: "Important", color: "bg-orange-400 text-white" },
  basse: { label: "Info", color: "bg-slate-400 text-white" },
};

function NewsCard({ item, onExpand }) {
  const style = CATEGORY_STYLES[item.categorie] || CATEGORY_STYLES.default;
  const Icon = style.icon;
  const urgency = URGENCY_CONFIG[item.urgence] || URGENCY_CONFIG.basse;

  return (
    <Card className={`border ${style.border} hover:shadow-md transition-all cursor-pointer group`} onClick={() => onExpand(item)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-green-700 transition-colors line-clamp-2">{item.titre}</h3>
              <div className="flex gap-1 flex-shrink-0">
                <Badge className={`text-[10px] px-1.5 py-0.5 ${urgency.color}`}>{urgency.label}</Badge>
              </div>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.resume}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                <Badge className={`text-[10px] px-1.5 py-0.5 ${style.badge}`}>{item.categorie}</Badge>
                {item.joueurs_concernes?.slice(0, 2).map((j, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0.5">{j}</Badge>
                ))}
                {item.joueurs_concernes?.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">+{item.joueurs_concernes.length - 2}</Badge>
                )}
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                <ChevronRight className="w-3 h-3 group-hover:text-green-500 transition-colors" />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewsModal({ item, onClose }) {
  if (!item) return null;
  const style = CATEGORY_STYLES[item.categorie] || CATEGORY_STYLES.default;
  const Icon = style.icon;
  const urgency = URGENCY_CONFIG[item.urgence] || URGENCY_CONFIG.basse;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${
          item.categorie === 'transfert' ? 'from-blue-500 to-blue-600' :
          item.categorie === 'contrat' ? 'from-orange-400 to-orange-500' :
          item.categorie === 'performance' ? 'from-green-500 to-green-600' :
          item.categorie === 'alerte' ? 'from-purple-500 to-purple-600' :
          'from-slate-400 to-slate-500'
        }`} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${style.iconColor}`} />
              </div>
              <div>
                <Badge className={`text-xs ${style.badge} mb-1`}>{item.categorie}</Badge>
                <Badge className={`text-xs ${urgency.color} ml-1 mb-1`}>{urgency.label}</Badge>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-3">{item.titre}</h2>
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">{item.resume}</p>

          {item.details && (
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Analyse détaillée</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{item.details}</p>
            </div>
          )}

          {item.impact_marche && (
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-green-600 uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Impact marché</p>
              <p className="text-sm text-slate-700">{item.impact_marche}</p>
            </div>
          )}

          {item.conseil_scout && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-purple-600 uppercase mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> Conseil scout</p>
              <p className="text-sm text-slate-700">{item.conseil_scout}</p>
            </div>
          )}

          {item.joueurs_concernes?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Joueurs concernés</p>
              <div className="flex flex-wrap gap-2">
                {item.joueurs_concernes.map((j, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{j}</Badge>
                ))}
              </div>
            </div>
          )}

          {item.clubs_concernes?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Clubs concernés</p>
              <div className="flex flex-wrap gap-2">
                {item.clubs_concernes.map((c, i) => (
                  <Badge key={i} className="bg-slate-100 text-slate-700 text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("");

  const loadingMessages = [
    "Consultation de L'Équipe, RMC Sport…",
    "Analyse de Transfermarkt & Sky Sports…",
    "Lecture de Football Italia, Marca…",
    "Compilation des transferts du jour…",
    "Analyse des contrats en fin de course…",
    "Identification des talents à surveiller…",
    "Génération du journal personnalisé…",
  ];

  const fetchNews = async () => {
    setLoading(true);
    setArticles([]);
    setLastUpdate(null);

    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 2500);

    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un journaliste sportif expert en football. Nous sommes le ${today}.

Consulte les journaux et sources sportives du jour : L'Équipe, RMC Sport, Sky Sports, BBC Sport, Transfermarkt, Fabrizio Romano, Goal.com, Marca, AS, Gazzetta dello Sport, Le Parisien Sport, L'Equipe du Soir, La Gazzetta.

Génère un journal complet du football du jour avec 15 à 20 articles couvrant :
1. Transferts confirmés ou rumeurs sérieuses (officiels et hot rumors)
2. Fins de contrat imminentes (joueurs libres en juin, rumeurs de renouvellement)
3. Joueurs à surveiller absolument pour les prochains mercatos
4. Performances marquantes de la semaine / du week-end
5. Blessures importantes impactant le marché
6. Signatures officielles récentes
7. Joueurs en conflit avec leur club (pas de renouvellement)
8. Révélations et jeunes talents qui montent

Pour chaque article, sois TRÈS DÉTAILLÉ dans les "details" : chiffres, montants, durée de contrat, statistiques, contexte, sources.
Donne des informations RÉELLES et ACTUELLES basées sur ce que tu sais.

IMPORTANT: urgence = "haute" si transfert imminent ou fin de contrat < 6 mois, "moyenne" si dans les 6-12 mois, "basse" sinon.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titre: { type: "string" },
                resume: { type: "string" },
                details: { type: "string" },
                categorie: {
                  type: "string",
                  enum: ["transfert", "contrat", "performance", "alerte", "palmares"]
                },
                urgence: {
                  type: "string",
                  enum: ["haute", "moyenne", "basse"]
                },
                joueurs_concernes: {
                  type: "array",
                  items: { type: "string" }
                },
                clubs_concernes: {
                  type: "array",
                  items: { type: "string" }
                },
                impact_marche: { type: "string" },
                conseil_scout: { type: "string" }
              }
            }
          }
        }
      }
    });

    clearInterval(interval);
    setArticles(data?.articles || []);
    setLastUpdate(new Date());
    setLoading(false);
  };

  const filtered = selectedCategory === "all"
    ? articles
    : articles.filter(a => a.categorie === selectedCategory);

  const urgentCount = articles.filter(a => a.urgence === "haute").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Journal du Football</h1>
                <p className="text-xs text-slate-500">
                  {lastUpdate
                    ? `Mis à jour à ${format(lastUpdate, "HH:mm", { locale: fr })}`
                    : format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {urgentCount > 0 && (
                <Badge className="bg-red-500 text-white gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {urgentCount} urgent{urgentCount > 1 ? "s" : ""}
                </Badge>
              )}
              <Button
                onClick={fetchNews}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : articles.length > 0
                    ? <RefreshCw className="w-4 h-4" />
                    : <Zap className="w-4 h-4" />
                }
                {articles.length > 0 ? "Actualiser" : "Lire le journal"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Empty state */}
        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center shadow-inner">
              <Newspaper className="w-12 h-12 text-slate-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Votre journal du jour</h2>
              <p className="text-slate-500 max-w-md">
                Cliquez sur <strong>"Lire le journal"</strong> pour que l'IA consulte tous les journaux sportifs du jour et vous génère un résumé complet : transferts, contrats, talents, performances…
              </p>
            </div>
            <Button onClick={fetchNews} size="lg" className="bg-green-600 hover:bg-green-700 gap-2 px-8">
              <Zap className="w-5 h-5" />
              Lire le journal du jour
            </Button>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {["L'Équipe", "RMC Sport", "Sky Sports", "Transfermarkt", "Fabrizio Romano", "Marca", "Gazzetta"].map(s => (
                <Badge key={s} variant="outline" className="text-xs text-slate-400">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Newspaper className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800 mb-1">Consultation des sources…</p>
              <p className="text-sm text-slate-500 transition-all">{loadingMsg}</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && articles.length > 0 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Articles", value: articles.length, icon: Newspaper, color: "text-slate-700", bg: "bg-slate-100" },
                { label: "Transferts", value: articles.filter(a => a.categorie === "transfert").length, icon: ArrowRightLeft, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Contrats", value: articles.filter(a => a.categorie === "contrat").length, icon: FileText, color: "text-orange-700", bg: "bg-orange-50" },
                { label: "À surveiller", value: articles.filter(a => a.categorie === "alerte").length, icon: Star, color: "text-purple-700", bg: "bg-purple-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const count = cat.key === "all" ? articles.length : articles.filter(a => a.categorie === cat.key).length;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                      isActive ? `${cat.color} border-transparent shadow` : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Articles grid */}
            {/* Urgent first */}
            {filtered.filter(a => a.urgence === "haute").length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-red-600 uppercase flex items-center gap-1.5 mb-3">
                  <AlertCircle className="w-4 h-4" /> À la Une — Urgent
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {filtered.filter(a => a.urgence === "haute").map((item, i) => (
                    <NewsCard key={i} item={item} onExpand={setExpanded} />
                  ))}
                </div>
              </div>
            )}

            {filtered.filter(a => a.urgence === "moyenne").length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-orange-600 uppercase flex items-center gap-1.5 mb-3">
                  <Clock className="w-4 h-4" /> Important
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {filtered.filter(a => a.urgence === "moyenne").map((item, i) => (
                    <NewsCard key={i} item={item} onExpand={setExpanded} />
                  ))}
                </div>
              </div>
            )}

            {filtered.filter(a => a.urgence === "basse").length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-3">
                  <Newspaper className="w-4 h-4" /> Informations
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {filtered.filter(a => a.urgence === "basse").map((item, i) => (
                    <NewsCard key={i} item={item} onExpand={setExpanded} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal détail */}
      {expanded && <NewsModal item={expanded} onClose={() => setExpanded(null)} />}
    </div>
  );
}