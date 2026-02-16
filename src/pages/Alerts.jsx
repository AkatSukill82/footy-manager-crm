import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, TrendingDown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function AlertsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("6months");

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['my-watchlist'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const watchedPlayerIds = new Set(watchList.map(w => w.player_id));

  const getAlerts = () => {
    const now = new Date();
    let periodDate;

    switch (period) {
      case "1month":
        periodDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        periodDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      case "6months":
        periodDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        periodDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    }

    return players
      .filter(p => {
        if (!p.contrat_fin) return false;
        const contractEnd = new Date(p.contrat_fin);
        return contractEnd >= now && contractEnd <= periodDate;
      })
      .map(player => {
        const contractEnd = new Date(player.contrat_fin);
        const daysLeft = Math.ceil((contractEnd - now) / (1000 * 60 * 60 * 24));
        const isWatched = watchedPlayerIds.has(player.id);

        let urgency = "low";
        if (daysLeft <= 30) urgency = "high";
        else if (daysLeft <= 90) urgency = "medium";

        return { ...player, daysLeft, urgency, isWatched };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const alerts = getAlerts();
  const watchedAlerts = alerts.filter(a => a.isWatched);
  const otherAlerts = alerts.filter(a => !a.isWatched);

  const urgencyColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-orange-100 text-orange-800 border-orange-200",
    low: "bg-blue-100 text-blue-800 border-blue-200"
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Chargement des alertes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-8 h-8 text-orange-600" />
            Alertes contrats
          </h1>
          <p className="text-slate-600 mt-1">Joueurs dont le contrat expire bientôt</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={period === "1month" ? "default" : "outline"}
            onClick={() => setPeriod("1month")}
            size="sm"
          >
            1 mois
          </Button>
          <Button
            variant={period === "3months" ? "default" : "outline"}
            onClick={() => setPeriod("3months")}
            size="sm"
          >
            3 mois
          </Button>
          <Button
            variant={period === "6months" ? "default" : "outline"}
            onClick={() => setPeriod("6months")}
            size="sm"
          >
            6 mois
          </Button>
          <Button
            variant={period === "1year" ? "default" : "outline"}
            onClick={() => setPeriod("1year")}
            size="sm"
          >
            1 an
          </Button>
        </div>
      </div>

      {watchedAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Star className="w-5 h-5 fill-orange-600 text-orange-600" />
              Joueurs suivis ({watchedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {watchedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${alert.id}`)}
                  className="flex items-center justify-between p-4 rounded-lg bg-white border border-orange-200 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    {alert.photo_url ? (
                      <img
                        src={alert.photo_url}
                        alt={alert.nom}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 rounded-full" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{alert.nom}</div>
                      <div className="text-sm text-slate-600">
                        {alert.poste} • {alert.age} ans • {alert.club_actuel || "Sans club"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {alert.valeur_marchande && (
                      <div className="text-right mr-4">
                        <div className="text-sm text-slate-500">Valeur</div>
                        <div className="font-semibold text-green-600">{alert.valeur_marchande}M €</div>
                      </div>
                    )}
                    <Badge className={urgencyColors[alert.urgency]}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {alert.daysLeft} jours
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tous les joueurs ({otherAlerts.length})</span>
            <Badge variant="outline">{alerts.length} alertes au total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {otherAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Aucune autre alerte pour cette période
            </div>
          ) : (
            <div className="space-y-2">
              {otherAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${alert.id}`)}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {alert.photo_url ? (
                      <img
                        src={alert.photo_url}
                        alt={alert.nom}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 rounded-full" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{alert.nom}</div>
                      <div className="text-sm text-slate-600">
                        {alert.poste} • {alert.age} ans • {alert.club_actuel || "Sans club"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {alert.valeur_marchande && (
                      <div className="text-right mr-4">
                        <div className="text-sm text-slate-500">Valeur</div>
                        <div className="font-semibold text-green-600">{alert.valeur_marchande}M €</div>
                      </div>
                    )}
                    <Badge className={urgencyColors[alert.urgency]}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {alert.daysLeft} jours
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}