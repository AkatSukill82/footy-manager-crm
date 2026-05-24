import React from "react";
import { CheckCircle, AlertCircle, Users, Building2, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ImportResults({ results, onReset }) {
  const { joueurs_crees = 0, joueurs_mis_a_jour = 0, clubs_crees = 0, clubs_mis_a_jour = 0, erreurs = [], details = [] } = results || {};
  const totalSuccess = joueurs_crees + joueurs_mis_a_jour + clubs_crees + clubs_mis_a_jour;

  return (
    <div>
      {/* Summary */}
      <div className={`rounded-2xl p-6 mb-6 ${erreurs.length === 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
        <div className="flex items-center gap-3 mb-4">
          {erreurs.length === 0
            ? <CheckCircle className="w-8 h-8 text-green-600" />
            : <AlertCircle className="w-8 h-8 text-yellow-600" />
          }
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {erreurs.length === 0 ? "Import réussi !" : "Import terminé avec avertissements"}
            </h2>
            <p className="text-slate-500 text-sm">{totalSuccess} enregistrement{totalSuccess > 1 ? "s" : ""} traité{totalSuccess > 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Joueurs créés", value: joueurs_crees, icon: Plus, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Joueurs mis à jour", value: joueurs_mis_a_jour, icon: RefreshCw, color: "text-indigo-600", bg: "bg-indigo-100" },
            { label: "Clubs créés", value: clubs_crees, icon: Plus, color: "text-purple-600", bg: "bg-purple-100" },
            { label: "Clubs mis à jour", value: clubs_mis_a_jour, icon: RefreshCw, color: "text-violet-600", bg: "bg-violet-100" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail lines */}
      {details.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Détail des opérations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {details.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-slate-100 last:border-0">
                  <Badge variant={d.action === "créé" ? "default" : "secondary"} className="text-xs shrink-0">
                    {d.action}
                  </Badge>
                  <span className="text-slate-700">{d.nom}</span>
                  <span className="text-slate-400 text-xs ml-auto">{d.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {erreurs.length > 0 && (
        <Card className="mb-4 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {erreurs.length} erreur{erreurs.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {erreurs.map((e, i) => (
                <div key={i} className="text-sm text-red-600 py-1 border-b border-red-100 last:border-0">{e}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={onReset} variant="outline" className="gap-2">
        <RotateCcw className="w-4 h-4" /> Nouvel import
      </Button>
    </div>
  );
}