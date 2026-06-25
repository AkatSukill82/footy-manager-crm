import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Loader2, ChevronLeft, ChevronRight, RefreshCw, MapPin } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const CONNECTOR_ID = "6a136187a4bae80428554350";

const EVENT_COLORS = {
  "1": "#7986cb", "2": "#33b679", "3": "#8e24aa", "4": "#e67c73",
  "5": "#f6bf26", "6": "#f4511e", "7": "#039be5", "8": "#616161",
  "9": "#3f51b5", "10": "#0b8043", "11": "#d50000",
};
const DEFAULT_COLOR = "#039be5";

const todayISO = () => new Date().toISOString().split("T")[0];
const shiftISO = (iso, days) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

function eventTime(ev, lang) {
  if (ev.start?.date) return t(lang, "session.dash.allDay");
  const raw = ev.start?.dateTime;
  if (!raw) return "—";
  return new Date(raw).toLocaleTimeString(lang === "en" ? "en-GB" : lang === "es" ? "es-ES" : "fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardAgenda() {
  const { lang } = useLanguage();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(todayISO());

  // Rule 2: reusable fetch — detects connection AND loads data
  const fetchEvents = useCallback(async (targetDate) => {
    setLoading(true);
    setError(null);
    try {
      const d = targetDate || date;
      const timeMin = new Date(`${d}T00:00:00`).toISOString();
      const timeMax = new Date(`${d}T23:59:59`).toISOString();
      const res = await base44.functions.invoke("syncToGoogleCalendar", {
        action: "list",
        timeMin,
        timeMax,
        maxResults: 50,
      });
      setEvents(res.data?.events || res.data?.items || []);
      setConnected(true);
    } catch {
      setConnected(false);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Rule 1+2: check auth then fetch on mount
  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) fetchEvents(date);
      else setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when date changes (only if already connected)
  useEffect(() => {
    if (connected) fetchEvents(date);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rule 3: open OAuth popup, poll close, then re-fetch
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          fetchEvents(date);
        }
      }, 500);
    } catch {
      setConnecting(false);
    }
  };

  const isToday = date === todayISO();
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(
    lang === "en" ? "en-GB" : lang === "es" ? "es-ES" : "fr-FR",
    { weekday: "short", day: "numeric", month: "short" }
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" /> {t(lang, "session.dash.agendaTitle")}
        </p>
        {connected && (
          <button onClick={() => fetchEvents(date)} disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50" title={t(lang, "session.dash.refresh")}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {!connected ? (
        <div className="text-center py-5">
          <CalendarDays className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400 mb-3">{t(lang, "session.dash.agendaConnectDesc")}</p>
          <button onClick={handleConnect} disabled={connecting}
            className="inline-flex items-center gap-2 text-sm bg-slate-900 hover:bg-slate-700 text-white rounded-lg px-3 py-1.5">
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            {t(lang, "session.dash.agendaConnect")}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setDate(shiftISO(date, -1))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-slate-700"}`}>
                {isToday ? t(lang, "session.dash.agendaToday") : dateLabel}
              </span>
              <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
                className="text-[11px] text-slate-400 bg-transparent border border-slate-200 rounded px-1.5 py-0.5" />
            </div>
            <button onClick={() => setDate(shiftISO(date, 1))} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-5 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "session.dash.agendaLoading")}
            </div>
          ) : error ? (
            <p className="text-sm text-slate-400 text-center py-4">{t(lang, "session.dash.agendaError")}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">{t(lang, "session.dash.agendaNone")}</p>
          ) : (
            <div className="space-y-1.5">
              {events.map((ev) => {
                const color = EVENT_COLORS[ev.colorId] || DEFAULT_COLOR;
                return (
                  <div key={ev.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-semibold text-slate-500 w-12 flex-shrink-0 mt-0.5">{eventTime(ev, lang)}</span>
                    <span className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: color, minHeight: "1.5rem" }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800 truncate">{ev.summary || "(sans titre)"}</p>
                      {ev.location && (
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" /> {ev.location}</p>
                      )}
                      {ev.description && !ev.location && (
                        <p className="text-[11px] text-slate-400 truncate">{ev.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}