import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, Building2, Users } from "lucide-react";
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
  name: "nom", last_name: "nom", lastname: "nom", surname: "nom",
  full_name: "nom", fullname: "nom", nom_complet: "nom",
  nom_club: "nom", club_full_name: "nom", club_name: "nom",
  first_name: "prenom", firstname: "prenom", given_name: "prenom",
  team: "club", equipe: "club", club_actuel: "club",
  current_club: "club", club_nom: "club", squad: "club", clube: "club",
  country: "pays", nation: "pays", pays_club: "pays",
  nationality: "nationalite", nat: "nationalite", citizenship: "nationalite",
  position: "poste", role: "poste", pos: "poste", fonction: "poste",
  job: "poste", title: "poste", titre: "poste",
  mail: "email", courriel: "email", e_mail: "email",
  email_club: "email_general", club_email: "email_general",
  email_contact: "email", email_joueur: "email",
  phone: "telephone", tel: "telephone", mobile: "telephone",
  gsm: "telephone", cell: "telephone", phone_number: "telephone",
  tel_contact: "telephone", numero_telephone: "telephone",
  num_tel: "telephone", no_telephone: "telephone", n_telephone: "telephone",
  numero_de_telephone: "telephone", numero: "telephone",
  phone_club: "telephone_general", tel_club: "telephone_general",
  club_phone: "telephone_general",
  wapp: "whatsapp", whats: "whatsapp", wa: "whatsapp",
  numero_whatsapp: "whatsapp", tel_whatsapp: "whatsapp",
  birth: "date_naissance", dob: "date_naissance", birthdate: "date_naissance",
  naissance: "date_naissance", birth_date: "date_naissance",
  date_de_naissance: "date_naissance", born: "date_naissance",
  birthplace: "lieu_naissance", birth_place: "lieu_naissance",
  born_in: "lieu_naissance", birth_city: "lieu_naissance",
  stadium: "stade", ground: "stade", arena: "stade",
  city: "ville", town: "ville",
  president_name: "president",
  coach: "entraineur", manager: "entraineur", head_coach: "entraineur",
  sporting_director: "directeur_sportif", dir_sportif: "directeur_sportif",
  website: "site_web", url: "site_web",
  budget: "budget_transfert", transfer_budget: "budget_transfert",
  capacity: "capacite_stade",
  insta: "instagram", instagram_handle: "instagram",
  twitter_handle: "twitter", x: "twitter",
  value: "valeur_marchande", market_value: "valeur_marchande",
  vm: "valeur_marchande", salary: "salaire", wage: "salaire",
  contract: "contrat_fin", contract_end: "contrat_fin",
  fin_contrat: "contrat_fin", expiry: "contrat_fin",
  agent_name: "agent", representant: "agent",
  agent_mail: "agent_email", agent_phone: "agent_telephone",
  agence: "agence", agency: "agence",
  photo: "photo_url", image: "photo_url", picture: "photo_url", avatar: "photo_url",
  league: "ligue", competition: "ligue", division: "ligue",
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

// Détecte un champ canonique en découpant la clé par "_" et en testant chaque mot
// Ex: "telephone_club" → ["telephone","club"] → "telephone"
// Ex: "email_club"     → ["email","club"]     → "email"
const PHONE_WORDS   = new Set(["tel","telephone","phone","mobile","portable","gsm","cell","cellular"]);
const WA_WORDS      = new Set(["whatsapp","wapp","whats"]);
const EMAIL_WORDS   = new Set(["email","mail","courriel"]);
const INSTA_WORDS   = new Set(["instagram","insta"]);
const TWITTER_WORDS = new Set(["twitter","x"]);
const LI_WORDS      = new Set(["linkedin"]);

const guessCanonical = (key) => {
  const parts = key.split("_");
  if (parts.some(p => WA_WORDS.has(p)))      return "whatsapp";
  if (parts.some(p => PHONE_WORDS.has(p)))   return "telephone";
  if (parts.some(p => EMAIL_WORDS.has(p)))   return "email";
  if (parts.some(p => INSTA_WORDS.has(p)))   return "instagram";
  if (parts.some(p => TWITTER_WORDS.has(p))) return "twitter";
  if (parts.some(p => LI_WORDS.has(p)))      return "linkedin";
  return null;
};

