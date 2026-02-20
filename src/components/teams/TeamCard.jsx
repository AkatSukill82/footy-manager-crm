import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function TeamCard({ team, playersCount, onDelete }) {
  const navigate = useNavigate();
  const points = (team.victoires || 0) * 3 + (team.nuls || 0);
  const goalDiff = (team.buts_pour || 0) - (team.buts_contre || 0);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete && onDelete();
  };

  return (
    <Card
      className="hover:shadow-xl transition-all cursor-pointer group border-slate-200"
      onClick={() => navigate(createPageUrl("TeamDetail") + "?id=" + team.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">{team.nom}</CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{team.formation}</Badge>
              {team.budget && (
                <Badge className="bg-green-100 text-green-800 text-xs border-0">{team.budget}M€</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Players count bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Effectif</span>
            <span className="font-semibold text-slate-700">{playersCount || 0} / 11</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${Math.min(((playersCount || 0) / 11) * 100, 100)}%` }}
            />
          </div>
        </div>

        {team.matchs_joues > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center bg-slate-50 rounded-lg py-1.5">
              <div className="text-base font-bold text-yellow-600">{points}</div>
              <div className="text-[10px] text-slate-500">Points</div>
            </div>
            <div className="text-center bg-slate-50 rounded-lg py-1.5">
              <div className="text-xs font-bold text-slate-700">{team.victoires}V {team.nuls}N {team.defaites}D</div>
              <div className="text-[10px] text-slate-500">{team.matchs_joues} matchs</div>
            </div>
            <div className="text-center bg-slate-50 rounded-lg py-1.5">
              <div className={`text-base font-bold ${goalDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {goalDiff >= 0 ? '+' : ''}{goalDiff}
              </div>
              <div className="text-[10px] text-slate-500">Diff.</div>
            </div>
          </div>
        )}

        {team.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{team.description}</p>
        )}
      </CardContent>
    </Card>
  );
}