import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle, Calculator } from "lucide-react";

export default function BudgetSimulator({ teams, players, teamPlayers }) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [simulation, setSimulation] = useState(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const simulateTransfer = () => {
    if (!selectedTeam || !selectedPlayer) return;

    const currentBudget = selectedTeam.budget || 0;
    const playerValue = selectedPlayer.valeur_marchande || 0;
    const teamPlayerCount = teamPlayers.filter(tp => tp.team_id === selectedTeamId).length;
    
    // Calculer la valeur actuelle de l'équipe
    const currentTeamPlayers = teamPlayers.filter(tp => tp.team_id === selectedTeamId);
    const currentTeamValue = currentTeamPlayers.reduce((sum, tp) => {
      const player = players.find(p => p.id === tp.player_id);
      return sum + (player?.valeur_marchande || 0);
    }, 0);

    const budgetAfterTransfer = currentBudget - playerValue;
    const newTeamValue = currentTeamValue + playerValue;
    const canAfford = budgetAfterTransfer >= 0;

    // Recommandations
    const recommendations = [];
    if (!canAfford) {
      recommendations.push("Budget insuffisant pour ce transfert");
      const deficit = Math.abs(budgetAfterTransfer);
      recommendations.push(`Vous devez augmenter le budget de ${deficit.toFixed(1)}M€`);
    } else if (budgetAfterTransfer < currentBudget * 0.2) {
      recommendations.push("Attention: Ce transfert laisse peu de budget de réserve");
    }

    if (teamPlayerCount >= 25) {
      recommendations.push("Effectif proche de la limite (25 joueurs max recommandé)");
    }

    if (playerValue > currentBudget * 0.5) {
      recommendations.push("Ce joueur représente plus de 50% de votre budget");
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
          Simulateur de budget de transfert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Sélectionner une équipe
          </label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une équipe..." />
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
            Sélectionner un joueur
          </label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un joueur..." />
            </SelectTrigger>
            <SelectContent>
              {players.filter(p => p.valeur_marchande).map(player => (
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
          Simuler le transfert
        </Button>

        {simulation && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              {simulation.canAfford ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Transfert possible
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Budget insuffisant
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">Budget actuel</div>
                <div className="text-2xl font-bold text-slate-900">
                  {simulation.currentBudget.toFixed(1)}M€
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">Coût du joueur</div>
                <div className="text-2xl font-bold text-orange-600">
                  {simulation.playerValue.toFixed(1)}M€
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">Budget restant</div>
                <div className={`text-2xl font-bold ${
                  simulation.budgetAfterTransfer >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {simulation.budgetAfterTransfer.toFixed(1)}M€
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">Nouvelle valeur équipe</div>
                <div className="text-2xl font-bold text-purple-600">
                  {simulation.newTeamValue.toFixed(1)}M€
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Effectif actuel:</span>
                <span className="font-medium">{simulation.teamPlayerCount} joueurs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Valeur actuelle équipe:</span>
                <span className="font-medium">{simulation.currentTeamValue.toFixed(1)}M€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">% du budget utilisé:</span>
                <span className="font-medium">
                  {((simulation.playerValue / simulation.currentBudget) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {simulation.recommendations.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-900">Recommandations</span>
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