import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

// Normalise une clé de colonne : minuscules, sans accents, espaces → _
const normalizeKey = (k) =>
  String(k)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s\-\/]+/g, "_");

// Normalise une valeur brute : convertit Date XLSX → string ISO YYYY-MM-DD
const normalizeValue = (v) => {
  if (v instanceof Date && !isNaN(v)) {
    return v.toISOString().split("T")[0];
  }
  return v;
};

// Mapping exhaustif alias → champ interne
const FIELD_MAP = {
  // ── Nom ──────────────────────────────────────────────────────────────────────
  name: "nom", last_name: "nom", lastname: "nom", surname: "nom",
  joueur: "nom", player: "nom", full_name: "nom", fullname: "nom",
  nom_complet: "nom", player_name: "nom", jugador: "nom", giocatore: "nom",
  player_fullname: "nom",
  // ── Prénom ───────────────────────────────────────────────────────────────────
  first_name: "prenom", firstname: "prenom", given_name: "prenom",
  // ── Poste ────────────────────────────────────────────────────────────────────
  position: "poste", role: "poste", pos: "poste",
  position_principale: "poste", main_position: "poste",
  // ── Poste secondaire ─────────────────────────────────────────────────────────
  position_2: "poste_secondaire", second_position: "poste_secondaire",
  position_secondaire: "poste_secondaire", poste2: "poste_secondaire",
  alt_position: "poste_secondaire",
  // ── Club ─────────────────────────────────────────────────────────────────────
  team: "club", equipe: "club", club_name: "club", club_actuel: "club",
  current_club: "club", club_nom: "club", squad: "club", clube: "club",
  // ── Nationalité ──────────────────────────────────────────────────────────────
  country: "nationalite", nation: "nationalite", nationality: "nationalite",
  nat: "nationalite", citizenship: "nationalite", pays_origine: "nationalite",
  pays_naissance: "nationalite",
  // ── Nationalité secondaire ───────────────────────────────────────────────────
  nationalite2: "nationalite_secondaire", second_nationality: "nationalite_secondaire",
  dual_nationality: "nationalite_secondaire", nationality_2: "nationalite_secondaire",
  // ── Email ─────────────────────────────────────────────────────────────────────
  mail: "email", courriel: "email", e_mail: "email", email_joueur: "email",
  // ── Téléphone ────────────────────────────────────────────────────────────────
  phone: "telephone", tel: "telephone", mobile: "telephone",
  gsm: "telephone", cell: "telephone", phone_number: "telephone",
  contact_number: "telephone",
  // ── WhatsApp ─────────────────────────────────────────────────────────────────
  wapp: "whatsapp", whats: "whatsapp", wa: "whatsapp",
  // ── Date de naissance ────────────────────────────────────────────────────────
  birth: "date_naissance", dob: "date_naissance", birthdate: "date_naissance",
  naissance: "date_naissance", birth_date: "date_naissance",
  date_de_naissance: "date_naissance", born: "date_naissance",
  annee_naissance: "date_naissance", born_date: "date_naissance",
  // ── Lieu de naissance ────────────────────────────────────────────────────────
  birthplace: "lieu_naissance", birth_place: "lieu_naissance",
  lieu_de_naissance: "lieu_naissance", born_in: "lieu_naissance",
  birth_city: "lieu_naissance",
  // ── Taille ───────────────────────────────────────────────────────────────────
  height: "taille", height_cm: "taille", taille_cm: "taille", size: "taille",
  // ── Poids ────────────────────────────────────────────────────────────────────
  weight: "poids", weight_kg: "poids", poids_kg: "poids",
  // ── Pied fort ────────────────────────────────────────────────────────────────
  foot: "pied_fort", pied: "pied_fort", preferred_foot: "pied_fort",
  pied_dominant: "pied_fort", stronger_foot: "pied_fort", best_foot: "pied_fort",
  // ── Buts ─────────────────────────────────────────────────────────────────────
  goals: "buts", goals_scored: "buts", g: "buts", gls: "buts",
  // ── Passes décisives ─────────────────────────────────────────────────────────
  assists: "passes_decisives", ast: "passes_decisives", a: "passes_decisives",
  // ── Matchs joués ─────────────────────────────────────────────────────────────
  games: "matchs_joues", appearances: "matchs_joues", played: "matchs_joues",
  matches: "matchs_joues", apps: "matchs_joues", games_played: "matchs_joues",
  mp: "matchs_joues", gp: "matchs_joues",
  // ── Minutes ──────────────────────────────────────────────────────────────────
  minutes: "minutes_jouees", mins: "minutes_jouees", minutes_played: "minutes_jouees",
  min: "minutes_jouees",
  // ── Cartons ──────────────────────────────────────────────────────────────────
  yellow: "cartons_jaunes", yellow_cards: "cartons_jaunes", yc: "cartons_jaunes",
  red: "cartons_rouges", red_cards: "cartons_rouges", rc: "cartons_rouges",
  // ── Note ─────────────────────────────────────────────────────────────────────
  rating: "note_moyenne", score: "note_moyenne", note: "note_moyenne",
  avg_rating: "note_moyenne", note_moy: "note_moyenne", sofascore: "note_moyenne",
  average: "note_moyenne", avg: "note_moyenne",
  // ── xG ───────────────────────────────────────────────────────────────────────
  xg: "xg", expected_goals: "xg",
  // ── Valeur marchande ─────────────────────────────────────────────────────────
  value: "valeur_marchande", market_value: "valeur_marchande", mv: "valeur_marchande",
  vm: "valeur_marchande", valeur: "valeur_marchande", worth: "valeur_marchande",
  market_val: "valeur_marchande",
  // ── Salaire ──────────────────────────────────────────────────────────────────
  salary: "salaire", wage: "salaire", salaire_annuel: "salaire",
  wages: "salaire", annual_salary: "salaire",
  // ── Contrat ──────────────────────────────────────────────────────────────────
  contract: "contrat_fin", contract_end: "contrat_fin", expiry: "contrat_fin",
  fin_contrat: "contrat_fin", contract_expires: "contrat_fin",
  end_contract: "contrat_fin", contrat: "contrat_fin", expiration: "contrat_fin",
  contract_expiry: "contrat_fin",
  // ── Agent ────────────────────────────────────────────────────────────────────
  agent_name: "agent", player_agent: "agent", representant: "agent",
  agent_mail: "agent_email", agent_phone: "agent_telephone", agent_tel: "agent_telephone",
  agence: "agence", agency: "agence", management: "agence",
  // ── Réseaux sociaux ──────────────────────────────────────────────────────────
  insta: "instagram", instagram_handle: "instagram",
  twitter_handle: "twitter", x: "twitter",
  // ── Photo ────────────────────────────────────────────────────────────────────
  photo: "photo_url", image: "photo_url", img: "photo_url",
  avatar: "photo_url", picture: "photo_url", photo_link: "photo_url",
  // ── Ligue ────────────────────────────────────────────────────────────────────
  league: "ligue", competition: "ligue", division: "ligue",
  championship: "ligue", ligue_nom: "ligue", tournament: "ligue",
  // ── Numéro de maillot ────────────────────────────────────────────────────────
  shirt: "numero_maillot", jersey: "numero_maillot", shirt_number: "numero_maillot",
  jersey_number: "numero_maillot", number: "numero_maillot", numero: "numero_maillot",
  // ── Champs clubs ─────────────────────────────────────────────────────────────
  nom_club: "nom", club_full_name: "nom",
  stadium: "stade", ground: "stade", arena: "stade",
  city: "ville", town: "ville",
  president_name: "president",
  coach: "entraineur", manager: "entraineur", head_coach: "entraineur",
  sporting_director: "directeur_sportif", dir_sportif: "directeur_sportif",
  website: "site_web", url: "site_web",
  budget: "budget_transfert", transfer_budget: "budget_transfert",
  capacity: "capacite_stade",
  email_club: "email_general", club_email: "email_general",
  phone_club: "telephone_general", club_phone: "telephone_general",
};

