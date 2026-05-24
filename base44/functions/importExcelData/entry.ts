import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  // Auth optional — asServiceRole handles DB access
  const user = await base44.auth.me().catch(() => null);

  const { data } = await req.json();
  const joueurs   = data?.joueurs   || [];
  const clubs     = data?.clubs     || [];
  const contacts  = data?.contacts  || [];
  const nomFichier = data?.nom_fichier || 'import';

  const results = {
    joueurs_crees: 0, joueurs_mis_a_jour: 0,
    clubs_crees: 0,   clubs_mis_a_jour: 0,
    contacts_crees: 0, contacts_mis_a_jour: 0,
    erreurs: [], details: []
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const POSTES_VALIDES = [
    'Gardien','Défenseur central','Latéral droit','Latéral gauche',
    'Milieu défensif','Milieu central','Milieu offensif',
    'Ailier droit','Ailier gauche','Attaquant'
  ];
  const POSTES_MAP: Record<string,string> = {
    'gk':'Gardien','goalkeeper':'Gardien','gardien':'Gardien',
    'cb':'Défenseur central','dc':'Défenseur central','defenseur central':'Défenseur central',
    'rb':'Latéral droit','lateral droit':'Latéral droit',
    'lb':'Latéral gauche','lateral gauche':'Latéral gauche',
    'dm':'Milieu défensif','milieu defensif':'Milieu défensif',
    'cm':'Milieu central','milieu central':'Milieu central',
    'am':'Milieu offensif','milieu offensif':'Milieu offensif',
    'rw':'Ailier droit','ailier droit':'Ailier droit',
    'lw':'Ailier gauche','ailier gauche':'Ailier gauche',
    'st':'Attaquant','cf':'Attaquant','fw':'Attaquant','attaquant':'Attaquant',
  };

  const normalizePoste = (val: unknown): string | null => {
    if (!val) return null;
    const s = String(val).trim();
    if (POSTES_VALIDES.includes(s)) return s;
    return POSTES_MAP[s.toLowerCase()] || null;
  };

  const normalizeDate = (val: unknown): string | null => {
    if (!val) return null;
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    if (/^\d{4}$/.test(s)) return `${s}-06-30`;
    return null;
  };

  const normalizeNum = (val: unknown): number | null => {
    if (val == null || val === '') return null;
    // Handle values like "25M", "1.5M", "500K"
    const s = String(val).replace(/\s/g,'').replace(',','.');
    const mM = s.match(/^([\d.]+)\s*[Mm]$/);
    if (mM) return parseFloat(mM[1]) * 1_000_000;
    const mK = s.match(/^([\d.]+)\s*[Kk]$/);
    if (mK) return parseFloat(mK[1]) * 1_000;
    const n = parseFloat(s.replace(/[^\d.]/g,''));
    return isNaN(n) ? null : n;
  };

  const combineName = (raw: Record<string,unknown>): string => {
    const prenom = raw.prenom ? String(raw.prenom).trim() : '';
    const nom    = raw.nom    ? String(raw.nom).trim()    : '';
    return [prenom, nom].filter(Boolean).join(' ') || nom;
  };

  // ── Fetch existing data ───────────────────────────────────────────────────────
  const [existingPlayers, existingClubs, existingContacts] = await Promise.all([
    base44.asServiceRole.entities.Player.list(),
    base44.asServiceRole.entities.Club.list(),
    base44.asServiceRole.entities.ClubContact.list(),
  ]);

  const playerMap: Record<string, any>  = {};
  existingPlayers.forEach((p: any) => { playerMap[p.nom.toLowerCase().trim()] = p; });

  const clubMap: Record<string, any> = {};
  existingClubs.forEach((c: any) => { clubMap[c.nom.toLowerCase().trim()] = c; });

  const contactMap: Record<string, any> = {};
  existingContacts.forEach((c: any) => {
    const key = `${c.nom?.toLowerCase().trim()}|${c.club?.toLowerCase().trim()}`;
    contactMap[key] = c;
  });

  // ── Helper : upsert a club and return its record ──────────────────────────────
  const upsertClub = async (nom: string, pays?: string): Promise<any> => {
    const key = nom.toLowerCase().trim();
    if (clubMap[key]) return clubMap[key];
    const created = await base44.asServiceRole.entities.Club.create({
      nom, pays: pays || 'Inconnu'
    });
    clubMap[key] = created;
    results.clubs_crees++;
    results.details.push({ type: 'Club', nom, action: 'créé' });
    return created;
  };

  // ── Process explicit club rows ────────────────────────────────────────────────
  for (const raw of clubs) {
    const nom = raw.nom?.trim();
    if (!nom) continue;
    const key = nom.toLowerCase();
    const payload: Record<string,unknown> = {};
    ['pays','ville','stade','president','president_email','president_telephone',
     'entraineur','entraineur_email','directeur_sportif','directeur_sportif_email',
     'directeur_sportif_telephone','email_general','telephone_general','site_web'
    ].forEach(f => { if (raw[f]) payload[f] = String(raw[f]).trim(); });
    ['budget_transfert','budget_annuel','capacite_stade','dette','valeur_effectif']
      .forEach(f => { const v = normalizeNum(raw[f]); if (v != null) payload[f] = v; });

    if (clubMap[key]) {
      await base44.asServiceRole.entities.Club.update(clubMap[key].id, payload);
      results.clubs_mis_a_jour++;
      results.details.push({ type: 'Club', nom, action: 'mis à jour' });
    } else {
      const c = await base44.asServiceRole.entities.Club.create({
        nom, pays: raw.pays || 'Inconnu', ...payload
      });
      clubMap[key] = c;
      results.clubs_crees++;
      results.details.push({ type: 'Club', nom, action: 'créé' });
    }
  }

  // ── Process players ───────────────────────────────────────────────────────────
  // For each player: try to enrich via LLM internet search (max 10 to avoid timeout)
  const PLAYER_ENRICH_LIMIT = 10;
  let enrichCount = 0;

  for (const raw of joueurs) {
    const nomComplet = combineName(raw);
    if (!nomComplet) continue;

    try {
      let enriched: Record<string,unknown> = {};

      // Enrich via internet search if we have a name and haven't hit the limit
      if (enrichCount < PLAYER_ENRICH_LIMIT) {
        enrichCount++;
        try {
          const llmResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Fiche complète du joueur de football professionnel "${nomComplet}"${raw.club_actuel ? ` (club: ${raw.club_actuel})` : ''}.
Retourne toutes les informations disponibles. Si tu ne trouves pas ce joueur, retourne un objet vide {}.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                age: { type: 'number' },
                date_naissance: { type: 'string' },
                lieu_naissance: { type: 'string' },
                nationalite: { type: 'string' },
                nationalite_secondaire: { type: 'string' },
                poste: { type: 'string' },
                poste_secondaire: { type: 'string' },
                pied_fort: { type: 'string' },
                taille: { type: 'number' },
                poids: { type: 'number' },
                club_actuel: { type: 'string' },
                ligue: { type: 'string' },
                pays_ligue: { type: 'string' },
                numero_maillot: { type: 'number' },
                contrat_fin: { type: 'string' },
                valeur_marchande: { type: 'number' },
                salaire: { type: 'number' },
                agent: { type: 'string' },
                agence: { type: 'string' },
                instagram: { type: 'string' },
                twitter: { type: 'string' },
                photo_url: { type: 'string' },
                stats_saison: {
                  type: 'object',
                  properties: {
                    matchs: { type: 'number' }, buts: { type: 'number' },
                    passes_decisives: { type: 'number' }, minutes: { type: 'number' },
                    note_sofascore: { type: 'number' }, xg: { type: 'number' },
                    cartons_jaunes: { type: 'number' }, cartons_rouges: { type: 'number' },
                  }
                },
              }
            }
          });
          if (llmResult && Object.keys(llmResult).length > 0) enriched = llmResult;
        } catch (_) { /* enrichment optional */ }
      }

      // Merge: Excel data as base, LLM enriches missing fields
      const s = (enriched as any)?.stats_saison;
      const payload: Record<string,unknown> = {
        poste: normalizePoste(enriched.poste || raw.poste) || 'Attaquant',
      };

      // String fields — LLM takes priority over Excel, Excel fills gaps
      const strFields = ['club_actuel','nationalite','nationalite_secondaire','email','telephone',
        'ligue','pays_ligue','pied_fort','agent','agent_email','agent_telephone','agence',
        'instagram','twitter','photo_url','lieu_naissance'];
      strFields.forEach(f => {
        const v = enriched[f] || raw[f];
        if (v) payload[f] = String(v).trim();
      });

      // Number fields
      const numFromEnriched: Record<string,unknown> = {
        age: enriched.age, taille: enriched.taille, poids: enriched.poids,
        valeur_marchande: enriched.valeur_marchande, salaire: enriched.salaire,
        numero_maillot: enriched.numero_maillot,
        matchs_joues: s?.matchs, buts: s?.buts, passes_decisives: s?.passes_decisives,
        minutes_jouees: s?.minutes, note_moyenne: s?.note_sofascore,
        xg: s?.xg, cartons_jaunes: s?.cartons_jaunes, cartons_rouges: s?.cartons_rouges,
      };
      const numFromExcel: Record<string,unknown> = {
        age: raw.age, taille: raw.taille, poids: raw.poids,
        valeur_marchande: raw.valeur_marchande, salaire: raw.salaire,
        matchs_joues: raw.matchs_joues, buts: raw.buts,
        passes_decisives: raw.passes_decisives, note_moyenne: raw.note_moyenne,
      };
      [...Object.keys(numFromEnriched), ...Object.keys(numFromExcel)].forEach(f => {
        if (payload[f] != null) return;
        const v = normalizeNum(numFromEnriched[f] ?? numFromExcel[f]);
        if (v != null) payload[f] = v;
      });

      // Date fields
      ['date_naissance','contrat_fin'].forEach(f => {
        const v = normalizeDate(enriched[f] || raw[f]);
        if (v) payload[f] = v;
      });

      // Auto-link club
      if (payload.club_actuel) await upsertClub(String(payload.club_actuel), String(payload.pays_ligue || ''));

      const key = nomComplet.toLowerCase();
      if (playerMap[key]) {
        await base44.asServiceRole.entities.Player.update(playerMap[key].id, payload);
        results.joueurs_mis_a_jour++;
        results.details.push({ type: 'Joueur', nom: nomComplet, action: 'mis à jour' });
      } else {
        await base44.asServiceRole.entities.Player.create({ nom: nomComplet, ...payload });
        results.joueurs_crees++;
        results.details.push({ type: 'Joueur', nom: nomComplet, action: 'créé (enrichi IA)' });
      }
    } catch (err: any) {
      results.erreurs.push(`Joueur "${combineName(raw)}": ${err.message}`);
    }
  }

  // ── Process club contacts ─────────────────────────────────────────────────────
  for (const raw of contacts) {
    // Combine prenom + nom into full name
    const nom = combineName(raw);
    const club = raw.club?.trim() || raw.club_actuel?.trim();
    if (!nom || !club) continue;

    try {
      const payload: Record<string,unknown> = {};
      if (raw.pays)      payload.pays      = String(raw.pays).trim();
      if (raw.poste)     payload.poste     = String(raw.poste).trim();
      if (raw.email)     payload.email     = String(raw.email).trim();
      if (raw.telephone) payload.telephone = String(raw.telephone).trim();

      // Always upsert the club
      const linkedClub = await upsertClub(club, raw.pays ? String(raw.pays) : undefined);
      payload.club_id = linkedClub.id;

      const key = `${nom.toLowerCase()}|${club.toLowerCase()}`;
      if (contactMap[key]) {
        await base44.asServiceRole.entities.ClubContact.update(contactMap[key].id, payload);
        results.contacts_mis_a_jour++;
        results.details.push({ type: 'Contact', nom: `${nom} (${club})`, action: 'mis à jour' });
      } else {
        await base44.asServiceRole.entities.ClubContact.create({ nom, club, ...payload });
        results.contacts_crees++;
        results.details.push({ type: 'Contact', nom: `${nom} (${club})`, action: 'créé' });
      }
    } catch (err: any) {
      results.erreurs.push(`Contact "${nom} @ ${club}": ${err.message}`);
    }
  }

  // ── Save import log ───────────────────────────────────────────────────────────
  await base44.asServiceRole.entities.ImportLog.create({
    nom_fichier: nomFichier,
    date_import: new Date().toISOString(),
    total_lignes: joueurs.length + clubs.length + contacts.length,
    joueurs_crees: results.joueurs_crees,
    joueurs_mis_a_jour: results.joueurs_mis_a_jour,
    clubs_crees: results.clubs_crees,
    clubs_mis_a_jour: results.clubs_mis_a_jour,
    erreurs: results.erreurs.length,
    details: JSON.stringify(results.details),
    statut: results.erreurs.length === 0 ? 'succès' : 'partiel',
    created_by: user?.email || 'system',
  }).catch(() => {});

  return Response.json(results);
});
