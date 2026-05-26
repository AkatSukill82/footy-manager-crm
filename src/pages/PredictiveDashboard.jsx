import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles } from "lucide-react";
import PredictiveKPIs from "../components/dashboard/predictive/PredictiveKPIs";
import CareerTrajectory from "../components/dashboard/predictive/CareerTrajectory";
import TransferRenewalPredictor from "../components/dashboard/predictive/TransferRenewalPredictor";
import MarketValueImpact from "../components/dashboard/predictive/MarketValueImpact";
import EmergingTalents from "../components/dashboard/predictive/EmergingTalents";
import PlayerComparisonTool from "../components/dashboard/predictive/PlayerComparisonTool";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function PredictiveDashboard() {
  const { lang } = useLanguage();
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500">
          <Sparkles className="w-5 h-5 animate-pulse text-purple-500" />
          {t(lang, 'predictive.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {t(lang, 'predictive.title')}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{t(lang, 'predictive.subtitle')}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          {t(lang, 'predictive.basedOn', { count: players.length, s: players.length !== 1 ? "s" : "" })}
        </div>
      </div>

      {/* KPIs */}
      <PredictiveKPIs players={players} />

      {/* Talents émergents — full width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmergingTalents players={players} />
        <TransferRenewalPredictor players={players} />
      </div>

      {/* Trajectoires + Impact valeur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CareerTrajectory players={players} />
        <MarketValueImpact players={players} />
      </div>

      {/* Comparaison avancée */}
      <PlayerComparisonTool allPlayers={players} />

      {/* Légende méthodologie */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">📌 {t(lang, 'predictive.methodTitle')}</p>
        <p>• {t(lang, 'predictive.methodTrajectory')}</p>
        <p>• {t(lang, 'predictive.methodTransfer')}</p>
        <p>• {t(lang, 'predictive.methodDev')}</p>
        <p>• {t(lang, 'predictive.methodTalent')}</p>
      </div>
    </div>
  );
}