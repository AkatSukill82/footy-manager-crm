import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, RefreshCw, AlertCircle } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../i18n/translations";

function predictRenewalOrTransfer(player) {
  const today = new Date();
  const contractEnd = player.contrat_fin ? new Date(player.contrat_fin) : null;
  const monthsLeft = contractEnd
    ? Math.max(0, (contractEnd - today) / (1000 * 60 * 60 * 24 * 30))
    : null;

  let transferScore = 0;
  let renewalScore = 0;
  const reasons = [];

  if (monthsLeft !== null) {
    if (monthsLeft < 6)  { transferScore += 35; reasons.push("predictive.reasonContract6m"); }
    else if (monthsLeft < 12) { transferScore += 20; reasons.push("predictive.reasonContract12m"); }
    else if (monthsLeft < 18) { transferScore += 10; reasons.push("predictive.reasonContract18m"); }
    else renewalScore += 15;
  }

  const age = player.age || 25;
  if (age >= 30) { transferScore += 15; reasons.push("predictive.reasonAge30"); }
  else if (age <= 23) { transferScore += 10; reasons.push("predictive.reasonYoungCoveted"); }
  else renewalScore += 10;

  if (player.valeur_marchande && player.valeur_marchande_peak) {
    const ratio = player.valeur_marchande / player.valeur_marchande_peak;
    if (ratio >= 0.9) { transferScore += 15; reasons.push("predictive.reasonPeakValue"); }
    else if (ratio < 0.6) renewalScore += 10;
  }

  if (player.note_moyenne >= 7.5) { transferScore += 10; reasons.push("predictive.reasonExcellentForm"); }
  else if (player.note_moyenne < 6.5) renewalScore += 5;

  const total = transferScore + renewalScore || 1;
  const transferPct = Math.round((transferScore / total) * 100);
  const renewalPct = 100 - transferPct;

  let statusKey, color, icon;
  if (transferPct >= 65) { statusKey = "predictive.transferLikely"; color = "text-orange-600"; icon = ArrowRightLeft; }
  else if (renewalPct >= 65) { statusKey = "predictive.renewalLikely"; color = "text-green-600"; icon = RefreshCw; }
  else { statusKey = "predictive.uncertain"; color = "text-slate-600"; icon = AlertCircle; }

  return { transferPct, renewalPct, statusKey, color, icon, reasons, monthsLeft };
}

export default function TransferRenewalPredictor({ players }) {
  const { lang } = useLanguage();

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
          {t(lang, 'predictive.transferProbTitle')}
        </CardTitle>
        <p className="text-xs text-slate-500">{t(lang, 'predictive.transferProbDesc')}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analyzed.map(player => {
            const { transferPct, renewalPct, statusKey, color, icon: Icon, reasons, monthsLeft } = player.pred;
            return (
              <div key={player.id} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{player.nom}</p>
                    <p className="text-xs text-slate-500">{player.poste} · {player.age} {t(lang, 'common.ageUnit')} · {player.club_actuel || "—"}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${color} flex-shrink-0`}>
                    <Icon className="w-3 h-3" />{t(lang, statusKey)}
                  </div>
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-orange-400 rounded-full transition-all"
                    style={{ width: `${transferPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                  <span>🔄 {t(lang, 'predictive.renewalLikely')} {renewalPct}%</span>
                  <span>{transferPct}% {t(lang, 'predictive.transferLikely')} ✈️</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {monthsLeft !== null && (
                    <Badge className={`text-[10px] border-0 px-1.5 py-0 ${monthsLeft < 12 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                      {monthsLeft < 1 ? t(lang, 'predictive.freeAgent') : t(lang, 'predictive.monthsContract', { count: Math.round(monthsLeft) })}
                    </Badge>
                  )}
                  {reasons.map((r, i) => (
                    <Badge key={i} className="bg-slate-100 text-slate-500 border-0 text-[10px] px-1.5 py-0">{t(lang, r)}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
          {analyzed.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">{t(lang, 'predictive.noDataPlayers')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
