import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function TopPlayers({ players, title, limit = 5 }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const displayTitle = title || t(lang,'dashboard.topPlayers');
  
  const sortedPlayers = [...players]
    .filter(p => p.valeur_marchande)
    .sort((a, b) => (b.valeur_marchande || 0) - (a.valeur_marchande || 0))
    .slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          {displayTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${player.id}`)}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{player.nom}</div>
                  <div className="text-sm text-slate-500">{player.poste}</div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {player.valeur_marchande}M €
              </Badge>
            </div>
          ))}
          {sortedPlayers.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              {t(lang,'dashboard.noTopPlayers')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}