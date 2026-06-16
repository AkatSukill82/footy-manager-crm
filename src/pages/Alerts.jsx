import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Calendar, Star, ArrowRightLeft, Clock, AlertTriangle,
  CheckCircle2, ChevronRight, FileText, Shield, Users, UserX, Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format, differenceInDays, isPast } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import { useCurrentUser } from "../lib/useCurrentUser";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function AlertsPage() {
  const { lang } = useLanguage();
  const DATE_LOCALES = { fr, es, en: enUS };
  const dateLocale = DATE_LOCALES[lang] || enUS;
  const navigate = useNavigate();
  const [contractPeriod, setContractPeriod] = useState("6months");
  const user = useCurrentUser();
  const userEmail = user?.email;

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players', user?.id],
    queryFn: () => base44.entities.Player.filter({ created_by_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers', user?.id],
    queryFn: () => base44.entities.Transfer.filter({ created_by_id: user.id }),
    enabled: !!user?.id,
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

  const { data: clubContacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['club-contacts'],
    queryFn: () => base44.entities.ClubContact.list(),
    staleTime: Infinity,
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
  const myTeamIds = useMemo(() => new Set(teams.map(tm => tm.id)), [teams]);
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

  // 5. Alertes contacts
  const contactContractAlerts = useMemo(() => {
    const now = new Date();
    const limit = new Date(now.getTime() + 90 * 86400000);
    return clubContacts
      .filter(c => c.contrat_fin && new Date(c.contrat_fin) >= now && new Date(c.contrat_fin) <= limit)
      .map(c => ({
        ...c,
        daysLeft: differenceInDays(new Date(c.contrat_fin), now),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [clubContacts]);

  const coldContacts = useMemo(() => {
    const now = new Date();
    const threshold = 60 * 86400000;
    return clubContacts.filter(c => {
      const lastActivity = c.updated_date || c.created_date;
      if (!lastActivity) return false;
      return now - new Date(lastActivity) > threshold;
    }).sort((a, b) => {
      const da = a.updated_date || a.created_date;
      const db = b.updated_date || b.created_date;
      return new Date(da) - new Date(db);
    });
  }, [clubContacts]);

  const totalContactAlerts = contactContractAlerts.length + coldContacts.length;
  const totalAlerts = contractAlerts.length + upcomingMatches.length + activeNegociations.length + pendingReminders.filter(r => r.overdue || r.daysUntil <= 3).length + totalContactAlerts;

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
    demande_initiale: t(lang,'alerts.statutInitiale'),
    en_negociation: t(lang,'alerts.statutOngoing'),
    offre_acceptee: t(lang,'alerts.statutAccepted'),
    offre_refusee: t(lang,'alerts.statutRefused'),
    transfert_finalise: t(lang,'alerts.statutFinalized'),
    annule: t(lang,'alerts.statutCancelled'),
  };

  if (loadingPlayers) {
    return (
      <div className="min-h-screen bg-slate-50"><div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="h-10 w-48 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-5 gap-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div></div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t(lang, 'alerts.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t(lang, 'alerts.count', { count: totalAlerts })}</p>
        </div>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="contracts" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{t(lang, 'alerts.tabContracts')}</span>
            {contractAlerts.length > 0 && <Badge className="bg-slate-700 text-white text-[10px] px-1 py-0 h-4 min-w-4">{contractAlerts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{t(lang, 'alerts.tabMatches')}</span>
            {upcomingMatches.length > 0 && <Badge className="bg-slate-700 text-white text-[10px] px-1 py-0 h-4 min-w-4">{upcomingMatches.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t(lang, 'alerts.tabTransfers')}</span>
            {activeNegociations.length > 0 && <Badge className="bg-slate-700 text-white text-[10px] px-1 py-0 h-4 min-w-4">{activeNegociations.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{t(lang, 'alerts.tabReminders')}</span>
            {pendingReminders.filter(r => r.overdue || r.daysUntil <= 3).length > 0 && (
              <Badge className="bg-slate-700 text-white text-[10px] px-1 py-0 h-4 min-w-4">
                {pendingReminders.filter(r => r.overdue || r.daysUntil <= 3).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex flex-col items-center gap-0.5 py-2 text-xs">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Contacts</span>
            {totalContactAlerts > 0 && (
              <Badge className="bg-slate-700 text-white text-[10px] px-1 py-0 h-4 min-w-4">{totalContactAlerts}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── CONTRATS ── */}
        <TabsContent value="contracts" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {["1month", "3months", "6months", "1year"].map(p => (
              <Button key={p} size="sm" variant={contractPeriod === p ? "default" : "outline"} onClick={() => setContractPeriod(p)}>
                {p === "1month" ? t(lang,'alerts.month1') : p === "3months" ? t(lang,'alerts.months3') : p === "6months" ? t(lang,'alerts.months6') : t(lang,'alerts.year1')}
              </Button>
            ))}
          </div>

          {contractAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-500">{t(lang, 'alerts.noContracts')}</div>
          ) : (
            <div className="space-y-2">
              {contractAlerts.filter(a => a.isWatched).length > 0 && (
                <p className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-orange-500 text-orange-500" /> {t(lang, 'alerts.watchedPlayers')}
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
                      ? <img src={alert.photo_url} alt={alert.nom || ""} className="w-10 h-10 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      : <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{alert.nom}</div>
                      <div className="text-xs text-slate-500 truncate">{alert.poste} • {alert.club_actuel || t(lang, 'players.noClub')}</div>
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
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-slate-400" />
              {t(lang, 'alerts.upcomingMatches')}
            </p>
            <div>
              {upcomingMatches.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">{t(lang, 'alerts.noMatches')}</div>
              ) : (
                <div className="space-y-2">
                  {upcomingMatches.map(match => {
                    const team1 = teams.find(tm => tm.id === match.team1_id);
                    const team2 = teams.find(tm => tm.id === match.team2_id);
                    const daysUntil = differenceInDays(new Date(match.date_match), new Date());
                    return (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {team1?.nom || t(lang,'alerts.team1')} vs {team2?.nom || t(lang,'alerts.team2')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(match.date_match), "d MMMM yyyy", { locale: dateLocale })} • {match.type_match}
                          </div>
                        </div>
                        <Badge className={daysUntil <= 3 ? "bg-red-100 text-red-700" : daysUntil <= 7 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}>
                          {daysUntil === 0 ? t(lang,'alerts.today') : t(lang,'alerts.daysUntil',{days:daysUntil})}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── TRANSFERTS ── */}
        <TabsContent value="transfers" className="space-y-4 mt-4">
          {activeNegociations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                {t(lang, 'alerts.activeNegotiations', { count: activeNegociations.length })}
              </p>
              <div className="space-y-2">
                {activeNegociations.map(neg => {
                  const player = players.find(p => p.id === neg.player_id);
                  return (
                    <div key={neg.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{player?.nom || t(lang,'alerts.unknownPlayer')}</div>
                        <div className="text-xs text-slate-500">{neg.club_acheteur} • {neg.montant_propose}M€</div>
                        {neg.date_limite && (
                          <div className="text-xs text-red-500 mt-0.5">
                            {t(lang,'alerts.deadline')}: {format(new Date(neg.date_limite), "d MMM", { locale: dateLocale })}
                          </div>
                        )}
                      </div>
                      <Badge className={statutColors[neg.statut] || "bg-slate-100 text-slate-700"}>
                        {statutLabels[neg.statut] || neg.statut}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-slate-400" />
              {t(lang, 'alerts.latestTransfers')}
            </p>
            {recentTransfers.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">{t(lang, 'alerts.noTransfers')}</div>
            ) : (
              <div className="space-y-2">
                {recentTransfers.map(tr => {
                  const player = players.find(p => p.id === tr.player_id);
                  return (
                    <div key={tr.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{player?.nom || t(lang,'alerts.player')}</div>
                        <div className="text-xs text-slate-500">
                          {tr.club_depart || "—"} → {tr.club_arrivee}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        {tr.montant ? <div className="font-semibold text-slate-800 text-sm">{tr.montant}M€</div> : null}
                        <div className="text-xs text-slate-400">{tr.type_transfert}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── RAPPELS ── */}
        <TabsContent value="reminders" className="space-y-4 mt-4">
          {pendingReminders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-500">{t(lang, 'alerts.noReminders')}</div>
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
                          {format(new Date(r.date_rappel), "d MMM yyyy", { locale: dateLocale })}
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
                        {r.overdue ? t(lang,'alerts.overdue') : r.daysUntil === 0 ? t(lang,'alerts.today') : t(lang,'alerts.daysUntil',{days:r.daysUntil})}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        {/* ── CONTACTS ── */}
        <TabsContent value="contacts" className="space-y-4 mt-4">

          {/* Contrats à risque */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-400" />
              Contrats expirant dans 90 jours
              {contactContractAlerts.length > 0 && (
                <Badge className="bg-slate-700 text-white ml-auto">{contactContractAlerts.length}</Badge>
              )}
            </p>
            {contactContractAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">Aucun contrat à risque</div>
            ) : (
              <div className="space-y-2">
                {contactContractAlerts.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      {c.photo_url
                        ? <img src={c.photo_url} alt={c.nom || ""} className="w-9 h-9 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                        : <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-slate-400" />
                          </div>}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{c.nom}</div>
                        <div className="text-xs text-slate-500 truncate">{c.poste}{c.club ? ` • ${c.club}` : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.telephone && (
                        <span className="text-xs text-slate-500 hidden sm:block">{c.telephone}</span>
                      )}
                      <Badge className={c.daysLeft <= 30 ? "bg-red-100 text-red-700" : c.daysLeft <= 60 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}>
                        <Calendar className="w-3 h-3 mr-1" />{c.daysLeft}j
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contacts froids */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <UserX className="w-4 h-4 text-slate-400" />
              Contacts inactifs (+60 jours)
              {coldContacts.length > 0 && (
                <Badge className="bg-slate-200 text-slate-600 ml-auto">{coldContacts.length}</Badge>
              )}
            </p>
            {coldContacts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">Tous vos contacts sont actifs</div>
            ) : (
              <div className="space-y-2">
                {coldContacts.slice(0, 20).map(c => {
                  const lastDate = c.updated_date || c.created_date;
                  const daysSince = differenceInDays(new Date(), new Date(lastDate));
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        {c.photo_url
                          ? <img src={c.photo_url} alt={c.nom || ""} className="w-9 h-9 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                          : <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 text-slate-400" />
                            </div>}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">{c.nom}</div>
                          <div className="text-xs text-slate-500 truncate">{c.poste}{c.club ? ` • ${c.club}` : ''}</div>
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-600 flex-shrink-0">
                        <Clock className="w-3 h-3 mr-1" />{daysSince}j
                      </Badge>
                    </div>
                  );
                })}
                {coldContacts.length > 20 && (
                  <p className="text-xs text-center text-slate-400 pt-1">+ {coldContacts.length - 20} autres contacts inactifs</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
    </div>
  );
}