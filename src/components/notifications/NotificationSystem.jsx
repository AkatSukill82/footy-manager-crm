import React, { useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Bell, TrendingUp, AlertCircle, Sparkles, Users, Clock, FileText } from "lucide-react";
import { differenceInDays } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function NotificationSystem({ user }) {
  const { lang } = useLanguage();

  useEffect(() => {
    if (!user) return;

    const unsubNeg = base44.entities.TransferNegociation.subscribe((event) => {
      if (event.type === 'create') {
        toast.success(
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">{t(lang, 'notifications.newNegotiation')}</div>
              <div className="text-xs text-slate-600">{event.data.club_acheteur} — {event.data.montant_propose}M€</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else if (event.type === 'update') {
        if (event.data.statut === 'offre_acceptee') {
          toast.success(
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">{t(lang, 'notifications.offerAccepted')}</div>
                <div className="text-xs text-slate-600">{event.data.club_acheteur}</div>
              </div>
            </div>,
            { duration: 6000 }
          );
        } else if (event.data.statut === 'transfert_finalise') {
          toast.success(
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">{t(lang, 'notifications.transferFinalized')}</div>
                <div className="text-xs text-slate-600">{event.data.club_acheteur} — {event.data.montant_propose}M€</div>
              </div>
            </div>,
            { duration: 6000 }
          );
        } else if (event.data.statut === 'offre_refusee') {
          toast.error(
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">{t(lang, 'notifications.offerRefused')}</div>
                <div className="text-xs text-slate-600">{event.data.club_acheteur}</div>
              </div>
            </div>,
            { duration: 5000 }
          );
        }
      }
    });

    const unsubInsights = base44.entities.AgentInsight.subscribe((event) => {
      if (event.type === 'create' && event.data.priority === 'haute') {
        toast.info(
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">{t(lang, 'notifications.newInsight')}</div>
              <div className="text-xs text-slate-600">{event.data.titre}</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      }
    });

    const unsubShared = base44.entities.SharedContent.subscribe((event) => {
      if (event.type === 'create') {
        toast.info(
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">{t(lang, 'notifications.newSharedContent')}</div>
              <div className="text-xs text-slate-600">{event.data.titre}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
      }
    });

    const unsubReminders = base44.entities.Reminder.subscribe((event) => {
      if (event.type === 'create') {
        const daysUntil = differenceInDays(new Date(event.data.date_rappel), new Date());
        if (daysUntil <= 3 || event.data.priorite === 'Haute') {
          const isLate = daysUntil < 0;
          toast.warning(
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">
                  {isLate ? t(lang, 'notifications.reminderLate') : t(lang, 'notifications.reminderUrgent')}
                </div>
                <div className="text-xs text-slate-600">
                  {event.data.titre}
                  {daysUntil >= 0
                    ? ` — ${t(lang, 'notifications.daysLeft', { n: daysUntil })}`
                    : ` — ${t(lang, 'notifications.late')}`}
                </div>
              </div>
            </div>,
            { duration: 6000 }
          );
        }
      }
    });

    const unsubPlayers = base44.entities.Player.subscribe((event) => {
      if (event.type === 'create' && event.data.contrat_fin) {
        const daysLeft = differenceInDays(new Date(event.data.contrat_fin), new Date());
        if (daysLeft <= 90 && daysLeft >= 0) {
          toast.warning(
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">{t(lang, 'notifications.contractExpiring')}</div>
                <div className="text-xs text-slate-600">
                  {event.data.nom} — {t(lang, 'notifications.daysRemaining', { n: daysLeft })}
                </div>
              </div>
            </div>,
            { duration: 5000 }
          );
        }
      }
    });

    const unsubWatchList = base44.entities.WatchList.subscribe((event) => {
      if (event.type === 'create') {
        toast.info(
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">{t(lang, 'notifications.addedWatchlist')}</div>
              <div className="text-xs text-slate-600">{t(lang, 'notifications.priorityLabel')} {event.data.priorite}</div>
            </div>
          </div>,
          { duration: 3000 }
        );
      }
    });

    return () => {
      unsubNeg();
      unsubInsights();
      unsubShared();
      unsubReminders();
      unsubPlayers();
      unsubWatchList();
    };
  }, [user, lang]);

  return null;
}
