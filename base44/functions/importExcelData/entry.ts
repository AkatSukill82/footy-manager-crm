import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  const { data } = await req.json();
  const joueurs    = data?.joueurs   || [];
  const clubs      = data?.clubs     || [];
  const contacts   = data?.contacts  || [];
  const nomFichier = data?.nom_fichier || 'import';

  const results = {
    joueurs_crees: 0, joueurs_mis_a_jour: 0,
    clubs_crees: 0,   clubs_mis_a_jour: 0,
    contacts_crees: 0, contacts_mis_a_jour: 0,
    erreurs: [], details: []
  };

  // ── Postes valides ────────────────────────────────────────────────────────────

  const POSTES_VALIDES = [
    'Gardien','Défenseur central','Latéral droit','Latéral gauche',
    'Milieu défensif','Milieu central','Milieu offensif',
    'Ailier droit','Ailier gauche','Attaquant'
  ];

  const POSTES_MAP: Record<string,string> = {
    // Gardien
    'gk':'Gardien','goalkeeper':'Gardien','gardien':'Gardien',
    'portero':'Gardien','portiere':'Gardien','torwart':'Gardien','keeper':'Gardien',
    // Défenseur central
    'cb':'Défenseur central','dc':'Défenseur central',
    'center-back':'Défenseur central','centreback':'Défenseur central',
    'centre-back':'Défenseur central','central defender':'Défenseur central',
    'defenseur central':'Défenseur central','defender':'Défenseur central',
    'defensa central':'Défenseur central','innenverteidiger':'Défenseur central',
    // Latéral droit
    'rb':'Latéral droit','rd':'Latéral droit',
    'right back':'Latéral droit','lateral droit':'Latéral droit',
    'right-back':'Latéral droit','rechtsverteidiger':'Latéral droit',
    // Latéral gauche
    'lb':'Latéral gauche','ld':'Latéral gauche',
    'left back':'Latéral gauche','lateral gauche':'Latéral gauche',
    'left-back':'Latéral gauche','linksverteidiger':'Latéral gauche',
    // Milieu défensif
    'dm':'Milieu défensif','cdm':'Milieu défensif','defensive mid':'Milieu défensif',
    'defensive midfielder':'Milieu défensif','milieu defensif':'Milieu défensif',
    'pivot':'Milieu défensif','ancre':'Milieu défensif',
    // Milieu central
    'cm':'Milieu central','central midfielder':'Milieu central',
    'milieu central':'Milieu central','midfielder':'Milieu central',
    'mf':'Milieu central','mid':'Milieu central',
    // Milieu offensif
    'am':'Milieu offensif','cam':'Milieu offensif',
    'attacking midfielder':'Milieu offensif','milieu offensif':'Milieu offensif',
    'trequartista':'Milieu offensif','no10':'Milieu offensif',
    // Ailier droit
    'rw':'Ailier droit','rm':'Ailier droit',
    'right winger':'Ailier droit','ailier droit':'Ailier droit',
    'right wing':'Ailier droit','right midfield':'Ailier droit',
    // Ailier gauche
    'lw':'Ailier gauche','lm':'Ailier gauche',
    'left winger':'Ailier gauche','ailier gauche':'Ailier gauche',
    'left wing':'Ailier gauche','left midfield':'Ailier gauche',
    'winger':'Ailier droit',
    // Attaquant
    'st':'Attaquant','cf':'Attaquant','fw':'Attaquant','ss':'Attaquant',
    'attaquant':'Attaquant','forward':'Attaquant','striker':'Attaquant',
    'centre forward':'Attaquant','centre-forward':'Attaquant',
    'center forward':'Attaquant','delantero':'Attaquant',
    'stuermer':'Attaquant','centravanti':'Attaquant',
  };

  const normalizePoste = (val: unknown): string | null => {
    if (!val) return null;
    const s = String(val).trim();
    if (POSTES_VALIDES.includes(s)) return s;
    return POSTES_MAP[s.toLowerCase()] || null;
  };

  // ── Dates ─────────────────────────────────────────────────────────────────────

  const normalizeDate = (val: unknown): string | null => {
    if (!val) return null;
    const s = String(val).trim();
    // ISO déjà correct
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // JJ/MM/AAAA ou JJ-MM-AAAA ou JJ.MM.AAAA
    const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    // MM/DD/YYYY (format US)
    const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) {
      const [, m1, d1, y1] = us;
      if (parseInt(m1) <= 12) return `${y1}-${m1.padStart(2,'0')}-${d1.padStart(2,'0')}`;
    }
    // Année seule → 30 juin
    if (/^\d{4}$/.test(s)) return `${s}-06-30`;
    return null;
  };

  // ── Nombres / Montants ────────────────────────────────────────────────────────

  const normalizeNum = (val: unknown): number | null => {
    if (val == null || val === '') return null;
    // Nettoyage : espaces, €, $, £
    const s = String(val)
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[€$£]/g, '');
    // "25M" ou "25m" → 25_000_000
    const mM = s.match(/^([\d.]+)\s*[Mm]$/);
    if (mM) return parseFloat(mM[1]) * 1_000_000;
    // "500K" → 500_000
    const mK = s.match(/^([\d.]+)\s*[Kk]$/);
    if (mK) return parseFloat(mK[1]) * 1_000;
    // "1.5B" → 1_500_000_000
    const mB = s.match(/^([\d.]+)\s*[Bb]$/);
    if (mB) return parseFloat(mB[1]) * 1_000_000_000;
    const n = parseFloat(s.replace(/[^\d.]/g, ''));
    return isNaN(n) ? null : n;
  };

  // ── Nationalités (codes ISO → noms complets) ──────────────────────────────────

  const NAT_MAP: Record<string,string> = {
    'fra':'France','esp':'Espagne','eng':'Angleterre','ger':'Allemagne',
    'deu':'Allemagne','ita':'Italie','por':'Portugal','prt':'Portugal',
    'ned':'Pays-Bas','nld':'Pays-Bas','bra':'Brésil','arg':'Argentine',
    'bel':'Belgique','cro':'Croatie','sen':'Sénégal','civ':"Côte d'Ivoire",
    'mar':'Maroc','nga':'Nigeria','aut':'Autriche','sco':'Écosse',
    'wal':'Pays de Galles','irl':'Irlande','usa':'États-Unis',
    'mex':'Mexique','col':'Colombie','uru':'Uruguay','chi':'Chili',
    'den':'Danemark','swe':'Suède','nor':'Norvège','sui':'Suisse',
    'pol':'Pologne','rus':'Russie','ukr':'Ukraine','srb':'Serbie',
    'tur':'Turquie','gha':'Ghana','cmr':'Cameroun','alg':'Algérie',
    'tun':'Tunisie','egy':'Égypte','jap':'Japon','jpn':'Japon',
    'kor':'Corée du Sud','mli':'Mali','gui':'Guinée','gnb':'Guinée-Bissau',
    // Noms anglais → français
    'france':'France','spain':'Espagne','england':'Angleterre',
    'germany':'Allemagne','italy':'Italie','brazil':'Brésil',
    'argentina':'Argentine','belgium':'Belgique','netherlands':'Pays-Bas',
    'portugal':'Portugal','senegal':'Sénégal','morocco':'Maroc',
    'nigeria':'Nigeria','cameroon':'Cameroun','ghana':'Ghana',
    'algeria':'Algérie','tunisia':'Tunisie','egypt':'Égypte',
    'ivory coast':"Côte d'Ivoire","cote d'ivoire":"Côte d'Ivoire",
    'united states':'États-Unis','usa':'États-Unis','japan':'Japon',
    'south korea':'Corée du Sud','korea':'Corée du Sud',
  };

  const normalizeNationality = (val: unknown): string | null => {
    if (!val) return null;
    const s = String(val).trim();
    if (!s) return null;
    return NAT_MAP[s.toLowerCase()] || s;
  };

  // ── Nom complet ───────────────────────────────────────────────────────────────

  const combineName = (raw: Record<string,unknown>): string => {
    const prenom = raw.prenom ? String(raw.prenom).trim() : '';
    const nom    = raw.nom    ? String(raw.nom).trim()    : '';
    return [prenom, nom].filter(Boolean).join(' ') || nom;
  };

  // Normalise accents pour comparaison
  const normalizeForCompare = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();

  // ── Données existantes ───────────────────────────────────────────────────────

  const [existingPlayers, existingClubs, existingContacts] = await Promise.all([
    base44.asServiceRole.entities.Player.list(),
    base44.asServiceRole.entities.Club.list(),
    base44.asServiceRole.entities.ClubContact.list(),
  ]);

  const playerMap: Record<string, any> = {};
  existingPlayers.forEach((p: any) => {
    playerMap[normalizeForCompare(p.nom)] = p;
  });

  const clubMap: Record<string, any> = {};
  existingClubs.forEach((c: any) => {
    clubMap[normalizeForCompare(c.nom)] = c;
  });

  const contactMap: Record<string, any> = {};
  existingContacts.forEach((c: any) => {
    const key = `${normalizeForCompare(c.nom||'')}|${normalizeForCompare(c.club||'')}`;
    contactMap[key] = c;
  });

  // ── Upsert club ───────────────────────────────────────────────────────────────

  const upsertClub = async (nom: string, pays?: string): Promise<any> => {
    const key = normalizeForCompare(nom);
    if (clubMap[key]) return clubMap[key];
    const created = await base44.asServiceRole.entities.Club.create({
      nom, pays: pays || 'Inconnu'
    });
    clubMap[key] = created;
    results.clubs_crees++;
    results.details.push({ type: 'Club', nom, action: 'créé' });
    return created;
  };

  // ── Clubs explicites ──────────────────────────────────────────────────────────

  for (const raw of clubs) {
    const nom = raw.nom?.trim();
    if (!nom) continue;
    const key = normalizeForCompare(nom);
    const payload: Record<string,unknown> = {};

    const strFields = ['pays','ville','stade','president','president_email',
      'entraineur','entraineur_email','directeur_sportif','directeur_sportif_email',
      'directeur_sportif_telephone','email_general','telephone_general','site_web'];
    strFields.forEach(f => { if (raw[f]) payload[f] = String(raw[f]).trim(); });

    const numFields = ['budget_transfert','budget_annuel','capacite_stade','dette','valeur_effectif'];
    numFields.forEach(f => { const v = normalizeNum(raw[f]); if (v != null) payload[f] = v; });

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

  // ── Enrichissement intelligent ────────────────────────────────────────────────
  // On n'enrichit que les fiches peu remplies (< 3 champs significatifs).
  // Cela évite des appels LLM inutiles pour des fichiers déjà complets.

  const MEANINGFUL_FIELDS = [
    'poste','nationalite','date_naissance','valeur_marchande','contrat_fin',
    'buts','matchs_joues','note_moyenne','ligue','taille','poids'
  ];

  const needsEnrichment = (raw: Record<string,unknown>): boolean => {
    const filled = MEANINGFUL_FIELDS.filter(f => raw[f] != null && raw[f] !== '').length;
    return filled < 3;
  };

  // ── Joueurs — traitement par lots parallèles ──────────────────────────────────

  const BATCH_SIZE = 4;

  for (let i = 0; i < joueurs.length; i += BATCH_SIZE) {
    const batch = joueurs.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(batch.map(async (raw) => {
      const nomComplet = combineName(raw);
      if (!nomComplet) return;

      try {
        let enriched: Record<string,unknown> = {};

        if (needsEnrichment(raw)) {
          try {
            const llmResult = await base44.integrations.Core.InvokeLLM({
              prompt: `Fiche complète du joueur de football professionnel "${nomComplet}"${raw.club_actuel ? ` (club actuel: ${raw.club_actuel})` : ''}.
Retourne toutes les informations disponibles publiquement. Si tu ne trouves pas ce joueur exact, retourne {}.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: 'object',
                properties: {
                  nom:                    { type: 'string' },
                  age:                    { type: 'number' },
                  date_naissance:         { type: 'string' },
                  lieu_naissance:         { type: 'string' },
                  nationalite:            { type: 'string' },
                  nationalite_secondaire: { type: 'string' },
                  poste:                  { type: 'string' },
                  poste_secondaire:       { type: 'string' },
                  pied_fort:              { type: 'string' },
                  taille:                 { type: 'number' },
                  poids:                  { type: 'number' },
                  club_actuel:            { type: 'string' },
                  ligue:                  { type: 'string' },
                  pays_ligue:             { type: 'string' },
                  numero_maillot:         { type: 'number' },
                  contrat_fin:            { type: 'string' },
                  valeur_marchande:       { type: 'number' },
                  salaire:                { type: 'number' },
                  agent:                  { type: 'string' },
                  agence:                 { type: 'string' },
                  instagram:              { type: 'string' },
                  twitter:                { type: 'string' },
                  photo_url:              { type: 'string' },
                  stats_saison: {
                    type: 'object',
                    properties: {
                      matchs:            { type: 'number' },
                      buts:              { type: 'number' },
                      passes_decisives:  { type: 'number' },
                      minutes:           { type: 'number' },
                      note_sofascore:    { type: 'number' },
                      xg:                { type: 'number' },
                      cartons_jaunes:    { type: 'number' },
                      cartons_rouges:    { type: 'number' },
                    }
                  },
                }
              }
            });
            if (llmResult && Object.keys(llmResult).length > 0) enriched = llmResult;
          } catch (_) { /* enrichissement optionnel */ }
        }

        const s = (enriched as any)?.stats_saison;

        // Excel = base fiable ; LLM = complément pour les champs vides
        const pick = (enrichedVal: unknown, excelVal: unknown) =>
          (enrichedVal != null && enrichedVal !== '') ? enrichedVal : excelVal;

        const payload: Record<string,unknown> = {
          poste: normalizePoste(pick(enriched.poste, raw.poste)) || 'Attaquant',
        };

        // Champs texte
        const textFields = [
          ['club_actuel',            pick(enriched.club_actuel, raw.club_actuel)],
          ['ligue',                  pick(enriched.ligue, raw.ligue)],
          ['pays_ligue',             pick(enriched.pays_ligue, raw.pays_ligue)],
          ['pied_fort',              pick(enriched.pied_fort, raw.pied_fort)],
          ['lieu_naissance',         pick(enriched.lieu_naissance, raw.lieu_naissance)],
          ['email',                  pick(enriched.email, raw.email)],
          ['telephone',              pick(enriched.telephone, raw.telephone)],
          ['whatsapp',               raw.whatsapp],
          ['agent',                  pick(enriched.agent, raw.agent)],
          ['agent_email',            pick(enriched.agent_email, raw.agent_email)],
          ['agent_telephone',        pick(enriched.agent_telephone, raw.agent_telephone)],
          ['agence',                 pick(enriched.agence, raw.agence)],
          ['instagram',              pick(enriched.instagram, raw.instagram)],
          ['twitter',                pick(enriched.twitter, raw.twitter)],
          ['photo_url',              pick(enriched.photo_url, raw.photo_url)],
          ['poste_secondaire',       pick(enriched.poste_secondaire, raw.poste_secondaire)],
        ];
        textFields.forEach(([f, v]) => { if (v) payload[f] = String(v).trim(); });

        // Nationalités (avec normalisation)
        const nat = normalizeNationality(pick(enriched.nationalite, raw.nationalite));
        if (nat) payload.nationalite = nat;
        const nat2 = normalizeNationality(pick(enriched.nationalite_secondaire, raw.nationalite_secondaire));
        if (nat2) payload.nationalite_secondaire = nat2;

        // Champs numériques — LLM prioritaire, Excel en fallback
        const numFields: [string, unknown, unknown][] = [
          ['age',               enriched.age,            raw.age],
          ['taille',            enriched.taille,         raw.taille],
          ['poids',             enriched.poids,          raw.poids],
          ['valeur_marchande',  enriched.valeur_marchande, raw.valeur_marchande],
          ['salaire',           enriched.salaire,        raw.salaire],
          ['numero_maillot',    enriched.numero_maillot, raw.numero_maillot],
          ['matchs_joues',      s?.matchs,               raw.matchs_joues],
          ['buts',              s?.buts,                 raw.buts],
          ['passes_decisives',  s?.passes_decisives,     raw.passes_decisives],
          ['minutes_jouees',    s?.minutes,              raw.minutes_jouees],
          ['note_moyenne',      s?.note_sofascore,       raw.note_moyenne],
          ['xg',                s?.xg,                   raw.xg],
          ['cartons_jaunes',    s?.cartons_jaunes,       raw.cartons_jaunes],
          ['cartons_rouges',    s?.cartons_rouges,       raw.cartons_rouges],
        ];
        numFields.forEach(([f, llmVal, excelVal]) => {
          const v = normalizeNum(llmVal ?? excelVal);
          if (v != null) payload[f] = v;
        });

        // Dates
        ['date_naissance','contrat_fin'].forEach(f => {
          const v = normalizeDate((enriched as any)[f] || raw[f]);
          if (v) payload[f] = v;
        });

        // Auto-lier le club
        if (payload.club_actuel) {
          await upsertClub(String(payload.club_actuel), String(payload.pays_ligue || ''));
        }

        const key = normalizeForCompare(nomComplet);
        if (playerMap[key]) {
          await base44.asServiceRole.entities.Player.update(playerMap[key].id, payload);
          results.joueurs_mis_a_jour++;
          results.details.push({ type: 'Joueur', nom: nomComplet, action: 'mis à jour' });
        } else {
          await base44.asServiceRole.entities.Player.create({ nom: nomComplet, ...payload });
          results.joueurs_crees++;
          const action = Object.keys(enriched).length > 0 ? 'créé (enrichi IA)' : 'créé';
          results.details.push({ type: 'Joueur', nom: nomComplet, action });
        }
      } catch (err: any) {
        results.erreurs.push(`Joueur "${combineName(raw)}": ${err.message}`);
      }
    }));
  }

  // ── Contacts staff ────────────────────────────────────────────────────────────

  for (const raw of contacts) {
    const nom = combineName(raw);
    const club = String(raw.club || raw.club_actuel || '').trim();
    if (!nom || !club) continue;

    try {
      const payload: Record<string,unknown> = {};
      if (raw.pays)      payload.pays      = String(raw.pays).trim();
      if (raw.poste)     payload.poste     = String(raw.poste).trim();
      if (raw.email)     payload.email     = String(raw.email).trim();
      if (raw.telephone) payload.telephone = String(raw.telephone).trim();
      if (raw.whatsapp)  payload.whatsapp  = String(raw.whatsapp).trim();

      const linkedClub = await upsertClub(club, raw.pays ? String(raw.pays) : undefined);
      payload.club_id = linkedClub.id;

      const key = `${normalizeForCompare(nom)}|${normalizeForCompare(club)}`;
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

  // ── Log d'import ─────────────────────────────────────────────────────────────

  await base44.asServiceRole.entities.ImportLog.create({
    nom_fichier:        nomFichier,
    date_import:        new Date().toISOString(),
    total_lignes:       joueurs.length + clubs.length + contacts.length,
    joueurs_crees:      results.joueurs_crees,
    joueurs_mis_a_jour: results.joueurs_mis_a_jour,
    clubs_crees:        results.clubs_crees,
    clubs_mis_a_jour:   results.clubs_mis_a_jour,
    erreurs:            results.erreurs.length,
    details:            JSON.stringify(results.details),
    statut:             results.erreurs.length === 0 ? 'succès' : 'partiel',
    created_by:         user?.email || 'system',
  }).catch(() => {});

  return Response.json(results);
});
