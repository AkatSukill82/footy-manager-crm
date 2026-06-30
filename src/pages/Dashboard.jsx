import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import NotificationSystem from "../components/notifications/NotificationSystem";
import PlayersByPosition from "../components/dashboard/PlayersByPosition";
import PlayersByAge from "../components/dashboard/PlayersByAge";
import TopPlayers from "../components/dashboard/TopPlayers";
import EnhancedCharts from "../components/dashboard/EnhancedCharts";
import DashboardTodayMatches from "../components/dashboard/DashboardTodayMatches";
import DashboardScouting from "../components/dashboard/DashboardScouting";
import DashboardAgenda from "../components/dashboard/DashboardAgenda";
import DashboardNews from "../components/dashboard/DashboardNews";
import DashboardFinance from "../components/dashboard/DashboardFinance";
import DashboardReports from "../components/dashboard/DashboardReports";
import DashboardAlerts from "../components/dashboard/DashboardAlerts";
import { useLanguage } from "../lib/LanguageContext";
import {
  Users, TrendingUp, AlertTriangle, Clock, ChevronRight,
  Calendar, ArrowRightLeft, Bell, BarChart3, ChevronDown, ChevronUp,
  SlidersHorizontal, Eye, EyeOff, RotateCcw, Check, GripVertical,
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

// ── Widgets personnalisables (ordre par défaut + libellés) ────────────────────
const DEFAULT_ORDER = ["stats", "alertes", "today_matches", "agenda", "news", "finance", "reports", "scouting", "focus", "urgent", "contracts", "reminders", "negotiations", "recent", "analytics"];
const WIDGET_LABEL = {
  fr: { stats: "Indicateurs", alertes: "Alertes (à traiter)", today_matches: "Matchs du jour", agenda: "Agenda", news: "Journal / Actualités", finance: "Finance", reports: "Rapports / Exports", scouting: "Joueurs à suivre", focus: "Focus du jour", urgent: "Points urgents", contracts: "Contrats à surveiller", reminders: "Rappels", negotiations: "Négociations", recent: "Joueurs récents", analytics: "Statistiques" },
  en: { stats: "Indicators", alertes: "Alerts (to handle)", today_matches: "Today's matches", agenda: "Calendar", news: "News feed", finance: "Finance", reports: "Reports / Exports", scouting: "Players to watch", focus: "Today's focus", urgent: "Urgent items", contracts: "Contracts to watch", reminders: "Reminders", negotiations: "Negotiations", recent: "Recent players", analytics: "Statistics" },
  es: { stats: "Indicadores", alertes: "Alertas (a tratar)", today_matches: "Partidos de hoy", agenda: "Agenda", news: "Noticias", finance: "Finanzas", reports: "Informes / Exportes", scouting: "Jugadores a seguir", focus: "Foco del día", urgent: "Puntos urgentes", contracts: "Contratos a vigilar", reminders: "Recordatorios", negotiations: "Negociaciones", recent: "Jugadores recientes", analytics: "Estadísticas" },
};
const DLOC = { fr: "fr-FR", en: "en-GB", es: "es-ES" };
const DASH = {
  fr: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir", focusToday: "Focus du jour", statPlayers: "Joueurs suivis", inWatchlist: "en watchlist", portfolio: "Valeur portefeuille", totalVM: "valeur marchande totale", contractsRisk: "Contrats à risque", expired: "expirés", in6m: "dans 6 mois", activeNego: "Négociations actives", totalTransfers: "transferts au total", toHandle: "à traiter", contractExpired: "Contrat expiré", reminderLate: "Rappel en retard", commLate: "Commission en retard · échéance", contractsWatch: "Contrats à surveiller", seeAll: "Voir tous", remindersWeek: "Rappels cette semaine", today: "Aujourd'hui", negoOngoing: "Négociations en cours", manage: "Gérer", recentPlayers: "Joueurs ajoutés récemment", done: "Terminé", customize: "Personnaliser", customizeTitle: "Personnaliser le tableau de bord", reset: "Réinitialiser", customizeHint: "Glissez pour réordonner, cliquez sur l'œil pour masquer/afficher. Vos préférences sont synchronisées sur tous vos appareils.", show: "Afficher", hide: "Masquer", urgentLine: (n) => `${n} point${n > 1 ? "s" : ""} urgent${n > 1 ? "s" : ""} à traiter`, inDays: (d) => `Dans ${d}j` },
  en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", focusToday: "Today's focus", statPlayers: "Tracked players", inWatchlist: "on watchlist", portfolio: "Portfolio value", totalVM: "total market value", contractsRisk: "Contracts at risk", expired: "expired", in6m: "within 6 months", activeNego: "Active negotiations", totalTransfers: "transfers total", toHandle: "to handle", contractExpired: "Contract expired", reminderLate: "Reminder overdue", commLate: "Commission overdue · due", contractsWatch: "Contracts to watch", seeAll: "See all", remindersWeek: "Reminders this week", today: "Today", negoOngoing: "Ongoing negotiations", manage: "Manage", recentPlayers: "Recently added players", done: "Done", customize: "Customize", customizeTitle: "Customize the dashboard", reset: "Reset", customizeHint: "Drag to reorder, click the eye to hide/show. Your preferences sync across all your devices.", show: "Show", hide: "Hide", urgentLine: (n) => `${n} urgent item${n > 1 ? "s" : ""} to handle`, inDays: (d) => `In ${d}d` },
  es: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches", focusToday: "Foco del día", statPlayers: "Jugadores seguidos", inWatchlist: "en seguimiento", portfolio: "Valor de cartera", totalVM: "valor de mercado total", contractsRisk: "Contratos en riesgo", expired: "vencidos", in6m: "en 6 meses", activeNego: "Negociaciones activas", totalTransfers: "traspasos en total", toHandle: "a tratar", contractExpired: "Contrato vencido", reminderLate: "Recordatorio atrasado", commLate: "Comisión atrasada · vencimiento", contractsWatch: "Contratos a vigilar", seeAll: "Ver todos", remindersWeek: "Recordatorios esta semana", today: "Hoy", negoOngoing: "Negociaciones en curso", manage: "Gestionar", recentPlayers: "Jugadores añadidos recientemente", done: "Hecho", customize: "Personalizar", customizeTitle: "Personalizar el panel", reset: "Restablecer", customizeHint: "Arrastra para reordenar, haz clic en el ojo para ocultar/mostrar. Tus preferencias se sincronizan en todos tus dispositivos.", show: "Mostrar", hide: "Ocultar", urgentLine: (n) => `${n} punto${n > 1 ? "s" : ""} urgente${n > 1 ? "s" : ""} a tratar`, inDays: (d) => `En ${d}d` },
};
// Widgets affichés en pleine largeur (sur toutes les colonnes de la grille).
const WIDE = new Set(["stats", "analytics"]);

export default function Dashboard() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const D = DASH[lang] || DASH.fr;
  const WL = WIDGET_LABEL[lang] || WIDGET_LABEL.fr;
  const loc = DLOC[lang] || DLOC.fr;
  const user = useCurrentUser();
  const userEmail = user?.email;
  const [showCharts, setShowCharts] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players', user?.id],
    queryFn: () => base44.entities.Player.filter({}),
    enabled: !!user?.id,
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({}),
    enabled: !!userEmail,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['dashboard-reminders', userEmail],
    queryFn: () => base44.entities.Reminder.filter({}),
    enabled: !!userEmail,
  });

  const { data: negociations = [] } = useQuery({
    queryKey: ['dashboard-negociations', userEmail],
    queryFn: () => base44.entities.TransferNegociation.filter({}),
    enabled: !!userEmail,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['dashboard-transfers', userEmail],
    queryFn: () => base44.entities.Transfer.filter({}),
    enabled: !!userEmail,
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['dashboard-commissions', userEmail],
    queryFn: () => base44.entities.Commission.filter({}),
    enabled: !!userEmail,
  });

  // ── Préférences de disposition (cross-appareil via Base44 + cache localStorage) ──
  const qc = useQueryClient();
  const prefsKey = user?.id ? `fdm_dash_${user.id}` : null;
  const normalize = (raw) => ({
    order: [...(raw.order || []).filter(k => DEFAULT_ORDER.includes(k)), ...DEFAULT_ORDER.filter(k => !(raw.order || []).includes(k))],
    hidden: raw.hidden || {},
  });

  const { data: prefRecords = [] } = useQuery({
    queryKey: ['dashboardPref', userEmail],
    queryFn: () => base44.entities.DashboardPref.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });
  const prefRecord = prefRecords[0] || null;

  const [prefs, setPrefs] = useState({ order: DEFAULT_ORDER, hidden: {} });
  const dirty = useRef(false);
  const appliedServer = useRef(false);

  // Seed immédiat depuis le cache localStorage (évite le clignotement au chargement).
  useEffect(() => {
    if (!prefsKey || dirty.current) return;
    try { const raw = JSON.parse(localStorage.getItem(prefsKey)); if (raw?.order) setPrefs(normalize(raw)); } catch { /* défaut */ }
  }, [prefsKey]);

  // Applique la disposition serveur (cross-appareil) une fois chargée.
  useEffect(() => {
    if (appliedServer.current || dirty.current) return;
    if (prefRecord?.layout) {
      try { setPrefs(normalize(JSON.parse(prefRecord.layout))); appliedServer.current = true; } catch { /* ignore */ }
    }
  }, [prefRecord]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMut = useMutation({
    mutationFn: (next) => prefRecord?.id
      ? base44.entities.DashboardPref.update(prefRecord.id, { layout: JSON.stringify(next) })
      : base44.entities.DashboardPref.create({ layout: JSON.stringify(next) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboardPref', userEmail] }),
  });

  const persist = (next) => {
    dirty.current = true;
    setPrefs(next);
    if (prefsKey) { try { localStorage.setItem(prefsKey, JSON.stringify(next)); } catch { /* quota */ } }
    saveMut.mutate(next);
  };
  const toggleHidden = (k) => persist({ ...prefs, hidden: { ...prefs.hidden, [k]: !prefs.hidden[k] } });
  const resetPrefs = () => persist({ order: DEFAULT_ORDER, hidden: {} });
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const order = [...prefs.order];
    const [moved] = order.splice(result.source.index, 1);
    order.splice(result.destination.index, 0, moved);
    persist({ ...prefs, order });
  };

  // ── Computed data ────────────────────────────────────────────────────────────

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? D.morning : hour < 18 ? D.afternoon : D.evening;

  const contractsExpiring = players
    .filter(p => { const d = daysUntil(p.contrat_fin); return d != null && d >= 0 && d <= 180; })
    .sort((a, b) => new Date(a.contrat_fin) - new Date(b.contrat_fin));

  const contractsExpired = players.filter(p => { const d = daysUntil(p.contrat_fin); return d != null && d < 0; });

  const overdueReminders = reminders
    .filter(r => r.statut !== "Terminé" && daysUntil(r.date_rappel) < 0)
    .sort((a, b) => new Date(a.date_rappel) - new Date(b.date_rappel));

  // Commissions Finance en retard : entrée encore en projection dont l'échéance est passée.
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueCommissions = commissions
    .filter(c => (c.sens || "entree") !== "sortie" && c.nature !== "reel" && c.date_echeance && c.date_echeance < todayStr)
    .sort((a, b) => new Date(a.date_echeance) - new Date(b.date_echeance));

  const upcomingReminders = reminders
    .filter(r => r.statut !== "Terminé" && daysUntil(r.date_rappel) >= 0 && daysUntil(r.date_rappel) <= 7)
    .sort((a, b) => new Date(a.date_rappel) - new Date(b.date_rappel));

  const activeNego = negociations.filter(n => n.statut !== "transfert_finalise" && n.statut !== "annule");
  const totalValue = players.reduce((s, p) => s + (p.valeur_marchande || 0), 0);
  const recentPlayers = players
    .filter(p => p.created_date && daysUntil(p.created_date.split("T")[0]) > -8)
    .slice(0, 5);
  const urgentCount = overdueReminders.length + overdueCommissions.length + (contractsExpired.length > 0 ? 1 : 0);

  // ── Widgets (nœuds JSX, rendus selon les préférences) ─────────────────────────

  const focusNode = (() => {
    const focus = [];
    contractsExpired.forEach(p => focus.push({ type: "contract-expired", label: `Contrat expiré — ${p.nom}`, sub: p.club_actuel || "Sans club", level: 0, href: createPageUrl("PlayerDetail") + "?id=" + p.id }));
    overdueReminders.forEach(r => focus.push({ type: "reminder-overdue", label: r.titre, sub: `Rappel en retard · ${new Date(r.date_rappel).toLocaleDateString("fr-FR")}`, level: 1, href: createPageUrl("Contacts") }));
    overdueCommissions.forEach(c => focus.push({ type: "finance-overdue", label: `Commission en retard — ${c.titre}`, sub: `Échéance ${c.date_echeance}${c.player_nom ? " · " + c.player_nom : ""}`, level: 0, href: createPageUrl("Finance") }));
    contractsExpiring.filter(p => daysUntil(p.contrat_fin) <= 30).forEach(p => focus.push({ type: "contract-soon", label: `Contrat expire dans ${daysUntil(p.contrat_fin)}j — ${p.nom}`, sub: p.club_actuel || "—", level: 2, href: createPageUrl("PlayerDetail") + "?id=" + p.id }));
    upcomingReminders.filter(r => daysUntil(r.date_rappel) === 0).forEach(r => focus.push({ type: "reminder-today", label: r.titre, sub: "Rappel aujourd'hui", level: 2, href: createPageUrl("Contacts") }));
    activeNego.filter(n => n.date_limite && daysUntil(n.date_limite) <= 1).forEach(n => focus.push({ type: "nego-deadline", label: `Deadline négociation — ${n.player_nom || "joueur"}`, sub: n.date_limite ? `Limite : ${new Date(n.date_limite).toLocaleDateString("fr-FR")}` : "", level: 1, href: createPageUrl("TransferManagement") }));
    if (focus.length === 0) return null;
    const sorted = focus.sort((a, b) => a.level - b.level).slice(0, 5);
    return (
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4 bg-slate-900 rounded-full flex-shrink-0" />
            <span className="font-semibold text-slate-900 text-sm">{D.focusToday}</span>
            <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{focus.length}</span>
          </div>
          <span className="text-[11px] text-slate-400">{now.toLocaleDateString(loc, { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
        <div className="divide-y divide-slate-50">
          {sorted.map((item, i) => (
            <div key={i} onClick={() => navigate(item.href)} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50/70 transition-colors group">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.level === 0 ? "bg-red-500" : item.level === 1 ? "bg-orange-400" : "bg-slate-300"}`} />
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
  })();

  const statsNode = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={Users} label={D.statPlayers} value={players.length} sub={`${watchList.length} ${D.inWatchlist}`} onClick={() => navigate(createPageUrl("Players"))} />
      <StatCard icon={TrendingUp} label={D.portfolio} value={totalValue >= 1 ? `${totalValue.toFixed(1)}M€` : `${Math.round(totalValue * 1000)}K€`} sub={D.totalVM} />
      <StatCard icon={AlertTriangle} label={D.contractsRisk} value={contractsExpiring.length + contractsExpired.length} sub={`${contractsExpired.length} ${D.expired} · ${contractsExpiring.length} ${D.in6m}`} onClick={() => navigate(createPageUrl("Players"))} />
      <StatCard icon={ArrowRightLeft} label={D.activeNego} value={activeNego.length} sub={`${transfers.length} ${D.totalTransfers}`} onClick={() => navigate(createPageUrl("TransferManagement"))} />
    </div>
  );

  const urgentNode = (overdueReminders.length > 0 || contractsExpired.length > 0 || overdueCommissions.length > 0) ? (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
        <span className="w-1 h-4 bg-red-500 rounded-full flex-shrink-0" />
        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        <span className="font-semibold text-slate-800 text-sm">{D.urgentLine(urgentCount)}</span>
      </div>
      <div className="p-3 space-y-1">
        {contractsExpired.map(p => (
          <div key={p.id} onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + p.id)} className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
            <div><p className="text-sm font-semibold text-slate-900">{p.nom}</p><p className="text-xs text-red-500">{D.contractExpired} · {p.contrat_fin}</p></div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        ))}
        {overdueReminders.map(r => (
          <div key={r.id} onClick={() => navigate(createPageUrl("Contacts"))} className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
            <div><p className="text-sm font-semibold text-slate-900">{r.titre}</p><p className="text-xs text-red-500">{D.reminderLate} · {new Date(r.date_rappel).toLocaleDateString(loc)}</p></div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        ))}
        {overdueCommissions.map(c => (
          <div key={c.id} onClick={() => navigate(createPageUrl("Finance"))} className="flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
            <div><p className="text-sm font-semibold text-slate-900">{c.titre}</p><p className="text-xs text-red-500">{D.commLate} {c.date_echeance}</p></div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const contractsNode = contractsExpiring.length > 0 ? (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <SectionHeader icon={Calendar} title={D.contractsWatch} count={contractsExpiring.length} cta={D.seeAll} onCta={() => navigate(createPageUrl("Players"))} />
      <div className="space-y-2">
        {contractsExpiring.slice(0, 5).map(p => {
          const days = daysUntil(p.contrat_fin);
          const urgency = days <= 60 ? "text-red-600 bg-red-50" : days <= 120 ? "text-orange-600 bg-orange-50" : "text-slate-600 bg-slate-100";
          return (
            <div key={p.id} onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + p.id)} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-slate-500">{p.nom?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</span></div>
                <div className="min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p><p className="text-xs text-slate-400 truncate">{p.poste} · {p.club_actuel}</p></div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${urgency}`}>{days <= 30 ? `${days}j` : p.contrat_fin?.substring(0, 7)}</span>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const remindersNode = upcomingReminders.length > 0 ? (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <SectionHeader icon={Bell} title={D.remindersWeek} count={upcomingReminders.length} cta={D.seeAll} onCta={() => navigate(createPageUrl("Contacts"))} />
      <div className="space-y-2">
        {upcomingReminders.slice(0, 5).map(r => {
          const days = daysUntil(r.date_rappel);
          return (
            <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0"><Clock className="w-4 h-4 text-slate-300 flex-shrink-0" /><p className="text-sm text-slate-800 truncate">{r.titre}</p></div>
              <span className="text-[11px] text-slate-500 font-medium flex-shrink-0 ml-2">{days === 0 ? D.today : D.inDays(days)}</span>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const negotiationsNode = activeNego.length > 0 ? (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <SectionHeader icon={ArrowRightLeft} title={D.negoOngoing} count={activeNego.length} cta={D.manage} onCta={() => navigate(createPageUrl("TransferManagement"))} />
      <div className="space-y-2">
        {activeNego.slice(0, 5).map(n => (
          <div key={n.id} onClick={() => navigate(createPageUrl("TransferManagement"))} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{n.player_nom}</p><p className="text-xs text-slate-400 truncate">{n.club_acheteur || n.club_vendeur || "—"}</p></div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-2 capitalize">{(n.statut || "").replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const recentNode = recentPlayers.length > 0 ? (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <SectionHeader icon={Users} title={D.recentPlayers} count={recentPlayers.length} cta={D.seeAll} onCta={() => navigate(createPageUrl("Players"))} />
      <div className="space-y-2">
        {recentPlayers.map(p => (
          <div key={p.id} onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + p.id)} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-slate-500">{p.nom?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</span></div>
              <div className="min-w-0"><p className="text-sm font-semibold text-slate-900 truncate">{p.nom}</p><p className="text-xs text-slate-400 truncate">{p.poste} · {p.club_actuel}</p></div>
            </div>
            {p.valeur_marchande && <span className="text-[11px] text-slate-600 font-medium flex-shrink-0 ml-2">{formatVM(p.valeur_marchande)}</span>}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const analyticsNode = (
    <div>
      <button onClick={() => setShowCharts(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <BarChart3 className="w-4 h-4" /> Statistiques & graphiques
        {showCharts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {showCharts && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PlayersByPosition players={players} />
            <PlayersByAge players={players} />
          </div>
          <TopPlayers players={players} />
          <EnhancedCharts players={players} transfers={transfers} watchList={watchList} teams={[]} />
        </div>
      )}
    </div>
  );

  const NODES = {
    stats: statsNode, today_matches: <DashboardTodayMatches players={players} />, agenda: <DashboardAgenda />,
    news: <DashboardNews />,
    finance: <DashboardFinance />,
    reports: <DashboardReports />,
    alertes: <DashboardAlerts players={players} commissions={commissions} reminders={reminders} />,
    scouting: <DashboardScouting players={players} />,
    focus: focusNode, urgent: urgentNode, contracts: contractsNode, reminders: remindersNode,
    negotiations: negotiationsNode, recent: recentNode, analytics: analyticsNode,
  };

  const visible = prefs.order.filter(k => !prefs.hidden[k]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <NotificationSystem user={user} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{now.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <Button variant={editing ? "default" : "outline"} size="sm" onClick={() => setEditing(v => !v)} className="gap-1.5 flex-shrink-0">
            {editing ? <><Check className="w-4 h-4" /> {D.done}</> : <><SlidersHorizontal className="w-4 h-4" /> {D.customize}</>}
          </Button>
        </div>

        {/* Panneau de personnalisation */}
        {editing && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-800 text-sm">{D.customizeTitle}</p>
              <button onClick={resetPrefs} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> {D.reset}</button>
            </div>
            <p className="text-xs text-slate-400 mb-3">{D.customizeHint}</p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="dash-widgets">
                {(prov) => (
                  <div ref={prov.innerRef} {...prov.droppableProps} className="space-y-1.5">
                    {prefs.order.map((k, idx) => {
                      const off = !!prefs.hidden[k];
                      return (
                        <Draggable key={k} draggableId={k} index={idx}>
                          {(p, snap) => (
                            <div ref={p.innerRef} {...p.draggableProps}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${off ? "border-slate-100 bg-slate-50/50 opacity-60" : "border-slate-200 bg-white"} ${snap.isDragging ? "shadow-md ring-1 ring-slate-200" : ""}`}>
                              <span {...p.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></span>
                              <button onClick={() => toggleHidden(k)} title={off ? D.show : D.hide} className="text-slate-400 hover:text-slate-700">
                                {off ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <span className="flex-1 text-sm text-slate-700">{WL[k] || k}</span>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {prov.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Widgets dans l'ordre choisi, en grille multi-colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {visible.map(k => {
            const node = NODES[k];
            if (!node) return null;
            return (
              <div key={k} className={WIDE.has(k) ? "md:col-span-2 xl:col-span-3" : ""}>
                {node}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
