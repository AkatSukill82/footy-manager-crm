import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar, Plus, Loader2, CheckCircle2, AlertCircle, Trash2,
  RefreshCw, X, Clock, CalendarDays, Zap, User,
  FileText, Trophy, ChevronRight, ExternalLink
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// ID du connecteur Google Calendar déclaré dans base44/connectors/googlecalendar.jsonc
const CONNECTOR_ID = "6a136187a4bae80428554350";

const EVENT_TEMPLATES = [
  { icon: FileText, label: "Expiration contrat", color: "text-red-500" },
  { icon: User,     label: "RDV joueur",          color: "text-blue-500" },
  { icon: User,     label: "RDV agent",            color: "text-purple-500" },
  { icon: Trophy,   label: "Match à surveiller",   color: "text-green-500" },
  { icon: CalendarDays, label: "Mercato",          color: "text-orange-500" },
  { icon: Zap,      label: "Autre",                color: "text-slate-500" },
];

function EventCard({ event, onDelete }) {
  const raw = event.start?.dateTime || event.start?.date;
  let dateStr = raw;
  try {
    dateStr = raw?.includes('T')
      ? format(parseISO(raw), "EEE d MMM · HH'h'mm", { locale: fr })
      : format(parseISO(raw), "EEE d MMM", { locale: fr });
  } catch {}

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white group">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-slate-900">{event.summary}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500">{dateStr}</p>
        </div>
        {event.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{event.description}</p>
        )}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(event)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function NewEventModal({ onClose, onCreated, players }) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate]               = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime]               = useState('10:00');
  const [duration, setDuration]       = useState(60);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleCreate = async () => {
    if (!title.trim() || !date) return;
    setLoading(true);
    setError('');
    try {
      const playerSuffix = selectedPlayer ? ` — ${selectedPlayer}` : '';
      const dateTime    = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(dateTime.getTime() + duration * 60_000);

      await base44.functions.invoke('syncToGoogleCalendar', {
        action: 'create',
        event: {
          summary:     title + playerSuffix,
          description,
          start: dateTime.toISOString(),
          end:   endDateTime.toISOString(),
        },
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-t-2xl" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">Nouvel événement</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Modèle rapide</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TEMPLATES.map(tpl => {
                const Icon = tpl.icon;
                return (
                  <button key={tpl.label} onClick={() => setTitle(tpl.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 text-xs font-medium transition-all">
                    <Icon className={`w-3.5 h-3.5 ${tpl.color}`} /> {tpl.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Titre *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="RDV joueur…" className="mt-1.5" />
          </div>

          {players.length > 0 && (
            <div>
              <Label>Joueur concerné (optionnel)</Label>
              <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— Aucun —</option>
                {players.map(p => (
                  <option key={p.id} value={p.nom}>{p.nom}{p.club_actuel ? ` (${p.club_actuel})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Heure</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Durée</Label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm">
              {[30, 45, 60, 90, 120].map(d => (
                <option key={d} value={d}>{d < 60 ? `${d} min` : `${Math.floor(d/60)}h${d%60 || ''}`}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Description (optionnel)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1.5" />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !date || loading}
              className="flex-1 bg-green-600 hover:bg-green-700">
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
  const [connected, setConnected] = useState(false);
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]         = useState('');
  const [showNewEvent, setShowNewEvent] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('-created_date'),
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('syncToGoogleCalendar', { action: 'list' });
      setEvents(res.data?.events || []);
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Ouvre le popup OAuth Base44 puis re-vérifie la connexion
  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      // Extrait le redirect_uri pour aider au débogage
      try {
        const u = new URL(url);
        const redir = u.searchParams.get('redirect_uri');
        if (redir) console.info('[FDM Calendar] redirect_uri utilisé par Base44 :', redir);
      } catch {}
      const popup = window.open(url, '_blank', 'width=520,height=620');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          fetchEvents();
        }
      }, 500);
    } catch (e) {
      setError(e.message);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    } catch {}
    setConnected(false);
    setEvents([]);
  };

  const handleDelete = async (event) => {
    if (!confirm(`Supprimer "${event.summary}" ?`)) return;
    try {
      await base44.functions.invoke('syncToGoogleCalendar', {
        action: 'delete',
        googleEventId: event.id,
      });
      setEvents(prev => prev.filter(e => e.id !== event.id));
    } catch (e) { setError(e.message); }
  };

  const today    = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const grouped = events.reduce((acc, ev) => {
    const raw = ev.start?.dateTime || ev.start?.date;
    const day = raw ? raw.substring(0, 10) : 'unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  const dayLabel = (day) => {
    if (day === today)    return "Aujourd'hui";
    if (day === tomorrow) return 'Demain';
    try { return format(parseISO(day), 'EEEE d MMMM', { locale: fr }); }
    catch { return day; }
  };

  const expiringPlayers = players.filter(p => {
    if (!p.contrat_fin) return false;
    const end = new Date(p.contrat_fin);
    return end <= new Date(Date.now() + 365 * 86400000) && end >= new Date();
  });

  const addContractEvent = async (player) => {
    try {
      const start = new Date(player.contrat_fin);
      start.setHours(10, 0, 0, 0);
      await base44.functions.invoke('syncToGoogleCalendar', {
        action: 'create',
        event: {
          summary:     `⚠️ Contrat expire — ${player.nom}`,
          description: `Fin de contrat de ${player.nom}${player.club_actuel ? ` (${player.club_actuel})` : ''}`,
          start: start.toISOString(),
          end:   new Date(start.getTime() + 3_600_000).toISOString(),
        },
      });
      fetchEvents();
    } catch (e) { setError(e.message); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-green-500" /> Calendrier
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Synchronisé avec Google Calendar</p>
          </div>
          {connected && (
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowNewEvent(true)} size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5">
                <Plus className="w-4 h-4" /> Événement
              </Button>
              <Button onClick={fetchEvents} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
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

        {/* Non connecté */}
        {!connected && (
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
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
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow">
                  <CalendarDays className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="text-center max-w-sm">
                <h2 className="text-xl font-bold text-slate-900">Connecter Google Calendar</h2>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  Synchronise ton agenda Google avec FDM pour gérer rendez-vous, expirations de contrat et événements.
                </p>
              </div>

              <Button onClick={handleConnect} disabled={connecting} size="lg"
                className="bg-white border-2 border-slate-200 hover:border-green-400 text-slate-900 hover:bg-green-50 gap-3 px-8 shadow-sm transition-all">
                {connecting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Connexion…</>
                ) : (
                  <>
                    <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                      <path fill="#4285F4" d="M47.532 24.552c0-1.636-.138-3.2-.395-4.705H24.48v9.01h12.97c-.56 3.01-2.24 5.56-4.77 7.27v6.04h7.72c4.52-4.17 7.13-10.3 7.13-17.615z"/>
                      <path fill="#34A853" d="M24.48 48c6.49 0 11.94-2.154 15.92-5.833l-7.72-6.04c-2.153 1.44-4.9 2.29-8.2 2.29-6.3 0-11.64-4.256-13.55-9.978H3v6.24C6.97 43.14 15.1 48 24.48 48z"/>
                      <path fill="#FBBC05" d="M10.93 28.44A14.48 14.48 0 0 1 9.93 24c0-1.54.266-3.04.737-4.44v-6.24H3A24.02 24.02 0 0 0 .48 24c0 3.87.928 7.53 2.52 10.68l7.93-6.24z"/>
                      <path fill="#EA4335" d="M24.48 9.583c3.55 0 6.73 1.22 9.24 3.62l6.93-6.93C36.41 2.37 30.96 0 24.48 0 15.1 0 6.97 4.86 3 12.32l7.93 6.24c1.91-5.72 7.25-8.977 13.55-8.977z"/>
                    </svg>
                    Se connecter avec Google
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-400">Accès limité au calendrier uniquement</p>
            </CardContent>
          </Card>
        )}

        {/* Connecté */}
        {connected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Google Calendar connecté</span>
                <span className="text-green-500">· {events.length} événement{events.length !== 1 ? 's' : ''} à venir</span>
              </div>
              <button onClick={handleDisconnect}
                className="text-xs text-green-500 hover:text-red-500 underline transition-colors">
                Déconnecter
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Liste des événements */}
              <div className="md:col-span-2 space-y-5">
                {events.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
                      <CalendarDays className="w-10 h-10 text-slate-300" />
                      <p className="text-slate-500">Aucun événement à venir.</p>
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
                          <EventCard key={ev.id} event={ev} onDelete={handleDelete} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Panneau droit */}
              <div className="space-y-4">
                {expiringPlayers.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" /> Contrats qui expirent
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {expiringPlayers.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-orange-50 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                            <p className="text-[10px] text-slate-500">{p.contrat_fin}</p>
                          </div>
                          <button onClick={() => addContractEvent(p)} title="Ajouter au calendrier"
                            className="w-6 h-6 flex-shrink-0 bg-orange-100 hover:bg-orange-200 rounded-md flex items-center justify-center transition-colors">
                            <Plus className="w-3.5 h-3.5 text-orange-600" />
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <div className="text-sm font-semibold">Actions rapides</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {EVENT_TEMPLATES.slice(0, 5).map(tpl => {
                      const Icon = tpl.icon;
                      return (
                        <button key={tpl.label} onClick={() => setShowNewEvent(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-left">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${tpl.color}`} />
                          <span className="text-slate-700">{tpl.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all">
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
          onCreated={fetchEvents}
          players={players}
        />
      )}
    </div>
  );
}
