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
          type_donnees: {
            type: "string",
            description: "Type principal de données détecté: 'joueurs', 'clubs', 'mixte'"
          },
          joueurs: {
            type: "array",
            description: "Liste des joueurs extraits",
            items: {
              type: "object",
              properties: {
                nom: { type: "string" },
                prenom: { type: "string" },
                poste: { type: "string" },
                club_actuel: { type: "string" },
                nationalite: { type: "string" },
                date_naissance: { type: "string" },
                age: { type: "number" },
                email: { type: "string" },
                telephone: { type: "string" },
                whatsapp: { type: "string" },
                instagram: { type: "string" },
                twitter: { type: "string" },
                agent: { type: "string" },
                agent_email: { type: "string" },
                agent_telephone: { type: "string" },
                agence: { type: "string" },
                valeur_marchande: { type: "number" },
                salaire: { type: "number" },
                salaire_semaine: { type: "number" },
                contrat_fin: { type: "string" },
                taille: { type: "number" },
                poids: { type: "number" },
                pied_fort: { type: "string" },
                ligue: { type: "string" },
                pays_ligue: { type: "string" },
                buts: { type: "number" },
                passes_decisives: { type: "number" },
                matchs_joues: { type: "number" },
                minutes_jouees: { type: "number" },
                note_moyenne: { type: "number" },
                ville_residence: { type: "string" },
                pays_residence: { type: "string" },
                adresse: { type: "string" }
              }
            }
          },
          clubs: {
            type: "array",
            description: "Liste des clubs extraits",
            items: {
              type: "object",
              properties: {
                nom: { type: "string" },
                pays: { type: "string" },
                ville: { type: "string" },
                stade: { type: "string" },
                president: { type: "string" },
                president_email: { type: "string" },
                president_telephone: { type: "string" },
                entraineur: { type: "string" },
                entraineur_email: { type: "string" },
                directeur_sportif: { type: "string" },
                directeur_sportif_email: { type: "string" },
                directeur_sportif_telephone: { type: "string" },
                email_general: { type: "string" },
                telephone_general: { type: "string" },
                site_web: { type: "string" },
                budget_transfert: { type: "number" },
                budget_annuel: { type: "number" }
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

    onExtracted({ ...result.output, nom_fichier: file.name });
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