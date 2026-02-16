import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy } from "lucide-react";

export default function MatchSimulator({ currentTeamId, allTeams, onSimulate }) {
  const [opponentId, setOpponentId] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);

  const opponents = allTeams.filter(t => t.id !== currentTeamId);

  const simulateMatch = async () => {
    if (!opponentId) return;

    setSimulating(true);
    
    // Simulation simple basée sur des valeurs aléatoires
    const score1 = Math.floor(Math.random() * 5);
    const score2 = Math.floor(Math.random() * 5);
    
    const matchData = {
      team1_id: currentTeamId,
      team2_id: opponentId,
      score_team1: score1,
      score_team2: score2,
      date_match: new Date().toISOString().split('T')[0],
      type_match: "Simulation"
    };

    await onSimulate(matchData);
    setResult({ score1, score2 });
    
    setTimeout(() => {
      setSimulating(false);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-orange-600" />
          Simuler un match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Adversaire
          </label>
          <Select value={opponentId} onValueChange={setOpponentId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un adversaire..." />
            </SelectTrigger>
            <SelectContent>
              {opponents.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.nom} ({team.formation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={simulateMatch} 
          disabled={!opponentId || simulating}
          className="w-full"
        >
          {simulating ? "Simulation en cours..." : "Lancer le match"}
        </Button>

        {result && !simulating && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <span className="font-bold text-lg">Résultat</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-4">
                <Badge className="text-2xl py-2 px-4 bg-blue-600">
                  {result.score1}
                </Badge>
                <span className="text-slate-600 font-semibold">-</span>
                <Badge className="text-2xl py-2 px-4 bg-green-600">
                  {result.score2}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {result.score1 > result.score2 ? "🎉 Victoire !" : 
                 result.score1 < result.score2 ? "😞 Défaite" : 
                 "🤝 Match nul"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}