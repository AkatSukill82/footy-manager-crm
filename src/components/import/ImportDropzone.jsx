import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImportDropzone({ onExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const processFile = async (file) => {
    setError(null);
    setLoading(true);

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      if (!uploadResult?.file_url) throw new Error("Échec du téléversement du fichier.");
      const { file_url } = uploadResult;

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            rows: {
              type: "array",
              description: `Extraire TOUTES les lignes de données du fichier.
RÈGLE CELLULES FUSIONNÉES : Si une colonne comme PAYS, CLUB, TEAM, COUNTRY est vide sur une ligne, recopier la dernière valeur non-vide de cette colonne (les cellules fusionnées Excel apparaissent vides après la première ligne du groupe).
Ignorer uniquement les lignes où NOM/NAME/LAST_NAME est complètement vide.
Les noms de colonnes peuvent varier : NOM/NAME/LAST_NAME/PRÉNOM/FIRST_NAME, CLUB/TEAM/ÉQUIPE, PAYS/COUNTRY/NATION, POSTE/POSITION/ROLE/TITLE, EMAIL/MAIL/EMAIL_CLUB, TEL/PHONE/TELEPHONE/MOBILE, VALEUR/VALUE/MARKET_VALUE, CONTRAT/CONTRACT/CONTRACT_END/EXPIRY, NAISSANCE/BIRTH/DOB/DATE_NAISSANCE, TAILLE/HEIGHT, POIDS/WEIGHT, BUTS/GOALS, PASSES/ASSISTS, MATCHS/GAMES/APPEARANCES, AGENT/AGENT_NAME, INSTAGRAM, TWITTER, NATIONALITE/NATIONALITY, LIGUE/LEAGUE, SALAIRE/SALARY, NOTE/RATING/SCORE.`,
              items: {
                type: "object",
                properties: {
                  nom: { type: "string", description: "Nom de famille ou nom complet" },
                  prenom: { type: "string", description: "Prénom si colonne séparée" },
                  club: { type: "string", description: "Nom du club" },
                  pays: { type: "string", description: "Pays du club ou nationalité" },
                  poste: { type: "string", description: "Poste sportif ou titre professionnel" },
                  nationalite: { type: "string" },
                  date_naissance: { type: "string", description: "Format DD/MM/YYYY ou YYYY-MM-DD" },
                  age: { type: "string" },
                  email: { type: "string" },
                  telephone: { type: "string" },
                  valeur_marchande: { type: "string", description: "Valeur en euros ou millions" },
                  contrat_fin: { type: "string", description: "Date fin de contrat" },
                  taille: { type: "string", description: "Taille en cm" },
                  poids: { type: "string", description: "Poids en kg" },
                  agent: { type: "string" },
                  agent_email: { type: "string" },
                  agent_telephone: { type: "string" },
                  buts: { type: "string" },
                  passes_decisives: { type: "string" },
                  matchs_joues: { type: "string" },
                  ligue: { type: "string" },
                  salaire: { type: "string" },
                  note_moyenne: { type: "string" },
                  instagram: { type: "string" },
                  twitter: { type: "string" },
                  pied_fort: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.status === "error") {
        throw new Error(result.details || "Erreur lors de l'extraction");
      }

      // result.output peut être un tableau (une entrée par feuille) ou un objet
      let rows = [];
      if (Array.isArray(result.output)) {
        for (const sheet of result.output) {
          if (Array.isArray(sheet?.rows)) rows = rows.concat(sheet.rows);
          else if (Array.isArray(sheet)) rows = rows.concat(sheet);
        }
      } else {
        rows = result.output?.rows || [];
      }

      rows = rows.filter(r => r.nom && String(r.nom).trim());

      if (rows.length === 0) {
        throw new Error("Aucune donnée reconnue dans ce fichier. Vérifiez que le fichier contient une colonne NOM ou NAME.");
      }

      // Classification joueurs vs contacts staff
      const footballPositions = [
        "gardien","défenseur","latéral","milieu","ailier","attaquant",
        "goalkeeper","defender","midfielder","forward","winger","striker",
        "centre-back","full-back","buteur","libero","cb","rb","lb","dm","cm","am","rw","lw","st","gk","fw"
      ];
      const joueurs = [];
      const staffContacts = [];

      for (const row of rows) {
        const nomComplet = [row.prenom, row.nom].filter(Boolean).map(s => String(s).trim()).join(" ") || String(row.nom).trim();
        const postelower = (row.poste || "").toLowerCase();
        const isPlayer = footballPositions.some(k => postelower.includes(k));
        if (isPlayer) {
          joueurs.push({ ...row, nom: nomComplet, club_actuel: row.club });
        } else {
          staffContacts.push({ ...row, nom: nomComplet });
        }
      }

      onExtracted({ contacts: staffContacts, joueurs, clubs: [], nom_fichier: file.name });
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
            <p className="text-slate-400 mt-1">L'IA extrait toutes les données disponibles</p>
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
          <div className="mt-4 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}