const FOOTBALL_POSITIONS = [
  // French
  "gardien", "defenseur", "lateral", "milieu", "ailier", "attaquant", "buteur", "libero",
  // English
  "goalkeeper", "defender", "midfielder", "forward", "winger", "striker",
  "centre-back", "centerback", "centreforward", "full-back", "fullback",
  "sweeper", "playmaker",
  // Abbreviations
  "gk", "cb", "rb", "lb", "dm", "cm", "am", "rw", "lw", "st", "cf", "fw",
  "dc", "md", "att", "def", "gar", "lat", "cdm", "cam",
  // Spanish / Italian
  "portero", "portiere", "delantero", "centrocampista", "defensa",
];

const STAFF_ROLES = [
  "president", "directeur", "dg", "ceo", "entraineur", "coach", "assistant",
  "scout", "recruteur", "analyste", "medecin", "physiotherapeute", "kine",
  "secretaire", "administrateur",
];

// Champs qui indiquent une ligne "club" (pas un joueur)
const CLUB_INDICATOR_FIELDS = [
  "nom_club", "club_name", "president", "president_email", "directeur_sportif",
  "email_general", "telephone_general", "stade", "stadium", "budget_transfert",
  "capacite_stade",
];

// Champs qui indiquent une ligne "joueur" (stats)
const PLAYER_STAT_FIELDS = ["buts", "matchs_joues", "passes_decisives", "minutes_jouees", "xg", "note_moyenne"];

