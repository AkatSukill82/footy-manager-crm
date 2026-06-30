import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar, Plus, Loader2, CheckCircle2, AlertCircle, Trash2,
  RefreshCw, X, Clock, CalendarDays, Zap, User,
  FileText, Trophy, ChevronRight, ExternalLink, ChevronDown,
  LogOut, Check
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import GoogleCalendarService from "../services/googleCalendar";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

const DATE_LOCALES = { fr, es, en: enUS };

const GCAL_COLORS = {
  '1':  'bg-blue-100 text-blue-800 border-blue-200',
  '2':  'bg-green-100 text-green-800 border-green-200',
  '3':  'bg-purple-100 text-purple-800 border-purple-200',
  '4':  'bg-pink-100 text-pink-800 border-pink-200',
  '5':  'bg-yellow-100 text-yellow-800 border-yellow-200',
  '6':  'bg-orange-100 text-orange-800 border-orange-200',
  '7':  'bg-cyan-100 text-cyan-800 border-cyan-200',
  '10': 'bg-green-100 text-green-800 border-green-200',
  '11': 'bg-red-100 text-red-800 border-red-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

function CalDot({ backgroundColor }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
      style={{ backgroundColor: backgroundColor || '#4285f4' }}
    />
  );
}

function EventCard({ event, onDelete }) {
  const { lang } = useLanguage();
  const colorClass = GCAL_COLORS[event.colorId] || GCAL_COLORS.default;
  const allDay  = GoogleCalendarService.isAllDay(event);
  const dateStr = GoogleCalendarService.formatEventDate(event);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${colorClass} group`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{event.summary}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
          <p className="text-xs opacity-70">{dateStr}{allDay ? ` · ${t(lang,'calendar.allDay')}` : ''}</p>
        </div>
        {event.description && (
          <p className="text-xs opacity-60 mt-1 line-clamp-1">{event.description}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(event)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Modal sélection calendrier — affiché juste après l'OAuth
function CalendarPickerModal({ onSelected, userInfo }) {
  const { lang } = useLanguage();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(null);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    GoogleCalendarService.getCalendars()
      .then(items => {
        setCalendars(items);
        const primary = items.find(c => c.primary) || items[0];
        if (primary) setSelected(primary);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = () => {
    if (!selected) return;
    setSaving(true);
    GoogleCalendarService.setSelectedCalendar({
      id: selected.id,
      summary: selected.summary,
      backgroundColor: selected.backgroundColor,
    });
    setTimeout(() => onSelected(selected), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-0.5 bg-slate-100" />
        <div className="p-6 space-y-5">
          {userInfo && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              {userInfo.picture
                ? <img src={userInfo.picture} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                : <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">{userInfo.name?.[0]}</div>
              }
              <div>
                <p className="font-semibold text-slate-900 text-sm">{userInfo.name}</p>
                <p className="text-xs text-slate-500">{userInfo.email}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-slate-700 ml-auto flex-shrink-0" />
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-900">{t(lang,'calendar.chooseCalTitle')}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t(lang,'calendar.chooseCalDesc')}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {calendars.map(cal => (
                <button key={cal.id} onClick={() => setSelected(cal)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    selected?.id === cal.id ? 'border-slate-900 bg-slate-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}>
                  <CalDot backgroundColor={cal.backgroundColor} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{cal.summary}</p>
                    {cal.primary && <Badge variant="outline" className="text-[10px] mt-0.5">{t(lang,'calendar.primaryBadge')}</Badge>}
                  </div>
                  {selected?.id === cal.id && <Check className="w-4 h-4 text-slate-700 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          <Button onClick={handleConfirm} disabled={!selected || saving} className="w-full bg-slate-900 hover:bg-slate-800">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t(lang,'calendar.synchronizing')}</>
              : <><CheckCircle2 className="w-4 h-4 mr-2" />{t(lang,'calendar.synchronize')}</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

const EVENT_TEMPLATES = [
  { key: 'contract',    icon: FileText,     color: "text-red-500",    colorId: '11' },
  { key: 'playerAppt',  icon: User,         color: "text-blue-500",   colorId: '1'  },
  { key: 'agentAppt',   icon: User,         color: "text-purple-500", colorId: '3'  },
  { key: 'matchWatch',  icon: Trophy,       color: "text-green-500",  colorId: '10' },
  { key: 'mercato',     icon: CalendarDays, color: "text-orange-500", colorId: '6'  },
  { key: 'other',       icon: Zap,          color: "text-slate-500",  colorId: '7'  },
];

function NewEventModal({ onClose, onCreated, players }) {
  const { lang } = useLanguage();
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate]             = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime]             = useState('10:00');
  const [allDay, setAllDay]         = useState(false);
  const [duration, setDuration]     = useState(60);
  const [colorId, setColorId]       = useState('1');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const applyTemplate = (tpl) => {
    setTitle(t(lang, `calendar.tpl_${tpl.key}`));
    setColorId(tpl.colorId);
    if (tpl.key === 'matchWatch') setDuration(105);
    if (tpl.key === 'contract') setAllDay(true);
  };

  const handleCreate = async () => {
    if (!title.trim() || !date) return;
    setLoading(true);
    setError('');
    try {
      const suffix = selectedPlayer ? ` — ${selectedPlayer}` : '';
      let event;
      if (allDay) {
        event = { summary: title + suffix, description, start: { date }, end: { date }, colorId, reminders: { useDefault: true } };
      } else {
        const dt = new Date(`${date}T${time}:00`);
        event = {
          summary: title + suffix, description,
          start: { dateTime: dt.toISOString() },
          end:   { dateTime: new Date(dt.getTime() + duration * 60_000).toISOString() },
          colorId, reminders: { useDefault: true },
        };
      }
      await GoogleCalendarService.createEvent(event);
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="h-0.5 bg-slate-100 rounded-t-2xl" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">{t(lang,'calendar.newEventTitle')}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t(lang,'calendar.quickTemplate')}</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TEMPLATES.map(tpl => {
                const Icon = tpl.icon;
                return (
                  <button key={tpl.key} onClick={() => applyTemplate(tpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-medium transition-all">
                    <Icon className={`w-3.5 h-3.5 ${tpl.color}`} /> {t(lang, `calendar.tpl_${tpl.key}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>{t(lang,'calendar.titleLabel')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t(lang,'calendar.titlePlh')} className="mt-1.5" />
          </div>

          {players.length > 0 && (
            <div>
              <Label>{t(lang,'calendar.playerLabel')}</Label>
              <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">{t(lang,'calendar.noPlayer')}</option>
                {players.map(p => <option key={p.id} value={p.nom}>{p.nom}{p.club_actuel ? ` (${p.club_actuel})` : ''}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t(lang,'calendar.dateLabel')}</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1.5" /></div>
            <div><Label>{t(lang,'calendar.timeLabel')}</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} disabled={allDay} className="mt-1.5" /></div>
          </div>

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
              {t(lang,'calendar.allDayLabel')}
            </label>
            {!allDay && (
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">{t(lang,'calendar.durationLabel')}</Label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="border border-slate-200 rounded-lg px-2 py-1 text-sm">
                  {[30, 45, 60, 90, 105, 120, 180].map(d => (
                    <option key={d} value={d}>{d < 60 ? `${d} min` : `${Math.floor(d/60)}h${d%60 || ''}`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div><Label>{t(lang,'calendar.descLabel')}</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1.5" /></div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t(lang,'calendar.colorLabel')}</p>
            <div className="flex gap-2 flex-wrap">
              {[{id:'1',bg:'bg-blue-500'},{id:'2',bg:'bg-green-400'},{id:'3',bg:'bg-purple-500'},
                {id:'6',bg:'bg-orange-400'},{id:'10',bg:'bg-green-700'},{id:'11',bg:'bg-red-500'},{id:'7',bg:'bg-cyan-500'}].map(c => (
                <button key={c.id} onClick={() => setColorId(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${colorId === c.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`} />
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">{t(lang,'common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !date || loading} className="flex-1 bg-slate-900 hover:bg-slate-800">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {t(lang,'calendar.createEventBtn')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { lang } = useLanguage();
  const dateLocale = DATE_LOCALES[lang] || enUS;
  const [connected, setConnected]     = useState(GoogleCalendarService.isConnected());
  const [selectedCal, setSelectedCal] = useState(GoogleCalendarService.getSelectedCalendar());
  const [userInfo, setUserInfo]       = useState(GoogleCalendarService.getUserInfoCache());
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [connecting, setConnecting]   = useState(false);
  const [autoReconnecting, setAutoReconnecting] = useState(false);
  const [error, setError]             = useState('');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [deletingId, setDeletingId]   = useState(null);

  // Au chargement : vérifie l'état RÉEL côté serveur (sans popup). La connexion
  // est maintenue côté backend via le refresh token → pas de reconnexion manuelle.
  useEffect(() => {
    setAutoReconnecting(true);
    GoogleCalendarService.checkStatus()
      .then((ok) => setConnected(ok))
      .catch(() => {})
      .finally(() => setAutoReconnecting(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const calendarId = selectedCal?.id || 'primary';

  const loadEvents = useCallback(async () => {
    if (!GoogleCalendarService.isConnected()) return;
    setLoading(true);
    setError('');
    try {
      const data = await GoogleCalendarService.getUpcomingEvents(calendarId, 30);
      setEvents(data);
    } catch (e) {
      setError(e.message);
      if (e.message.includes('expirée') || e.message.includes('connecté')) {
        setConnected(false);
        setSelectedCal(null);
      }
    } finally {
      setLoading(false);
    }
  }, [calendarId]);

  useEffect(() => {
    if (connected && selectedCal) loadEvents();
  }, [connected, selectedCal, loadEvents]);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      await GoogleCalendarService.connect();
      setConnected(true);
      const info = await GoogleCalendarService.getUserInfo();
      setUserInfo(info);
      setShowCalPicker(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleCalendarSelected = (cal) => {
    setSelectedCal({ id: cal.id, summary: cal.summary, backgroundColor: cal.backgroundColor });
    setShowCalPicker(false);
  };

  const handleDisconnect = () => {
    GoogleCalendarService.disconnect();
    setConnected(false);
    setSelectedCal(null);
    setUserInfo(null);
    setEvents([]);
  };

  const handleDelete = async (event) => {
    if (!confirm(t(lang, 'calendar.deleteConfirm', { title: event.summary }))) return;
    setDeletingId(event.id);
    try {
      await GoogleCalendarService.deleteEvent(event.id);
      setEvents(prev => prev.filter(e => e.id !== event.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = events.reduce((acc, ev) => {
    const raw = ev.start?.dateTime || ev.start?.date;
    const day = raw ? raw.substring(0, 10) : 'unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  const today    = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const dayLabel = (day) => {
    if (day === today)    return t(lang, 'calendar.today');
    if (day === tomorrow) return t(lang, 'calendar.tomorrow');
    try { return format(parseISO(day), 'EEEE d MMMM', { locale: dateLocale }); }
    catch { return day; }
  };

  const expiringPlayers = players.filter(p => {
    if (!p.contrat_fin) return false;
    const end = new Date(p.contrat_fin);
    return end <= new Date(Date.now() + 365 * 86400000) && end >= new Date();
  });

  const addContractEvent = async (player) => {
    try {
      await GoogleCalendarService.createEvent(GoogleCalendarService.buildContractExpiryEvent(player.nom, player.contrat_fin));
      await loadEvents();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-slate-600" /> {t(lang,'calendar.title')}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{t(lang,'calendar.subtitle')}</p>
          </div>
          {connected && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowNewEvent(true)} size="sm" className="bg-slate-900 hover:bg-slate-800 gap-1.5">
                <Plus className="w-4 h-4" /> {t(lang,'calendar.newEventBtn')}
              </Button>
              <Button onClick={loadEvents} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Reconnexion silencieuse en cours */}
        {autoReconnecting && (
          <Card>
            <CardContent className="flex flex-col items-center py-16 gap-4 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-500">{lang === "en" ? "Reconnecting to Google Calendar…" : lang === "es" ? "Reconectando con Google Calendar…" : "Reconnexion à Google Calendar…"}</p>
            </CardContent>
          </Card>
        )}

        {/* Non connecté */}
        {!connected && !autoReconnecting && (
          <Card className="overflow-hidden">
            <div className="h-0.5 bg-slate-100" />
            <CardContent className="flex flex-col items-center py-16 gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-slate-100">
                  <svg viewBox="0 0 48 48" className="w-12 h-12">
                    <path fill="#4285F4" d="M47.532 24.552c0-1.636-.138-3.2-.395-4.705H24.48v9.01h12.97c-.56 3.01-2.24 5.56-4.77 7.27v6.04h7.72c4.52-4.17 7.13-10.3 7.13-17.615z"/>
                    <path fill="#34A853" d="M24.48 48c6.49 0 11.94-2.154 15.92-5.833l-7.72-6.04c-2.153 1.44-4.9 2.29-8.2 2.29-6.3 0-11.64-4.256-13.55-9.978H3v6.24C6.97 43.14 15.1 48 24.48 48z"/>
                    <path fill="#FBBC05" d="M10.93 28.44A14.48 14.48 0 0 1 9.93 24c0-1.54.266-3.04.737-4.44v-6.24H3A24.02 24.02 0 0 0 .48 24c0 3.87.928 7.53 2.52 10.68l7.93-6.24z"/>
                    <path fill="#EA4335" d="M24.48 9.583c3.55 0 6.73 1.22 9.24 3.62l6.93-6.93C36.41 2.37 30.96 0 24.48 0 15.1 0 6.97 4.86 3 12.32l7.93 6.24c1.91-5.72 7.25-8.977 13.55-8.977z"/>
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center shadow">
                  <CalendarDays className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="text-center max-w-sm">
                <h2 className="text-xl font-bold text-slate-900">{t(lang,'calendar.connectTitle')}</h2>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  {t(lang,'calendar.connectDesc')}
                </p>
              </div>

              <Button onClick={handleConnect} disabled={connecting} size="lg"
                className="bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-900 hover:bg-slate-50 gap-3 px-8 shadow-sm transition-all">
                {connecting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t(lang,'calendar.connecting')}</>
                ) : (
                  <>
                    <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                      <path fill="#4285F4" d="M47.532 24.552c0-1.636-.138-3.2-.395-4.705H24.48v9.01h12.97c-.56 3.01-2.24 5.56-4.77 7.27v6.04h7.72c4.52-4.17 7.13-10.3 7.13-17.615z"/>
                      <path fill="#34A853" d="M24.48 48c6.49 0 11.94-2.154 15.92-5.833l-7.72-6.04c-2.153 1.44-4.9 2.29-8.2 2.29-6.3 0-11.64-4.256-13.55-9.978H3v6.24C6.97 43.14 15.1 48 24.48 48z"/>
                      <path fill="#FBBC05" d="M10.93 28.44A14.48 14.48 0 0 1 9.93 24c0-1.54.266-3.04.737-4.44v-6.24H3A24.02 24.02 0 0 0 .48 24c0 3.87.928 7.53 2.52 10.68l7.93-6.24z"/>
                      <path fill="#EA4335" d="M24.48 9.583c3.55 0 6.73 1.22 9.24 3.62l6.93-6.93C36.41 2.37 30.96 0 24.48 0 15.1 0 6.97 4.86 3 12.32l7.93 6.24c1.91-5.72 7.25-8.977 13.55-8.977z"/>
                    </svg>
                    {t(lang,'calendar.connectBtn')}
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-400">{t(lang,'calendar.accessNote')}</p>
            </CardContent>
          </Card>
        )}

        {/* Connecté */}
        {connected && selectedCal && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-wrap">
              <div className="flex items-center gap-3">
                {userInfo?.picture && (
                  <img src={userInfo.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                )}
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{userInfo?.name ? `${userInfo.name} · ` : ''}{t(lang,'calendar.connectedLabel')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white rounded-lg px-2 py-1 border border-slate-200">
                  <CalDot backgroundColor={selectedCal.backgroundColor} />
                  <span className="truncate max-w-[120px]">{selectedCal.summary}</span>
                  <button onClick={() => setShowCalPicker(true)} className="ml-0.5 hover:text-slate-900">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{t(lang,'calendar.eventCount', { count: events.length })}</span>
                <button onClick={handleDisconnect} className="text-xs text-slate-400 hover:text-red-500 underline transition-colors flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> {t(lang,'calendar.disconnect')}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : events.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
                      <CalendarDays className="w-10 h-10 text-slate-300" />
                      <p className="text-slate-500">{t(lang,'calendar.noEvents')}</p>
                      <Button onClick={() => setShowNewEvent(true)} size="sm" className="bg-slate-900 hover:bg-slate-800 gap-1.5">
                        <Plus className="w-4 h-4" /> {t(lang,'calendar.createEvent')}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(grouped).map(([day, dayEvents]) => (
                    <div key={day}>
                      <h3 className={`text-sm font-bold mb-2 capitalize ${day === today ? 'text-slate-900' : 'text-slate-500'}`}>
                        {day === today && <span className="inline-block w-2 h-2 rounded-full bg-slate-900 mr-2 mb-0.5" />}
                        {dayLabel(day)}
                      </h3>
                      <div className="space-y-2">
                        {dayEvents.map(ev => (
                          <EventCard key={ev.id} event={ev} onDelete={deletingId === ev.id ? () => {} : handleDelete} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-4">
                {expiringPlayers.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" /> {t(lang,'calendar.expiringContracts')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {expiringPlayers.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-orange-50 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                            <p className="text-[10px] text-slate-500">{p.contrat_fin}</p>
                          </div>
                          <button onClick={() => addContractEvent(p)}
                            className="w-6 h-6 flex-shrink-0 bg-orange-100 hover:bg-orange-200 rounded-md flex items-center justify-center transition-colors">
                            <Plus className="w-3.5 h-3.5 text-orange-600" />
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{t(lang,'calendar.quickActions')}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {EVENT_TEMPLATES.slice(0, 5).map(tpl => {
                      const Icon = tpl.icon;
                      return (
                        <button key={tpl.key} onClick={() => setShowNewEvent(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-left">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${tpl.color}`} />
                          <span className="text-slate-700">{t(lang, `calendar.tpl_${tpl.key}`)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all">
                  <ExternalLink className="w-4 h-4" /> {t(lang,'calendar.openGCal')}
                </a>
              </div>
            </div>
          </div>
        )}

        {connected && !selectedCal && !showCalPicker && (
          <Card>
            <CardContent className="flex flex-col items-center py-12 gap-4 text-center">
              <CalendarDays className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-slate-800">{t(lang,'calendar.chooseSyncTitle')}</p>
              <Button onClick={() => setShowCalPicker(true)} className="bg-slate-900 hover:bg-slate-800">
                {t(lang,'calendar.chooseCalTitle')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {showCalPicker && <CalendarPickerModal onSelected={handleCalendarSelected} userInfo={userInfo} />}
      {showNewEvent  && <NewEventModal onClose={() => setShowNewEvent(false)} onCreated={loadEvents} players={players} />}
    </div>
  );
}
