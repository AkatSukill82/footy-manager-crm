import React, { useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Bell, TrendingUp, AlertCircle, Sparkles, Users } from "lucide-react";

export default function NotificationSystem({ user }) {
  useEffect(() => {
    if (!user) return;

    // Écouter les nouvelles négociations
    const unsubscribeNegociations = base44.entities.TransferNegociation.subscribe((event) => {
      if (event.type === 'create') {
        toast.success(
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold">Nouvelle négociation</div>
              <div className="text-sm text-slate-600">
                {event.data.club_acheteur} - {event.data.montant_propose}M€
              </div>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else if (event.type === 'update' && event.data.statut === 'offre_acceptee') {
        toast.success(
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold">Offre acceptée !</div>
              <div className="text-sm text-slate-600">
                Négociation avec {event.data.club_acheteur}
              </div>
            </div>
          </div>,
          { duration: 6000 }
        );
      } else if (event.type === 'update' && event.data.statut === 'transfert_finalise') {
        toast.success(
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <div className="font-semibold">Transfert finalisé !</div>
              <div className="text-sm text-slate-600">
                {event.data.club_acheteur} - {event.data.montant_propose}M€
              </div>
            </div>
          </div>,
          { duration: 6000 }
        );
      }
    });

    // Écouter les nouveaux insights IA
    const unsubscribeInsights = base44.entities.AgentInsight.subscribe((event) => {
      if (event.type === 'create' && event.data.priority === 'haute') {
        toast.info(
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <div className="font-semibold">Nouvel insight IA</div>
              <div className="text-sm text-slate-600">
                {event.data.titre}
              </div>
            </div>
          </div>,
          { duration: 5000 }
        );
      }
    });

    // Écouter les nouveaux contenus partagés
    const unsubscribeSharedContent = base44.entities.SharedContent.subscribe((event) => {
      if (event.type === 'create') {
        toast.info(
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold">Nouveau contenu partagé</div>
              <div className="text-sm text-slate-600">
                {event.data.titre}
              </div>
            </div>
          </div>,
          { duration: 4000 }
        );
      }
    });

    // Écouter les nouveaux rappels urgents
    const unsubscribeReminders = base44.entities.Reminder.subscribe((event) => {
      if (event.type === 'create' && event.data.priorite === 'Haute') {
        const daysUntil = Math.floor(
          (new Date(event.data.date_rappel) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil <= 3) {
          toast.warning(
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <div className="font-semibold">Rappel urgent</div>
                <div className="text-sm text-slate-600">
                  {event.data.titre} - Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                </div>
              </div>
            </div>,
            { duration: 6000 }
          );
        }
      }
    });

    // Écouter les nouveaux joueurs ajoutés à la watchlist
    const unsubscribeWatchList = base44.entities.WatchList.subscribe((event) => {
      if (event.type === 'create') {
        toast.info(
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold">Ajouté à la watchlist</div>
              <div className="text-sm text-slate-600">
                Priorité: {event.data.priorite}
              </div>
            </div>
          </div>,
          { duration: 3000 }
        );
      }
    });

    // Nettoyage
    return () => {
      unsubscribeNegociations();
      unsubscribeInsights();
      unsubscribeSharedContent();
      unsubscribeReminders();
      unsubscribeWatchList();
    };
  }, [user]);

  return null; // Ce composant ne rend rien, il gère seulement les notifications
}