import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bell, CheckCircle2, BellOff } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const AL = {
  fr: { alertes: "Alertes", empty: "Rien à traiter 🎉", snooze: "Reporter 7 jours", done: "Marquer traité", reminderLate: "Rappel en retard", reminderToday: "Rappel aujourd'hui", contractExpired: (n) => `Contrat expiré — ${n}`, contractExpires: (d, n) => `Contrat expire dans ${d}j — ${n}`, commLate: (t) => `Commission en retard — ${t}`, due: (d) => `échéance ${d}` },
  en: { alertes: "Alerts", empty: "Nothing to handle 🎉", snooze: "Snooze 7 days", done: "Mark as handled", reminderLate: "Reminder overdue", reminderToday: "Reminder today", contractExpired: (n) => `Contract expired — ${n}`, contractExpires: (d, n) => `Contract expires in ${d}d — ${n}`, commLate: (t) => `Commission overdue — ${t}`, due: (d) => `due ${d}` },
  es: { alertes: "Alertas", empty: "Nada que tratar 🎉", snooze: "Posponer 7 días", done: "Marcar tratado", reminderLate: "Recordatorio atrasado", reminderToday: "Recordatorio hoy", contractExpired: (n) => `Contrato vencido — ${n}`, contractExpires: (d, n) => `El contrato vence en ${d}d — ${n}`, commLate: (t) => `Comisión atrasada — ${t}`, due: (d) => `vencimiento ${d}` },
};

/**
 * Moteur d'alertes du dashboard (cahier §4). Agrège les alertes de plusieurs
 * sources (contrats, finance, rappels), avec gestion par alerte : ouvrir,
 * REPORTER (snooze 7j) et MARQUER TRAITÉ. L'état est persistant (localStorage,
 * par identifiant stable source:id). Reçoit les données du Dashboard (pas de
 * requête en double).
 */
const todayISO = () => new Date().toISOString().split("T")[0];
const daysUntil = (d) => (d ? Math.round((new Date(d) - new Date(todayISO())) / 86400000) : null);

const STATE_KEY = "fdm_alert_state";
const loadState = () => { try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } };
const saveState = (s) => { try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch { /* ignore */ } };

export default function DashboardAlerts({ players = [], commissions = [], reminders = [] }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const T = AL[lang] || AL.fr;
  const [state, setState] = useState(loadState);
  const upd = (id, val) => { const next = { ...state, [id]: val }; setState(next); saveState(next); };
  const snooze = (id) => { const d = new Date(); d.setDate(d.getDate() + 7); upd(id, `snooze:${d.toISOString().split("T")[0]}`); };

  const alerts = useMemo(() => {
    const today = todayISO();
    const list = [];
    for (const p of players) {
      const d = daysUntil(p.contrat_fin);
      if (d == null) continue;
      if (d < 0) list.push({ id: `contract:${p.id}`, sev: "red", title: T.contractExpired(p.nom), sub: p.contrat_fin || "", href: createPageUrl("PlayerDetail") + "?id=" + p.id });
      else if (d <= 180) list.push({ id: `contract:${p.id}`, sev: d <= 30 ? "amber" : "blue", title: T.contractExpires(d, p.nom), sub: p.club_actuel || "—", href: createPageUrl("PlayerDetail") + "?id=" + p.id });
    }
    for (const c of commissions) {
      if ((c.sens || "entree") === "sortie" || c.nature === "reel") continue;
      if (c.date_echeance && c.date_echeance < today) list.push({ id: `finance:${c.id}`, sev: "red", title: T.commLate(c.titre), sub: T.due(c.date_echeance), href: createPageUrl("Finance") });
    }
    for (const r of reminders) {
      if (r.statut === "Terminé") continue;
      const d = daysUntil(r.date_rappel);
      if (d == null) continue;
      if (d < 0) list.push({ id: `reminder:${r.id}`, sev: "red", title: r.titre, sub: T.reminderLate, href: createPageUrl("Contacts") });
      else if (d === 0) list.push({ id: `reminder:${r.id}`, sev: "amber", title: r.titre, sub: T.reminderToday, href: createPageUrl("Contacts") });
    }
    const order = { red: 0, amber: 1, blue: 2 };
    return list
      .filter((a) => {
        const st = state[a.id];
        if (st === "done") return false;
        if (typeof st === "string" && st.startsWith("snooze:") && st.slice(7) > today) return false;
        return true;
      })
      .sort((a, b) => order[a.sev] - order[b.sev]);
  }, [players, commissions, reminders, state, lang]);

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
        <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-red-500" /> {T.alertes}
          {alerts.length > 0 && <span className="text-[11px] bg-red-100 text-red-700 rounded-full px-1.5 font-semibold">{alerts.length}</span>}
        </span>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-5 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> {T.empty}</p>
      ) : (
        <div className="p-2 space-y-0.5">
          {alerts.slice(0, 12).map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-slate-50 group">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.sev === "red" ? "bg-red-500" : a.sev === "amber" ? "bg-amber-500" : "bg-blue-500"}`} />
              <button onClick={() => navigate(a.href)} className="flex-1 min-w-0 text-left">
                <p className="text-sm text-slate-800 truncate">{a.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{a.sub}</p>
              </button>
              <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => snooze(a.id)} title={T.snooze} className="p-1 rounded text-slate-400 hover:text-amber-600"><BellOff className="w-3.5 h-3.5" /></button>
                <button onClick={() => upd(a.id, "done")} title={T.done} className="p-1 rounded text-slate-400 hover:text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
