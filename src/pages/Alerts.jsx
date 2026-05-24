import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Calendar, Star, ArrowRightLeft, Clock, AlertTriangle,
  CheckCircle2, ChevronRight, FileText, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useCurrentUser } from "../lib/useCurrentUser";

export default function AlertsPage() {
  const navigate = useNavigate();
  const [contractPeriod, setContractPeriod] = useState("6months");
  const user = useCurrentUser();
  const userEmail = user?.email;

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['my-watchlist', userEmail],
    queryFn: () => base44.entities.WatchList.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => base44.entities.Transfer.list('-created_date', 30),
  });

  const { data: negociations = [] } = useQuery({
    queryKey: ['negociations', userEmail],
    queryFn: () => base44.entities.TransferNegociation.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders-alerts', userEmail],
    queryFn: () => base44.entities.Reminder.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.list('-date_match', 20),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['my-teams', userEmail],
    queryFn: () => base44.entities.Team.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const watchedPlayerIds = useMemo(() => new Set(watchList.map(w => w.player_id)), [watchList]);

  // 1. Contrats expirants
  const contractAlerts = useMemo(() => {
    const now = new Date();
    const days = { "1month": 30, "3months": 90, "6months": 180, "1year": 365 }[contractPeriod];
    const limit = new Date(now.getTime() + days * 86400000);
    return players
      .filter(p => p.contrat_fin && new Date(p.contrat_fin) >= now && new Date(p.contrat_fin) <= limit)
      .map(p => {
        const daysLeft = differenceInDays(new Date(p.contrat_fin), now);
        return { ...p, daysLeft, urgency: daysLeft <= 30 ? "high" : daysLeft <= 90 ? "medium" : "low", isWatched: watchedPlayerIds.has(p.id) };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [players, contractPeriod, watchedPlayerIds]);

  // 2. Matchs à venir (équipes suivies)
  const myTeamIds = useMemo(() => new Set(teams.map(t => t.id)), [teams]);
  const upcomingMatches = useMemo(() => {
    const now = new Date();
    return matches
      .filter(m => m.date_match && !isPast(new Date(m.date_match)) && (myTeamIds.has(m.team1_id) || myTeamIds.has(m.team2_id)))
      .sort((a, b) => new Date(a.date_match) - new Date(b.date_match));
  }, [matches, myTeamIds]);

  // 3. Transferts & négociations actives
  const activeNegociations = useMemo(() =>
    negociations.filter(n => !['transfert_finalise', 'annule', 'offre_refusee'].includes(n.statut))
      .sort((a, b) => {
        const priority = { haute: 0, moyenne: 1, basse: 2 };
        return (priority[a.priorite] ?? 1) - (priority[b.priorite] ?? 1);
      }),
    [negociations]
  );

  const recentTransfers = useMemo(() =>
    transfers.slice(0, 10),
    [transfers]
  );

  // 4. Rappels en attente
  const pendingReminders = useMemo(() =>
    reminders
      .filter(r => r.statut !== 'Terminé')
      .map(r => ({ ...r, daysUntil: differenceInDays(new Date(r.date_rappel), new Date()), overdue: isPast(new Date(r.date_rappel)) }))
      .sort((a, b) => new Date(a.date_rappel) - new Date(b.date_rappel)),
    [reminders]
  );

  const totalAlerts = contractAlerts.length + upcomingMatches.length + activeNegociations.length + pendingReminders.filter(r => r.overdue || r.daysUntil <= 3).length;

  const urgencyColors = { high: "bg-red-100 text-red-800", medium: "bg-orange-100 text-orange-800", low: "bg-blue-100 text-blue-800" };
  const statutColors = {
    demande_initiale: "bg-slate-100 text-slate-700",
    en_negociation: "bg-blue-100 text-blue-700",
    offre_acceptee: "bg-green-100 text-green-700",
    offre_refusee: "bg-red-100 text-red-700",
    transfert_finalise: "bg-purple-100 text-purple-700",
    annule: "bg-slate-100 text-slate-500",
  };
  const statutLabels = {
    demande_initiale: "Initiale", en_negociation: "En cours",
    offre_acceptee: "Acceptée", offre_refusee: "Refusée",
    transfert_finalise: "Finalisé", annule: "Annulé",
  };

  if (loadingPlayers) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-slate-500">Chargement des alertes...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
            Alertes & Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalAlerts} alerte{totalAlerts > 1 ? 's' : ''} active{totalAlerts > 1 ? 's' : ''}</p>
        </div>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="contracts" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Contrats</span>
            {contractAlerts.length > 0 && <Badge className="bg-red-500 text-white text-[10px] px-1 py-0 h-4 min-w-4">{contractAlerts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Matchs</span>
            {upcomingMatches.length > 0 && <Badge className="bg-blue-500 text-white text-[10px] px-1 py-0 h-4 min-w-4">{upcomingMatches.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Transferts</span>
            {activeNegociations.length > 0 && <Badge className="bg-orange-500 text-white text-[10px] px-1 py-0 h-4 min-w-4">{activeNegociations.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Rappels</span>
            {pendingReminders.filter(r => r.overdue || r.daysUntil <= 3).length > 0 && (
              <Badge className="bg-purple-500 text-white text-[10px] px-1 py-0 h-4 min-w-4">
                {pendingReminders.filter(r => r.overdue || r.daysUntil <= 3).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── CONTRATS ── */}
        <TabsContent value="contracts" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {["1month", "3months", "6months", "1year"].map(p => (
              <Button key={p} size="sm" variant={contractPeriod === p ? "default" : "outline"} onClick={() => setContractPeriod(p)}>
                {p === "1month" ? "1 mois" : p === "3months" ? "3 mois" : p === "6months" ? "6 mois" : "1 an"}
              </Button>
            ))}
          </div>

          {contractAlerts.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-slate-500">Aucun contrat expirant sur cette période</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {contractAlerts.filter(a => a.isWatched).length > 0 && (
                <p className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-orange-500 text-orange-500" /> Joueurs suivis
                </p>
              )}
              {contractAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${alert.id}`)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${alert.isWatched ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {alert.photo_url
                      ? <img src={alert.photo_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      : <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{alert.nom}</div>
                      <div className="text-xs text-slate-500 truncate">{alert.poste} • {alert.club_actuel || "Sans club"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.valeur_marchande && <span className="text-sm font-semibold text-green-600 hidden sm:block">{alert.valeur_marchande}M€</span>}
                    <Badge className={urgencyColors[alert.urgency]}>
                      <Calendar className="w-3 h-3 mr-1" />{alert.daysLeft}j
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── MATCHS ── */}
        <TabsContent value="matches" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Matchs à venir – Mes équipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">Aucun match à venir pour vos équipes</div>
              ) : (
                <div className="space-y-2">
                  {upcomingMatches.map(match => {
                    const team1 = teams.find(t => t.id === match.team1_id);
                    const team2 = teams.find(t => t.id === match.team2_id);
                    const daysUntil = differenceInDays(new Date(match.date_match), new Date());
                    return (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {team1?.nom || "Équipe 1"} vs {team2?.nom || "Équipe 2"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(match.date_match), "d MMMM yyyy", { locale: fr })} • {match.type_match}
                          </div>
                        </div>
                        <Badge className={daysUntil <= 3 ? "bg-red-100 text-red-700" : daysUntil <= 7 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}>
                          {daysUntil === 0 ? "Aujourd'hui" : `J-${daysUntil}`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TRANSFERTS ── */}
        <TabsContent value="transfers" className="space-y-4 mt-4">
          {activeNegociations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Négociations actives ({activeNegociations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeNegociations.map(neg => {
                  const player = players.find(p => p.id === neg.player_id);
                  return (
                    <div key={neg.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{player?.nom || "Joueur inconnu"}</div>
                        <div className="text-xs text-slate-500">{neg.club_acheteur} • {neg.montant_propose}M€</div>
                        {neg.date_limite && (
                          <div className="text-xs text-red-500 mt-0.5">
                            Deadline: {format(new Date(neg.date_limite), "d MMM", { locale: fr })}
                          </div>
                        )}
                      </div>
                      <Badge className={statutColors[neg.statut] || "bg-slate-100 text-slate-700"}>
                        {statutLabels[neg.statut] || neg.statut}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-500" />
                Derniers transferts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransfers.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">Aucun transfert enregistré</div>
              ) : (
                <div className="space-y-2">
                  {recentTransfers.map(t => {
                    const player = players.find(p => p.id === t.player_id);
                    return (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">{player?.nom || "Joueur"}</div>
                          <div className="text-xs text-slate-500">
                            {t.club_depart || "—"} → {t.club_arrivee}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          {t.montant ? <div className="font-semibold text-green-600 text-sm">{t.montant}M€</div> : null}
                          <div className="text-xs text-slate-400">{t.type_transfert}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RAPPELS ── */}
        <TabsContent value="reminders" className="space-y-4 mt-4">
          {pendingReminders.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-slate-500">Aucun rappel en attente</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {pendingReminders.map(r => {
                const player = players.find(p => p.id === r.player_id);
                return (
                  <div
                    key={r.id}
                    className={`flex items-start justify-between p-3 rounded-xl border ${
                      r.overdue ? "bg-red-50 border-red-200" :
                      r.daysUntil <= 3 ? "bg-orange-50 border-orange-200" :
                      "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        r.overdue ? "bg-red-100" : r.daysUntil <= 3 ? "bg-orange-100" : "bg-slate-100"
                      }`}>
                        {r.statut === "Terminé"
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : <Clock className={`w-4 h-4 ${r.overdue ? "text-red-500" : r.daysUntil <= 3 ? "text-orange-500" : "text-slate-400"}`} />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{r.titre}</div>
                        {player && <div className="text-xs text-slate-500">{player.nom}</div>}
                        <div className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(r.date_rappel), "d MMM yyyy", { locale: fr })}
                          {r.type && ` • ${r.type}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <Badge className={
                        r.overdue ? "bg-red-100 text-red-700" :
                        r.daysUntil <= 3 ? "bg-orange-100 text-orange-700" :
                        r.priorite === "Haute" ? "bg-red-100 text-red-700" :
                        r.priorite === "Moyenne" ? "bg-orange-100 text-orange-700" :
                        "bg-slate-100 text-slate-700"
                      }>
                        {r.overdue ? "En retard" : r.daysUntil === 0 ? "Aujourd'hui" : `J-${r.daysUntil}`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}