const isClubRow = (row) =>
  CLUB_INDICATOR_FIELDS.some((f) => row[f] != null && String(row[f]).trim() !== "");

const isPlayerRow = (row) => {
  const pos = normalizeKey(String(row.poste || ""));
  if (FOOTBALL_POSITIONS.some((k) => pos.includes(k))) return true;
  if (PLAYER_STAT_FIELDS.some((f) => row[f] != null && row[f] !== "")) return true;
  const isStaff = STAFF_ROLES.some((r) => pos.includes(r));
  return !isStaff && !!row.club; // has club but no staff indicator → assume player
};

// Détecte le type d'une feuille à partir de son nom
const SHEET_PATTERNS = {
  joueurs: /^(joueurs?|players?|jugadores?|footballers?|footballeurs?|efectivo|squad|roster)$/i,
  clubs:   /^(clubs?|équipes?|teams?|equipos?|squadre?)$/i,
  contacts:/^(contacts?|staff|personnel|dirigeants?|management|coaches?)$/i,
};

const detectSheetType = (name) => {
  for (const [type, re] of Object.entries(SHEET_PATTERNS)) {
    if (re.test(name.trim())) return type;
  }
  return null;
};

const parseExcelFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        const sheets = {};

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];

          // Propager les cellules fusionnées
          if (ws["!merges"]) {
            for (const merge of ws["!merges"]) {
              const firstCell = ws[XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
              if (!firstCell) continue;
              for (let r = merge.s.r; r <= merge.e.r; r++) {
                for (let c = merge.s.c; c <= merge.e.c; c++) {
                  if (r === merge.s.r && c === merge.s.c) continue;
                  ws[XLSX.utils.encode_cell({ r, c })] = { ...firstCell };
                }
              }
            }
          }

          sheets[sheetName] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        }

        resolve(sheets);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// Normalise une ligne brute : clés + FIELD_MAP aliases + conversion de valeurs
const normalizeRow = (rawRow) => {
  const lowered = {};
  for (const [k, v] of Object.entries(rawRow)) {
    lowered[normalizeKey(k)] = normalizeValue(v);
  }
  const normalized = { ...lowered };
  for (const [alias, canonical] of Object.entries(FIELD_MAP)) {
    if (lowered[alias] !== undefined && normalized[canonical] === undefined) {
      normalized[canonical] = lowered[alias];
    }
  }
  return normalized;
};

