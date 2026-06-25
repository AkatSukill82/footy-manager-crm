/* ============================================================
   GOOGLE CALENDAR SERVICE — version « blindée » (backend + refresh token)
   - connect() : flux OAuth "code" (popup) → la fonction Base44 googleCalendar
     échange le code et stocke le REFRESH TOKEN côté serveur (jamais ici).
   - ensureToken() : demande un access token frais à la fonction (qui le
     renouvelle via le refresh token) → connexion qui tient indéfiniment.
   - Les appels API Google Calendar partent du navigateur avec cet access token
     court terme (mis en cache localement le temps de sa validité).
   ============================================================ */
import { invokeFn } from '@/api/base44Client';

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const TOKEN_KEY = 'gcal_token';            // cache local de l'access token vendu
const TOKEN_EXPIRY_KEY = 'gcal_token_expiry';
const CLIENT_ID_KEY = 'gcal_client_id';
const SELECTED_CAL_KEY = 'gcal_selected_calendar';
const USER_INFO_KEY = 'gcal_user_info';
const LINKED_KEY = 'gcal_linked';
const API_BASE = 'https://www.googleapis.com/calendar/v3';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const GoogleCalendarService = {

  // ── Config ────────────────────────────────────────────────

  getClientId() {
    const stored = localStorage.getItem(CLIENT_ID_KEY);
    if (stored && stored.trim()) return stored.trim();
    return '614478963291-6lralciv1c676pi61dker53q0gpminfs.apps.googleusercontent.com';
  },
  setClientId(id) { localStorage.setItem(CLIENT_ID_KEY, id.trim()); },
  hasClientId() { return true; },

  getSelectedCalendar() {
    try { return JSON.parse(localStorage.getItem(SELECTED_CAL_KEY)); } catch { return null; }
  },
  setSelectedCalendar(cal) { localStorage.setItem(SELECTED_CAL_KEY, JSON.stringify(cal)); },

  getUserInfoCache() {
    try { return JSON.parse(localStorage.getItem(USER_INFO_KEY)); } catch { return null; }
  },

  // ── État de connexion ─────────────────────────────────────

  isLinked() { return localStorage.getItem(LINKED_KEY) === '1'; },
  // Synchrone (utilisé pour l'init UI) — l'intention de connexion persiste.
  isConnected() { return this.isLinked(); },

  // Vérifie l'état RÉEL côté serveur (gère le multi-appareils) et synchronise le flag.
  async checkStatus() {
    try {
      const res = await invokeFn('googleCalendar', { action: 'status' });
      if (res?.ok) {
        if (res.connected) {
          localStorage.setItem(LINKED_KEY, '1');
          if (res.email) localStorage.setItem(USER_INFO_KEY, JSON.stringify({ email: res.email }));
        } else {
          localStorage.removeItem(LINKED_KEY);
        }
        return !!res.connected;
      }
    } catch { /* hors-ligne / fonction non déployée → on garde le flag local */ }
    return this.isLinked();
  },

  // ── Cache local de l'access token ─────────────────────────

  _getCachedToken() {
    const expiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0');
    if (Date.now() > expiry) { localStorage.removeItem(TOKEN_KEY); return null; }
    return localStorage.getItem(TOKEN_KEY);
  },
  _cacheToken(token, expiry) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String((expiry || Date.now() + 3600_000) - 30_000));
  },
  _clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  // ── Google Identity Services ──────────────────────────────

  loadGIS() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) { resolve(); return; }
      const existing = document.getElementById('gis-script');
      if (existing) { existing.addEventListener('load', resolve); return; }
      const script = document.createElement('script');
      script.id = 'gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Impossible de charger Google Identity Services'));
      document.body.appendChild(script);
    });
  },

  // ── Connexion : flux "code" → backend stocke le refresh token ─────────────

  async connect() {
    const clientId = this.getClientId();
    if (!clientId) throw new Error('Client ID Google non configuré');
    await this.loadGIS();

    const code = await new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: SCOPES,
        ux_mode: 'popup',
        callback: (resp) => {
          if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
          resolve(resp.code);
        },
        error_callback: (err) => reject(new Error(err?.message || 'Autorisation Google annulée')),
      });
      client.requestCode();
    });

    const res = await invokeFn('googleCalendar', { action: 'exchangeCode', code });
    if (!res?.ok) throw new Error(res?.error || 'Connexion Google impossible');
    localStorage.setItem(LINKED_KEY, '1');
    if (res.email) localStorage.setItem(USER_INFO_KEY, JSON.stringify({ email: res.email }));
    this._clearToken();
    return true;
  },

  // Access token frais : cache local sinon backend (renouvelle via refresh token).
  async ensureToken() {
    const cached = this._getCachedToken();
    if (cached) return cached;
    const res = await invokeFn('googleCalendar', { action: 'getAccessToken' });
    if (!res?.ok || !res.access_token) {
      if (res?.needsReconnect) localStorage.removeItem(LINKED_KEY);
      throw new Error(res?.error || 'Non connecté — reconnectez votre Google Calendar');
    }
    this._cacheToken(res.access_token, res.expiry);
    return res.access_token;
  },

  async disconnect() {
    // Vide le local tout de suite (UI réactive), puis révoque côté serveur.
    this._clearToken();
    localStorage.removeItem(SELECTED_CAL_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(LINKED_KEY);
    try { await invokeFn('googleCalendar', { action: 'disconnect' }); } catch { /* ignore */ }
  },

  async getUserInfo() {
    try {
      const token = await this.ensureToken();
      const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return this.getUserInfoCache();
      const info = await res.json();
      localStorage.setItem(USER_INFO_KEY, JSON.stringify({ name: info.name, email: info.email, picture: info.picture }));
      return info;
    } catch { return this.getUserInfoCache(); }
  },

  // ── API helpers ───────────────────────────────────────────

  async _fetch(path, options = {}, _retried = false) {
    const token = await this.ensureToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      this._clearToken(); // force un nouveau token côté backend
      if (!_retried && this.isLinked()) return this._fetch(path, options, true);
      throw new Error('Session expirée — reconnectez votre Google Calendar');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Erreur HTTP ${res.status}`);
    }
    return res.json();
  },

  async getCalendars() {
    const data = await this._fetch('/users/me/calendarList');
    return data.items || [];
  },

  async getUpcomingEvents(calendarId = 'primary', maxResults = 20) {
    const params = new URLSearchParams({
      orderBy: 'startTime', singleEvents: 'true',
      timeMin: new Date().toISOString(), maxResults: String(maxResults),
    });
    const data = await this._fetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    return data.items || [];
  },

  async getEventsForDay(dateISO, calendarId = 'primary') {
    const start = new Date(`${dateISO}T00:00:00`);
    const end = new Date(`${dateISO}T23:59:59`);
    const params = new URLSearchParams({
      orderBy: 'startTime', singleEvents: 'true',
      timeMin: start.toISOString(), timeMax: end.toISOString(), maxResults: '50',
    });
    const data = await this._fetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    return data.items || [];
  },

  async getPastEvents(calendarId = 'primary', maxResults = 10) {
    const params = new URLSearchParams({
      orderBy: 'startTime', singleEvents: 'true',
      timeMax: new Date().toISOString(), maxResults: String(maxResults),
    });
    const data = await this._fetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    return (data.items || []).reverse();
  },

  async createEvent(eventData, calendarId = 'primary') {
    return this._fetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST', body: JSON.stringify(eventData),
    });
  },

  async deleteEvent(eventId, calendarId = 'primary') {
    const token = await this.ensureToken();
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { this._clearToken(); throw new Error('Session expirée'); }
    if (!res.ok && res.status !== 204) throw new Error(`Erreur HTTP ${res.status}`);
  },

  // ── Event builders (templates CRM) ───────────────────────

  buildContractExpiryEvent(playerName, contractEnd) {
    const date = contractEnd.substring(0, 10);
    return {
      summary: `⚠️ Contrat expire — ${playerName}`,
      description: `Le contrat de ${playerName} arrive à expiration. Action requise.`,
      start: { date }, end: { date },
      reminders: { useDefault: false, overrides: [
        { method: 'email', minutes: 43200 }, { method: 'popup', minutes: 10080 },
      ] },
      colorId: '11',
    };
  },

  buildMeetingEvent(title, description, dateTime, durationMinutes = 60) {
    const start = new Date(dateTime);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    return {
      summary: title, description,
      start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() },
      reminders: { useDefault: true }, colorId: '2',
    };
  },

  buildMatchEvent(matchInfo, dateTime) {
    const start = new Date(dateTime);
    const end = new Date(start.getTime() + 105 * 60_000);
    return {
      summary: `⚽ ${matchInfo}`,
      start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() },
      colorId: '10',
    };
  },

  // ── Format helpers ────────────────────────────────────────

  formatEventDate(event) {
    const raw = event.start?.dateTime || event.start?.date;
    if (!raw) return '';
    return new Date(raw).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
      ...(event.start?.dateTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  },

  isAllDay(event) { return !!event.start?.date; },
};

export default GoogleCalendarService;
