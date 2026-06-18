import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Loader2, ExternalLink, AlertCircle, RefreshCw, Search } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const NEWS_SCHEMA = {
  type: "object",
  properties: {
    articles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre:      { type: "string" },
          resume:     { type: "string" },
          source_nom: { type: "string" },
          source_url: { type: "string" },
          date:       { type: "string" },
        },
      },
    },
  },
};

// Rubrique Journal : articles de presse récents sur le joueur (recherche web via LLM).
// Si rien n'est trouvé, on propose un lien direct de recherche Google "info <nom>".
export default function PlayerNews({ player }) {
  const { lang } = useLanguage();
  const name = player?.nom;
  // Recherche Google du joueur directement sur l'onglet "Actualités" (tbm=nws).
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(name || "")}&tbm=nws&hl=fr`;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["player-news", player?.id],
    enabled: !!name,
    staleTime: 1000 * 60 * 30,    // 30 min : évite de relancer le LLM à chaque ouverture
    retry: false,
    queryFn: async () => {
      const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      const ctx = [
        player.club_actuel && `Club : ${player.club_actuel}`,
        player.poste && `Poste : ${player.poste}`,
        player.nationalite && `Nationalité : ${player.nationalite}`,
      ].filter(Boolean).join(", ");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un agrégateur de news football. Nous sommes le ${today}.
Recherche sur le web les vrais articles de presse récents (3 derniers mois) qui parlent du joueur **${name}**.
${ctx ? `Contexte : ${ctx}.` : ""}
Sources à fouiller : L'Équipe, RMC Sport, Sky Sports, BBC Sport, Transfermarkt, Goal.com, Marca, AS, Gazzetta dello Sport, journaux locaux du club, Fabrizio Romano (X).
Pour chaque article : "titre" (le titre exact, ne reformule pas), "resume" (1 phrase), "source_nom" (le média), "source_url" (l'URL exacte commençant par https://), "date" (AAAA-MM-JJ si connue).
RÈGLE ABSOLUE : uniquement des articles réels avec une URL valide. Si tu n'es pas sûr de l'URL exacte, ne l'inclus pas. Vise 5 à 8 articles.`,
        add_context_from_internet: true,
        response_json_schema: NEWS_SCHEMA,
      });
      return Array.isArray(res?.articles) ? res.articles.filter((a) => a?.titre) : [];
    },
  });

  if (!name) return null;
  const articles = data || [];

  const GoogleLink = () => (
    <a
      href={googleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 pt-1"
    >
      <Search className="w-3.5 h-3.5" /> {t(lang, "session.journal.google")}
    </a>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-indigo-600" /> {t(lang, "session.journal.title")}
          </CardTitle>
          <Button onClick={() => refetch()} disabled={isFetching} variant="ghost" size="sm" className="h-7 w-7 p-0">
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span className="text-sm">{t(lang, "session.journal.loading")}</span>
          </div>
        ) : isError ? (
          <>
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{error?.message || t(lang, "session.journal.error")}</span>
              <Button onClick={() => refetch()} size="sm" variant="ghost" className="h-7 gap-1 text-amber-600 hover:text-amber-700">
                <RefreshCw className="w-3 h-3" /> {t(lang, "session.journal.retry")}
              </Button>
            </div>
            <GoogleLink />
          </>
        ) : articles.length === 0 ? (
          <>
            <p className="text-xs text-slate-400 py-2">{t(lang, "session.journal.empty")}</p>
            <GoogleLink />
          </>
        ) : (
          <>
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
              {articles.map((a, i) => (
                <a
                  key={`${i}-${a.source_url || a.titre}`}
                  href={a.source_url || googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 line-clamp-2">{a.titre}</p>
                      {a.resume && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.resume}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {a.source_nom && <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{a.source_nom}</span>}
                        {a.date && <span className="text-[10px] text-slate-400">{a.date}</span>}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              ))}
            </div>
            <GoogleLink />
          </>
        )}
      </CardContent>
    </Card>
  );
}
