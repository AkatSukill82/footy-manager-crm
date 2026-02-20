import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

function predictRenewalOrTransfer(player) {
  const today = new Date();
  const contractEnd = player.contrat_fin ? new Date(player.contrat_fin) : null;
  const monthsLeft = contractEnd
    ? Math.max(0, (contractEnd - today) / (1000 * 60 * 60 * 24 * 30))
    : null;

  let transferScore = 0;
  let renewalScore = 0;
  const reasons = [];

  // Contrat
  if (monthsLeft !== null) {
    if (monthsLeft < 6) { transferScore += 35; reasons.push("Contrat < 6 mois"); }
    else if (monthsLeft < 12) { transferScore += 20; reasons.push("Contrat < 1 an"); }
    else if (monthsLeft < 18) { transferScore += 10; reasons.push("Contrat < 18 mois"); }
    else renewalScore += 15;
  }

  // Âge
  const age = player.age || 25;
  if (age >= 30) { transferScore += 15; reasons.push("30 ans ou +"); }
  else if (age <= 23) { transferScore += 10; reasons.push("Jeune talent convoité"); }
  else renewalScore += 10;

  // Valeur vs peak
  if (player.valeur_marchande && player.valeur_marchande_peak) {
    const ratio = player.valeur_marchande / player.valeur_marchande_peak;
    if (ratio >= 0.9) { transferScore += 15; reasons.push("Au sommet de sa valeur"); }
    else if (ratio < 0.6) renewalScore += 10;
  }

  // Note SofaScore
  if (player.note_moyenne >= 7.5) { transferScore += 10; reasons.push("Excellente forme"); }
  else if (player.note_moyenne < 6.5) renewalScore += 5;

  const total = transferScore + renewalScore || 1;
  const transferPct = Math.round((transferScore / total) * 100);
  const renewalPct = 100 - transferPct;

  let status, color, icon;
  if (transferPct >= 65) { status = "Transfert probable"; color = "text-orange-600"; icon = ArrowRightLeft; }
  else if (renewalPct >= 65) { status = "Renouvellement probable"; color = "text-green-600"; icon = RefreshCw; }
  else { status = "Incertain"; color = "text-slate-600"; icon = AlertCircle; }

  return { transferPct, renewalPct, status, color, icon, reasons, monthsLeft };
}

export default function TransferRenewalPredictor({ players }) {
  const analyzed = players
    .filter(p => p.contrat_fin || p.age)
    .map(p => ({ ...p, pred: predictRenewalOrTransfer(p) }))
    .sort((a, b) => b.pred.transferPct - a.pred.transferPct)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="w-4 h-4 text-orange-500" />
          Probabilité transfert / renouvellement
        </CardTitle>
        <p className="text-xs text-slate-500">Estimation basée sur l'âge, le contrat, la valeur et la forme</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analyzed.map(player => {
            const { transferPct, renewalPct, status, color, icon: Icon, reasons, monthsLeft } = player.pred;
            return (
              <div key={player.id} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{player.nom}</p>
                    <p className="text-xs text-slate-500">{player.poste} · {player.age} ans · {player.club_actuel || "—"}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${color} flex-shrink-0`}>
                    <Icon className="w-3 h-3" />{status}
                  </div>
                </div>

                {/* Barre de probabilité */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-orange-400 rounded-full transition-all"
                    style={{ width: `${transferPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                  <span>🔄 Renouvellement {renewalPct}%</span>
                  <span>{transferPct}% Transfert ✈️</span>
                </div>

                {/* Tags raisons */}
                <div className="flex flex-wrap gap-1">
                  {monthsLeft !== null && (
                    <Badge className={`text-[10px] border-0 px-1.5 py-0 ${monthsLeft < 12 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                      {monthsLeft < 1 ? "Libre !" : `${Math.round(monthsLeft)}m contrat`}
                    </Badge>
                  )}
                  {reasons.map((r, i) => (
                    <Badge key={i} className="bg-slate-100 text-slate-500 border-0 text-[10px] px-1.5 py-0">{r}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
          {analyzed.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Aucun joueur avec suffisamment de données.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}