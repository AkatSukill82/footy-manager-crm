/**
 * GOOGLE CALENDAR — flux serveur avec refresh token (version « blindée »).
 *
 * Le refresh token (secret durable) est stocké dans l'entité GoogleToken
 * (RLS admin-only) et ne quitte JAMAIS le serveur. Le front demande un
 * access token frais via l'action « getAccessToken » et appelle l'API Google
 * Calendar directement avec ce jeton court terme.
 *
 * ⚙️ Secrets requis (Base44 → fonction googleCalendar → variables/secrets) :
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 *
 * Actions : exchangeCode | getAccessToken | status | disconnect
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

function creds() {
  return { id: Deno.env.get('GOOGLE_CLIENT_ID'), secret: Deno.env.get('GOOGLE_CLIENT_SECRET') };
}

async function loadRow(svc: any, userId: string) {
  const rows = await svc.entities.GoogleToken.filter({ user_id: userId });
  return rows?.[0] || null;
}

// Échange un refresh_token contre un access_token frais.
async function refreshAccess(refreshToken: string) {
  const { id, secret } = creds();
  const body = new URLSearchParams({
    client_id: id!, client_secret: secret!,
    refresh_token: refreshToken, grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || 'Échec du renouvellement');
  return data; // { access_token, expires_in, scope, ... }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const { id: CLIENT_ID, secret: CLIENT_SECRET } = creds();

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return Response.json({ ok: false, error: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET non configurés dans les secrets de la fonction.' }, { status: 500 });
    }

    const { action, code } = await req.json();

    // ── 1re connexion : échange du code d'autorisation contre les tokens ──
    if (action === 'exchangeCode') {
      if (!code) return Response.json({ ok: false, error: 'Code manquant' }, { status: 400 });
      const body = new URLSearchParams({
        code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        redirect_uri: 'postmessage', grant_type: 'authorization_code',
      });
      const res = await fetch(TOKEN_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
      });
      const data = await res.json();
      if (!res.ok) return Response.json({ ok: false, error: data?.error_description || data?.error || 'Échec échange code' }, { status: 400 });

      let email = '';
      try {
        const ui = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${data.access_token}` } });
        if (ui.ok) email = (await ui.json())?.email || '';
      } catch { /* ignore */ }

      const existing = await loadRow(svc, user.id);
      const payload: any = {
        user_id: user.id, email,
        access_token: data.access_token || '',
        expiry: Date.now() + ((data.expires_in || 3600) * 1000) - 60_000,
        scope: data.scope || '',
      };
      // Google ne renvoie le refresh_token qu'au 1er consentement → ne pas l'écraser par vide.
      if (data.refresh_token) payload.refresh_token = data.refresh_token;

      if (existing) {
        await svc.entities.GoogleToken.update(existing.id, payload);
      } else {
        if (!payload.refresh_token) {
          return Response.json({ ok: false, error: 'Aucun refresh token reçu — réautorisez avec consentement.' }, { status: 400 });
        }
        await svc.entities.GoogleToken.create(payload);
      }
      return Response.json({ ok: true, connected: true, email });
    }

    // ── Statut de connexion ──
    if (action === 'status') {
      const row = await loadRow(svc, user.id);
      return Response.json({ ok: true, connected: !!row?.refresh_token, email: row?.email || null });
    }

    // ── Access token frais (renouvelé côté serveur via le refresh token) ──
    if (action === 'getAccessToken') {
      const row = await loadRow(svc, user.id);
      if (!row?.refresh_token) return Response.json({ ok: false, error: 'Non connecté', needsReconnect: true }, { status: 401 });
      if (row.access_token && row.expiry && Date.now() < row.expiry) {
        return Response.json({ ok: true, access_token: row.access_token, expiry: row.expiry });
      }
      let data;
      try { data = await refreshAccess(row.refresh_token); }
      catch (e: any) {
        return Response.json({ ok: false, error: e?.message || 'Renouvellement impossible', needsReconnect: true }, { status: 401 });
      }
      const expiry = Date.now() + ((data.expires_in || 3600) * 1000) - 60_000;
      await svc.entities.GoogleToken.update(row.id, { access_token: data.access_token, expiry });
      return Response.json({ ok: true, access_token: data.access_token, expiry });
    }

    // ── Déconnexion (révoque + supprime le jeton stocké) ──
    if (action === 'disconnect') {
      const row = await loadRow(svc, user.id);
      if (row) {
        try { if (row.refresh_token) await fetch(`${REVOKE_URL}?token=${encodeURIComponent(row.refresh_token)}`, { method: 'POST' }); } catch { /* ignore */ }
        await svc.entities.GoogleToken.delete(row.id);
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: `Action inconnue: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('googleCalendar:', err?.message);
    return Response.json({ ok: false, error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
});
