import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Plus, Loader2, CheckCircle2, AlertCircle, Trash2,
  RefreshCw, Settings, X, Clock, CalendarDays, Zap, User,
  FileText, Trophy, ChevronRight, ExternalLink, Info
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import GoogleCalendarService from "../services/googleCalendar";

// ── Color mapping for Google Calendar event colors ────────────────────────────
const GCal_COLORS = {
  '1': 'bg-blue-100 text-blue-800 border-blue-200',
  '2': 'bg-green-100 text-green-800 border-green-200',
  '3': 'bg-purple-100 text-purple-800 border-purple-200',
  '4': 'bg-pink-100 text-pink-800 border-pink-200',
  '5': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '6': 'bg-orange-100 text-orange-800 border-orange-200',
  '7': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  '10': 'bg-green-100 text-green-800 border-green-200',
  '11': 'bg-red-100 text-red-800 border-red-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

function EventCard({ event, onDelete }) {
  const colorClass = GCal_COLORS[event.colorId] || GCal_COLORS.default;
  const allDay = GoogleCalendarService.isAllDay(event);
  const dateStr = GoogleCalendarService.formatEventDate(event);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${colorClass} group`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{event.summary}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
          <p className="text-xs opacity-70">{dateStr}{allDay ? ' · Journée entière' : ''}</p>
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

function SetupCard({ onSaved }) {
  const [clientId, setClientId] = useState(GoogleCalendarService.getClientId());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!clientId.trim()) return;
    GoogleCalendarService.setClientId(clientId.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onSaved(); }, 800);
  };

  return (
    <Card className="border-2 border-dashed border-slate-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" /> Configuration Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-blue-800 flex items-center gap-1.5"><Info className="w-4 h-4" /> Comment obtenir ton Client ID</p>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside text-xs leading-relaxed">
            <li>Va sur <strong>console.cloud.google.com</strong></li>
            <li>Crée un projet → <strong>APIs & Services → Bibliothèque</strong> → Active <strong>"Google Calendar API"</strong></li>
            <li><strong>APIs & Services → Identifiants</strong> → Créer des identifiants → <strong>ID client OAuth 2.0</strong></li>
            <li>Type : <strong>Application Web</strong></li>
            <li>Origines JavaScript autorisées : colle l'URL de cette app (ex: <code className="bg-blue-100 px-1 rounded">https://app.base44.com</code>)</li>
            <li>Copie le <strong>Client ID</strong> et colle-le ici</li>
          </ol>
        </div>

        <div>
          <Label>Client ID Google OAuth 2.0</Label>
          <Input
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="123456789-abc...apps.googleusercontent.com"
            className="mt-1.5 font-mono text-sm"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={!clientId.trim() || saved}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Enregistré !</> : "Enregistrer le Client ID"}
        </Button>
      </CardContent>
    </Card>
  );
}

const EVENT_TEMPLATES = [
  { icon: FileText, label: "Expiration contrat", color: "text-red-500", colorId: '11' },
  { icon: User, label: "RDV joueur", color: "text-blue-500", colorId: '1' },
  { icon: User, label: "RDV agent", color: "text-purple-500", colorId: '3' },
  { icon: Trophy, label: "Match à surveiller", color: "text-green-500", colorId: '10' },
  { icon: CalendarDays, label: "Mercato", color: "text-orange-500", colorId: '6' },
  { icon: Zap, label: "Autre", color: "text-slate-500", colorId: '7' },
];

function NewEventModal({ onClose, onCreated, players }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [duration, setDuration] = useState(60);
  const [colorId, setColorId] = useState('1');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyTemplate = (tpl) => {
    setTitle(tpl.label);
    setColorId(tpl.colorId);
    if (tpl.label === 'Match à surveiller') { setDuration(105); setAllDay(false); }
    if (tpl.label === 'Expiration contrat') setAllDay(true);
  };

  const handleCreate = async () => {
    if (!title.trim() || !date) return;
    setLoading(true);
    setError('');
    try {
      let event;
      const playerSuffix = selectedPlayer ? ` — ${selectedPlayer}` : '';
      if (allDay) {
        event = {
          summary: title + playerSuffix,
          description,
          start: { date },
          end: { date },
          colorId,
          reminders: { useDefault: true },
        };
      } else {
        const dateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(dateTime.getTime() + duration * 60_000);
        event = {
          summary: title + playerSuffix,
          description,
          start: { dateTime: dateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          colorId,
          reminders: { useDefault: true },
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
        <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-t-2xl" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">Nouvel événement</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>

          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Modèle rapide</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TEMPLATES.map(tpl => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.label}
                    onClick={() => applyTemplate(tpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 text-xs font-medium transition-all"
                  >
                    <Icon className={`w-3.5 h-3.5 ${tpl.color}`} /> {tpl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titre */}
          <div>
            <Label>Titre *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Expiration contrat Mbappé…" className="mt-1.5" />
          </div>

          {/* Joueur lié */}
          {players.length > 0 && (
            <div>
              <Label>Joueur concerné (optionnel)</Label>
              <select
                value={selectedPlayer}
                onChange={e => setSelectedPlayer(e.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— Aucun —</option>
                {players.map(p => <option key={p.id} value={p.nom}>{p.nom}{p.club_actuel ? ` (${p.club_actuel})` : ''}</option>)}
              </select>
            </div>
          )}

          {/* Date + heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Heure</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} disabled={allDay} className="mt-1.5" />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
              Journée entière
            </label>
            {!allDay && (
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Durée</Label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                >
                  {[30, 45, 60, 90, 105, 120, 180].map(d => (
                    <option key={d} value={d}>{d < 60 ? `${d} min` : `${Math.floor(d/60)}h${d%60 ? d%60 : ''}`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>Description (optionnel)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          {/* Couleur */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Couleur</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: '1', bg: 'bg-blue-500', label: 'Bleu' },
                { id: '2', bg: 'bg-green-400', label: 'Vert clair' },
                { id: '3', bg: 'bg-purple-500', label: 'Violet' },
                { id: '6', bg: 'bg-orange-400', label: 'Orange' },
                { id: '10', bg: 'bg-green-700', label: 'Vert foncé' },
                { id: '11', bg: 'bg-red-500', label: 'Rouge' },
                { id: '7', bg: 'bg-cyan-500', label: 'Cyan' },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setColorId(c.id)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${colorId === c.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !date || loading} className="flex-1 bg-green-600 hover:bg-green-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Créer l'événement
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [connected, setConnected] = useState(GoogleCalendarService.isConnected());
  const [hasClientId, setHasClientId] = useState(!!GoogleCalendarService.getClientId());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('-created_date'),
  });

  const loadEvents = useCallback(async () => {
    if (!GoogleCalendarService.isConnected()) return;
    setLoading(true);
    setError('');
    try {
      const data = await GoogleCalendarService.getUpcomingEvents('primary', 30);
      setEvents(data);
    } catch (e) {
      setError(e.message);
      if (e.message.includes('expirée') || e.message.includes('connecté')) setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected) loadEvents();
  }, [connected, loadEvents]);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      await GoogleCalendarService.connect();
      setConnected(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    GoogleCalendarService.disconnect();
    setConnected(false);
    setEvents([]);
  };

  const handleDelete = async (event) => {
    if (!confirm(`Supprimer "${event.summary}" de votre Google Calendar ?`)) return;
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

  // Group events by day
  const grouped = events.reduce((acc, ev) => {
    const raw = ev.start?.dateTime || ev.start?.date;
    const day = raw ? raw.substring(0, 10) : 'unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const dayLabel = (day) => {
    if (day === today) return "Aujourd'hui";
    if (day === tomorrow) return 'Demain';
    try {
      return format(parseISO(day), 'EEEE d MMMM', { locale: fr });
    } catch { return day; }
  };

  // Quick actions: players with contract expiring within 1 year
  const expiringPlayers = players.filter(p => {
    if (!p.contrat_fin) return false;
    const end = new Date(p.contrat_fin);
    const inOneYear = new Date(Date.now() + 365 * 86400000);
    return end <= inOneYear && end >= new Date();
  });

  const addContractEvent = async (player) => {
    if (!connected) { setError('Connectez d\'abord votre Google Calendar'); return; }
    try {
      const event = GoogleCalendarService.buildContractExpiryEvent(player.nom, player.contrat_fin);
      await GoogleCalendarService.createEvent(event);
      await loadEvents();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-green-500" /> Calendrier
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Synchronisé avec Google Calendar</p>
          </div>
          <div className="flex items-center gap-2">
            {connected && (
              <>
                <Button onClick={() => setShowNewEvent(true)} size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5">
                  <Plus className="w-4 h-4" /> Événement
                </Button>
                <Button onClick={loadEvents} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </>
            )}
            <Button onClick={() => setShowSettings(s => !s)} variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <SetupCard onSaved={() => { setHasClientId(true); setShowSettings(false); }} />
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Not configured */}
        {!hasClientId && !showSettings && (
          <Card className="border-2 border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center py-16 gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                <Calendar className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">Connecter Google Calendar</h2>
                <p className="text-slate-500 text-sm mt-1 max-w-sm">
                  Synchronise ton agenda Google avec le CRM pour gérer les rendez-vous, expirations de contrat et événements directement depuis l'app.
                </p>
              </div>
              <Button onClick={() => setShowSettings(true)} className="bg-green-600 hover:bg-green-700 gap-2">
                <Settings className="w-4 h-4" /> Configurer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Configured but not connected */}
        {hasClientId && !connected && (
          <Card>
            <CardContent className="flex flex-col items-center py-12 gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-800">Non connecté</h2>
                <p className="text-slate-500 text-sm mt-1">Clique sur "Se connecter" pour autoriser l'accès à ton Google Calendar.</p>
              </div>
              <Button onClick={handleConnect} disabled={connecting} className="bg-white border-2 border-slate-200 hover:border-green-400 text-slate-900 gap-2 px-6">
                {connecting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</>
                  : <>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" referrerPolicy="no-referrer" />
                      Se connecter avec Google
                    </>
                }
              </Button>
              <button onClick={handleDisconnect} className="text-xs text-slate-400 hover:text-slate-600 underline">
                Changer de compte / déconnecter
              </button>
            </CardContent>
          </Card>
        )}

        {/* Connected */}
        {connected && (
          <div className="space-y-6">
            {/* Status bar */}
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Google Calendar connecté</span>
                <span className="text-green-500">· {events.length} événement{events.length !== 1 ? 's' : ''} à venir</span>
              </div>
              <button onClick={handleDisconnect} className="text-xs text-green-500 hover:text-red-500 underline transition-colors">
                Déconnecter
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Events list */}
              <div className="md:col-span-2 space-y-5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : events.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
                      <CalendarDays className="w-10 h-10 text-slate-300" />
                      <p className="text-slate-500">Aucun événement à venir dans ton calendrier.</p>
                      <Button onClick={() => setShowNewEvent(true)} size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5">
                        <Plus className="w-4 h-4" /> Créer un événement
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(grouped).map(([day, dayEvents]) => (
                    <div key={day}>
                      <h3 className={`text-sm font-bold mb-2 capitalize ${day === today ? 'text-green-700' : 'text-slate-500'}`}>
                        {day === today && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 mb-0.5" />}
                        {dayLabel(day)}
                      </h3>
                      <div className="space-y-2">
                        {dayEvents.map(ev => (
                          <EventCard
                            key={ev.id}
                            event={ev}
                            onDelete={deletingId === ev.id ? () => {} : handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right panel */}
              <div className="space-y-4">
                {/* Quick action: expiring contracts */}
                {expiringPlayers.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" /> Contrats qui expirent
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {expiringPlayers.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-orange-50 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                            <p className="text-[10px] text-slate-500">{p.contrat_fin}</p>
                          </div>
                          <button
                            onClick={() => addContractEvent(p)}
                            title="Ajouter au calendrier"
                            className="w-6 h-6 flex-shrink-0 bg-orange-100 hover:bg-orange-200 rounded-md flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-orange-600" />
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quick create */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {EVENT_TEMPLATES.slice(0, 5).map(tpl => {
                      const Icon = tpl.icon;
                      return (
                        <button
                          key={tpl.label}
                          onClick={() => setShowNewEvent(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-left"
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${tpl.color}`} />
                          <span className="text-slate-700">{tpl.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> Ouvrir Google Calendar
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewEvent && (
        <NewEventModal
          onClose={() => setShowNewEvent(false)}
          onCreated={loadEvents}
          players={players}
        />
      )}
    </div>
  );
}
