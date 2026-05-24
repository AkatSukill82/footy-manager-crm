import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await req.json();
  const joueurs = data?.joueurs || [];
  const clubs = data?.clubs || [];
  const nomFichier = data?.nom_fichier || "import";

  const results = {
    joueurs_crees: 0,
    joueurs_mis_a_jour: 0,
    clubs_crees: 0,
    clubs_mis_a_jour: 0,
    erreurs: [],
    details: []
  };

  // Normalize poste value to match enum
  const POSTES_VALIDES = [
    "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
    "Milieu défensif", "Milieu central", "Milieu offensif",
    "Ailier droit", "Ailier gauche", "Attaquant"
  ];
  const POSTES_MAP = {
    "gk": "Gardien", "goalkeeper": "Gardien", "gardien": "Gardien", "gb": "Gardien",
    "cb": "Défenseur central", "dc": "Défenseur central", "defenseeur central": "Défenseur central",
    "rb": "Latéral droit", "lateral droit": "Latéral droit", "ld": "Latéral droit",
    "lb": "Latéral gauche", "lateral gauche": "Latéral gauche", "lg": "Latéral gauche",
    "dm": "Milieu défensif", "milieu defensif": "Milieu défensif", "mdp": "Milieu défensif",
    "cm": "Milieu central", "milieu central": "Milieu central", "mc": "Milieu central",
    "am": "Milieu offensif", "milieu offensif": "Milieu offensif", "mo": "Milieu offensif",
    "rw": "Ailier droit", "ailier droit": "Ailier droit", "ad": "Ailier droit",
    "lw": "Ailier gauche", "ailier gauche": "Ailier gauche", "ag": "Ailier gauche",
    "st": "Attaquant", "cf": "Attaquant", "fw": "Attaquant", "attaquant": "Attaquant", "avant-centre": "Attaquant"
  };

  const normalizePoste = (val) => {
    if (!val) return null;
    const s = String(val).trim();
    if (POSTES_VALIDES.includes(s)) return s;
    const lower = s.toLowerCase();
    return POSTES_MAP[lower] || null;
  };

  const normalizeDate = (val) => {
    if (!val) return null;
    const s = String(val).trim();
    // Try ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Try DD/MM/YYYY
    const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    // Try YYYY
    if (/^\d{4}$/.test(s)) return `${s}-06-30`;
    return null;
  };

  const normalizeNum = (val) => {
    if (val == null || val === "") return null;
    const n = parseFloat(String(val).replace(",", "."));
    return isNaN(n) ? null : n;
  };

  // Fetch existing data for dedup
  const existingPlayers = await base44.asServiceRole.entities.Player.list();
  const existingClubs = await base44.asServiceRole.entities.Club.list();

  const playerMap = {};
  existingPlayers.forEach(p => { playerMap[p.nom.toLowerCase().trim()] = p; });

  const clubMap = {};
  existingClubs.forEach(c => { clubMap[c.nom.toLowerCase().trim()] = c; });

  // --- Process clubs ---
  for (const raw of clubs) {
    const nom = raw.nom?.trim();
    if (!nom) continue;

    const payload = {};
    const fields = [
      "pays","ville","stade","president","president_email","president_telephone",
      "entraineur","entraineur_email","directeur_sportif","directeur_sportif_email",
      "directeur_sportif_telephone","email_general","telephone_general","site_web"
    ];
    fields.forEach(f => { if (raw[f]) payload[f] = String(raw[f]).trim(); });
    ["budget_transfert","budget_annuel","capacite_stade","dette","valeur_effectif"].forEach(f => {
      const v = normalizeNum(raw[f]);
      if (v != null) payload[f] = v;
    });

    const existing = clubMap[nom.toLowerCase()];
    if (existing) {
      await base44.asServiceRole.entities.Club.update(existing.id, payload);
      results.clubs_mis_a_jour++;
      results.details.push({ type: "Club", nom, action: "mis à jour" });
    } else {
      await base44.asServiceRole.entities.Club.create({ nom, pays: raw.pays || "Inconnu", ...payload });
      results.clubs_crees++;
      results.details.push({ type: "Club", nom, action: "créé" });
    }
  }

  // --- Process players ---
  for (const raw of joueurs) {
    const nomComplet = [raw.prenom, raw.nom].filter(Boolean).map(s => s.trim()).join(" ") || raw.nom?.trim();
    if (!nomComplet) continue;

    const poste = normalizePoste(raw.poste) || "Attaquant";

    const payload = { poste };

    // String fields
    const strFields = [
      "club_actuel","nationalite","nationalite_secondaire","email","telephone","whatsapp",
      "instagram","twitter","linkedin","agent","agent_email","agent_telephone","agence",
      "ligue","pays_ligue","stade","pied_fort","ville_residence","pays_residence","adresse",
      "style_jeu","forces","faiblesses","palmares","distinctions","stats_resume"
    ];
    strFields.forEach(f => { if (raw[f]) payload[f] = String(raw[f]).trim(); });

    // Number fields
    const numFields = [
      "age","taille","poids","valeur_marchande","salaire","salaire_semaine",
      "buts","passes_decisives","matchs_joues","minutes_jouees","note_moyenne",
      "xg","xa","cartons_jaunes","cartons_rouges","numero_maillot","note_globale_scout"
    ];
    numFields.forEach(f => {
      const v = normalizeNum(raw[f]);
      if (v != null) payload[f] = v;
    });

    // Date fields
    ["date_naissance","contrat_fin"].forEach(f => {
      const v = normalizeDate(raw[f]);
      if (v) payload[f] = v;
    });

    const existing = playerMap[nomComplet.toLowerCase()];
    if (existing) {
      await base44.asServiceRole.entities.Player.update(existing.id, payload);
      results.joueurs_mis_a_jour++;
      results.details.push({ type: "Joueur", nom: nomComplet, action: "mis à jour" });
    } else {
      await base44.asServiceRole.entities.Player.create({ nom: nomComplet, ...payload });
      results.joueurs_crees++;
      results.details.push({ type: "Joueur", nom: nomComplet, action: "créé" });
    }
  }

  // Save log
  await base44.asServiceRole.entities.ImportLog.create({
    nom_fichier: nomFichier,
    date_import: new Date().toISOString(),
    total_lignes: joueurs.length + clubs.length,
    joueurs_crees: results.joueurs_crees,
    joueurs_mis_a_jour: results.joueurs_mis_a_jour,
    clubs_crees: results.clubs_crees,
    clubs_mis_a_jour: results.clubs_mis_a_jour,
    erreurs: results.erreurs.length,
    details: JSON.stringify(results.details),
    statut: results.erreurs.length === 0 ? "succès" : "partiel"
  });

  return Response.json(results);
});