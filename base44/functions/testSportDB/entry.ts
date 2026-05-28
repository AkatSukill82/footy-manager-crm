import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const response = await fetch("https://api.sportdb.dev/api/transfermarkt/countries", {
            headers: {
                "X-API-Key": "Ew88GicoMUjt5ztxaGzKLOxq3OHLD1AnbbveVVns"
            }
        });

        const data = await response.json();

        return Response.json({
            status: response.status,
            ok: response.ok,
            data: data
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});