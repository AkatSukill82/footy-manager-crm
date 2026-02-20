import React from "react";
import { TrendingUp, AlertCircle, Sparkles, ArrowRightLeft } from "lucide-react";

function KpiCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    blue: "from-blue-500 to-blue-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 shadow`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function PredictiveKPIs({ players }) {
  const today = new Date();

  const emergingCount = players.filter(p => {
    const age = p.age || 99;
    const note = p.note_moyenne || 0;
    return age <= 23 && (note >= 7.0 || (p.buts || 0) + (p.passes_decisives || 0) >= 8);
  }).length;

  const transferRiskCount = players.filter(p => {
    if (!p.contrat_fin) return false;
    const months = (new Date(p.contrat_fin) - today) / (1000 * 60 * 60 * 24 * 30);
    return months < 12;
  }).length;

  const growthPotential = players.filter(p => {
    const age = p.age || 99;
    const note = p.note_moyenne || 0;
    return age <= 25 && note >= 7.0;
  }).reduce((sum, p) => {
    const proj = (p.valeur_marchande || 0) * 1.2;
    return sum + proj - (p.valeur_marchande || 0);
  }, 0);

  const risingPlayers = players.filter(p => {
    const age = p.age || 99;
    const value = p.valeur_marchande || 0;
    const peak = p.valeur_marchande_peak || value;
    return age <= 26 && value >= peak && value > 0;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard icon={Sparkles} label="Talents émergents" value={emergingCount} sub="Joueurs ≤23 ans à fort potentiel" color="purple" />
      <KpiCard icon={AlertCircle} label="Risques départs" value={transferRiskCount} sub="Contrats < 12 mois restants" color="orange" />
      <KpiCard icon={TrendingUp} label="Plus-value potentielle" value={`${Math.round(growthPotential)} M€`} sub="Sur les joueurs ≤25 ans en forme" color="green" />
      <KpiCard icon={ArrowRightLeft} label="Au pic de valeur" value={risingPlayers} sub="Joueurs à leur valeur max" color="blue" />
    </div>
  );
}