const normalizeRow = (rawRow, type = "contacts") => {
  const lowered = {};
  for (const [k, v] of Object.entries(rawRow)) {
    lowered[normalizeKey(k)] = normalizeValue(v);
  }
  const normalized = { ...lowered };

  // Passe 1 : mapping exact via FIELD_MAP
  for (const [alias, canonical] of Object.entries(FIELD_MAP)) {
    if (lowered[alias] !== undefined && normalized[canonical] === undefined) {
      normalized[canonical] = lowered[alias];
    }
  }

  // Passe 2 : détection par mots-clés pour les colonnes non encore mappées
  for (const [key, val] of Object.entries(lowered)) {
    if (val == null || String(val).trim() === "") continue;
    const canonical = guessCanonical(key);
    if (canonical && normalized[canonical] === undefined) {
      normalized[canonical] = val;
    }
  }

  // Passe 3 : pour les contacts, les champs "général" du club sont les champs perso
  if (type === "contacts") {
    if (!normalized.telephone && normalized.telephone_general) normalized.telephone = normalized.telephone_general;
    if (!normalized.email     && normalized.email_general)     normalized.email     = normalized.email_general;
  }

  return normalized;
};

// ── Composant ─────────────────────────────────────────────────────────────────
export default function ImportDropzone({ onExtracted }) {
  const { lang } = useLanguage();
  const [dataType, setDataType] = useState(null); // "clubs" | "contacts"
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const processFile = async (file) => {
    setError(null);
    setLoading(true);

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

        const rows = rawRows.map(r => normalizeRow(r, dataType));

        if (dataType === "clubs") {
          const validRows = rows.filter((r) => {
            const n = r.nom || r.club || r.equipe;
            return n && String(n).trim().length > 0;
          });
          let lastPays = "";
          for (const row of validRows) {
            if (row.pays && String(row.pays).trim()) lastPays = String(row.pays).trim();
            else if (lastPays && !row.pays) row.pays = lastPays;
            clubs.push({ ...row, nom: String(row.nom || row.club || row.equipe || "").trim() });
          }
        } else {
          const validRows = rows.filter((r) => {
            const n = r.nom || r.prenom;
            return n && String(n).trim().length > 0;
          });
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
        throw new Error(`Aucune ligne valide trouvée.\n\nColonnes détectées : ${cols}`);
      }

      onExtracted({ clubs, contacts, nom_fichier: file.name });
    } catch (err) {
      console.error("Import error:", err);
      setError(err.message || "Une erreur est survenue lors de l'analyse du fichier.");
    } finally {
      setLoading(false);
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
    <div className="flex flex-col gap-4">

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setDataType("clubs")}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            dataType === "clubs"
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            dataType === "clubs" ? "bg-blue-500" : "bg-slate-100"
          }`}>
            <Building2 className={`w-5 h-5 ${dataType === "clubs" ? "text-white" : "text-slate-500"}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${dataType === "clubs" ? "text-blue-800" : "text-slate-700"}`}>Clubs</p>
            <p className="text-xs text-slate-400">Noms, stades, budgets, staff…</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setDataType("contacts")}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
            dataType === "contacts"
              ? "border-orange-500 bg-orange-50 shadow-sm"
              : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/40"
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            dataType === "contacts" ? "bg-orange-500" : "bg-slate-100"
          }`}>
            <Users className={`w-5 h-5 ${dataType === "contacts" ? "text-white" : "text-slate-500"}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${dataType === "contacts" ? "text-orange-800" : "text-slate-700"}`}>Contacts</p>
            <p className="text-xs text-slate-400">Dirigeants, agents, staff…</p>
          </div>
        </button>
      </div>

      {/* Drop zone — visible seulement après sélection du type */}
      <Card
        className={`border-2 border-dashed transition-all ${
          !dataType
            ? "opacity-40 pointer-events-none border-slate-200"
            : dragging
            ? "border-green-400 bg-green-50 cursor-pointer"
            : "border-slate-300 hover:border-green-400 hover:bg-green-50/30 cursor-pointer"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => dataType && !loading && inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleChange}
          />

          {loading ? (
            <>
              <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Analyse en cours…</h3>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">
                {dataType
                  ? `Déposez votre fichier ${dataType === "clubs" ? "Clubs" : "Contacts"} ici`
                  : "Choisissez un type ci-dessus"}
              </h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">.xlsx · .xls · .csv</p>
              {dataType && (
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Choisir un fichier
                </Button>
              )}
            </>
          )}

          {error && (
            <div className="mt-4 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm whitespace-pre-line text-left max-w-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
