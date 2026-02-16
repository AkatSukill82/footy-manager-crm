import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function TeamCard({ team, playersCount }) {
  const navigate = useNavigate();
  const points = (team.victoires * 3) + (team.nuls * 1);
  const goalDiff = team.buts_pour - team.buts_contre;

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer"
      onClick={() => navigate(createPageUrl("TeamDetail") + "?id=" + team.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{team.nom}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{team.formation}</Badge>
              {team.budget && (
                <Badge className="bg-green-100 text-green-800">
                  {team.budget}M€
                </Badge>
              )}
            </div>
          </div>
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Joueurs</span>
          <span className="font-semibold">{playersCount || 0}/11</span>
        </div>

        {team.matchs_joues > 0 && (
          <>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold">{points} pts</span>
              </div>
              <span className="text-slate-600">
                {team.victoires}V - {team.nuls}N - {team.defaites}D
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Buts</span>
              <span className="font-semibold">
                {team.buts_pour} - {team.buts_contre}
                <span className={goalDiff >= 0 ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                  ({goalDiff >= 0 ? '+' : ''}{goalDiff})
                </span>
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}