import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useCurrentUser } from "../lib/useCurrentUser";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { Button } from "@/components/ui/button";
import NotificationSystem from "../components/notifications/NotificationSystem";
import PlayersByPosition from "../components/dashboard/PlayersByPosition";
import PlayersByAge from "../components/dashboard/PlayersByAge";
import TopPlayers from "../components/dashboard/TopPlayers";
import EnhancedCharts from "../components/dashboard/EnhancedCharts";
import {
  Users, Star, TrendingUp, AlertTriangle, Clock, ChevronRight,
  Calendar, ArrowRightLeft, Bell, BarChart3, ChevronDown, ChevronUp,
} from "lucide-react";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function formatVM(v) {
  if (v == null) return null;
  return v >= 1 ? `${v}M€` : `${Math.round(v * 1000)}K€`;
}

function StatCard({ icon: Icon, label, value, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-100 p-5 ${onClick ? "cursor-pointer hover:border-slate-200 hover:shadow-sm transition-all" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-none">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
      </div>
      <div className="text-[1.75rem] font-bold text-slate-900 leading-none">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1.5">{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, cta, onCta }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <h2 className="font-semibold text-slate-700 text-sm">{title}</h2>
        {count != null && (
          <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{count}</span>
        )}
      </div>
      {cta && (
        <button onClick={onCta} className="text-[11px] text-slate-400 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors">
          {cta} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const userEmail = user?.email;
  const [showCharts, setShowCharts] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players', user?.id],
    queryFn: () => base44.entities.Player.filter({ created_by_id: user.id }),
    enabled: !!user?.id,
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['dashboard-reminders', userEmail],
    queryFn: () => base44.entities.Reminder.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: negociations = [] } = useQuery({
    queryKey: ['dashboard-negociations', userEmail],
    queryFn: () => base44.entities.TransferNegociation.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['dashboard-transfers', userEmail],
    queryFn: () => base44.entities.Transfer.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  // ── Computed data ────────────────────────────────────────────────────────────

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = user?.email?.split("@")[0] || "";

  // Contracts expiring
  const contractsExpiring = players
    .filter(p => {
      const d = daysUntil(p.contrat_fin);
      return d != null && d >= 0 && d <= 180;
    })
    .sort((a, b) => new Date(a.contrat_fin) - new Date(b.contrat_fin));

  const contractsExpired = players.filter(p => {
    const d = daysUntil(p.contrat_fin);
    return d != null && d < 0;
  });

  // Overdue / upcoming reminders
  const overdueReminders = reminders
    .filter(r => r.statut !== "Terminé" && daysUntil(r.date_rappel) < 0)
    .sort((a, b) => new Date(a.date_rappel) - new Date(b.date_rappel));

  const upcomingReminders = reminders
    .filter(r => r.statut !== "Terminé" && daysUntil(r.date_rappel) >= 0 && daysUntil(r.date_rappel) <= 7)
    .sort((a, b) => new Date(a.date_rappel) - new Date(b.date_rappel));

  // Active negotiations
  const activeNego = negociations.filter(n =>
    n.statut !== "transfert_finalise" && n.statut !== "annule"
  );

  // Total portfolio value
  const totalValue = players.reduce((s, p) => s + (p.valeur_marchande || 0), 0);

  // Players recently added (last 7 days)
  const recentPlayers = players
    .filter(p => p.created_date && daysUntil(p.created_date.split("T")[0]) > -8)
    .slice(0, 5);

  const urgentCount = overdueReminders.length + (contractsExpired.length > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <NotificationSystem user={user} />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* ── TODAY'S FOCUS ── */}
        {(() => {
          const focus = [];
          contractsExpired.forEach(p => focus.push({
            type: "contract-expired", player: p,
            label: `Contrat expiré — ${p.nom}`,
            sub: p.club_actuel || "Sans club",
            level: 0,
            href: createPageUrl("PlayerDetail") + "?id=" + p.id,
          }));
          overdueReminders.forEach(r => focus.push({
            type: "reminder-overdue",
            label: r.titre,
            sub: `Rappel en retard · ${new Date(r.date_rappel).toLocaleDateString("fr-FR")}`,
            level: 1,
            href: createPageUrl("Contacts"),
          }));
          contractsExpiring.filter(p => daysUntil(p.contrat_fin) <= 30).forEach(p => focus.push({
            type: "contract-soon", player: p,
            label: `Contrat expire dans ${daysUntil(p.contrat_fin)}j — ${p.nom}`,
            sub: p.club_actuel || "—",
            level: 2,
            href: createPageUrl("PlayerDetail") + "?id=" + p.id,
          }));
          upcomingReminders.filter(r => daysUntil(r.date_rappel) === 0).forEach(r => focus.push({
            type: "reminder-today",
            label: r.titre,
            sub: "Rappel aujourd'hui",
            level: 2,
            href: createPageUrl("Contacts"),
          }));
          activeNego.filter(n => n.date_limite && daysUntil(n.date_limite) <= 1).forEach(n => focus.push({
            type: "nego-deadline",
            label: `Deadline négociation — ${n.player_nom || "joueur"}`,
            sub: n.date_limite ? `Limite : ${new Date(n.date_limite).toLocaleDateString("fr-FR")}` : "",
            level: 1,
            href: createPageUrl("TransferManagement"),
          }));

          if (focus.length === 0) return null;
          const sorted = focus.sort((a, b) => a.level - b.level).slice(0, 5);

          return (
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-4 bg-slate-900 rounded-full flex-shrink-0" />
                  <span className="font-semibold text-slate-900 text-sm">Focus du jour</span>
                  <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{focus.length}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {now.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {sorted.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(item.href)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50/70 transition-colors group"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      item.level === 0 ? "bg-red-500" : item.level === 1 ? "bg-orange-400" : "bg-slate-300"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{item.label}</p>
                      {item.sub && <p className="text-[11px] text-slate-400 truncate">{item.sub}</p>}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Users} label="Joueurs suivis" value={players.length}
            sub={`${watchList.length} en watchlist`}
            onClick={() => navigate(createPageUrl("Players"))}
          />
          <StatCard
            icon={TrendingUp} label="Valeur portefeuille"
            value={totalValue >= 1 ? `${totalValue.toFixed(1)}M€` : `${Math.round(totalValue * 1000)}K€`}
            sub="valeur marchande totale"
          />
          <StatCard
            icon={AlertTriangle} label="Contrats à risque"
            value={contractsExpiring.length + contractsExpired.length}
            sub={`${contractsExpired.length} expirés · ${contractsExpiring.length} dans 6 mois`}
            onClick={() => navigate(createPageUrl("Players"))}
          />
          <StatCard
            icon={ArrowRightLeft} label="Négociations actives"
            value={activeNego.length}
            sub={`${transfers.length} transferts au total`}
            onClick={() => navigate(createPageUrl("TransferManagement"))}
          />
        </div>

        {/* ── URGENT ── */}
        {(overdueReminders.length > 0 || contractsExpired.length > 0) && (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
              <span className="w-1 h-4 bg-red-500 rounded-full flex-shrink-0" />
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-slate-800 text-sm">
                {urgentCount} point{urgentCount > 1 ? "s" : ""} urgent{urgentCount > 1 ? "s" : ""} à traiter
              </span>
            </div>
            <div className="p-3 space-y-1">
              {contractsExpired.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + p.id)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.nom}</p>
                    <p className="text-xs text-red-500">Contrat expiré · {p.contrat_fin}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
              {overdueReminders.map(r => (
                <div
                  key={r.id}
                  onClick={() => navigate(createPageUrl("Contacts"))}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.titre}</p>
                    <p className="text-xs text-red-500">
                      Rappel en retard · {new Date(r.date_rappel).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── CONTRATS À SURVEILLER ── */}
          {contractsExpiring.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <SectionHeader
                icon={Calendar} title="Contrats à surveiller"
                count={contractsExpiring.length}
                cta="Voir tous" onCta={() => navigate(createPageUrl("Players"))}
              />
              <div className="space-y-2">
                {contractsExpiring.slice(0, 5).map(p => {
                  const days = daysUntil(p.contrat_fin);
                  const urgency = days <= 60
                    ? "text-red-600 bg-red-50"
                    : days <= 120
                    ? "text-orange-600 bg-orange-50"
                    : "text-slate-600 bg-slate-100";
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + p.id)}
                      className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-slate-500">
                            {p.nom?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                          <p className="text-xs text-slate-400 truncate">{p.poste} · {p.club_actuel}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${urgency}`}>
                        {days <= 30 ? `${days}j` : p.contrat_fin?.substring(0, 7)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RAPPELS À VENIR ── */}
          {upcomingReminders.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <SectionHeader
                icon={Bell} title="Rappels cette semaine"
                count={upcomingReminders.length}
                cta="Voir tous" onCta={() => navigate(createPageUrl("Contacts"))}
              />
              <div className="space-y-2">
                {upcomingReminders.slice(0, 5).map(r => {
                  const days = daysUntil(r.date_rappel);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <p className="text-sm text-slate-800 truncate">{r.titre}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium flex-shrink-0 ml-2">
                        {days === 0 ? "Aujourd'hui" : `Dans ${days}j`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── NÉGOCIATIONS ACTIVES ── */}
          {activeNego.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <SectionHeader
                icon={ArrowRightLeft} title="Négociations en cours"
                count={activeNego.length}
                cta="Gérer" onCta={() => navigate(createPageUrl("TransferManagement"))}
              />
              <div className="space-y-2">
                {activeNego.slice(0, 5).map(n => (
                  <div
                    key={n.id}
                    onClick={() => navigate(createPageUrl("TransferManagement"))}
                    className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{n.player_nom}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {n.club_acheteur || n.club_vendeur || "—"}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-2 capitalize">
                      {(n.statut || "").replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── JOUEURS RÉCENTS ── */}
          {recentPlayers.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <SectionHeader
                icon={Users} title="Joueurs ajoutés récemment"
                count={recentPlayers.length}
                cta="Voir tous" onCta={() => navigate(createPageUrl("Players"))}
              />
              <div className="space-y-2">
                {recentPlayers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + p.id)}
                    className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-slate-500">
                          {p.nom?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p>
                        <p className="text-xs text-slate-400 truncate">{p.poste} · {p.club_actuel}</p>
                      </div>
                    </div>
                    {p.valeur_marchande && (
                      <span className="text-[11px] text-slate-600 font-medium flex-shrink-0 ml-2">
                        {formatVM(p.valeur_marchande)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── ANALYTICS (repliable) ── */}
        <div>
          <button
            onClick={() => setShowCharts(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Statistiques & graphiques
            {showCharts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCharts && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PlayersByPosition players={players} />
                <PlayersByAge players={players} />
              </div>
              <TopPlayers players={players} />
              <EnhancedCharts
                players={players}
                transfers={transfers}
                watchList={watchList}
                teams={[]}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
