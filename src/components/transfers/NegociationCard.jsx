import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const statutColors = {
  demande_initiale: "bg-blue-100 text-blue-800",
  en_negociation: "bg-yellow-100 text-yellow-800",
  offre_acceptee: "bg-green-100 text-green-800",
  offre_refusee: "bg-red-100 text-red-800",
  transfert_finalise: "bg-purple-100 text-purple-800",
  annule: "bg-slate-100 text-slate-800"
};

const prioriteColors = {
  haute: "bg-red-100 text-red-800",
  moyenne: "bg-yellow-100 text-yellow-800",
  basse: "bg-green-100 text-green-800"
};

export default function NegociationCard({ negociation, player, onUpdateStatus, onFinalize }) {
  const { lang } = useLanguage();
  const isExpired = negociation.date_limite && new Date(negociation.date_limite) < new Date();
  const canFinalize = negociation.statut === "offre_acceptee";

  const statutLabels = {
    demande_initiale: t(lang, 'alerts.statutInitiale'),
    en_negociation: t(lang, 'alerts.statutOngoing'),
    offre_acceptee: t(lang, 'alerts.statutAccepted'),
    offre_refusee: t(lang, 'alerts.statutRefused'),
    transfert_finalise: t(lang, 'alerts.statutFinalized'),
    annule: t(lang, 'alerts.statutCancelled'),
  };

  const prioriteLabels = {
    haute: t(lang, 'transfers.high'),
    moyenne: t(lang, 'transfers.medium'),
    basse: t(lang, 'transfers.low'),
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {player?.nom || t(lang, 'transfers.unknownPlayer')}
            </h3>
            <div className="flex gap-2 mb-2">
              <Badge className={statutColors[negociation.statut]}>
                {statutLabels[negociation.statut] || negociation.statut.replace(/_/g, ' ')}
              </Badge>
              {negociation.priorite && (
                <Badge className={prioriteColors[negociation.priorite]}>
                  {(prioriteLabels[negociation.priorite] || negociation.priorite).toUpperCase()}
                </Badge>
              )}
              {isExpired && (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {t(lang, 'transfers.expired')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{t(lang, 'transfers.sellerClubLabel')}</span>
            <span className="font-medium">{negociation.club_vendeur || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{t(lang, 'transfers.buyerClubLabel')}</span>
            <span className="font-medium">{negociation.club_acheteur}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{t(lang, 'transfers.offeredLabel')}</span>
            <span className="font-bold text-green-600">{negociation.montant_propose}M€</span>
          </div>
          {negociation.montant_demande && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">{t(lang, 'transfers.askedLabel')}</span>
              <span className="font-bold text-orange-600">{negociation.montant_demande}M€</span>
            </div>
          )}
        </div>

        {negociation.date_limite && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Calendar className="w-4 h-4" />
            {t(lang, 'transfers.deadlineLabel')} {format(new Date(negociation.date_limite), "dd/MM/yyyy")}
          </div>
        )}

        {negociation.notes_negociation && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-700">{negociation.notes_negociation}</p>
          </div>
        )}

        {negociation.statut !== "transfert_finalise" && negociation.statut !== "annule" && (
          <div className="flex gap-2 pt-3 border-t border-slate-200">
            {negociation.statut === "demande_initiale" && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(negociation.id, "en_negociation")}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                {t(lang, 'transfers.startNego')}
              </Button>
            )}
            {negociation.statut === "en_negociation" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(negociation.id, "offre_acceptee")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t(lang, 'transfers.accept')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus(negociation.id, "offre_refusee")}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {t(lang, 'transfers.refuse')}
                </Button>
              </>
            )}
            {canFinalize && (
              <Button
                size="sm"
                onClick={() => onFinalize(negociation)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {t(lang, 'transfers.finalize')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
