import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Building2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const DATE_LOCALES = { fr, es, en: enUS };

const typeColors = {
  "Transfert définitif": "bg-blue-100 text-blue-800",
  "Prêt": "bg-yellow-100 text-yellow-800",
  "Libre": "bg-green-100 text-green-800",
  "Fin de prêt": "bg-purple-100 text-purple-800"
};

export default function PlayerTransferHistory({ player, transfers }) {
  const { lang } = useLanguage();

  const playerTransfers = transfers
    .filter(tr => tr.player_id === player.id)
    .sort((a, b) => new Date(b.date_transfert) - new Date(a.date_transfert));

  const totalTransferValue = playerTransfers.reduce((sum, tr) => sum + (tr.montant || 0), 0);
  const transferCount = playerTransfers.length;
  const avgTransferValue = transferCount > 0 ? totalTransferValue / transferCount : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t(lang, 'transfers.playerHistoryTitle', { name: player.nom })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {playerTransfers.length === 0 ? (
          <p className="text-center text-slate-500 py-8">{t(lang, 'transfers.noTransfersPlayer')}</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{transferCount}</div>
                <div className="text-sm text-slate-600 mt-1">{t(lang, 'transfers.transferCount')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{totalTransferValue.toFixed(1)}M€</div>
                <div className="text-sm text-slate-600 mt-1">{t(lang, 'transfers.totalValueLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{avgTransferValue.toFixed(1)}M€</div>
                <div className="text-sm text-slate-600 mt-1">{t(lang, 'transfers.averageLabel')}</div>
              </div>
            </div>

            <div className="space-y-4">
              {playerTransfers.map((transfer) => (
                <div key={transfer.id} className="relative pl-8 pb-4 border-l-2 border-slate-200 last:border-l-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-slate-900 rounded-full"></div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-slate-900">
                          {format(new Date(transfer.date_transfert), "dd MMMM yyyy", { locale: DATE_LOCALES[lang] || fr })}
                        </span>
                      </div>
                      <Badge className={typeColors[transfer.type_transfert]}>
                        {transfer.type_transfert}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Building2 className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-slate-900">
                          {transfer.club_depart || t(lang, 'transfers.freeLabel')}
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-medium text-slate-900">
                          {transfer.club_arrivee}
                        </span>
                        <Building2 className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>

                    {transfer.montant && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{t(lang, 'transfers.transferAmountLabel')}</span>
                          <span className="text-lg font-bold text-green-600">
                            {transfer.montant}M€
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
