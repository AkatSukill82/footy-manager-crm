import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, User, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

const typeLabels = {
  player_profile: "Profil joueur",
  team_analysis: "Analyse d'équipe",
  market_insight: "Insight marché",
  transfer_opportunity: "Opportunité de transfert"
};

const typeColors = {
  player_profile: "bg-blue-100 text-blue-800",
  team_analysis: "bg-purple-100 text-purple-800",
  market_insight: "bg-green-100 text-green-800",
  transfer_opportunity: "bg-orange-100 text-orange-800"
};

export default function SharedContentCard({ content, onLike, currentUserEmail, player, team }) {
  const hasLiked = content.liked_by?.includes(currentUserEmail);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <Badge className={typeColors[content.type]}>
            {typeLabels[content.type]}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            {format(new Date(content.created_date), "dd/MM/yyyy")}
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{content.titre}</h3>
        
        {player && (
          <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
            <User className="w-4 h-4" />
            <span>{player.nom} - {player.poste}</span>
          </div>
        )}

        {team && (
          <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
            <Eye className="w-4 h-4" />
            <span>{team.nom} - {team.formation}</span>
          </div>
        )}

        <p className="text-slate-700 mb-3">{content.description}</p>

        {content.insights && (
          <div className="bg-slate-50 rounded-lg p-4 mb-3">
            <p className="text-sm text-slate-600 font-medium mb-1">Insights:</p>
            <p className="text-slate-700">{content.insights}</p>
          </div>
        )}

        {content.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.tags.split(',').map((tag, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>Partagé par {content.created_by}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(content.id)}
            className={hasLiked ? "text-blue-600" : ""}
          >
            <ThumbsUp className={`w-4 h-4 mr-1 ${hasLiked ? "fill-blue-600" : ""}`} />
            {content.likes || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}