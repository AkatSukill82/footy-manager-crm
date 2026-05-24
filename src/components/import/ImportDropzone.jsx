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

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            description: "Extraire CHAQUE ligne du fichier (hors ligne d'en-tête) comme un objet. Ne pas filtrer, ne pas ignorer de lignes. Mapper les colonnes aux champs ci-dessous même si les noms de colonnes sont en anglais (NAME=nom, CLUB=club, COUNTRY=pays, POSITION=poste, TEL=telephone, EMAIL=email).",
            items: {
              type: "object",
              properties: {
                nom: { type: "string", description: "Nom complet. Colonnes: NOM, NAME, PLAYER, JOUEUR, PRÉNOM+NOM" },
                club: { type: "string", description: "Club. Colonnes: CLUB, TEAM, ÉQUIPE, CLUB_ACTUEL" },
                pays: { type: "string", description: "Pays. Colonnes: COUNTRY, PAYS, NATION" },
                poste: { type: "string", description: "Poste ou rôle. Colonnes: POSITION, POSTE, ROLE, TITRE, JOB" },
                email: { type: "string", description: "Email. Colonnes: EMAIL, MAIL, E-MAIL" },
                telephone: { type: "string", description: "Téléphone. Colonnes: TEL, PHONE, TELEPHONE, MOBILE, TÉL" },
                nationalite: { type: "string", description: "Nationalité. Colonnes: NATIONALITY, NATIONALITÉ, NAT" },
                age: { type: "number", description: "Âge. Colonnes: AGE, ÂGE" },
                date_naissance: { type: "string", description: "Date de naissance. Colonnes: DOB, DATE_NAISSANCE, BIRTH_DATE" },
                valeur_marchande: { type: "number", description: "Valeur marchande en millions. Colonnes: VALUE, VALEUR, MARKET_VALUE" },
                contrat_fin: { type: "string", description: "Fin de contrat. Colonnes: CONTRACT, CONTRAT, CONTRACT_END" }
              }
            }
          }
        }
      }
    });

    setLoading(false);

    if (result.status === "error") {
      setError(result.details || "Erreur lors de l'extraction");
      return;
    }

    console.log("Extraction brute:", JSON.stringify(result.output, null, 2));

    // result.output can be an array (one entry per sheet) or a single object
    let rawRows = [];
    if (Array.isArray(result.output)) {
      // Flatten all sheets
      for (const sheet of result.output) {
        if (Array.isArray(sheet?.rows)) rawRows = rawRows.concat(sheet.rows);
        else if (Array.isArray(sheet)) rawRows = rawRows.concat(sheet);
      }
    } else {
      rawRows = result.output?.rows || [];
    }

    const rows = rawRows;

    if (rows.length === 0) {
      setError("Aucune donnée reconnue. Vérifiez que votre fichier a des colonnes : NOM (ou NAME), CLUB, POSTE (ou POSITION).");
      return;
    }

    // Classify rows into contacts (staff) vs joueurs (players)
    const staffKeywords = ["ceo","director","coach","manager","head","administrator","recruitment","communication","president","sport","assistant","staff","secretary","operations","relations","marketing","finance","medical","analyst","scout","agent","responsable","directeur","entraîneur","recruteur","chef"];
    const footballPositions = ["gardien","défenseur","latéral","milieu","ailier","attaquant","goalkeeper","defender","midfielder","forward","winger","striker","centre-back","full-back"];

    const contacts = [];
    const joueurs = [];

    for (const row of rows) {
      if (!row.nom) continue;
      const postelower = (row.poste || "").toLowerCase();
      const isStaff = staffKeywords.some(k => postelower.includes(k));
      const isPlayer = footballPositions.some(k => postelower.includes(k));

      if (isStaff && !isPlayer) {
        contacts.push(row);
      } else {
        // default to player if unclear
        joueurs.push({ ...row, club_actuel: row.club_actuel || row.club });
      }
    }

    onExtracted({ contacts, joueurs, clubs: [], nom_fichier: file.name });
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