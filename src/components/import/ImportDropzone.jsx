import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

// Normalise une clé : minuscules, sans accents, espaces → _
const normalizeKey = (k) =>
  String(k)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s\-\/]+/g, "_");

// Convertit les Date XLSX → string ISO YYYY-MM-DD
const normalizeValue = (v) => {
  if (v instanceof Date && !isNaN(v)) return v.toISOString().split("T")[0];
  return v;
};

// ── Mapping alias → champ interne ────────────────────────────────────────────
const FIELD_MAP = {
  // Nom du club / de la personne
  name: "nom", last_name: "nom", lastname: "nom", surname: "nom",
  full_name: "nom", fullname: "nom", nom_complet: "nom",
  nom_club: "nom", club_full_name: "nom", club_name: "nom",
  // Prénom
  first_name: "prenom", firstname: "prenom", given_name: "prenom",
  // Club employeur (pour contacts)
  team: "club", equipe: "club", club_actuel: "club",
  current_club: "club", club_nom: "club", squad: "club", clube: "club",
  // Pays
  country: "pays", nation: "pays", pays_club: "pays",
  // Nationalité personne
  nationality: "nationalite", nat: "nationalite", citizenship: "nationalite",
  // Poste / Fonction
  position: "poste", role: "poste", pos: "poste", fonction: "poste",
  job: "poste", title: "poste", titre: "poste",
  // Email
  mail: "email", courriel: "email", e_mail: "email",
  email_club: "email_general", club_email: "email_general",
  email_contact: "email", email_joueur: "email",
  // Téléphone
  phone: "telephone", tel: "telephone", mobile: "telephone",
  gsm: "telephone", cell: "telephone", phone_number: "telephone",
  tel_contact: "telephone", phone_club: "telephone_general",
  club_phone: "telephone_general",
  // WhatsApp
  wapp: "whatsapp", whats: "whatsapp", wa: "whatsapp",
  // Date de naissance
  birth: "date_naissance", dob: "date_naissance", birthdate: "date_naissance",
  naissance: "date_naissance", birth_date: "date_naissance",
  date_de_naissance: "date_naissance", born: "date_naissance",
  // Lieu de naissance
  birthplace: "lieu_naissance", birth_place: "lieu_naissance",
  born_in: "lieu_naissance", birth_city: "lieu_naissance",
  // Stade / Club
  stadium: "stade", ground: "stade", arena: "stade",
  city: "ville", town: "ville",
  // Direction
  president_name: "president",
  coach: "entraineur", manager: "entraineur", head_coach: "entraineur",
  sporting_director: "directeur_sportif", dir_sportif: "directeur_sportif",
  // Web / Budget
  website: "site_web", url: "site_web",
  budget: "budget_transfert", transfer_budget: "budget_transfert",
  capacity: "capacite_stade",
  // Réseaux sociaux
  insta: "instagram", instagram_handle: "instagram",
  twitter_handle: "twitter", x: "twitter",
  // Valeur / Salaire
  value: "valeur_marchande", market_value: "valeur_marchande",
  vm: "valeur_marchande", salary: "salaire", wage: "salaire",
  // Contrat
  contract: "contrat_fin", contract_end: "contrat_fin",
  fin_contrat: "contrat_fin", expiry: "contrat_fin",
  // Agent
  agent_name: "agent", representant: "agent",
  agent_mail: "agent_email", agent_phone: "agent_telephone",
  agence: "agence", agency: "agence",
  // Photo
  photo: "photo_url", image: "photo_url", picture: "photo_url", avatar: "photo_url",
  // Ligue
  league: "ligue", competition: "ligue", division: "ligue",
};

// ── Colonnes typiques d'un fichier CLUBS ──────────────────────────────────────
// Si le fichier a AU MOINS UNE de ces colonnes → c'est un fichier clubs
const CLUB_COLUMN_SIGNALS = [
  "president", "president_email", "entraineur", "directeur_sportif",
  "stade", "stadium", "capacite_stade", "capacity",
  "budget_transfert", "budget", "transfer_budget",
  "email_general", "email_club", "telephone_general", "phone_club",
  "dette", "valeur_effectif",
];

