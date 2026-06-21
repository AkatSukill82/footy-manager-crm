import React, { useState, useEffect, useRef } from "react";
import { invokeFn } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

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
  "club_actuel", "ligue",
  "sofascore_id", "fotmob_id", "besoccer_id", "transfermarkt_id",
]);

// Champs de stats pures (hors identité/IDs) — alimentés depuis UNE seule source
// primaire pour garder une ligne de stats cohérente (même périmètre partout).
const STAT_ONLY_FIELDS = [
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
];

// Une source a-t-elle de vraies stats saison (pas juste un objet vide) ?
const hasStats = (s) =>
  !!s && (s.matchs_joues != null || s.buts != null || s.minutes_jouees != null);

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
  const { lang } = useLanguage();
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
        // Indices d'identité passés à chaque source pour fiabiliser le matching.
        const club        = player.club_actuel || undefined;
        const nationality = player.nationalite || undefined;
        const age         = player.age || undefined;
        const birthYear   = player.date_naissance
          ? parseInt(String(player.date_naissance).slice(0, 4)) || undefined
          : undefined;

        // Réutiliser un ID déjà résolu (getStats/getPlayer par ID) plutôt que de
        // refaire une recherche par nom fragile qui peut re-binder un autre joueur.
        const tmCall = player.transfermarkt_id
          ? invokeFn("transfermarktProxy", { action: "getPlayer", transfermarkt_url: `https://www.transfermarkt.com/-/profil/spieler/${player.transfermarkt_id}` })
          : invokeFn("transfermarktProxy", { action: "searchAndGet", query: player.nom, club });
        const fmCall = player.fotmob_id
          ? invokeFn("fotmobProxy", { action: "getStats", fotmob_id: player.fotmob_id })
          : invokeFn("fotmobProxy", { action: "searchAndGetStats", query: player.nom, club });
        const ssCall = player.sofascore_id
          ? invokeFn("sofascoreProxy", { action: "getStats", sofascore_id: player.sofascore_id })
          : invokeFn("sofascoreProxy", { action: "searchAndGetStats", query: player.nom, club, nationality, birthYear });
        const bsCall = invokeFn("besoccerProxy", { action: "searchAndGetPlayer", query: player.nom, club, nationality, age });

        const [tmRes, fmRes, ssRes, bsRes] = await Promise.allSettled([tmCall, fmCall, ssCall, bsCall]);
        if (cancelled) return;

        const val = (r) => (r.status === "fulfilled" && r.value?.ok ? r.value : null);
        const tmV = val(tmRes), fmV = val(fmRes), ssV = val(ssRes), bsV = val(bsRes);

        // On ne fait confiance à une source que si elle a été résolue par un ID
        // connu (pas de recherche par nom → confiance 1) OU si la confiance du
        // match nom/club dépasse le seuil. Sinon : match probablement faux, on
        // l'ignore complètement (ni stats, ni identité, ni ID persisté).
        const MIN_CONF = 0.55;
        const trusted = (v, knownId) => v && (knownId ? 1 : (v.confidence ?? 0)) >= MIN_CONF;

        const tm = trusted(tmV, player.transfermarkt_id) ? tmV.player : null;
        const fm = trusted(fmV, player.fotmob_id)        ? fmV.stats  : null;
        const ss = trusted(ssV, player.sofascore_id)     ? ssV.stats  : null;
        const bs = trusted(bsV, null)                    ? bsV.player : null;

        // Normaliser le nom de la note FotMob vers le champ commun.
        if (fm && fm.note_moyenne == null && fm.note_fotmob != null) fm.note_moyenne = fm.note_fotmob;

        // ── Source primaire UNIQUE pour les stats ──────────────────────────────
        // SofaScore (le plus riche, périmètre saison/toutes compétitions) ; sinon
        // FotMob (même périmètre) ; sinon BeSoccer (basiques). On ne mélange pas
        // les sources champ par champ → ligne de stats cohérente, même périmètre.
        const primary = hasStats(ss) ? ss : hasStats(fm) ? fm : hasStats(bs) ? bs : null;

        const flat = {
          // Identité : Transfermarkt prioritaire, BeSoccer en complément.
          club_actuel: tm?.club_actuel || bs?.club_actuel,
          ligue:       bs?.ligue || tm?.ligue,
          // IDs résolus → réutilisés à la prochaine synchro (plus de recherche par nom).
          sofascore_id: ss?.sofascore_id,
          fotmob_id:    fm?.fotmob_id,
          besoccer_id:  bs?.besoccer_id,
          transfermarkt_id: tm?.transfermarkt_id,
        };

        // Toutes les stats proviennent de la même source primaire.
        if (primary) {
          for (const k of STAT_ONLY_FIELDS) flat[k] = primary[k];
        }

        // N'appliquer que les champs stats qui changent réellement
        const toApply = {};
        Object.entries(flat).forEach(([k, v]) => {
          if (!STATS_FIELDS.has(k)) return;
          if (v != null && v !== "" && String(v) !== String(player[k] ?? "")) toApply[k] = v;
        });

        // ── Détection auto du PRÊT via l'historique Transfermarkt ──────────────
        // Si le transfert le plus récent est un "Prêt" (sans "Fin de prêt" après),
        // le joueur est actuellement en prêt → club propriétaire = club de départ.
        if (tm) {
          try {
            const trRes = await invokeFn("transfermarktProxy",
              player.transfermarkt_id
                ? { action: "getTransfers", transfermarkt_id: player.transfermarkt_id }
                : { action: "getTransfers", query: player.nom });
            const transfers = trRes?.ok ? (trRes.transfers || []) : [];
            if (!cancelled && transfers.length) {
              const latest = [...transfers].sort(
                (a, b) => String(b.date_transfert).localeCompare(String(a.date_transfert))
              )[0];
              const onLoan = latest?.type_transfert === "Prêt";
              if (onLoan) {
                if (!player.en_pret) toApply.en_pret = true;
                if (latest.club_depart && latest.club_depart !== player.club_proprietaire)
                  toApply.club_proprietaire = latest.club_depart;
              } else if (player.en_pret) {
                toApply.en_pret = false; // prêt terminé d'après Transfermarkt
              }
            }
          } catch { /* non bloquant */ }
        }

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
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t(lang, "session.sync.updating")}
      </span>
    );
  }
  if (state === "applied") {
    return (
      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" /> {t(lang, "session.sync.updated", { count })}
      </Badge>
    );
  }
  return null; // disparaît une fois terminé
}
