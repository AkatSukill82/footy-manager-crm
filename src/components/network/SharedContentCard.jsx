import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, User, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const typeColors = {
  player_profile: "bg-blue-100 text-blue-800",
  team_analysis: "bg-purple-100 text-purple-800",
  market_insight: "bg-green-100 text-green-800",
  transfer_opportunity: "bg-orange-100 text-orange-800"
};

const TYPE_LABEL_KEYS = {
  player_profile: "network.typePlayerProfile",
  team_analysis: "network.typeTeamAnalysis",
  market_insight: "network.typeMarketInsight",
  transfer_opportunity: "network.typeTransferOpp",
};

export default function SharedContentCard({ content, onLike, currentUserEmail, player, team }) {
  const { lang } = useLanguage();
  const hasLiked = content.liked_by?.includes(currentUserEmail);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <Badge className={typeColors[content.type]}>
            {t(lang, TYPE_LABEL_KEYS[content.type] || 'network.typePlayerProfile')}
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
            <p className="text-sm text-slate-600 font-medium mb-1">{t(lang, 'network.insightsLabel')}:</p>
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
            <span>{t(lang, 'network.sharedBy', { name: content.created_by })}</span>
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
