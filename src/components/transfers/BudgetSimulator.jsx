import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle, Calculator } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function BudgetSimulator({ teams, players, teamPlayers }) {
  const { lang } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [simulation, setSimulation] = useState(null);

  const selectedTeam = teams.find(tm => tm.id === selectedTeamId);
  const selectedPlayer = players.find(pl => pl.id === selectedPlayerId);

  const simulateTransfer = () => {
    if (!selectedTeam || !selectedPlayer) return;

    const currentBudget = selectedTeam.budget || 0;
    const playerValue = selectedPlayer.valeur_marchande || 0;
    const teamPlayerCount = teamPlayers.filter(tp => tp.team_id === selectedTeamId).length;

    const currentTeamPlayers = teamPlayers.filter(tp => tp.team_id === selectedTeamId);
    const currentTeamValue = currentTeamPlayers.reduce((sum, tp) => {
      const pl = players.find(p => p.id === tp.player_id);
      return sum + (pl?.valeur_marchande || 0);
    }, 0);

    const budgetAfterTransfer = currentBudget - playerValue;
    const newTeamValue = currentTeamValue + playerValue;
    const canAfford = budgetAfterTransfer >= 0;

    const recommendations = [];
    if (!canAfford) {
      recommendations.push(t(lang, 'transfers.recInsufficient'));
      const deficit = Math.abs(budgetAfterTransfer);
      recommendations.push(t(lang, 'transfers.recIncrease', { deficit: deficit.toFixed(1) }));
    } else if (budgetAfterTransfer < currentBudget * 0.2) {
      recommendations.push(t(lang, 'transfers.recLowReserve'));
    }

    if (teamPlayerCount >= 25) {
      recommendations.push(t(lang, 'transfers.recSquadLimit'));
    }

    if (playerValue > currentBudget * 0.5) {
      recommendations.push(t(lang, 'transfers.recBigSpend'));
    }

    setSimulation({
      canAfford,
      currentBudget,
      playerValue,
      budgetAfterTransfer,
      currentTeamValue,
      newTeamValue,
      teamPlayerCount,
      recommendations
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          {t(lang, 'transfers.simulatorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            {t(lang, 'transfers.selectTeam')}
          </label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger>
              <SelectValue placeholder={t(lang, 'transfers.chooseTeam')} />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.nom} ({team.budget || 0}M€)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            {t(lang, 'transfers.selectPlayer')}
          </label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger>
              <SelectValue placeholder={t(lang, 'transfers.selectPlayerPlh')} />
            </SelectTrigger>
            <SelectContent>
              {players.filter(pl => pl.valeur_marchande).map(player => (
                <SelectItem key={player.id} value={player.id}>
                  {player.nom} - {player.valeur_marchande}M€
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={simulateTransfer}
          disabled={!selectedTeamId || !selectedPlayerId}
          className="w-full bg-slate-900 hover:bg-slate-800"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {t(lang, 'transfers.simulateBtn')}
        </Button>

        {simulation && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              {simulation.canAfford ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t(lang, 'transfers.feasible')}
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {t(lang, 'transfers.insufficientBudget')}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">{t(lang, 'transfers.currentBudget')}</div>
                <div className="text-2xl font-bold text-slate-900">
                  {simulation.currentBudget.toFixed(1)}M€
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">{t(lang, 'transfers.playerCost')}</div>
                <div className="text-2xl font-bold text-orange-600">
                  {simulation.playerValue.toFixed(1)}M€
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">{t(lang, 'transfers.remainingBudget')}</div>
                <div className={`text-2xl font-bold ${simulation.budgetAfterTransfer >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {simulation.budgetAfterTransfer.toFixed(1)}M€
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">{t(lang, 'transfers.newTeamValue')}</div>
                <div className="text-2xl font-bold text-purple-600">
                  {simulation.newTeamValue.toFixed(1)}M€
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t(lang, 'transfers.currentSquad')}</span>
                <span className="font-medium">{simulation.teamPlayerCount} {t(lang, 'teams.squad').toLowerCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t(lang, 'transfers.currentTeamValue')}</span>
                <span className="font-medium">{simulation.currentTeamValue.toFixed(1)}M€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t(lang, 'transfers.budgetUsed')}</span>
                <span className="font-medium">
                  {((simulation.playerValue / simulation.currentBudget) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {simulation.recommendations.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-900">{t(lang, 'transfers.simulRecommendations')}</span>
                </div>
                <ul className="space-y-1 text-sm text-amber-800">
                  {simulation.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
