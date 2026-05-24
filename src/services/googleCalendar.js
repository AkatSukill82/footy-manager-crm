/* ============================================================
   GOOGLE CALENDAR SERVICE
   Uses Google Identity Services (token flow — no backend needed)
   Access tokens stored in localStorage, expire after ~1h
   ============================================================ */

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const TOKEN_KEY = 'gcal_token';
const TOKEN_EXPIRY_KEY = 'gcal_token_expiry';
const CLIENT_ID_KEY = 'gcal_client_id';
const API_BASE = 'https://www.googleapis.com/calendar/v3';

const GoogleCalendarService = {

  // ── Config ────────────────────────────────────────────────

  getClientId() {
    return localStorage.getItem(CLIENT_ID_KEY) || '';
  },

  setClientId(id) {
    localStorage.setItem(CLIENT_ID_KEY, id.trim());
  },

  getToken() {
    const expiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0');
    if (Date.now() > expiry) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  },

  saveToken(accessToken, expiresIn) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000 - 60_000));
  },

  disconnect() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    if (window.google?.accounts?.oauth2) {
      google.accounts.oauth2.revoke(this.getToken() || '', () => {});
    }
  },

  isConnected() {
    return !!this.getToken();
  },

  // ── Load Google Identity Services script ─────────────────

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

  // ── OAuth — request access token (opens Google popup) ────

  async connect() {
    const clientId = this.getClientId();
    if (!clientId) throw new Error('Client ID Google non configuré');

    await this.loadGIS();

    return new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          this.saveToken(response.access_token, response.expires_in);
          resolve(response.access_token);
        },
      });
      client.requestAccessToken({ prompt: '' });
    });
  },

  // ── API helpers ───────────────────────────────────────────

  async _fetch(path, options = {}) {
    const token = this.getToken();
    if (!token) throw new Error('Non connecté — reconnectez votre Google Calendar');

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      throw new Error('Session expirée — reconnectez votre Google Calendar');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Erreur HTTP ${res.status}`);
    }

    return res.json();
  },

  // ── Calendar list ─────────────────────────────────────────

  async getCalendars() {
    const data = await this._fetch('/users/me/calendarList');
    return data.items || [];
  },

  // ── Events ───────────────────────────────────────────────

  async getUpcomingEvents(calendarId = 'primary', maxResults = 20) {
    const now = new Date().toISOString();
    const params = new URLSearchParams({
      orderBy: 'startTime',
      singleEvents: 'true',
      timeMin: now,
      maxResults: String(maxResults),
    });
    const data = await this._fetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    return data.items || [];
  },

  async getPastEvents(calendarId = 'primary', maxResults = 10) {
    const now = new Date().toISOString();
    const params = new URLSearchParams({
      orderBy: 'startTime',
      singleEvents: 'true',
      timeMax: now,
      maxResults: String(maxResults),
    });
    const data = await this._fetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    return (data.items || []).reverse();
  },

  async createEvent(eventData, calendarId = 'primary') {
    return this._fetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  async deleteEvent(eventId, calendarId = 'primary') {
    const token = this.getToken();
    if (!token) throw new Error('Non connecté');
    const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); throw new Error('Session expirée'); }
    if (!res.ok && res.status !== 204) throw new Error(`Erreur HTTP ${res.status}`);
  },

  // ── Event builders (templates CRM) ───────────────────────

  buildContractExpiryEvent(playerName, contractEnd) {
    const date = contractEnd.substring(0, 10);
    return {
      summary: `⚠️ Contrat expire — ${playerName}`,
      description: `Le contrat de ${playerName} arrive à expiration. Action requise.`,
      start: { date },
      end: { date },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 43200 },  // 30 jours avant
          { method: 'popup', minutes: 10080 },  // 7 jours avant
        ],
      },
      colorId: '11', // Tomato
    };
  },

  buildMeetingEvent(title, description, dateTime, durationMinutes = 60) {
    const start = new Date(dateTime);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    return {
      summary: title,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: { useDefault: true },
      colorId: '2', // Sage
    };
  },

  buildMatchEvent(matchInfo, dateTime) {
    const start = new Date(dateTime);
    const end = new Date(start.getTime() + 105 * 60_000); // 1h45
    return {
      summary: `⚽ ${matchInfo}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      colorId: '10', // Basil
    };
  },

  // ── Format helpers ────────────────────────────────────────

  formatEventDate(event) {
    const raw = event.start?.dateTime || event.start?.date;
    if (!raw) return '';
    const d = new Date(raw);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
      ...(event.start?.dateTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  },

  isAllDay(event) {
    return !!event.start?.date;
  },
};

export default GoogleCalendarService;
