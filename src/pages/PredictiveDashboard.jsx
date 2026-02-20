import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles } from "lucide-react";
import PredictiveKPIs from "../components/dashboard/predictive/PredictiveKPIs";
import CareerTrajectory from "../components/dashboard/predictive/CareerTrajectory";
import TransferRenewalPredictor from "../components/dashboard/predictive/TransferRenewalPredictor";
import MarketValueImpact from "../components/dashboard/predictive/MarketValueImpact";
import EmergingTalents from "../components/dashboard/predictive/EmergingTalents";

export default function PredictiveDashboard() {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500">
          <Sparkles className="w-5 h-5 animate-pulse text-purple-500" />
          Chargement de l'analyse prédictive…
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
            Analyse Prédictive
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Projections IA · Trajectoires de carrière · Risques de transfert · Talents émergents
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Basé sur {players.length} joueur{players.length !== 1 ? "s" : ""} dans la base
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

      {/* Légende méthodologie */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">📌 Méthodologie</p>
        <p>• <strong>Trajectoires</strong> : projection mathématique basée sur la courbe âge/valeur type (pic entre 24-27 ans, déclin progressif après 29 ans)</p>
        <p>• <strong>Transfert/Renouvellement</strong> : scoring pondéré (contrat restant, âge, forme récente, ratio valeur/peak)</p>
        <p>• <strong>Impact développement</strong> : facteurs multiplicatifs (âge, note SofaScore, ratio buts/xG, contributions)</p>
        <p>• <strong>Talents émergents</strong> : algorithme multi-critères sur joueurs ≤23 ans (âge, note, xG, contributions, valeur)</p>
      </div>
    </div>
  );
}