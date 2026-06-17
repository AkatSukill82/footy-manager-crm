import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const STATUT_LABEL = {
  demande_initiale: "Initiale",
  en_negociation: "En cours",
  offre_acceptee: "Acceptée",
  offre_refusee: "Refusée",
  transfert_finalise: "Finalisé",
  annule: "Annulé",
};

const STATUT_STYLE = {
  demande_initiale: "bg-slate-100 text-slate-600",
  en_negociation: "bg-blue-50 text-blue-700",
  offre_acceptee: "bg-emerald-50 text-emerald-700",
  offre_refusee: "bg-red-50 text-red-600",
  transfert_finalise: "bg-slate-900 text-white",
  annule: "bg-slate-100 text-slate-400",
};

const PRIORITE_DOT = {
  haute: "bg-red-500",
  moyenne: "bg-orange-400",
  basse: "bg-slate-300",
};

export default function NegociationCard({ negociation, player, onUpdateStatus, onFinalize }) {
  const { lang } = useLanguage();
  const isExpired = negociation.date_limite && new Date(negociation.date_limite) < new Date();
  const canFinalize = negociation.statut === "offre_acceptee";
  const hasFinancialTerms = negociation.clause_revente || negociation.bonus_performance || negociation.commission_agent;

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Top stripe */}
      <div className="h-0.5 bg-slate-100" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-base truncate">
              {player?.nom || t(lang, 'transfers.unknownPlayer')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {negociation.club_vendeur || "—"} → {negociation.club_acheteur}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {negociation.priorite && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITE_DOT[negociation.priorite] || "bg-slate-300"}`} />
            )}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUT_STYLE[negociation.statut] || "bg-slate-100 text-slate-600"}`}>
              {STATUT_LABEL[negociation.statut] || negociation.statut}
            </span>
            {isExpired && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />Expiré
              </span>
            )}
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Proposé</p>
            <p className="font-bold text-slate-900 text-sm">{negociation.montant_propose}M€</p>
          </div>
          {negociation.montant_demande ? (
            <div className="bg-slate-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Demandé</p>
              <p className="font-bold text-slate-900 text-sm">{negociation.montant_demande}M€</p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-center">
              <p className="text-[11px] text-slate-300">—</p>
            </div>
          )}
        </div>

        {/* Financial deal terms */}
        {hasFinancialTerms && (
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {negociation.clause_revente != null && (
              <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                Revente {negociation.clause_revente}%
              </span>
            )}
            {negociation.bonus_performance != null && (
              <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                Bonus {negociation.bonus_performance}M€
              </span>
            )}
            {negociation.commission_agent != null && (
              <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                Agent {negociation.commission_agent}%
              </span>
            )}
          </div>
        )}

        {/* Deadline */}
        {negociation.date_limite && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
            <Calendar className="w-3 h-3" />
            Deadline : {format(new Date(negociation.date_limite), "dd/MM/yyyy")}
          </div>
        )}

        {/* Notes */}
        {negociation.notes_negociation && (
          <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-3 line-clamp-2">
            {negociation.notes_negociation}
          </p>
        )}

        {/* Actions */}
        {negociation.statut !== "transfert_finalise" && negociation.statut !== "annule" && (
          <div className="flex gap-2 pt-3 border-t border-slate-50">
            {negociation.statut === "demande_initiale" && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(negociation.id, "en_negociation")}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                {t(lang, 'transfers.startNego')}
              </Button>
            )}
            {negociation.statut === "en_negociation" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(negociation.id, "offre_acceptee")}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  {t(lang, 'transfers.accept')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(negociation.id, "offre_refusee")}
                  className="flex-1 h-8 text-xs border-slate-200"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  {t(lang, 'transfers.refuse')}
                </Button>
              </>
            )}
            {canFinalize && (
              <Button
                size="sm"
                onClick={() => onFinalize(negociation)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs"
              >
                {t(lang, 'transfers.finalize')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
