import React, { useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Bell, TrendingUp, AlertCircle, Sparkles, Users, Clock, FileText } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function NotificationSystem({ user }) {
  useEffect(() => {
    if (!user) return;

    // Négociations de transfert
    const unsubNeg = base44.entities.TransferNegociation.subscribe((event) => {
      if (event.type === 'create') {
        toast.success(
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Nouvelle négociation</div>
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
                <div className="font-semibold text-sm">Offre acceptée !</div>
                <div className="text-xs text-slate-600">Négociation avec {event.data.club_acheteur}</div>
              </div>
            </div>,
            { duration: 6000 }
          );
        } else if (event.data.statut === 'transfert_finalise') {
          toast.success(
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Transfert finalisé !</div>
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
                <div className="font-semibold text-sm">Offre refusée</div>
                <div className="text-xs text-slate-600">Négociation avec {event.data.club_acheteur}</div>
              </div>
            </div>,
            { duration: 5000 }
          );
        }
      }
    });

    // Insights IA haute priorité
    const unsubInsights = base44.entities.AgentInsight.subscribe((event) => {
      if (event.type === 'create' && event.data.priority === 'haute') {
        toast.info(
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Nouvel insight IA</div>
              <div className="text-xs text-slate-600">{event.data.titre}</div>
            </div>
          </div>,
          { duration: 5000 }
        );
      }
    });

    // Contenus partagés
    const unsubShared = base44.entities.SharedContent.subscribe((event) => {
      if (event.type === 'create') {
        toast.info(
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Nouveau contenu partagé</div>
              <div className="text-xs text-slate-600">{event.data.titre}</div>
            </div>
          </div>,
          { duration: 4000 }
        );
      }
    });

    // Rappels urgents
    const unsubReminders = base44.entities.Reminder.subscribe((event) => {
      if (event.type === 'create') {
        const daysUntil = differenceInDays(new Date(event.data.date_rappel), new Date());
        if (daysUntil <= 3 || event.data.priorite === 'Haute') {
          toast.warning(
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Rappel {daysUntil < 0 ? "en retard" : "urgent"}</div>
                <div className="text-xs text-slate-600">
                  {event.data.titre}
                  {daysUntil >= 0 ? ` — J-${daysUntil}` : " — En retard !"}
                </div>
              </div>
            </div>,
            { duration: 6000 }
          );
        }
      }
    });

    // Contrats bientôt expirés (nouveaux joueurs ajoutés)
    const unsubPlayers = base44.entities.Player.subscribe((event) => {
      if (event.type === 'create' && event.data.contrat_fin) {
        const daysLeft = differenceInDays(new Date(event.data.contrat_fin), new Date());
        if (daysLeft <= 90 && daysLeft >= 0) {
          toast.warning(
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Contrat bientôt expiré</div>
                <div className="text-xs text-slate-600">{event.data.nom} — {daysLeft} jours restants</div>
              </div>
            </div>,
            { duration: 5000 }
          );
        }
      }
    });

    // Watchlist
    const unsubWatchList = base44.entities.WatchList.subscribe((event) => {
      if (event.type === 'create') {
        toast.info(
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Ajouté à la watchlist</div>
              <div className="text-xs text-slate-600">Priorité: {event.data.priorite}</div>
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
  }, [user]);

  return null;
}