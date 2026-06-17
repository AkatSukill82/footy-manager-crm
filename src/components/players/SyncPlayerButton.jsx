import React, { useState, useEffect, useRef } from "react";
import { invokeFn } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";

// Champs de stats appliqués automatiquement (pas l'identité, pour ne pas écraser)
const STATS_FIELDS = new Set([
  "matchs_joues", "titularisations", "minutes_jouees", "note_moyenne",
  "buts", "passes_decisives", "xg", "xa", "tirs", "tirs_cadres", "tirs_cadres_pct",
  "grandes_chances", "grandes_chances_manquees", "penaltys_marques",
  "passes_reussies", "passes_reussies_pct", "passes_cles", "passes_longues_pct",
  "centres", "centres_reussis_pct",
  "dribbles_reussis", "dribbles_tentes", "dribbles_pct", "touches_balle", "pertes_balle",
  "duels_gagnes_pct", "duels_aeriens_pct",
  "tacles", "interceptions", "degagements", "recuperations",
  "cartons_jaunes", "cartons_rouges", "fautes_commises", "fautes_subies", "hors_jeu",
  "arrets", "buts_encaisses", "clean_sheets",
  "club_actuel", "ligue", "sofascore_id",
]);

// Anti-spam : on ne re-synchronise pas un joueur déjà synchro il y a moins de 6h
const SYNC_TTL = 1000 * 60 * 60 * 6;
const syncedRecently = (id) => {
  try {
    const ts = Number(localStorage.getItem(`fdm_sync_${id}`));
    return ts && Date.now() - ts < SYNC_TTL;
  } catch { return false; }
};
const markSynced = (id) => { try { localStorage.setItem(`fdm_sync_${id}`, String(Date.now())); } catch { /* quota */ } };

export default function SyncPlayerButton({ player, onApply }) {
  const [state, setState] = useState("idle"); // idle | loading | applied | done
  const [count, setCount] = useState(0);
  const ranFor = useRef(null);

  useEffect(() => {
    if (!player?.id || !player?.nom) return;
    if (ranFor.current === player.id) return;     // déjà lancé pour ce joueur ce montage
    ranFor.current = player.id;
    if (syncedRecently(player.id)) return;          // synchro récente → on ne refait pas

    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const [tmRes, fmRes, ssRes] = await Promise.allSettled([
          invokeFn("transfermarktProxy", { action: "searchAndGet",      query: player.nom }),
          invokeFn("fotmobProxy",        { action: "searchAndGetStats", query: player.nom, club: player.club_actuel }),
          invokeFn("sofascoreProxy",     { action: "searchAndGetStats", query: player.nom, club: player.club_actuel }),
        ]);
        if (cancelled) return;

        const tm = tmRes.status === "fulfilled" && tmRes.value?.ok ? tmRes.value.player : null;
        const fm = fmRes.status === "fulfilled" && fmRes.value?.ok ? fmRes.value.stats  : null;
        const ss = ssRes.status === "fulfilled" && ssRes.value?.ok ? ssRes.value.stats  : null;

        const flat = {
          sofascore_id:     ss?.sofascore_id,
          club_actuel:      tm?.club_actuel,
          ligue:            tm?.ligue,
          // Synthèse
          matchs_joues:     ss?.matchs_joues     ?? fm?.matchs_joues,
          titularisations:  fm?.titularisations,
          minutes_jouees:   ss?.minutes_jouees   ?? fm?.minutes_jouees,
          note_moyenne:     ss?.note_moyenne     ?? fm?.note_fotmob,
          // Offensif
          buts:             ss?.buts             ?? fm?.buts,
          passes_decisives: ss?.passes_decisives ?? fm?.passes_decisives,
          xg:               ss?.xg,
          xa:               ss?.xa,
          tirs:             ss?.tirs             ?? fm?.tirs,
          tirs_cadres:      ss?.tirs_cadres,
          tirs_cadres_pct:  ss?.tirs_cadres_pct,
          grandes_chances:          ss?.grandes_chances,
          grandes_chances_manquees: ss?.grandes_chances_manquees,
          penaltys_marques: ss?.penaltys_marques,
          // Passes
          passes_reussies:     ss?.passes_reussies,
          passes_reussies_pct: ss?.passes_reussies_pct,
          passes_cles:         ss?.passes_cles ?? fm?.passes_cles,
          passes_longues_pct:  ss?.passes_longues_pct,
          centres:             ss?.centres,
          centres_reussis_pct: ss?.centres_reussis_pct,
          // Dribbles / possession
          dribbles_reussis: ss?.dribbles_reussis ?? fm?.dribbles_reussis,
          dribbles_tentes:  ss?.dribbles_tentes,
          dribbles_pct:     ss?.dribbles_pct,
          touches_balle:    ss?.touches_balle,
          pertes_balle:     ss?.pertes_balle,
          duels_gagnes_pct:  ss?.duels_gagnes_pct,
          duels_aeriens_pct: ss?.duels_aeriens_pct,
          // Défensif
          tacles:           ss?.tacles        ?? fm?.tacles,
          interceptions:    ss?.interceptions ?? fm?.interceptions,
          degagements:      ss?.degagements,
          recuperations:    ss?.recuperations,
          // Discipline
          cartons_jaunes:   ss?.cartons_jaunes ?? fm?.cartons_jaunes,
          cartons_rouges:   ss?.cartons_rouges ?? fm?.cartons_rouges,
          fautes_commises:  ss?.fautes_commises,
          fautes_subies:    ss?.fautes_subies,
          hors_jeu:         ss?.hors_jeu,
          // Gardien
          arrets:           ss?.arrets,
          buts_encaisses:   ss?.buts_encaisses,
          clean_sheets:     ss?.clean_sheets,
        };

        // N'appliquer que les champs stats qui changent réellement
        const toApply = {};
        Object.entries(flat).forEach(([k, v]) => {
          if (!STATS_FIELDS.has(k)) return;
          if (v != null && v !== "" && String(v) !== String(player[k] ?? "")) toApply[k] = v;
        });

        markSynced(player.id);

        if (Object.keys(toApply).length > 0) {
          onApply(toApply);
          if (!cancelled) { setCount(Object.keys(toApply).length); setState("applied"); }
          setTimeout(() => !cancelled && setState("done"), 3000);
        } else {
          setState("done");
        }
      } catch {
        if (!cancelled) setState("done"); // échec silencieux
      }
    })();

    return () => { cancelled = true; };
  }, [player?.id, player?.nom]);

  // Discret : un indicateur transitoire pendant/juste après la synchro, puis rien.
  if (state === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mise à jour des stats…
      </span>
    );
  }
  if (state === "applied") {
    return (
      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" /> {count} stat{count > 1 ? "s" : ""} mise{count > 1 ? "s" : ""} à jour
      </Badge>
    );
  }
  return null; // disparaît une fois terminé
}
