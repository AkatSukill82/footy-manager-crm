import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function SimilarPlayers({ currentPlayer, allPlayers }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const getSimilarPlayers = () => {
    if (!currentPlayer) return [];

    // Calcul de similarité basé sur poste, âge, valeur marchande
    const similar = allPlayers
      .filter(p => p.id !== currentPlayer.id)
      .map(player => {
        let score = 0;

        // Même poste = +50 points
        if (player.poste === currentPlayer.poste) score += 50;

        // Différence d'âge
        if (player.age && currentPlayer.age) {
          const ageDiff = Math.abs(player.age - currentPlayer.age);
          if (ageDiff <= 2) score += 30;
          else if (ageDiff <= 5) score += 15;
        }

        // Valeur marchande proche
        if (player.valeur_marchande && currentPlayer.valeur_marchande) {
          const valueDiff = Math.abs(player.valeur_marchande - currentPlayer.valeur_marchande);
          const valuePercent = valueDiff / currentPlayer.valeur_marchande;
          if (valuePercent <= 0.2) score += 20; // ±20%
          else if (valuePercent <= 0.5) score += 10; // ±50%
        }

        return { player, score };
      })
      .filter(item => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return similar.map(item => item.player);
  };

  const similarPlayers = getSimilarPlayers();

  if (similarPlayers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          {t(lang,'players.similarPlayers')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {similarPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${player.id}`)}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100"
            >
              <div className="flex items-center gap-3">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.nom}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-slate-900">{player.nom}</div>
                  <div className="text-sm text-slate-500">
                    {player.age} {t(lang,'common.ageUnit')} • {player.club_actuel || t(lang,'players.noClub')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-1">
                  {player.poste}
                </Badge>
                {player.valeur_marchande && (
                  <div className="text-sm font-semibold text-green-600">
                    {player.valeur_marchande}M €
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}