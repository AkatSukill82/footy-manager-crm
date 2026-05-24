import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

// Normalise une clé de colonne : minuscules, sans accents, espaces → _
const normalizeKey = (k) =>
  String(k)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

// Mappe les noms de colonnes courants vers nos champs internes
const FIELD_MAP = {
  name: "nom", last_name: "nom", lastname: "nom", surname: "nom", joueur: "nom", player: "nom",
  full_name: "nom", fullname: "nom",
  first_name: "prenom", firstname: "prenom",
  team: "club", equipe: "club", club_name: "club",
  country: "pays", nation: "pays",
  position: "poste", role: "poste", title: "poste", titre: "poste",
  mail: "email", email_club: "email", courriel: "email",
  phone: "telephone", tel: "telephone", mobile: "telephone", gsm: "telephone",
  birth: "date_naissance", dob: "date_naissance", birthdate: "date_naissance", naissance: "date_naissance",
  height: "taille", weight: "poids",
  goals: "buts", assists: "passes_decisives", games: "matchs_joues", appearances: "matchs_joues",
  value: "valeur_marchande", market_value: "valeur_marchande",
  contract: "contrat_fin", contract_end: "contrat_fin", expiry: "contrat_fin",
  salary: "salaire", wage: "salaire",
  rating: "note_moyenne", score: "note_moyenne",
  league: "ligue", nationality: "nationalite",
};

const FOOTBALL_POSITIONS = [
  "gardien", "defenseur", "lateral", "milieu", "ailier", "attaquant",
  "goalkeeper", "defender", "midfielder", "forward", "winger", "striker",
  "centre-back", "full-back", "buteur", "libero",
  "cb", "rb", "lb", "dm", "cm", "am", "rw", "lw", "st", "gk", "fw",
];

// Parse le fichier Excel localement — 100% déterministe, sans IA
const parseExcelFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        const allRows = [];

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          // Propager les cellules fusionnées (merges)
          if (ws["!merges"]) {
            for (const merge of ws["!merges"]) {
              const firstCell = ws[XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
              if (!firstCell) continue;
              for (let r = merge.s.r; r <= merge.e.r; r++) {
                for (let c = merge.s.c; c <= merge.e.c; c++) {
                  if (r === merge.s.r && c === merge.s.c) continue;
                  const addr = XLSX.utils.encode_cell({ r, c });
                  if (!ws[addr]) ws[addr] = { ...firstCell };
                }
              }
            }
          }

          const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
          allRows.push(...rawRows);
        }

        resolve(allRows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

export default function ImportDropzone({ onExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const inputRef = useRef();

  const processFile = async (file) => {
    setError(null);
    setLoading(true);
    setStatus("Lecture du fichier...");

    try {
      // 1. Parser le fichier localement avec SheetJS
      const rawRows = await parseExcelFile(file);

      if (rawRows.length === 0) {
        throw new Error("Le fichier est vide ou ne contient pas de données.");
      }

      // 2. Normaliser les clés de chaque ligne
      const rows = rawRows.map((r) => {
        const lowered = {};
        for (const [k, v] of Object.entries(r)) {
          lowered[normalizeKey(k)] = v;
        }
        const normalized = { ...lowered };
        for (const [alias, canonical] of Object.entries(FIELD_MAP)) {
          if (lowered[alias] !== undefined && normalized[canonical] === undefined) {
            normalized[canonical] = lowered[alias];
          }
        }
        return normalized;
      });

      // 3. Filtrer les lignes sans nom
      const validRows = rows.filter((r) => {
        const n = r.nom || r.prenom;
        return n && String(n).trim().length > 0;
      });

      if (validRows.length === 0) {
        const cols = Object.keys(rows[0] || {}).join(", ");
        throw new Error(
          `Aucune ligne avec un nom trouvée.\n\nColonnes détectées : ${cols}\n\nVérifiez que le fichier contient une colonne NOM, NAME ou PRÉNOM.`
        );
      }

      // 4. Classifier : joueurs vs contacts staff
      const joueurs = [];
      const staffContacts = [];

      // Propagation de PAYS et CLUB entre les lignes (cellules fusionnées non couvertes par merges)
      let lastPays = "";
      let lastClub = "";

      for (const row of validRows) {
        if (row.pays && String(row.pays).trim()) lastPays = String(row.pays).trim();
        else if (lastPays) row.pays = lastPays;

        if (row.club && String(row.club).trim()) lastClub = String(row.club).trim();
        else if (lastClub) row.club = lastClub;

        const nomComplet = [row.prenom, row.nom]
          .filter(Boolean)
          .map((s) => String(s).trim())
          .join(" ")
          .trim();

        const posteLower = normalizeKey(String(row.poste || ""));
        const isPlayer = FOOTBALL_POSITIONS.some((k) => posteLower.includes(k));

        if (isPlayer) {
          joueurs.push({ ...row, nom: nomComplet, club_actuel: row.club });
        } else {
          staffContacts.push({ ...row, nom: nomComplet });
        }
      }

      // 5. Si des joueurs ont été trouvés, enrichir via l'IA Base44
      if (joueurs.length > 0) {
        setStatus(`Enrichissement IA pour ${joueurs.length} joueur(s)...`);
        try {
          const enriched = await base44.integrations.Core.InvokeLLM({
            prompt: `Voici une liste de joueurs de football extraite d'un fichier Excel. Pour chaque joueur, complète les informations manquantes (nationalité, poste normalisé, valeur marchande, date de naissance, contrat, agent...) en te basant sur les données publiques disponibles. Retourne exactement le même nombre d'objets dans le même ordre.

Joueurs: ${JSON.stringify(joueurs.map(j => ({ nom: j.nom, club: j.club_actuel || j.club, poste: j.poste })))}`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                joueurs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nom: { type: "string" },
                      poste: { type: "string" },
                      nationalite: { type: "string" },
                      date_naissance: { type: "string" },
                      club_actuel: { type: "string" },
                      valeur_marchande: { type: "number" },
                      contrat_fin: { type: "string" },
                    },
                  },
                },
              },
            },
          });

          if (enriched?.joueurs?.length === joueurs.length) {
            enriched.joueurs.forEach((enr, i) => {
              if (enr.poste && !joueurs[i].poste) joueurs[i].poste = enr.poste;
              if (enr.nationalite && !joueurs[i].nationalite) joueurs[i].nationalite = enr.nationalite;
              if (enr.date_naissance && !joueurs[i].date_naissance) joueurs[i].date_naissance = enr.date_naissance;
              if (enr.valeur_marchande && !joueurs[i].valeur_marchande) joueurs[i].valeur_marchande = enr.valeur_marchande;
              if (enr.contrat_fin && !joueurs[i].contrat_fin) joueurs[i].contrat_fin = enr.contrat_fin;
            });
          }
        } catch (_) { /* enrichissement optionnel */ }
      }

      setStatus("");
      onExtracted({ contacts: staffContacts, joueurs, clubs: [], nom_fichier: file.name });
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
            <h3 className="text-lg font-semibold text-slate-700">Analyse du fichier en cours...</h3>
            <p className="text-slate-400 mt-1">{status || "Lecture des données..."}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Glissez votre fichier ici</h3>
            <p className="text-slate-400 mt-1 mb-4">Excel (.xlsx, .xls) ou CSV — toute structure acceptée</p>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Choisir un fichier
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
