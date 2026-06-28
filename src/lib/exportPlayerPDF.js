// Export PDF d'une fiche joueur — multilingue (fr / en / es).
const L = {
  fr: {
    cat: { technique: "Technique", physique: "Physique", intelligence: "Intelligence de jeu", mental: "Mental / Caractère", attitude: "Attitude & Esprit d'équipe" },
    groups: { synthese: "Synthèse", tirs: "Tirs & Buts", passes: "Passes", possession: "Possession & Duels", defense: "Défense", discipline: "Discipline", gardien: "Gardien" },
    stat: { matchs_joues: "Matchs", titularisations: "Titularisations", minutes_jouees: "Minutes", note_moyenne: "Note moy.", buts: "Buts", xg: "xG", xgot: "xGOT", xg_hors_penalty: "xG hors péno", tirs: "Tirs", tirs_cadres: "Tirs cadrés", penaltys_marques: "Pénaltys", passes_decisives: "Passes déc.", xa: "xA", passes_reussies: "Passes réussies", passes_reussies_pct: "% passes", passes_longues: "Passes longues", passes_longues_pct: "% longues", passes_cles: "Passes clés", grandes_chances: "Grandes occasions", centres: "Centres", centres_reussis_pct: "% centres", duels_gagnes: "Duels gagnés", duels_gagnes_pct: "% duels", duels_aeriens_pct: "% aériens", dribbles_reussis: "Dribbles réussis", touches_balle: "Touches", touches_surface_adverse: "Touches surf. adv.", pertes_balle: "Pertes", fautes_subies: "Fautes subies", actions_defensives: "Actions déf.", interceptions: "Interceptions", tacles: "Tacles", recuperations: "Récupérations", dribbles_subis: "Dribbles subis", degagements: "Dégagements", buts_encaisses_terrain: "Buts enc. (terrain)", xg_concede_terrain: "xG concédé", cartons_jaunes: "Cartons jaunes", cartons_rouges: "Cartons rouges", fautes_commises: "Fautes commises", hors_jeu: "Hors-jeu", arrets: "Arrêts", arrets_pct: "% arrêts", buts_encaisses: "Buts encaissés", clean_sheets: "Clean sheets", sorties_reussies: "Sorties réussies" },
    info: { poste: "Poste", poste_secondaire: "Poste secondaire", age: "Âge", ddn: "Date de naissance", lieu: "Lieu de naissance", nat: "Nationalité", nat2: "2e nationalité", club: "Club", ligue: "Ligue", maillot: "N° maillot", pied: "Pied fort", taille: "Taille", poids: "Poids", sexe: "Sexe" },
    contract: { vm: "Valeur marchande", salaire: "Salaire annuel", arrivee: "Arrivée au club", fin: "Fin de contrat", option: "Option de contrat", pret: "En prêt", finpret: "Fin du prêt", agent: "Agent", agence: "Agence", contact: "Contact agent" },
    sec: { info: "Informations", contrat: "Contrat", stats: "Statistiques (FotMob)", scout: "Notes Scout", notes: "Notes & Observations", profil: "Profil Scout" },
    ui: { reportTitle: "Rapport Scout", reportDate: "Rapport du", ans: "ans", avg: "Moy.", eval: "Évaluation", interet: "Intérêt", observe: "Observé le", style: "Style de jeu", forces: "Points forts", faiblesses: "Points faibles", statsResume: "Statistiques", footer: "Rapport généré automatiquement — Football Data Management", oui: "Oui", ouiProp: "Oui — propriété de", popups: "Veuillez autoriser les pop-ups pour exporter en PDF." },
  },
  en: {
    cat: { technique: "Technical", physique: "Physical", intelligence: "Game intelligence", mental: "Mental / Character", attitude: "Attitude & Team spirit" },
    groups: { synthese: "Summary", tirs: "Shots & Goals", passes: "Passing", possession: "Possession & Duels", defense: "Defense", discipline: "Discipline", gardien: "Goalkeeping" },
    stat: { matchs_joues: "Apps", titularisations: "Starts", minutes_jouees: "Minutes", note_moyenne: "Avg. rating", buts: "Goals", xg: "xG", xgot: "xGOT", xg_hors_penalty: "Non-pen xG", tirs: "Shots", tirs_cadres: "Shots on target", penaltys_marques: "Penalties", passes_decisives: "Assists", xa: "xA", passes_reussies: "Acc. passes", passes_reussies_pct: "% passes", passes_longues: "Long passes", passes_longues_pct: "% long", passes_cles: "Key passes", grandes_chances: "Big chances", centres: "Crosses", centres_reussis_pct: "% crosses", duels_gagnes: "Duels won", duels_gagnes_pct: "% duels", duels_aeriens_pct: "% aerial", dribbles_reussis: "Succ. dribbles", touches_balle: "Touches", touches_surface_adverse: "Touches opp. box", pertes_balle: "Poss. lost", fautes_subies: "Fouls won", actions_defensives: "Def. actions", interceptions: "Interceptions", tacles: "Tackles", recuperations: "Recoveries", dribbles_subis: "Dribbled past", degagements: "Clearances", buts_encaisses_terrain: "Goals conceded", xg_concede_terrain: "xG conceded", cartons_jaunes: "Yellow cards", cartons_rouges: "Red cards", fautes_commises: "Fouls", hors_jeu: "Offsides", arrets: "Saves", arrets_pct: "% saves", buts_encaisses: "Goals conceded", clean_sheets: "Clean sheets", sorties_reussies: "Succ. claims" },
    info: { poste: "Position", poste_secondaire: "Secondary position", age: "Age", ddn: "Date of birth", lieu: "Place of birth", nat: "Nationality", nat2: "2nd nationality", club: "Club", ligue: "League", maillot: "Shirt no.", pied: "Strong foot", taille: "Height", poids: "Weight", sexe: "Sex" },
    contract: { vm: "Market value", salaire: "Annual salary", arrivee: "Joined club", fin: "Contract end", option: "Contract option", pret: "On loan", finpret: "Loan end", agent: "Agent", agence: "Agency", contact: "Agent contact" },
    sec: { info: "Information", contrat: "Contract", stats: "Statistics (FotMob)", scout: "Scout ratings", notes: "Notes & Observations", profil: "Scout profile" },
    ui: { reportTitle: "Scout Report", reportDate: "Report of", ans: "yrs", avg: "Avg.", eval: "Rating", interet: "Interest", observe: "Observed on", style: "Playing style", forces: "Strengths", faiblesses: "Weaknesses", statsResume: "Statistics", footer: "Automatically generated report — Football Data Management", oui: "Yes", ouiProp: "Yes — owned by", popups: "Please allow pop-ups to export to PDF." },
  },
  es: {
    cat: { technique: "Técnica", physique: "Físico", intelligence: "Inteligencia de juego", mental: "Mental / Carácter", attitude: "Actitud y espíritu de equipo" },
    groups: { synthese: "Resumen", tirs: "Tiros y Goles", passes: "Pases", possession: "Posesión y Duelos", defense: "Defensa", discipline: "Disciplina", gardien: "Portería" },
    stat: { matchs_joues: "Partidos", titularisations: "Titularidades", minutes_jouees: "Minutos", note_moyenne: "Nota media", buts: "Goles", xg: "xG", xgot: "xGOT", xg_hors_penalty: "xG sin penalti", tirs: "Tiros", tirs_cadres: "Tiros a puerta", penaltys_marques: "Penaltis", passes_decisives: "Asistencias", xa: "xA", passes_reussies: "Pases compl.", passes_reussies_pct: "% pases", passes_longues: "Pases largos", passes_longues_pct: "% largos", passes_cles: "Pases clave", grandes_chances: "Ocasiones claras", centres: "Centros", centres_reussis_pct: "% centros", duels_gagnes: "Duelos ganados", duels_gagnes_pct: "% duelos", duels_aeriens_pct: "% aéreos", dribbles_reussis: "Regates compl.", touches_balle: "Toques", touches_surface_adverse: "Toques área riv.", pertes_balle: "Pérdidas", fautes_subies: "Faltas recibidas", actions_defensives: "Acc. defensivas", interceptions: "Intercepciones", tacles: "Entradas", recuperations: "Recuperaciones", dribbles_subis: "Regateado", degagements: "Despejes", buts_encaisses_terrain: "Goles encajados", xg_concede_terrain: "xG concedido", cartons_jaunes: "Tarjetas amar.", cartons_rouges: "Tarjetas rojas", fautes_commises: "Faltas", hors_jeu: "Fueras de juego", arrets: "Paradas", arrets_pct: "% paradas", buts_encaisses: "Goles encajados", clean_sheets: "Porterías a cero", sorties_reussies: "Salidas compl." },
    info: { poste: "Posición", poste_secondaire: "Posición secundaria", age: "Edad", ddn: "Fecha de nacimiento", lieu: "Lugar de nacimiento", nat: "Nacionalidad", nat2: "2ª nacionalidad", club: "Club", ligue: "Liga", maillot: "Dorsal", pied: "Pie hábil", taille: "Altura", poids: "Peso", sexe: "Sexo" },
    contract: { vm: "Valor de mercado", salaire: "Salario anual", arrivee: "Llegada al club", fin: "Fin de contrato", option: "Opción de contrato", pret: "Cedido", finpret: "Fin de cesión", agent: "Agente", agence: "Agencia", contact: "Contacto agente" },
    sec: { info: "Información", contrat: "Contrato", stats: "Estadísticas (FotMob)", scout: "Notas Scout", notes: "Notas y Observaciones", profil: "Perfil Scout" },
    ui: { reportTitle: "Informe Scout", reportDate: "Informe del", ans: "años", avg: "Prom.", eval: "Evaluación", interet: "Interés", observe: "Observado el", style: "Estilo de juego", forces: "Puntos fuertes", faiblesses: "Puntos débiles", statsResume: "Estadísticas", footer: "Informe generado automáticamente — Football Data Management", oui: "Sí", ouiProp: "Sí — propiedad de", popups: "Por favor, permita las ventanas emergentes para exportar a PDF." },
  },
};
const LOCALE = { fr: "fr-FR", en: "en-GB", es: "es-ES" };