export default function ImportDropzone({ onExtracted }) {
  const { lang } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const inputRef = useRef();

  const processFile = async (file) => {
    setError(null);
    setLoading(true);
    setStatus(t(lang, "import.reading"));

    try {
      const sheets = await parseExcelFile(file);
      const sheetNames = Object.keys(sheets);

      if (sheetNames.length === 0 || sheetNames.every((n) => sheets[n].length === 0)) {
        throw new Error("Le fichier est vide ou ne contient pas de données.");
      }

      const joueurs = [];
      const clubs = [];
      const staffContacts = [];

      let lastPays = "";
      let lastClub = "";

      for (const sheetName of sheetNames) {
        const rawRows = sheets[sheetName];
        if (rawRows.length === 0) continue;

        const sheetType = detectSheetType(sheetName);

        // Filtrer lignes sans nom
        const rows = rawRows
          .map(normalizeRow)
          .filter((r) => {
            const n = r.nom || r.prenom;
            return n && String(n).trim().length > 0;
          });

        for (const row of rows) {
          // Propagation de PAYS/CLUB depuis les lignes précédentes (fusionné sans merge)
          if (row.pays && String(row.pays).trim()) lastPays = String(row.pays).trim();
          else if (lastPays && !row.pays) row.pays = lastPays;

          if (row.club && String(row.club).trim()) lastClub = String(row.club).trim();
          else if (lastClub && !row.club) row.club = lastClub;

          const nomComplet = [row.prenom, row.nom]
            .filter(Boolean)
            .map((s) => String(s).trim())
            .join(" ")
            .trim() || String(row.nom || row.prenom || "").trim();

          if (sheetType === "clubs" || (!sheetType && isClubRow(row))) {
            clubs.push({ ...row, nom: row.nom || row.club || nomComplet });
          } else if (sheetType === "contacts") {
            staffContacts.push({ ...row, nom: nomComplet });
          } else if (sheetType === "joueurs" || (!sheetType && isPlayerRow(row))) {
            joueurs.push({ ...row, nom: nomComplet, club_actuel: row.club_actuel || row.club });
          } else {
            // Fallback : staff si poste reconnu, sinon joueur
            const pos = normalizeKey(String(row.poste || ""));
            const isStaff = STAFF_ROLES.some((r) => pos.includes(r));
            if (isStaff) {
              staffContacts.push({ ...row, nom: nomComplet });
            } else {
              joueurs.push({ ...row, nom: nomComplet, club_actuel: row.club_actuel || row.club });
            }
          }
        }
      }

      const total = joueurs.length + clubs.length + staffContacts.length;

      if (total === 0) {
        const sampleRow = Object.values(sheets).flat()[0] || {};
        const cols = Object.keys(sampleRow).join(", ");
        throw new Error(
          `Aucune ligne valide trouvée.\n\nColonnes détectées : ${cols}\n\nVérifiez que le fichier contient une colonne NOM, NAME ou PRÉNOM.`
        );
      }

      setStatus("");
      onExtracted({ contacts: staffContacts, joueurs, clubs, nom_fichier: file.name });
    } catch (err) {
      console.error("Import error:", err);
      setError(err.message || "Une erreur est survenue lors de l'analyse du fichier.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  return (
    <Card
      className={`border-2 border-dashed transition-all cursor-pointer ${
        dragging ? "border-green-400 bg-green-50" : "border-slate-300 hover:border-green-400 hover:bg-green-50/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
    >
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
        />

        {loading ? (
          <>
            <Loader2 className="w-14 h-14 text-green-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">{t(lang, "import.analyzing")}</h3>
            <p className="text-slate-400 mt-1">{status || t(lang, "import.reading")}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">{t(lang, "import.dropzoneTitle")}</h3>
            <p className="text-slate-400 mt-1 mb-4">{t(lang, "import.dropzoneHint")}</p>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              {t(lang, "import.chooseFile")}
            </Button>
          </>
        )}

        {error && (
          <div className="mt-4 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm whitespace-pre-line text-left max-w-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
