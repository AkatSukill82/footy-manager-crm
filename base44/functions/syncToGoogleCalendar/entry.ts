import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "6a136187a4bae80428554350";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const authHeader = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // List upcoming events
    if (action === 'list') {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ahead
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const res = await fetch(url, { headers: authHeader });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: res.status });
      }
      const data = await res.json();
      return Response.json({ events: data.items || [] });
    }

    // Create event
    if (action === 'create') {
      const { event } = body;
      const gcEvent = {
        summary: event.summary,
        description: event.description || '',
        start: { dateTime: event.start, timeZone: 'Europe/Brussels' },
        end: { dateTime: event.end, timeZone: 'Europe/Brussels' },
      };
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(gcEvent),
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: res.status });
      }
      const created = await res.json();
      return Response.json({ success: true, googleEventId: created.id });
    }

    // Delete event
    if (action === 'delete') {
      const { googleEventId } = body;
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      return Response.json({ success: res.status === 204 || res.ok });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});