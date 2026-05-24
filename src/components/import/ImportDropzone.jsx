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

    // Parse the Excel file directly using the raw data approach
    // We use ExtractDataFromUploadedFile but with a very simple schema
    // to just get all raw cell values
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          contacts: {
            type: "array",
            description: "Extraire TOUTES les lignes de données. Les colonnes peuvent s'appeler PAYS/COUNTRY, CLUB/TEAM, NOM/NAME, POSITION/POSTE (avec ou sans espaces), EMAIL/EMAIL_CLUB, TEL/TELEPHONE/téléphone_club. IMPORTANT: si PAYS ou CLUB est vide sur certaines lignes, propager la dernière valeur non-vide (les cellules fusionnées Excel sont souvent vides après la première ligne du groupe). Ignorer uniquement les lignes où NOM est vide.",
            items: {
              type: "object",
              properties: {
                nom: { type: "string" },
                club: { type: "string" },
                pays: { type: "string" },
                poste: { type: "string" },
                email: { type: "string" },
                telephone: { type: "string" }
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
    let contacts = [];
    if (Array.isArray(result.output)) {
      for (const sheet of result.output) {
        if (Array.isArray(sheet?.contacts)) contacts = contacts.concat(sheet.contacts);
        else if (Array.isArray(sheet)) contacts = contacts.concat(sheet);
      }
    } else {
      contacts = result.output?.contacts || [];
    }

    // Filter out empty rows
    contacts = contacts.filter(r => r.nom && r.nom.trim());

    if (contacts.length === 0) {
      setError("Aucune donnée reconnue dans ce fichier. Assurez-vous que le fichier contient des colonnes NOM/NAME et CLUB.");
      return;
    }

    // Separate players from staff based on position keywords
    const footballPositions = ["gardien","défenseur","latéral","milieu","ailier","attaquant","goalkeeper","defender","midfielder","forward","winger","striker","centre-back","full-back","droit","gauche","buteur","libero"];
    const joueurs = [];
    const staffContacts = [];

    for (const row of contacts) {
      const postelower = (row.poste || "").toLowerCase();
      const isPlayer = footballPositions.some(k => postelower.includes(k));
      if (isPlayer) {
        joueurs.push({ ...row, club_actuel: row.club });
      } else {
        staffContacts.push(row);
      }
    }

    onExtracted({ contacts: staffContacts, joueurs, clubs: [], nom_fichier: file.name });
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