// ── Noms de feuilles → type forcé ────────────────────────────────────────────
const SHEET_TYPE_PATTERNS = {
  clubs:    /^(clubs?|équipes?|teams?|equipos?|squadre?|club_data|clubes?)$/i,
  contacts: /^(contacts?|staff|personnel|dirigeants?|management|coaches?|agents?)$/i,
};

const detectSheetTypeForcedByName = (name) => {
  for (const [type, re] of Object.entries(SHEET_TYPE_PATTERNS)) {
    if (re.test(name.trim())) return type;
  }
  return null;
};

// Détecte le type de feuille en analysant les noms de colonnes
const detectSheetTypeFromColumns = (firstRow) => {
  if (!firstRow) return "contacts";
  const cols = new Set(
    Object.keys(firstRow).map((k) => {
      const norm = normalizeKey(k);
      return FIELD_MAP[norm] || norm;
    })
  );
  const isClub = CLUB_COLUMN_SIGNALS.some((f) => cols.has(f));
  return isClub ? "clubs" : "contacts";
};

// ── Parsing XLSX ──────────────────────────────────────────────────────────────
const parseExcelFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        const sheets = {};
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          // Expand merged cells
          if (ws["!merges"]) {
            for (const merge of ws["!merges"]) {
              const first = ws[XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
              if (!first) continue;
              for (let r = merge.s.r; r <= merge.e.r; r++) {
                for (let c = merge.s.c; c <= merge.e.c; c++) {
                  if (r === merge.s.r && c === merge.s.c) continue;
                  ws[XLSX.utils.encode_cell({ r, c })] = { ...first };
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

// Normalise une ligne brute : clés + FIELD_MAP + conversion valeurs
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

// ── Composant ─────────────────────────────────────────────────────────────────
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

      const clubs = [];
      const contacts = [];

      for (const sheetName of sheetNames) {
        const rawRows = sheets[sheetName];
        if (rawRows.length === 0) continue;

        // Détecter le type : nom de feuille en priorité, sinon colonnes
        const forcedType = detectSheetTypeForcedByName(sheetName);
        const sheetType = forcedType || detectSheetTypeFromColumns(rawRows[0]);

        // Normaliser toutes les lignes
        const rows = rawRows.map(normalizeRow);

        if (sheetType === "clubs") {
          // Pour un fichier clubs, le nom du club = nom || club (colonne "club" = le club lui-même)
          const validRows = rows.filter((r) => {
            const n = r.nom || r.club || r.equipe;
            return n && String(n).trim().length > 0;
          });

          // Propager PAYS entre les lignes (cellules fusionnées non couvertes)
          let lastPays = "";
          for (const row of validRows) {
            if (row.pays && String(row.pays).trim()) lastPays = String(row.pays).trim();
            else if (lastPays && !row.pays) row.pays = lastPays;

            clubs.push({
              ...row,
              nom: String(row.nom || row.club || row.equipe || "").trim(),
            });
          }
        } else {
          // Contacts : nom de la personne obligatoire
          const validRows = rows.filter((r) => {
            const n = r.nom || r.prenom;
            return n && String(n).trim().length > 0;
          });

          // Propager CLUB entre les lignes
          let lastClub = "";
          for (const row of validRows) {
            if (row.club && String(row.club).trim()) lastClub = String(row.club).trim();
            else if (lastClub && !row.club) row.club = lastClub;

            const nomComplet = [row.prenom, row.nom]
              .filter(Boolean)
              .map((s) => String(s).trim())
              .join(" ")
              .trim();

            contacts.push({ ...row, nom: nomComplet });
          }
        }
      }

      const total = clubs.length + contacts.length;

      if (total === 0) {
        const sample = Object.values(sheets).flat()[0] || {};
        const cols = Object.keys(sample).join(", ");
        throw new Error(
          `Aucune ligne valide trouvée.\n\nColonnes détectées : ${cols}\n\nPour les clubs : colonne NOM ou NOM_CLUB.\nPour les contacts : colonne NOM ou PRÉNOM.`
        );
      }

      setStatus("");
      onExtracted({ clubs, contacts, nom_fichier: file.name });
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
