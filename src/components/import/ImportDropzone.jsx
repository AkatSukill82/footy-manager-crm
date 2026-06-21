import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, Building2, Users, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
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
  liens: "lien", link: "lien", links: "lien",
  lien_externe: "lien", lien_profil: "lien", profil_url: "lien",
  profile: "lien", profil: "lien", profile_url: "lien",
};

// Champs cibles proposés dans le menu de correction, par type.
const CANONICAL = {
  clubs: [
    "nom", "pays", "ville", "stade", "ligue", "capacite_stade", "budget_transfert",
    "president", "president_email", "president_telephone",
    "entraineur", "entraineur_email", "directeur_sportif", "directeur_sportif_email",
    "email_general", "telephone_general", "site_web", "instagram", "twitter",
  ],
  contacts: [
    "nom", "prenom", "club", "poste", "nationalite",
    "email", "telephone", "whatsapp", "instagram", "twitter", "linkedin",
    "date_naissance", "lieu_naissance", "agent", "agence",
    "valeur_marchande", "salaire", "contrat_fin", "photo_url", "lien",
  ],
};
const CANONICAL_SET = new Set([...CANONICAL.clubs, ...CANONICAL.contacts]);

const PHONE_WORDS   = new Set(["tel","telephone","phone","mobile","portable","gsm","cell","cellular"]);
const WA_WORDS      = new Set(["whatsapp","wapp","whats"]);
const EMAIL_WORDS   = new Set(["email","mail","courriel"]);
const INSTA_WORDS   = new Set(["instagram","insta"]);
const TWITTER_WORDS = new Set(["twitter","x"]);
const LI_WORDS      = new Set(["linkedin"]);
const LIEN_WORDS    = new Set(["lien","liens","link","links","profil","profile","url"]);

const guessCanonical = (key) => {
  const parts = key.split("_");
  if (parts.some(p => WA_WORDS.has(p)))      return "whatsapp";
  if (parts.some(p => PHONE_WORDS.has(p)))   return "telephone";
  if (parts.some(p => EMAIL_WORDS.has(p)))   return "email";
  if (parts.some(p => INSTA_WORDS.has(p)))   return "instagram";
  if (parts.some(p => TWITTER_WORDS.has(p))) return "twitter";
  if (parts.some(p => LI_WORDS.has(p)))      return "linkedin";
  if (parts.some(p => LIEN_WORDS.has(p)))    return "lien";
  return null;
};

