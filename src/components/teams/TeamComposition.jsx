import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Trash2 } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const positionColors = {
  "Gardien": "bg-yellow-100 text-yellow-800",
  "Défenseur": "bg-blue-100 text-blue-800",
  "Milieu": "bg-green-100 text-green-800",
  "Attaquant": "bg-red-100 text-red-800"
};

export default function TeamComposition({ teamPlayers, players, onRemovePlayer }) {
  const { lang } = useLanguage();
  const getPlayerById = (playerId) => players.find(p => p.id === playerId);

  const groupedByPosition = {
    "Gardien": [],
    "Défenseur": [],
    "Milieu": [],
    "Attaquant": []
  };

  teamPlayers.forEach(tp => {
    const player = getPlayerById(tp.player_id);
    if (player) {
      groupedByPosition[tp.position_equipe].push({ ...tp, player });
    }
  });

  const totalValue = teamPlayers.reduce((sum, tp) => {
    const player = getPlayerById(tp.player_id);
    return sum + (player?.valeur_marchande || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t(lang, 'teams.composition', { count: teamPlayers.length })}
          </CardTitle>
          <Badge className="bg-green-100 text-green-800">
            {t(lang, 'teams.totalValue', { value: totalValue.toFixed(1) })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedByPosition).map(([position, playersInPos]) => (
          <div key={position}>
            <h4 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-2">
              <Badge className={positionColors[position]}>{position}</Badge>
              <span className="text-slate-500">({playersInPos.length})</span>
            </h4>
            <div className="space-y-2">
              {playersInPos.length === 0 ? (
                <p className="text-sm text-slate-500 italic">{t(lang, 'teams.noPlayer')}</p>
              ) : (
                playersInPos.map((tp) => (
                  <div
                    key={tp.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      {tp.numero_maillot && (
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {tp.numero_maillot}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{tp.player.nom}</div>
                        <div className="text-sm text-slate-600">
                          {tp.player.poste} • {tp.player.age} {t(lang, 'common.ageUnit')}
                          {tp.player.valeur_marchande && ` • ${tp.player.valeur_marchande}M€`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemovePlayer(tp.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}