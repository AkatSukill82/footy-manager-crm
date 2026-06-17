import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function SimilarPlayers({ currentPlayer, allPlayers }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const similarPlayers = useMemo(() => {
    if (!currentPlayer || !allPlayers.length) return [];
    return allPlayers
      .filter(p => p.id !== currentPlayer.id)
      .map(player => {
        let score = 0;
        if (player.poste === currentPlayer.poste) score += 50;
        if (player.age && currentPlayer.age) {
          const ageDiff = Math.abs(player.age - currentPlayer.age);
          if (ageDiff <= 2) score += 30;
          else if (ageDiff <= 5) score += 15;
        }
        if (player.valeur_marchande && currentPlayer.valeur_marchande) {
          const valuePercent = Math.abs(player.valeur_marchande - currentPlayer.valeur_marchande) / currentPlayer.valeur_marchande;
          if (valuePercent <= 0.2) score += 20;
          else if (valuePercent <= 0.5) score += 10;
        }
        return { player, score };
      })
      .filter(item => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.player);
  }, [currentPlayer, allPlayers]);

  if (similarPlayers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-slate-400" />
        {t(lang,'players.similarPlayers')}
      </p>
      <div className="space-y-2">
        {similarPlayers.map((player) => (
          <div
            key={player.id}
            onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${player.id}`)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100"
          >
            <div className="flex items-center gap-3">
              {player.photo_url ? (
                <img src={player.photo_url} alt={player.nom} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div>
                <div className="font-medium text-slate-900 text-sm">{player.nom}</div>
                <div className="text-xs text-slate-400">
                  {player.age} {t(lang,'common.ageUnit')} · {player.club_actuel || t(lang,'players.noClub')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-xs mb-1">{player.poste}</Badge>
              {player.valeur_marchande && (
                <div className="text-xs font-semibold text-slate-700">{player.valeur_marchande}M€</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}