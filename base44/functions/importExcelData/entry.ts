import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  const { data } = await req.json();
  const clubs      = data?.clubs     || [];
  const contacts   = data?.contacts  || [];
  const nomFichier = data?.nom_fichier || 'import';

  const results = {
    clubs_crees: 0,   clubs_mis_a_jour: 0,
    contacts_crees: 0, contacts_mis_a_jour: 0,
    erreurs: [], details: []
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────

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
    const s = String(val).replace(/\s/g,'').replace(',','.').replace(/[€$£]/g,'');
    const mM = s.match(/^([\d.]+)\s*[Mm]$/);
    if (mM) return parseFloat(mM[1]) * 1_000_000;
    const mK = s.match(/^([\d.]+)\s*[Kk]$/);
    if (mK) return parseFloat(mK[1]) * 1_000;
    const mB = s.match(/^([\d.]+)\s*[Bb]$/);
    if (mB) return parseFloat(mB[1]) * 1_000_000_000;
    const n = parseFloat(s.replace(/[^\d.]/g,''));
    return isNaN(n) ? null : n;
  };

  const normalizeForCompare = (s: string) =>
    (s || '').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();

  const combineName = (raw: Record<string,unknown>): string => {
    const prenom = raw.prenom ? String(raw.prenom).trim() : '';
    const nom    = raw.nom    ? String(raw.nom).trim()    : '';
    return [prenom, nom].filter(Boolean).join(' ') || nom;
  };

  // ── Chargement des données existantes ────────────────────────────────────────

  const [existingClubs, existingContacts] = await Promise.all([
    base44.asServiceRole.entities.Club.list(),
    base44.asServiceRole.entities.ClubContact.list(),
  ]);

  const clubMap: Record<string, any> = {};
  existingClubs.forEach((c: any) => {
    clubMap[normalizeForCompare(c.nom)] = c;
  });

  const contactMap: Record<string, any> = {};
  existingContacts.forEach((c: any) => {
    const key = `${normalizeForCompare(c.nom||'')}|${normalizeForCompare(c.club||'')}`;
    contactMap[key] = c;
  });

  // ── Upsert d'un club (crée si inexistant) ────────────────────────────────────

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

  // ── Traitement des clubs ──────────────────────────────────────────────────────

  for (const raw of clubs) {
    const nom = String(raw.nom || '').trim();
    if (!nom) continue;

    const key = normalizeForCompare(nom);
    const payload: Record<string,unknown> = {};

    const strFields = [
      'pays', 'ville', 'stade', 'ligue',
      'president', 'president_email', 'president_telephone',
      'entraineur', 'entraineur_email',
      'directeur_sportif', 'directeur_sportif_email', 'directeur_sportif_telephone',
      'email_general', 'telephone_general', 'site_web',
      'instagram', 'twitter', 'photo_url',
    ];
    strFields.forEach(f => {
      const v = raw[f];
      if (v != null && String(v).trim()) payload[f] = String(v).trim();
    });

    const numFields = ['budget_transfert','budget_annuel','capacite_stade','dette','valeur_effectif'];
    numFields.forEach(f => {
      const v = normalizeNum(raw[f]);
      if (v != null) payload[f] = v;
    });

    try {
      if (clubMap[key]) {
        await base44.asServiceRole.entities.Club.update(clubMap[key].id, payload);
        results.clubs_mis_a_jour++;
        results.details.push({ type: 'Club', nom, action: 'mis à jour' });
      } else {
        const created = await base44.asServiceRole.entities.Club.create({
          nom,
          pays: String(raw.pays || 'Inconnu').trim(),
          ...payload,
        });
        clubMap[key] = created;
        results.clubs_crees++;
        results.details.push({ type: 'Club', nom, action: 'créé' });
      }
    } catch (err: any) {
      results.erreurs.push(`Club "${nom}": ${err.message}`);
    }
  }

  // ── Traitement des contacts ───────────────────────────────────────────────────

  for (const raw of contacts) {
    const nom = combineName(raw) || String(raw.nom || '').trim();
    if (!nom) continue;

    const clubNom = String(raw.club || raw.club_actuel || raw.equipe || '').trim();

    try {
      const payload: Record<string,unknown> = {};

      const strFields = [
        'poste', 'pays', 'nationalite', 'email', 'telephone', 'whatsapp',
        'instagram', 'twitter', 'photo_url', 'agent', 'agence', 'lieu_naissance',
      ];
      strFields.forEach(f => {
        if (raw[f] != null && String(raw[f]).trim()) payload[f] = String(raw[f]).trim();
      });

      const numFields: [string, unknown][] = [
        ['valeur_marchande', raw.valeur_marchande],
        ['salaire', raw.salaire],
      ];
      numFields.forEach(([f, v]) => {
        const n = normalizeNum(v);
        if (n != null) payload[f] = n;
      });

      ['date_naissance', 'contrat_fin'].forEach(f => {
        const d = normalizeDate(raw[f]);
        if (d) payload[f] = d;
      });

      if (clubNom) {
        const linkedClub = await upsertClub(clubNom, raw.pays ? String(raw.pays) : undefined);
        payload.club_id = linkedClub.id;
        payload.club    = clubNom;
      }

      const key = `${normalizeForCompare(nom)}|${normalizeForCompare(clubNom)}`;
      const label = clubNom ? `${nom} (${clubNom})` : nom;

      if (contactMap[key]) {
        await base44.asServiceRole.entities.ClubContact.update(contactMap[key].id, payload);
        results.contacts_mis_a_jour++;
        results.details.push({ type: 'Contact', nom: label, action: 'mis à jour' });
      } else {
        await base44.asServiceRole.entities.ClubContact.create({ nom, club: clubNom || '', ...payload });
        results.contacts_crees++;
        results.details.push({ type: 'Contact', nom: label, action: 'créé' });
      }
    } catch (err: any) {
      results.erreurs.push(`Contact "${nom}": ${err.message}`);
    }
  }

  // ── Log d'import ─────────────────────────────────────────────────────────────

  await base44.asServiceRole.entities.ImportLog.create({
    nom_fichier:         nomFichier,
    date_import:         new Date().toISOString(),
    total_lignes:        clubs.length + contacts.length,
    clubs_crees:         results.clubs_crees,
    clubs_mis_a_jour:    results.clubs_mis_a_jour,
    contacts_crees:      results.contacts_crees,
    contacts_mis_a_jour: results.contacts_mis_a_jour,
    erreurs:             results.erreurs.length,
    details:             JSON.stringify(results.details),
    statut:              results.erreurs.length === 0 ? 'succès' : 'partiel',
    created_by:          user?.email || 'system',
  }).catch(() => {});

  return Response.json(results);
});
