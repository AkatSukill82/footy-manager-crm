import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper, Loader2, RefreshCw, TrendingUp, ArrowRightLeft,
  FileText, Eye, Star, Clock, AlertCircle, ChevronRight,
  Calendar, Zap, Trophy, Users, DollarSign, X, UserSearch, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

const DATE_LOCALES = { fr, es, en: enUS };

const CATEGORIES = [
  { key: "all",         labelKey: "news.catAll",          icon: Newspaper,      color: "bg-slate-700 text-white" },
  { key: "transfert",   labelKey: "news.catTransfers",    icon: ArrowRightLeft, color: "bg-blue-600 text-white" },
  { key: "contrat",     labelKey: "news.catContracts",    icon: FileText,       color: "bg-orange-500 text-white" },
  { key: "performance", labelKey: "news.catPerformance",  icon: TrendingUp,     color: "bg-green-600 text-white" },
  { key: "alerte",      labelKey: "news.catWatch",        icon: Eye,            color: "bg-purple-600 text-white" },
  { key: "palmares",    labelKey: "news.catResults",      icon: Trophy,         color: "bg-amber-500 text-white" },
];

const CATEGORY_STYLES = {
  transfert:   { bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-800",     icon: ArrowRightLeft, iconColor: "text-blue-600" },
  contrat:     { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-800", icon: FileText,       iconColor: "text-orange-600" },
  performance: { bg: "bg-green-50",  border: "border-green-200",  badge: "bg-green-100 text-green-800",   icon: TrendingUp,     iconColor: "text-green-600" },
  alerte:      { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800", icon: Star,           iconColor: "text-purple-600" },
  palmares:    { bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-800",   icon: Trophy,         iconColor: "text-amber-600" },
  default:     { bg: "bg-slate-50",  border: "border-slate-200",  badge: "bg-slate-100 text-slate-700",   icon: Newspaper,      iconColor: "text-slate-500" },
};

const URGENCY_CONFIG = {
  haute:   { labelKey: "news.urgencyHigh",   color: "bg-red-500 text-white" },
  moyenne: { labelKey: "news.urgencyMedium", color: "bg-orange-400 text-white" },
  basse:   { labelKey: "news.urgencyLow",    color: "bg-slate-400 text-white" },
};

const PERIODS = [
  { key: "1m",  label: "1 mois",  labelKey: "news.period1m", months: 1 },
  { key: "3m",  label: "3 mois",  labelKey: "news.period3m", months: 3 },
  { key: "6m",  label: "6 mois",  labelKey: "news.period6m", months: 6 },
  { key: "1y",  label: "1 an",    labelKey: "news.period1y", months: 12 },
];

const LOADING_MSGS_JOURNAL = {
  fr: [
    "Consultation de L'Équipe, RMC Sport…",
    "Analyse de Transfermarkt & Sky Sports…",
    "Lecture de Football Italia, Marca…",
    "Compilation des transferts du jour…",
    "Analyse des contrats en fin de course…",
    "Identification des talents à surveiller…",
    "Génération du journal personnalisé…",
  ],
  es: [
    "Consultando L'Équipe, RMC Sport…",
    "Analizando Transfermarkt & Sky Sports…",
    "Leyendo Football Italia, Marca…",
    "Compilando transferencias del día…",
    "Analizando contratos por expirar…",
    "Identificando talentos a seguir…",
    "Generando el diario personalizado…",
  ],
  en: [
    "Consulting L'Équipe, RMC Sport…",
    "Analysing Transfermarkt & Sky Sports…",
    "Reading Football Italia, Marca…",
    "Compiling today's transfers…",
    "Analysing expiring contracts…",
    "Identifying talents to watch…",
    "Generating your personalised journal…",
  ],
};

const LOADING_MSGS_PLAYER = {
  fr: [
    "Recherche dans les archives sportives…",
    "Consultation Transfermarkt, SofaScore…",
    "Analyse des médias et journaux…",
    "Compilation des informations…",
    "Génération du rapport joueur…",
  ],
  es: [
    "Buscando en los archivos deportivos…",
    "Consultando Transfermarkt, SofaScore…",
    "Analizando medios y periódicos…",
    "Compilando la información…",
    "Generando el informe del jugador…",
  ],
  en: [
    "Searching sports archives…",
    "Consulting Transfermarkt, SofaScore…",
    "Analysing media and press…",
    "Compiling information…",
    "Generating player report…",
  ],
};

function NewsCard({ item, onExpand }) {
  const { lang } = useLanguage();
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
              <Badge className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${urgency.color}`}>{t(lang, urgency.labelKey)}</Badge>
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
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-green-500 transition-colors flex-shrink-0" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewsModal({ item, onClose }) {
  const { lang } = useLanguage();
  if (!item) return null;
  const style = CATEGORY_STYLES[item.categorie] || CATEGORY_STYLES.default;
  const Icon = style.icon;
  const urgency = URGENCY_CONFIG[item.urgence] || URGENCY_CONFIG.basse;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${
          item.categorie === 'transfert'   ? 'from-blue-500 to-blue-600' :
          item.categorie === 'contrat'     ? 'from-orange-400 to-orange-500' :
          item.categorie === 'performance' ? 'from-green-500 to-green-600' :
          item.categorie === 'alerte'      ? 'from-purple-500 to-purple-600' :
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
                <Badge className={`text-xs ${urgency.color} ml-1 mb-1`}>{t(lang, urgency.labelKey)}</Badge>
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
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t(lang, 'news.detailAnalysis')}</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{item.details}</p>
            </div>
          )}

          {item.impact_marche && (
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-green-600 uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> {t(lang, 'news.marketImpact')}</p>
              <p className="text-sm text-slate-700">{item.impact_marche}</p>
            </div>
          )}

          {item.conseil_scout && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-purple-600 uppercase mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> {t(lang, 'news.scoutAdvice')}</p>
              <p className="text-sm text-slate-700">{item.conseil_scout}</p>
            </div>
          )}

          {item.joueurs_concernes?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> {t(lang, 'news.playersInvolved')}</p>
              <div className="flex flex-wrap gap-2">
                {item.joueurs_concernes.map((j, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{j}</Badge>
                ))}
              </div>
            </div>
          )}

          {item.clubs_concernes?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t(lang, 'news.clubsInvolved')}</p>
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

function ArticlesList({ articles, selectedCategory, onCategoryChange, onExpand }) {
  const { lang } = useLanguage();
  const filtered = selectedCategory === "all"
    ? articles
    : articles.filter(a => a.categorie === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = cat.key === "all" ? articles.length : articles.filter(a => a.categorie === cat.key).length;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                isActive ? `${cat.color} border-transparent shadow` : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(lang, cat.labelKey)}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.filter(a => a.urgence === "haute").length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-red-600 uppercase flex items-center gap-1.5 mb-3">
            <AlertCircle className="w-4 h-4" /> {t(lang, 'news.urgentSection')}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.filter(a => a.urgence === "haute").map((item, i) => (
              <NewsCard key={i} item={item} onExpand={onExpand} />
            ))}
          </div>
        </div>
      )}
      {filtered.filter(a => a.urgence === "moyenne").length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-orange-600 uppercase flex items-center gap-1.5 mb-3">
            <Clock className="w-4 h-4" /> {t(lang, 'news.importantSection')}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.filter(a => a.urgence === "moyenne").map((item, i) => (
              <NewsCard key={i} item={item} onExpand={onExpand} />
            ))}
          </div>
        </div>
      )}
      {filtered.filter(a => a.urgence === "basse").length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-3">
            <Newspaper className="w-4 h-4" /> {t(lang, 'news.infoSection')}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.filter(a => a.urgence === "basse").map((item, i) => (
              <NewsCard key={i} item={item} onExpand={onExpand} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const NEWS_SCHEMA = {
  type: "object",
  properties: {
    articles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre:             { type: "string" },
          resume:            { type: "string" },
          details:           { type: "string" },
          categorie:         { type: "string", enum: ["transfert", "contrat", "performance", "alerte", "palmares"] },
          urgence:           { type: "string", enum: ["haute", "moyenne", "basse"] },
          joueurs_concernes: { type: "array", items: { type: "string" } },
          clubs_concernes:   { type: "array", items: { type: "string" } },
          impact_marche:     { type: "string" },
          conseil_scout:     { type: "string" },
        },
      },
    },
  },
};

export default function NewsPage() {
  const { lang } = useLanguage();
  const dateLocale = DATE_LOCALES[lang] || enUS;

  const [activeTab, setActiveTab] = useState("journal");

  const [loadingJournal, setLoadingJournal] = useState(false);
  const [articlesJournal, setArticlesJournal] = useState([]);
  const [categoryJournal, setCategoryJournal] = useState("all");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loadingMsgJournal, setLoadingMsgJournal] = useState("");

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("3m");
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [articlesPlayer, setArticlesPlayer] = useState([]);
  const [categoryPlayer, setCategoryPlayer] = useState("all");
  const [loadingMsgPlayer, setLoadingMsgPlayer] = useState("");
  const [playerSearchDone, setPlayerSearchDone] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('-created_date'),
  });

  const fetchJournal = async () => {
    setLoadingJournal(true);
    setArticlesJournal([]);
    setLastUpdate(null);

    const msgs = LOADING_MSGS_JOURNAL[lang] || LOADING_MSGS_JOURNAL.fr;
    let msgIdx = 0;
    setLoadingMsgJournal(msgs[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setLoadingMsgJournal(msgs[msgIdx]);
    }, 2500);

    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un journaliste sportif expert en football. Nous sommes le ${today}.

Consulte les journaux et sources sportives du jour : L'Équipe, RMC Sport, Sky Sports, BBC Sport, Transfermarkt, Fabrizio Romano, Goal.com, Marca, AS, Gazzetta dello Sport, Le Parisien Sport.

Génère un journal complet du football du jour avec 15 à 20 articles couvrant :
1. Transferts confirmés ou rumeurs sérieuses
2. Fins de contrat imminentes
3. Joueurs à surveiller pour les prochains mercatos
4. Performances marquantes de la semaine
5. Blessures importantes impactant le marché
6. Signatures officielles récentes
7. Joueurs en conflit avec leur club
8. Révélations et jeunes talents

Pour chaque article, sois TRÈS DÉTAILLÉ dans les "details" : chiffres, montants, durée de contrat, statistiques, contexte, sources.
IMPORTANT: urgence = "haute" si transfert imminent ou fin de contrat < 6 mois, "moyenne" si dans les 6-12 mois, "basse" sinon.`,
        add_context_from_internet: true,
        response_json_schema: NEWS_SCHEMA,
      });
      setArticlesJournal(data?.articles || []);
      setLastUpdate(new Date());
    } catch (err) {
      setArticlesJournal([]);
    } finally {
      clearInterval(interval);
      setLoadingJournal(false);
    }
  };

  const fetchPlayerNews = async () => {
    if (!selectedPlayer) return;
    setLoadingPlayer(true);
    setArticlesPlayer([]);
    setPlayerSearchDone(false);

    const msgs = LOADING_MSGS_PLAYER[lang] || LOADING_MSGS_PLAYER.fr;
    let msgIdx = 0;
    setLoadingMsgPlayer(msgs[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setLoadingMsgPlayer(msgs[msgIdx]);
    }, 2000);

    const period = PERIODS.find(pd => pd.key === selectedPeriod);
    const periodLabel = period?.label || "3 mois";
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - (period?.months || 3));
    const fromLabel = fromDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const pl = selectedPlayer;
    const context = [
      pl.club_actuel && `Club actuel : ${pl.club_actuel}`,
      pl.poste && `Poste : ${pl.poste}`,
      pl.nationalite && `Nationalité : ${pl.nationalite}`,
      pl.age && `Âge : ${pl.age} ans`,
      pl.ligue && `Ligue : ${pl.ligue}`,
      pl.valeur_marchande && `Valeur marchande : ${pl.valeur_marchande} M€`,
      pl.contrat_fin && `Fin de contrat : ${pl.contrat_fin}`,
    ].filter(Boolean).join(", ");

    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un analyste sportif expert. Nous sommes le ${today}.

Recherche toutes les informations et actualités concernant le joueur de football **${pl.nom}** sur les ${periodLabel} écoulés (depuis le ${fromLabel}).
${context ? `\nContexte du joueur dans notre CRM : ${context}` : ""}

Fouille toutes les sources : L'Équipe, RMC Sport, Sky Sports, Transfermarkt, SofaScore, Fabrizio Romano, Goal.com, Marca, AS, Gazzetta dello Sport, BBC Sport, les journaux locaux de son club.

Génère entre 8 et 15 articles couvrant TOUT ce qui concerne ce joueur sur cette période :
- Ses performances matchs par matchs importantes
- Les rumeurs de transfert le concernant
- Son contrat (renouvellement, négociations, expiration)
- Ses statistiques et évolutions
- Ses blessures ou retours de blessure
- Les déclarations le concernant (entraîneur, agent, dirigeants)
- Sa valeur marchande et son évolution
- Sa situation en équipe nationale
- Tout événement marquant (but décisif, récompense, incident, etc.)

Sois PRÉCIS dans les dates (mois/année), les montants et les statistiques.
Si tu ne trouves pas d'info récente sur une catégorie, ne l'invente pas.
urgence = "haute" si c'est une info très récente (< 2 semaines) ou critique, "moyenne" si dans le dernier mois, "basse" sinon.`,
        add_context_from_internet: true,
        response_json_schema: NEWS_SCHEMA,
      });
      setArticlesPlayer(data?.articles || []);
      setPlayerSearchDone(true);
    } catch (err) {
      setArticlesPlayer([]);
      setPlayerSearchDone(true);
    } finally {
      clearInterval(interval);
      setLoadingPlayer(false);
    }
  };

  const urgentCountJournal = articlesJournal.filter(a => a.urgence === "haute").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{t(lang, 'news.title')}</h1>
                <p className="text-xs text-slate-500">
                  {lastUpdate && activeTab === "journal"
                    ? t(lang, 'news.updatedAt', { time: format(lastUpdate, "HH:mm", { locale: dateLocale }) })
                    : format(new Date(), "EEEE d MMMM yyyy", { locale: dateLocale })}
                </p>
              </div>
            </div>

            {/* Tab toggle */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab("journal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "journal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">{t(lang, 'news.tabJournal')}</span>
              </button>
              <button
                onClick={() => setActiveTab("joueur")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "joueur" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserSearch className="w-4 h-4" />
                <span className="hidden sm:inline">{t(lang, 'news.tabPlayers')}</span>
              </button>
            </div>

            {/* Action button */}
            {activeTab === "journal" && (
              <div className="flex items-center gap-2">
                {urgentCountJournal > 0 && (
                  <Badge className="bg-red-500 text-white gap-1 hidden sm:flex">
                    <AlertCircle className="w-3 h-3" />
                    {t(lang, 'news.urgentBadge', { count: urgentCountJournal, s: urgentCountJournal > 1 ? "s" : "" })}
                  </Badge>
                )}
                <Button onClick={fetchJournal} disabled={loadingJournal} className="bg-green-600 hover:bg-green-700 gap-2">
                  {loadingJournal ? <Loader2 className="w-4 h-4 animate-spin" /> : articlesJournal.length > 0 ? <RefreshCw className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  <span className="hidden sm:inline">{articlesJournal.length > 0 ? t(lang, 'news.refresh') : t(lang, 'news.readJournal')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── JOURNAL DU JOUR ── */}
        {activeTab === "journal" && (
          <>
            {!loadingJournal && articlesJournal.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center shadow-inner">
                  <Newspaper className="w-12 h-12 text-slate-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t(lang, 'news.yourJournalTitle')}</h2>
                  <p className="text-slate-500 max-w-md">{t(lang, 'news.yourJournalDesc')}</p>
                </div>
                <Button onClick={fetchJournal} size="lg" className="bg-green-600 hover:bg-green-700 gap-2 px-8">
                  <Zap className="w-5 h-5" /> {t(lang, 'news.readToday')}
                </Button>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {["L'Équipe", "RMC Sport", "Sky Sports", "Transfermarkt", "Fabrizio Romano", "Marca", "Gazzetta"].map(s => (
                    <Badge key={s} variant="outline" className="text-xs text-slate-400">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {loadingJournal && <LoadingSpinner msg={loadingMsgJournal} icon={<Newspaper className="w-8 h-8 text-green-500" />} />}

            {!loadingJournal && articlesJournal.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Contenu généré par IA — peut contenir des inexactitudes. Vérifier les informations avant utilisation professionnelle.
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { labelKey: "news.statsArticles",  value: articlesJournal.length,                                              icon: Newspaper,      color: "text-slate-700",  bg: "bg-slate-100" },
                    { labelKey: "news.statsTransfers", value: articlesJournal.filter(a => a.categorie === "transfert").length,     icon: ArrowRightLeft, color: "text-blue-700",   bg: "bg-blue-50" },
                    { labelKey: "news.statsContracts", value: articlesJournal.filter(a => a.categorie === "contrat").length,       icon: FileText,       color: "text-orange-700", bg: "bg-orange-50" },
                    { labelKey: "news.statsWatch",     value: articlesJournal.filter(a => a.categorie === "alerte").length,        icon: Star,           color: "text-purple-700", bg: "bg-purple-50" },
                  ].map(({ labelKey, value, icon: Icon, color, bg }) => (
                    <div key={labelKey} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{value}</p>
                        <p className="text-xs text-slate-500">{t(lang, labelKey)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <ArticlesList
                  articles={articlesJournal}
                  selectedCategory={categoryJournal}
                  onCategoryChange={setCategoryJournal}
                  onExpand={setExpanded}
                />
              </>
            )}
          </>
        )}

        {/* ── MES JOUEURS ── */}
        {activeTab === "joueur" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <UserSearch className="w-5 h-5 text-green-500" />
                {t(lang, 'news.searchPlayerTitle')}
              </h2>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t(lang, 'news.choosePlayer')}</p>
                {players.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">{t(lang, 'news.noPlayers')}</p>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(o => !o)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-green-400 transition-colors text-left"
                    >
                      {selectedPlayer ? (
                        <div className="flex items-center gap-3">
                          {selectedPlayer.photo_url
                            ? <img src={selectedPlayer.photo_url} alt={selectedPlayer.nom} className="w-8 h-8 rounded-full object-cover border" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                            : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Users className="w-4 h-4 text-slate-400" /></div>}
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{selectedPlayer.nom}</p>
                            <p className="text-xs text-slate-500">{selectedPlayer.poste}{selectedPlayer.club_actuel ? ` · ${selectedPlayer.club_actuel}` : ""}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">{t(lang, 'news.selectPlayerPlh')}</span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                        {players.map(pl => (
                          <button
                            key={pl.id}
                            onClick={() => {
                              setSelectedPlayer(pl);
                              setDropdownOpen(false);
                              setArticlesPlayer([]);
                              setPlayerSearchDone(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left ${selectedPlayer?.id === pl.id ? "bg-green-50" : ""}`}
                          >
                            {pl.photo_url
                              ? <img src={pl.photo_url} alt={pl.nom} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                              : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-slate-400" /></div>}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate">{pl.nom}</p>
                              <p className="text-xs text-slate-500 truncate">{pl.poste}{pl.club_actuel ? ` · ${pl.club_actuel}` : ""}</p>
                            </div>
                            {selectedPlayer?.id === pl.id && <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t(lang, 'news.period')}</p>
                <div className="flex gap-2 flex-wrap">
                  {PERIODS.map(pd => (
                    <button
                      key={pd.key}
                      onClick={() => setSelectedPeriod(pd.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedPeriod === pd.key
                          ? "bg-green-600 text-white border-green-600 shadow"
                          : "bg-white text-slate-600 border-slate-200 hover:border-green-300"
                      }`}
                    >
                      {t(lang, pd.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={fetchPlayerNews}
                disabled={!selectedPlayer || loadingPlayer}
                className="w-full bg-green-600 hover:bg-green-700 gap-2 h-11"
              >
                {loadingPlayer
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t(lang, 'news.searching')}</>
                  : <><UserSearch className="w-4 h-4" /> {t(lang, 'news.searchBtn')}</>}
              </Button>
            </div>

            {loadingPlayer && <LoadingSpinner msg={loadingMsgPlayer} icon={<UserSearch className="w-8 h-8 text-green-500" />} />}

            {!loadingPlayer && playerSearchDone && articlesPlayer.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">{t(lang, 'news.noResults', { name: selectedPlayer?.nom })}</p>
              </div>
            )}

            {!loadingPlayer && articlesPlayer.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Contenu généré par IA — peut contenir des inexactitudes. Vérifier les informations avant utilisation professionnelle.
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">{selectedPlayer?.nom}</h2>
                    <p className="text-xs text-slate-500">
                      {articlesPlayer.length} article{articlesPlayer.length > 1 ? "s" : ""} · {t(lang, PERIODS.find(pd => pd.key === selectedPeriod)?.labelKey || 'news.period3m')}
                    </p>
                  </div>
                  <Button onClick={fetchPlayerNews} disabled={loadingPlayer} variant="outline" size="sm" className="gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> {t(lang, 'news.refresh')}
                  </Button>
                </div>

                <ArticlesList
                  articles={articlesPlayer}
                  selectedCategory={categoryPlayer}
                  onCategoryChange={setCategoryPlayer}
                  onExpand={setExpanded}
                />
              </>
            )}
          </div>
        )}
      </div>

      {expanded && <NewsModal item={expanded} onClose={() => setExpanded(null)} />}
    </div>
  );
}

function LoadingSpinner({ msg, icon }) {
  const { lang } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative w-20 h-20">
        <div className="w-20 h-20 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800 mb-1">{t(lang, 'news.consultingSources')}</p>
        <p className="text-sm text-slate-500">{msg}</p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