// Détecte le champ canonique d'un en-tête de colonne (ou null si non reconnu).
const detectField = (header) => {
  const k = normalizeKey(header);
  if (CANONICAL_SET.has(k)) return k;
  if (FIELD_MAP[k]) return FIELD_MAP[k];
  return guessCanonical(k);
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

// En-têtes (colonnes) présents dans toutes les feuilles + 1er exemple de valeur.
const collectColumns = (sheets) => {
  const cols = new Map(); // header original → exemple de valeur
  for (const rows of Object.values(sheets)) {
    for (const row of rows) {
      for (const [h, v] of Object.entries(row)) {
        if (!cols.has(h)) cols.set(h, "");
        if (!cols.get(h) && v != null && String(v).trim() !== "") cols.set(h, String(v).trim());
      }
    }
  }
  return [...cols.entries()].map(([header, sample]) => ({ header, sample }));
};

// Normalise une ligne en appliquant le mapping CHOISI (header original → champ).
const applyMapping = (rawRow, mapping) => {
  const out = {};
  for (const [h, v] of Object.entries(rawRow)) {
    const field = mapping[h];
    if (field && field !== "__ignore__" && out[field] === undefined) out[field] = normalizeValue(v);
  }
  return out;
};

const buildExtracted = (sheets, mapping, type) => {
  const clubs = [];
  const contacts = [];
  for (const rows of Object.values(sheets)) {
    const normRows = rows.map((r) => applyMapping(r, mapping));
    if (type === "clubs") {
      let lastPays = "";
      for (const row of normRows) {
        if (!row.nom || !String(row.nom).trim()) continue;
        if (row.pays && String(row.pays).trim()) lastPays = String(row.pays).trim();
        else if (lastPays) row.pays = lastPays;
        clubs.push({ ...row, nom: String(row.nom).trim() });
      }
    } else {
      let lastClub = "";
      for (const row of normRows) {
        if (!row.nom && !row.prenom) continue;
        if (row.club && String(row.club).trim()) lastClub = String(row.club).trim();
        else if (lastClub) row.club = lastClub;
        const nomComplet = [row.prenom, row.nom].filter(Boolean).map((s) => String(s).trim()).join(" ").trim();
        if (!nomComplet) continue;
        contacts.push({ ...row, nom: nomComplet });
      }
    }
  }
  return { clubs, contacts };
};

// ── Composant ─────────────────────────────────────────────────────────────────
export default function ImportDropzone({ onExtracted }) {
  const { lang } = useLanguage();
  const [dataType, setDataType] = useState(null); // "clubs" | "contacts"
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheets, setSheets] = useState(null);    // données parsées
  const [columns, setColumns] = useState([]);    // [{header, sample}]
  const [mapping, setMapping] = useState({});    // header → champ choisi
  const [fileName, setFileName] = useState("");
  const inputRef = useRef();

  const processFile = async (file) => {
    setError(null);
    setLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      const names = Object.keys(parsed);
      if (names.length === 0 || names.every((n) => parsed[n].length === 0)) {
        throw new Error("Le fichier est vide ou ne contient pas de données.");
      }
      const cols = collectColumns(parsed);
      // Mapping initial auto-détecté
      const initial = {};
      for (const { header } of cols) initial[header] = detectField(header) || "__ignore__";
      setSheets(parsed);
      setColumns(cols);
      setMapping(initial);
      setFileName(file.name);
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse du fichier.");
    } finally {
      setLoading(false);
    }
  };

  const confirmMapping = () => {
    const { clubs, contacts } = buildExtracted(sheets, mapping, dataType);
    const total = clubs.length + contacts.length;
    if (total === 0) {
      setError("Aucune ligne valide. Vérifiez qu'une colonne est bien mappée sur « nom ».");
      return;
    }
    onExtracted({ clubs, contacts, nom_fichier: fileName });
  };

  const resetFile = () => { setSheets(null); setColumns([]); setMapping({}); setError(null); };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); };
  const handleChange = (e) => { const f = e.target.files[0]; if (f) processFile(f); };

  // ── Écran de vérification du mapping ──────────────────────────────────────
  if (sheets) {
    const fields = CANONICAL[dataType] || [];
    const recognized = columns.filter((c) => mapping[c.header] && mapping[c.header] !== "__ignore__").length;
    const hasName = Object.values(mapping).includes("nom");
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t(lang, "import.mapTitle")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t(lang, "import.mapDesc")}</p>
            </div>
            <span className="text-xs font-medium text-slate-500">{recognized}/{columns.length} {t(lang, "import.mapRecognized")}</span>
          </div>

          {!hasName && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs mb-3">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {t(lang, "import.mapNeedName")}
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[55vh] overflow-y-auto">
            {columns.map(({ header, sample }) => {
              const val = mapping[header];
              const ok = val && val !== "__ignore__";
              return (
                <div key={header} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex-shrink-0">
                    {ok
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{header}</p>
                    {sample && <p className="text-[11px] text-slate-400 truncate">{t(lang, "import.mapExample")}: {sample}</p>}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  <select
                    value={val}
                    onChange={(e) => setMapping((m) => ({ ...m, [header]: e.target.value }))}
                    className={`h-8 rounded-lg border px-2 text-xs flex-shrink-0 w-44 focus:outline-none ${ok ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                  >
                    <option value="__ignore__">— {t(lang, "import.mapIgnore")} —</option>
                    {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

          <div className="flex items-center justify-between gap-3 mt-4">
            <Button variant="outline" onClick={resetFile} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> {t(lang, "import.mapBack")}</Button>
            <Button onClick={confirmMapping} className="bg-green-600 hover:bg-green-700 gap-1.5">{t(lang, "import.mapConfirm")} <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Écran de dépôt ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setDataType("clubs")}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${dataType === "clubs" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${dataType === "clubs" ? "bg-blue-500" : "bg-slate-100"}`}>
            <Building2 className={`w-5 h-5 ${dataType === "clubs" ? "text-white" : "text-slate-500"}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${dataType === "clubs" ? "text-blue-800" : "text-slate-700"}`}>Clubs</p>
            <p className="text-xs text-slate-400">Noms, stades, budgets, staff…</p>
          </div>
        </button>

        <button type="button" onClick={() => setDataType("contacts")}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${dataType === "contacts" ? "border-orange-500 bg-orange-50 shadow-sm" : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/40"}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${dataType === "contacts" ? "bg-orange-500" : "bg-slate-100"}`}>
            <Users className={`w-5 h-5 ${dataType === "contacts" ? "text-white" : "text-slate-500"}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${dataType === "contacts" ? "text-orange-800" : "text-slate-700"}`}>Contacts</p>
            <p className="text-xs text-slate-400">Dirigeants, agents, staff…</p>
          </div>
        </button>
      </div>

      <Card
        className={`border-2 border-dashed transition-all ${!dataType ? "opacity-40 pointer-events-none border-slate-200" : dragging ? "border-green-400 bg-green-50 cursor-pointer" : "border-slate-300 hover:border-green-400 hover:bg-green-50/30 cursor-pointer"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => dataType && !loading && inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleChange} />
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
                {dataType ? `Déposez votre fichier ${dataType === "clubs" ? "Clubs" : "Contacts"} ici` : "Choisissez un type ci-dessus"}
              </h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">.xlsx · .xls · .csv</p>
              {dataType && <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" /> Choisir un fichier</Button>}
            </>
          )}
          {error && <div className="mt-4 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm whitespace-pre-line text-left max-w-md">{error}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