const CAT_KEYS = [
  { key: "note_technique", lk: "technique", color: "#3b82f6" },
  { key: "note_physique", lk: "physique", color: "#22c55e" },
  { key: "note_intelligence", lk: "intelligence", color: "#a855f7" },
  { key: "note_mental", lk: "mental", color: "#f97316" },
  { key: "note_attitude", lk: "attitude", color: "#ec4899" },
];

const STAT_GROUPS = [
  { gk: "synthese", items: [["matchs_joues"], ["titularisations"], ["minutes_jouees", "'"], ["note_moyenne"]] },
  { gk: "tirs", items: [["buts"], ["xg"], ["xgot"], ["xg_hors_penalty"], ["tirs"], ["tirs_cadres"], ["penaltys_marques"]] },
  { gk: "passes", items: [["passes_decisives"], ["xa"], ["passes_reussies"], ["passes_reussies_pct", "%"], ["passes_longues"], ["passes_longues_pct", "%"], ["passes_cles"], ["grandes_chances"], ["centres"], ["centres_reussis_pct", "%"]] },
  { gk: "possession", items: [["duels_gagnes"], ["duels_gagnes_pct", "%"], ["duels_aeriens_pct", "%"], ["dribbles_reussis"], ["touches_balle"], ["touches_surface_adverse"], ["pertes_balle"], ["fautes_subies"]] },
  { gk: "defense", items: [["actions_defensives"], ["interceptions"], ["tacles"], ["recuperations"], ["dribbles_subis"], ["degagements"], ["buts_encaisses_terrain"], ["xg_concede_terrain"]] },
  { gk: "discipline", items: [["cartons_jaunes"], ["cartons_rouges"], ["fautes_commises"], ["hors_jeu"]] },
  { gk: "gardien", items: [["arrets"], ["arrets_pct", "%"], ["buts_encaisses"], ["clean_sheets"], ["sorties_reussies"]] },
];

