import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Download, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ImportDropzone from "@/components/import/ImportDropzone";
import ImportPreview from "@/components/import/ImportPreview";
import ImportResults from "@/components/import/ImportResults";
import ImportHistory from "@/components/import/ImportHistory";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function ImportExcel() {
  const { lang } = useLanguage();
  const [step, setStep] = useState("upload"); // upload | preview | processing | results
  const [extractedData, setExtractedData] = useState(null);
  const [results, setResults] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleFileExtracted = (data) => {
    setExtractedData(data);
    setStep("preview");
  };

  const handleConfirmImport = async () => {
    setStep("processing");
    setProcessing(true);
    try {
      const res = await base44.functions.invoke("importExcelData", { data: extractedData });
      const data = res?.data ?? res;
      if (!data || data.error) {
        throw new Error(data?.error || data?.message || "Erreur lors de l'import");
      }
      setResults(data);
      setStep("results");
    } catch (err) {
      console.error("Import function error:", err);
      setResults({ erreurs: [err.message || "Erreur inconnue"], contacts_crees: 0, contacts_mis_a_jour: 0, clubs_crees: 0, clubs_mis_a_jour: 0 });
      setStep("results");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setExtractedData(null);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t(lang, 'import.title')}</h1>
              <p className="text-slate-500 text-sm">{t(lang, 'import.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: "upload",      label: t(lang, 'import.stepFile') },
            { key: "preview",     label: t(lang, 'import.stepPreview') },
            { key: "processing",  label: t(lang, 'import.stepImport') },
            { key: "results",     label: t(lang, 'import.stepResults') },
          ].map((s, i, arr) => (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                step === s.key ? "bg-green-500 text-white shadow" :
                arr.findIndex(x => x.key === step) > i ? "bg-green-100 text-green-700" :
                "bg-slate-200 text-slate-500"
              }`}>
                {arr.findIndex(x => x.key === step) > i
                  ? <CheckCircle className="w-4 h-4" />
                  : <span className="w-4 h-4 text-center leading-4">{i + 1}</span>
                }
                {s.label}
              </div>
              {i < arr.length - 1 && <div className="flex-1 h-px bg-slate-300" />}
            </React.Fragment>
          ))}
        </div>

        {/* Info box */}
        {step === "upload" && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-4 pb-5">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="font-semibold text-blue-900 mb-3 text-sm">{t(lang, 'import.infoTitle')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    {/* CLUBS */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="font-bold text-blue-800 text-xs uppercase tracking-wide mb-2">🏟️ Clubs</p>
                      <p className="text-[11px] text-blue-700 mb-1.5 italic">
                        Détecté automatiquement si le fichier contient une colonne <strong>président</strong>, <strong>stade</strong>, <strong>budget</strong>, <strong>directeur_sportif</strong> ou <strong>entraîneur</strong>.
                        Vous pouvez aussi nommer l'onglet "Clubs".
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {["nom", "pays", "ville", "stade", "président", "email_président", "directeur_sportif", "entraîneur", "email_général", "tél_général", "site_web", "budget_transfert", "budget_annuel", "capacité_stade"].map(f => (
                          <span key={f} className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-mono">{f}</span>
                        ))}
                      </div>
                    </div>

                    {/* CONTACTS */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="font-bold text-orange-800 text-xs uppercase tracking-wide mb-2">👔 Contacts (staff / agents / dirigeants)</p>
                      <p className="text-[11px] text-orange-700 mb-1.5 italic">
                        Fichier par défaut si aucune colonne club n'est détectée.
                        Vous pouvez aussi nommer l'onglet "Contacts" ou "Staff".
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {["nom", "prénom", "poste", "club", "pays", "email", "téléphone", "whatsapp", "nationalité", "date_naissance", "instagram", "twitter", "valeur_marchande", "contrat_fin", "agent", "agence", "photo"].map(f => (
                          <span key={f} className="bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.5 rounded font-mono">{f}</span>
                        ))}
                      </div>
                    </div>

                  </div>
                  <p className="text-blue-600 text-[11px] mt-2.5 italic">{t(lang, 'import.infoAI')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main content */}
        {step === "upload" && (
          <ImportDropzone onExtracted={handleFileExtracted} />
        )}

        {step === "preview" && extractedData && (
          <ImportPreview
            data={extractedData}
            onConfirm={handleConfirmImport}
            onBack={handleReset}
          />
        )}

        {step === "processing" && (
          <Card className="text-center py-16">
            <CardContent>
              <RefreshCw className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t(lang, 'import.processingTitle')}</h2>
              <p className="text-slate-500">{t(lang, 'import.processingDesc')}</p>
              <p className="text-slate-400 text-xs mt-3">⏳ L'enrichissement IA peut prendre 1–2 minutes selon la taille du fichier</p>
            </CardContent>
          </Card>
        )}

        {step === "results" && results && (
          <ImportResults results={results} onReset={handleReset} />
        )}

        {/* History */}
        {step === "upload" && (
          <div className="mt-8">
            <ImportHistory />
          </div>
        )}
      </div>
    </div>
  );
}