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
  if (!value) return "";
  return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`;
}

export function exportPlayerPDF(player, playerNote) {
  const avg = ratingAvg(player);
  const today = new Date().toLocaleDateString("fr-FR");

  const photoSection = player.photo_url
    ? `<img class="player-photo" src="${player.photo_url}" alt="${player.nom}" crossorigin="anonymous" />`
    : `<div class="player-photo-placeholder">👤</div>`;

  const noteSection = playerNote?.note
    ? `<div class="section">
        <h3 class="section-title">Notes & Observations</h3>
        <div class="note-box">${playerNote.note.replace(/\n/g, "<br>")}</div>
        <div class="note-meta">
          ${playerNote.evaluation ? `<span class="note-badge">Évaluation : <strong>${playerNote.evaluation}/10</strong></span>` : ""}
          ${playerNote.interet ? `<span class="note-badge">Intérêt : <strong>${playerNote.interet}</strong></span>` : ""}
          ${playerNote.date_observation ? `<span class="note-badge">Observé le ${new Date(playerNote.date_observation).toLocaleDateString("fr-FR")}</span>` : ""}
        </div>
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

  const infoSection = `
    <div class="section">
      <h3 class="section-title">Informations</h3>
      <div class="info-grid">
        ${infoRow("Poste", player.poste)}
        ${infoRow("Âge", player.age ? `${player.age} ans` : null)}
        ${infoRow("Nationalité", player.nationalite)}
        ${infoRow("Club", player.club_actuel)}
        ${infoRow("Pied fort", player.pied_fort)}
        ${infoRow("Taille", player.taille ? `${player.taille} cm` : null)}
        ${infoRow("Valeur marchande", player.valeur_marchande ? `${player.valeur_marchande} M€` : null)}
        ${infoRow("Fin de contrat", player.contrat_fin ? new Date(player.contrat_fin).toLocaleDateString("fr-FR") : null)}
        ${infoRow("Agent", player.agent_nom)}
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
  ${ratingsSection}
  ${noteSection}
  ${statsSection}

  <div class="footer">Rapport généré automatiquement — Global Sports Agency</div>

  <script>
    window.onload = function() {
      // Delay slightly so image can load before print dialog
      setTimeout(function() { window.print(); }, 600);
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