function ratingAvg(player) {
  const vals = CAT_KEYS.map((c) => player[c.key]).filter((v) => v != null && v > 0);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

export function exportPlayerPDF(player, notes, lang = "fr") {
  const D = L[lang] || L.fr;
  const loc = LOCALE[lang] || LOCALE.fr;
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(loc) : null);
  const today = new Date().toLocaleDateString(loc);
  const avg = ratingAvg(player);
  const noteList = Array.isArray(notes) ? notes.filter((n) => n?.note) : (notes?.note ? [notes] : []);

  const infoRow = (label, value) => (value == null || value === "")
    ? "" : `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`;

  const ratingBars = () => CAT_KEYS.map((cat) => {
    const val = player[cat.key] || 0;
    return `<div class="rating-row"><div class="rating-label">${D.cat[cat.lk]}</div><div class="rating-bar-wrap"><div class="rating-bar-fill" style="width:${(val / 10) * 100}%;background:${cat.color}"></div></div><div class="rating-score">${val > 0 ? `${val}/10` : "—"}</div></div>`;
  }).join("");

  const statsGroupsHtml = () => STAT_GROUPS.map((g) => {
    const cells = g.items
      .filter(([k]) => player[k] != null && player[k] !== "")
      .map(([k, suffix]) => `<div class="stat-card"><div class="stat-num">${player[k]}${suffix || ""}</div><div class="stat-lbl">${D.stat[k]}</div></div>`)
      .join("");
    return cells ? `<div class="stat-group"><div class="stat-group-title">${D.groups[g.gk]}</div><div class="stats-grid">${cells}</div></div>` : "";
  }).join("");

  const photoSection = player.photo_url
    ? `<img class="player-photo" src="${player.photo_url}" alt="${player.nom}" referrerpolicy="no-referrer" />`
    : `<div class="player-photo-placeholder">👤</div>`;

  const noteSection = noteList.length
    ? `<div class="section"><h3 class="section-title">${D.sec.notes}</h3>${noteList.map((n) => `<div class="note-box">${n.note.replace(/\n/g, "<br>")}</div><div class="note-meta">${n.evaluation ? `<span class="note-badge">${D.ui.eval} : <strong>${n.evaluation}/10</strong></span>` : ""}${n.interet ? `<span class="note-badge">${D.ui.interet} : <strong>${n.interet}</strong></span>` : ""}${n.date_observation ? `<span class="note-badge">${D.ui.observe} ${fmtDate(n.date_observation)}</span>` : ""}</div>`).join("")}</div>`
    : "";

  const statsHtml = statsGroupsHtml();
  const statsPerf = statsHtml
    ? `<div class="section"><h3 class="section-title">${D.sec.stats}${player.ligue ? ` <span class="avg-badge">${player.ligue}</span>` : ""}</h3>${statsHtml}</div>`
    : "";

  const hasRatings = CAT_KEYS.some((c) => player[c.key] > 0);
  const ratingsSection = hasRatings
    ? `<div class="section"><h3 class="section-title">${D.sec.scout}${avg ? ` <span class="avg-badge">${D.ui.avg} ${avg}/10</span>` : ""}</h3><div class="ratings">${ratingBars()}</div></div>`
    : "";

  const profilSection = (player.stats_resume || player.style_jeu || player.forces || player.faiblesses)
    ? `<div class="section"><h3 class="section-title">${D.sec.profil}</h3>${player.style_jeu ? `<div class="profile-block"><span class="profile-label">${D.ui.style}</span><p>${player.style_jeu}</p></div>` : ""}${player.forces ? `<div class="profile-block"><span class="profile-label">${D.ui.forces}</span><p>${player.forces}</p></div>` : ""}${player.faiblesses ? `<div class="profile-block"><span class="profile-label">${D.ui.faiblesses}</span><p>${player.faiblesses}</p></div>` : ""}${player.stats_resume ? `<div class="profile-block"><span class="profile-label">${D.ui.statsResume}</span><p>${player.stats_resume}</p></div>` : ""}</div>`
    : "";

  const ageVal = player.age ?? (player.date_naissance
    ? Math.floor((Date.now() - new Date(player.date_naissance).getTime()) / 31557600000) : null);

  const infoSection = `
    <div class="section"><h3 class="section-title">${D.sec.info}</h3><div class="info-grid">
      ${infoRow(D.info.poste, player.poste)}
      ${infoRow(D.info.poste_secondaire, player.poste_secondaire)}
      ${infoRow(D.info.age, ageVal != null ? `${ageVal} ${D.ui.ans}` : null)}
      ${infoRow(D.info.ddn, fmtDate(player.date_naissance))}
      ${infoRow(D.info.lieu, player.lieu_naissance)}
      ${infoRow(D.info.nat, player.nationalite)}
      ${infoRow(D.info.nat2, player.nationalite_secondaire)}
      ${infoRow(D.info.club, player.club_actuel)}
      ${infoRow(D.info.ligue, player.ligue)}
      ${infoRow(D.info.maillot, player.numero_maillot)}
      ${infoRow(D.info.pied, player.pied_fort)}
      ${infoRow(D.info.taille, player.taille ? `${player.taille} cm` : null)}
      ${infoRow(D.info.poids, player.poids ? `${player.poids} kg` : null)}
      ${infoRow(D.info.sexe, player.sexe)}
    </div></div>
    <div class="section"><h3 class="section-title">${D.sec.contrat}</h3><div class="info-grid">
      ${infoRow(D.contract.vm, player.valeur_marchande ? `${player.valeur_marchande} M€` : null)}
      ${infoRow(D.contract.salaire, player.salaire ? `${player.salaire} M€` : null)}
      ${infoRow(D.contract.arrivee, fmtDate(player.date_arrivee_club))}
      ${infoRow(D.contract.fin, fmtDate(player.contrat_fin))}
      ${infoRow(D.contract.option, player.option_contrat)}
      ${infoRow(D.contract.pret, player.en_pret ? (player.club_proprietaire ? `${D.ui.ouiProp} ${player.club_proprietaire}` : D.ui.oui) : null)}
      ${infoRow(D.contract.finpret, fmtDate(player.pret_fin))}
      ${infoRow(D.contract.agent, player.agent)}
      ${infoRow(D.contract.agence, player.agence)}
      ${infoRow(D.contract.contact, player.agent_email || player.agent_telephone)}
    </div></div>`;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>${D.ui.reportTitle} — ${player.nom}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 32px 40px; max-width: 800px; margin: auto; }
  .header { display: flex; align-items: center; gap: 24px; padding-bottom: 20px; border-bottom: 3px solid #2563eb; margin-bottom: 24px; }
  .player-photo { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid #2563eb; flex-shrink: 0; }
  .player-photo-placeholder { width: 90px; height: 90px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; }
  .header-info h1 { font-size: 26px; font-weight: 700; color: #1e293b; }
  .header-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1d4ed8; }
  .badge.green { background: #dcfce7; color: #15803d; }
  .badge.gray { background: #f1f5f9; color: #475569; }
  .report-date { margin-left: auto; font-size: 11px; color: #94a3b8; align-self: flex-end; }
  .section { margin-bottom: 22px; }
  .section-title { font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .avg-badge { font-size: 12px; font-weight: 700; background: #2563eb; color: #fff; padding: 1px 8px; border-radius: 999px; text-transform: none; letter-spacing: normal; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .info-row { display: flex; gap: 8px; font-size: 12px; }
  .info-label { color: #64748b; min-width: 110px; flex-shrink: 0; }
  .info-value { font-weight: 600; }
  .stat-group { margin-bottom: 12px; } .stat-group:last-child { margin-bottom: 0; }
  .stat-group-title { font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; }
  .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 6px; text-align: center; }
  .stat-num { font-size: 17px; font-weight: 800; color: #2563eb; line-height: 1.1; }
  .stat-lbl { font-size: 9px; color: #64748b; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.02em; }
  .ratings { display: flex; flex-direction: column; gap: 10px; }
  .rating-row { display: flex; align-items: center; gap: 10px; }
  .rating-label { font-size: 12px; color: #475569; min-width: 160px; flex-shrink: 0; }
  .rating-bar-wrap { flex: 1; height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
  .rating-bar-fill { height: 100%; border-radius: 999px; }
  .rating-score { font-size: 12px; font-weight: 700; color: #1e293b; min-width: 36px; text-align: right; }
  .note-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; line-height: 1.6; margin-bottom: 8px; }
  .note-meta { display: flex; flex-wrap: wrap; gap: 6px; }
  .note-badge { font-size: 11px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 999px; }
  .profile-block { margin-bottom: 10px; }
  .profile-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 3px; }
  .profile-block p { line-height: 1.5; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 20px; } @page { margin: 1cm; } }
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
        ${player.age ? `<span class="badge gray">${player.age} ${D.ui.ans}</span>` : ""}
      </div>
    </div>
    <div class="report-date">${D.ui.reportDate} ${today}</div>
  </div>
  ${infoSection}
  ${statsPerf}
  ${ratingsSection}
  ${noteSection}
  ${profilSection}
  <div class="footer">${D.ui.footer}</div>
  <script>
    window.onload = function() {
      var img = document.querySelector('.player-photo'); var done = false;
      function go() { if (done) return; done = true; setTimeout(function() { window.print(); }, 300); }
      if (img && !img.complete) { img.addEventListener('load', go); img.addEventListener('error', go); setTimeout(go, 3000); }
      else { go(); }
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert(D.ui.popups); return; }
  win.document.write(html);
  win.document.close();
}
