import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, AlertCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const DATE_LOCALES = { fr, es, en: enUS };

const categoryIcons = {
  tendance_marche: TrendingUp,
  performance_joueur: Sparkles,
  opportunite_transfert: Zap,
  analyse_equipe: Users,
  prevision: AlertCircle
};

const categoryColors = {
  tendance_marche: "bg-green-100 text-green-800",
  performance_joueur: "bg-blue-100 text-blue-800",
  opportunite_transfert: "bg-orange-100 text-orange-800",
  analyse_equipe: "bg-purple-100 text-purple-800",
  prevision: "bg-yellow-100 text-yellow-800"
};

const CATEGORY_LABEL_KEYS = {
  tendance_marche: "network.catMarketTrend",
  performance_joueur: "network.catPlayerPerf",
  opportunite_transfert: "network.catTransferOpp",
  analyse_equipe: "network.catTeamAnalysis",
  prevision: "network.catForecast",
};

const priorityColors = {
  haute: "bg-red-100 text-red-800",
  moyenne: "bg-yellow-100 text-yellow-800",
  basse: "bg-green-100 text-green-800"
};

export default function InsightCard({ insight }) {
  const { lang } = useLanguage();
  const Icon = categoryIcons[insight.categorie] || Sparkles;

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-slate-900">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <Badge className={categoryColors[insight.categorie]}>
                {t(lang, CATEGORY_LABEL_KEYS[insight.categorie] || 'network.catMarketTrend')}
              </Badge>
              {insight.priority && (
                <Badge className={`ml-2 ${priorityColors[insight.priority]}`}>
                  {insight.priority.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
          {insight.confiance && (
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">{insight.confiance}%</div>
              <div className="text-xs text-slate-500">{t(lang, 'network.confidence')}</div>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-3">{insight.titre}</h3>

        <p className="text-slate-700 whitespace-pre-line mb-3">{insight.contenu}</p>

        {insight.donnees_source && (
          <div className="bg-slate-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-slate-500 mb-1">{t(lang, 'network.dataSources')}</p>
            <p className="text-sm text-slate-600">{insight.donnees_source}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            {t(lang, 'network.generatedAt', { date: format(new Date(insight.created_date), "dd/MM/yyyy HH:mm", { locale: DATE_LOCALES[lang] || fr }) })}
          </span>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {t(lang, 'network.agentIA')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
