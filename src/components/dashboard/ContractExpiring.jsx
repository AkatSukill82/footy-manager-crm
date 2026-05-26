import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function ContractExpiring({ players }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  
  const now = new Date();
  const sixMonthsLater = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

  const expiringPlayers = players
    .filter(p => {
      if (!p.contrat_fin) return false;
      const contractEnd = new Date(p.contrat_fin);
      return contractEnd >= now && contractEnd <= sixMonthsLater;
    })
    .sort((a, b) => new Date(a.contrat_fin) - new Date(b.contrat_fin))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-600" />
          {t(lang,'dashboard.expiringContracts')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expiringPlayers.map((player) => {
            const contractDate = new Date(player.contrat_fin);
            const daysLeft = Math.ceil((contractDate - now) / (1000 * 60 * 60 * 24));
            
            return (
              <div
                key={player.id}
                onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${player.id}`)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-900">{player.nom}</div>
                  <div className="text-sm text-slate-500">{player.club_actuel || t(lang,'players.noClub')}</div>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  {t(lang,'dashboard.daysLeft', { days: daysLeft })}
                </Badge>
              </div>
            );
          })}
          {expiringPlayers.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              {t(lang,'dashboard.noExpiring')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}