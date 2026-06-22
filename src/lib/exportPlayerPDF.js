const CATEGORIES = [
  { key: "note_technique",    label: "Technique",                  color: "#3b82f6" },
  { key: "note_physique",     label: "Physique",                   color: "#22c55e" },
  { key: "note_intelligence", label: "Intelligence de jeu",        color: "#a855f7" },
  { key: "note_mental",       label: "Mental / Caractère",         color: "#f97316" },
  { key: "note_attitude",     label: "Attitude & Esprit d'équipe", color: "#ec4899" },
];

function ratingAvg(player) {
  const vals = CATEGORIES.map(c => player[c.key]).filter(v => v != null && v > 0);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function ratingBars(player) {
  return CATEGORIES.map(cat => {
    const val = player[cat.key] || 0;
    const pct = (val / 10) * 100;
    return `
      <div class="rating-row">
        <div class="rating-label">${cat.label}</div>
        <div class="rating-bar-wrap">
          <div class="rating-bar-fill" style="width:${pct}%;background:${cat.color}"></div>
        </div>
        <div class="rating-score">${val > 0 ? `${val}/10` : "—"}</div>
      </div>`;
  }).join("");
}

function infoRow(label, value) {
  if (value == null || value === "") return "";
  return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`;
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : null);

// Statistiques de performance (FotMob), groupées comme le panneau de la fiche.
// [clé, libellé, suffixe?]. N'affiche que les valeurs renseignées.
const STAT_GROUPS = [
  { title: "Synthèse", items: [
    ["matchs_joues", "Matchs"], ["titularisations", "Titularisations"], ["minutes_jouees", "Minutes", "'"], ["note_moyenne", "Note moy."],
  ]},
  { title: "Tirs & Buts", items: [
    ["buts", "Buts"], ["xg", "xG"], ["xgot", "xGOT"], ["xg_hors_penalty", "xG hors péno"], ["tirs", "Tirs"], ["tirs_cadres", "Tirs cadrés"], ["penaltys_marques", "Pénaltys"],
  ]},
  { title: "Passes", items: [
    ["passes_decisives", "Passes déc."], ["xa", "xA"], ["passes_reussies", "Passes réussies"], ["passes_reussies_pct", "% passes", "%"],
    ["passes_longues", "Passes longues"], ["passes_longues_pct", "% longues", "%"], ["passes_cles", "Passes clés"],
    ["grandes_chances", "Grandes occasions"], ["centres", "Centres"], ["centres_reussis_pct", "% centres", "%"],
  ]},
  { title: "Possession & Duels", items: [
    ["duels_gagnes", "Duels gagnés"], ["duels_gagnes_pct", "% duels", "%"], ["duels_aeriens_pct", "% aériens", "%"], ["dribbles_reussis", "Dribbles réussis"],
    ["touches_balle", "Touches"], ["touches_surface_adverse", "Touches surf. adv."], ["pertes_balle", "Pertes"], ["fautes_subies", "Fautes subies"],
  ]},
  { title: "Défense", items: [
    ["actions_defensives", "Actions déf."], ["interceptions", "Interceptions"], ["tacles", "Tacles"], ["recuperations", "Récupérations"],
    ["dribbles_subis", "Dribbles subis"], ["degagements", "Dégagements"], ["buts_encaisses_terrain", "Buts enc. (terrain)"], ["xg_concede_terrain", "xG concédé"],
  ]},
  { title: "Discipline", items: [
    ["cartons_jaunes", "Cartons jaunes"], ["cartons_rouges", "Cartons rouges"], ["fautes_commises", "Fautes commises"], ["hors_jeu", "Hors-jeu"],
  ]},
  { title: "Gardien", items: [
    ["arrets", "Arrêts"], ["arrets_pct", "% arrêts", "%"], ["buts_encaisses", "Buts encaissés"], ["clean_sheets", "Clean sheets"], ["sorties_reussies", "Sorties réussies"],
  ]},
];

function statsGroupsHtml(player) {
  return STAT_GROUPS.map((g) => {
    const cells = g.items
      .filter(([k]) => player[k] != null && player[k] !== "")
      .map(([k, label, suffix]) => `<div class="stat-card"><div class="stat-num">${player[k]}${suffix || ""}</div><div class="stat-lbl">${label}</div></div>`)
      .join("");
    if (!cells) return "";
    return `<div class="stat-group"><div class="stat-group-title">${g.title}</div><div class="stats-grid">${cells}</div></div>`;
  }).join("");
}

export function exportPlayerPDF(player, notes) {
  const avg = ratingAvg(player);
  const today = new Date().toLocaleDateString("fr-FR");
  const noteList = Array.isArray(notes) ? notes.filter((n) => n?.note) : (notes?.note ? [notes] : []);

  const photoSection = player.photo_url
    ? `<img class="player-photo" src="${player.photo_url}" alt="${player.nom}" referrerpolicy="no-referrer" />`
    : `<div class="player-photo-placeholder">👤</div>`;

  const noteSection = noteList.length
    ? `<div class="section">
        <h3 class="section-title">Notes & Observations</h3>
        ${noteList.map((n) => `
          <div class="note-box">${n.note.replace(/\n/g, "<br>")}</div>
          <div class="note-meta">
            ${n.evaluation ? `<span class="note-badge">Évaluation : <strong>${n.evaluation}/10</strong></span>` : ""}
            ${n.interet ? `<span class="note-badge">Intérêt : <strong>${n.interet}</strong></span>` : ""}
            ${n.date_observation ? `<span class="note-badge">Observé le ${fmtDate(n.date_observation)}</span>` : ""}
          </div>`).join("")}
      </div>`
    : "";

  const statsHtml = statsGroupsHtml(player);
  const statsPerf = statsHtml
    ? `<div class="section">
        <h3 class="section-title">Statistiques (FotMob)${player.ligue ? ` <span class="avg-badge">${player.ligue}</span>` : ""}</h3>
        ${statsHtml}
      </div>`
    : "";

  const hasRatings = CATEGORIES.some(c => player[c.key] > 0);
  const ratingsSection = hasRatings
    ? `<div class="section">
        <h3 class="section-title">Notes Scout${avg ? ` <span class="avg-badge">Moy. ${avg}/10</span>` : ""}</h3>
        <div class="ratings">${ratingBars(player)}</div>
      </div>`
    : "";

  const statsSection = (player.stats_resume || player.style_jeu || player.forces || player.faiblesses)
    ? `<div class="section">
        <h3 class="section-title">Profil Scout</h3>
        ${player.style_jeu ? `<div class="profile-block"><span class="profile-label">Style de jeu</span><p>${player.style_jeu}</p></div>` : ""}
        ${player.forces ? `<div class="profile-block"><span class="profile-label">Points forts</span><p>${player.forces}</p></div>` : ""}
        ${player.faiblesses ? `<div class="profile-block"><span class="profile-label">Points faibles</span><p>${player.faiblesses}</p></div>` : ""}
        ${player.stats_resume ? `<div class="profile-block"><span class="profile-label">Statistiques</span><p>${player.stats_resume}</p></div>` : ""}
      </div>`
    : "";

  const ageVal = player.age ?? (player.date_naissance
    ? Math.floor((Date.now() - new Date(player.date_naissance).getTime()) / 31557600000)
    : null);

  const infoSection = `
    <div class="section">
      <h3 class="section-title">Informations</h3>
      <div class="info-grid">
        ${infoRow("Poste", player.poste)}
        ${infoRow("Poste secondaire", player.poste_secondaire)}
        ${infoRow("Âge", ageVal != null ? `${ageVal} ans` : null)}
        ${infoRow("Date de naissance", fmtDate(player.date_naissance))}
        ${infoRow("Lieu de naissance", player.lieu_naissance)}
        ${infoRow("Nationalité", player.nationalite)}
        ${infoRow("2e nationalité", player.nationalite_secondaire)}
        ${infoRow("Club", player.club_actuel)}
        ${infoRow("Ligue", player.ligue)}
        ${infoRow("N° maillot", player.numero_maillot)}
        ${infoRow("Pied fort", player.pied_fort)}
        ${infoRow("Taille", player.taille ? `${player.taille} cm` : null)}
        ${infoRow("Poids", player.poids ? `${player.poids} kg` : null)}
        ${infoRow("Sexe", player.sexe)}
      </div>
    </div>
    <div class="section">
      <h3 class="section-title">Contrat</h3>
      <div class="info-grid">
        ${infoRow("Valeur marchande", player.valeur_marchande ? `${player.valeur_marchande} M€` : null)}
        ${infoRow("Salaire annuel", player.salaire ? `${player.salaire} M€` : null)}
        ${infoRow("Arrivée au club", fmtDate(player.date_arrivee_club))}
        ${infoRow("Fin de contrat", fmtDate(player.contrat_fin))}
        ${infoRow("Option de contrat", player.option_contrat)}
        ${infoRow("En prêt", player.en_pret ? (player.club_proprietaire ? `Oui — propriété de ${player.club_proprietaire}` : "Oui") : null)}
        ${infoRow("Fin du prêt", fmtDate(player.pret_fin))}
        ${infoRow("Agent", player.agent)}
        ${infoRow("Agence", player.agence)}
        ${infoRow("Contact agent", player.agent_email || player.agent_telephone)}
      </div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Rapport Scout — ${player.nom}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #fff;
    padding: 32px 40px;
    max-width: 800px;
    margin: auto;
  }
  /* Header */
  .header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-bottom: 20px;
    border-bottom: 3px solid #2563eb;
    margin-bottom: 24px;
  }
  .player-photo {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #2563eb;
    flex-shrink: 0;
  }
  .player-photo-placeholder {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    flex-shrink: 0;
  }
  .header-info h1 { font-size: 26px; font-weight: 700; color: #1e293b; }
  .header-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: #dbeafe;
    color: #1d4ed8;
  }
  .badge.green { background: #dcfce7; color: #15803d; }
  .badge.gray { background: #f1f5f9; color: #475569; }
  .report-date { margin-left: auto; font-size: 11px; color: #94a3b8; align-self: flex-end; }
  /* Sections */
  .section { margin-bottom: 22px; }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #2563eb;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .avg-badge {
    font-size: 12px;
    font-weight: 700;
    background: #2563eb;
    color: #fff;
    padding: 1px 8px;
    border-radius: 999px;
    text-transform: none;
    letter-spacing: normal;
  }
  /* Info grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .info-row { display: flex; gap: 8px; font-size: 12px; }
  .info-label { color: #64748b; min-width: 110px; flex-shrink: 0; }
  .info-value { font-weight: 600; }
  /* Stats grid */
  .stat-group { margin-bottom: 12px; }
  .stat-group:last-child { margin-bottom: 0; }
  .stat-group-title { font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; }
  .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .stat-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 6px;
    text-align: center;
  }
  .stat-num { font-size: 17px; font-weight: 800; color: #2563eb; line-height: 1.1; }
  .stat-lbl { font-size: 9px; color: #64748b; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.02em; }
  /* Ratings */
  .ratings { display: flex; flex-direction: column; gap: 10px; }
  .rating-row { display: flex; align-items: center; gap: 10px; }
  .rating-label { font-size: 12px; color: #475569; min-width: 160px; flex-shrink: 0; }
  .rating-bar-wrap {
    flex: 1;
    height: 10px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
  }
  .rating-bar-fill { height: 100%; border-radius: 999px; transition: none; }
  .rating-score { font-size: 12px; font-weight: 700; color: #1e293b; min-width: 36px; text-align: right; }
  /* Note */
  .note-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
    line-height: 1.6;
    margin-bottom: 8px;
  }
  .note-meta { display: flex; flex-wrap: wrap; gap: 6px; }
  .note-badge {
    font-size: 11px;
    background: #f1f5f9;
    color: #475569;
    padding: 2px 8px;
    border-radius: 999px;
  }
  /* Profile */
  .profile-block { margin-bottom: 10px; }
  .profile-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    display: block;
    margin-bottom: 3px;
  }
  .profile-block p { line-height: 1.5; }
  /* Footer */
  .footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
  }
  @media print {
    body { padding: 20px; }
    @page { margin: 1cm; }
  }
</style>
</head>
<body>
  <div class="header">
    ${photoSection}
    <div class="header-info">
      <h1>${player.nom}</h1>
      <div class="header-badges">
        ${player.poste ? `<span class="badge">${player.poste}</span>` : ""}
        ${player.club_actuel ? `<span class="badge green">${player.club_actuel}</span>` : ""}
        ${player.nationalite ? `<span class="badge gray">${player.nationalite}</span>` : ""}
        ${player.age ? `<span class="badge gray">${player.age} ans</span>` : ""}
      </div>
    </div>
    <div class="report-date">Rapport du ${today}</div>
  </div>

  ${infoSection}
  ${statsPerf}
  ${ratingsSection}
  ${noteSection}
  ${statsSection}

  <div class="footer">Rapport généré automatiquement — Football Data Management</div>

  <script>
    window.onload = function() {
      // Attend que la photo soit chargée avant d'imprimer (sinon elle manque).
      var img = document.querySelector('.player-photo');
      var done = false;
      function go() { if (done) return; done = true; setTimeout(function() { window.print(); }, 300); }
      if (img && !img.complete) {
        img.addEventListener('load', go);
        img.addEventListener('error', go);
        setTimeout(go, 3000); // sécurité si l'image ne répond pas
      } else {
        go();
      }
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Veuillez autoriser les pop-ups pour exporter en PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
