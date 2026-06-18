import React, { useState, useEffect, useRef } from "react";
import { invokeFn } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Loader2, RefreshCw, ExternalLink, AlertCircle, Activity, Check, Download } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

// Groupes d'affichage : clé i18n du groupe + liste des clés de stats.
// Les libellés sont traduits via session.fotmob.l.<clé>.
// Structure calquée sur le panneau "Performances de la saison" de FotMob.
const GROUPS = [
  { key: "gSynth", items: ["matchs_joues", "titularisations", "minutes_jouees", "note_moyenne"] },
  { key: "gShot",  items: ["buts", "xg", "xgot", "xg_hors_penalty", "tirs", "tirs_cadres"] },
  { key: "gPass",  items: ["passes_decisives", "xa", "passes_reussies", "passes_reussies_pct", "passes_longues", "passes_longues_pct", "passes_cles", "grandes_chances", "centres", "centres_reussis_pct"] },
  { key: "gPoss",  items: ["duels_gagnes", "duels_gagnes_pct", "touches_balle", "touches_surface_adverse", "pertes_balle", "fautes_subies"] },
  { key: "gDef",   items: ["actions_defensives", "interceptions", "tacles", "recuperations", "dribbles_subis", "degagements", "buts_encaisses_terrain", "xg_concede_terrain"] },
  { key: "gDisc",  items: ["cartons_jaunes", "cartons_rouges"] },
  { key: "gGk",    items: ["arrets", "arrets_pct", "buts_encaisses", "clean_sheets", "sorties_reussies"] },
];
const SUFFIX = {
  minutes_jouees: "'",
  tirs_cadres_pct: "%", passes_reussies_pct: "%", passes_longues_pct: "%",
  centres_reussis_pct: "%", duels_gagnes_pct: "%", dribbles_pct: "%", arrets_pct: "%",
};

// Champs réellement écrits dans l'entité Player lors de l'application.
const APPLY_FIELDS = GROUPS.flatMap(g => g.items);

export default function PlayerFotmobStats({ player, onApply }) {
  const { lang } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);
  // Évite de relancer le chargement auto plusieurs fois pour le même joueur.
  const autoLoadedFor = useRef(null);

  // Chargement automatique à l'ouverture de la fiche (une fois par joueur).
  // Ancré sur player.id (stable) pour éviter de relancer après l'auto-application.
  useEffect(() => {
    const key = player?.id || player?.nom;
    if (!key || autoLoadedFor.current === key) return;
    autoLoadedFor.current = key;
    fetchStats({ auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  if (!player?.nom) return null;

  // Construit le payload complet des stats à écrire dans l'entité Player.
  const buildPayload = (s) => {
    const data = {};
    for (const k of APPLY_FIELDS) {
      if (s[k] != null && s[k] !== "") data[k] = s[k];
    }
    if (s.fotmob_id) data.fotmob_id = s.fotmob_id;
    return data;
  };

  // Ne garde que les champs dont la valeur a changé par rapport à la fiche actuelle.
  const changedPayload = (s) => {
    const full = buildPayload(s);
    const diff = {};
    for (const k of Object.keys(full)) {
      if (String(full[k]) !== String(player?.[k] ?? "")) diff[k] = full[k];
    }
    return diff;
  };

  const fetchStats = async ({ auto = false } = {}) => {
    setLoading(true);
    setError(null);
    setApplied(false);
    try {
      const res = player.fotmob_id
        ? await invokeFn("fotmobProxy", { action: "getStats", fotmob_id: player.fotmob_id })
        : await invokeFn("fotmobProxy", { action: "searchAndGetStats", query: player.nom, club: player.club_actuel });
      if (!res?.ok) throw new Error(res?.error || "Aucune stat trouvée sur FotMob");
      const s = { ...res.stats };
      // Note FotMob → champ commun.
      if (s.note_moyenne == null && s.note_fotmob != null) s.note_moyenne = s.note_fotmob;
      setStats(s);

      // Persistance automatique : on enregistre sur la fiche les stats qui ont
      // changé, pour qu'elles restent et se mettent à jour toutes seules.
      if (onApply) {
        const diff = changedPayload(s);
        if (Object.keys(diff).length > 0) {
          onApply(diff);
          setApplied(true);
        } else if (!auto) {
          setApplied(true);   // rien à changer mais l'utilisateur a cliqué : feedback
        }
      }
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des stats FotMob");
    } finally {
      setLoading(false);
    }
  };

  // Application manuelle : réécrit toutes les stats FotMob sur la fiche.
  const applyStats = () => {
    if (!stats || !onApply) return;
    const data = buildPayload(stats);
    if (Object.keys(data).length > 0) {
      onApply(data);
      setApplied(true);
    }
  };

  const fmUrl = `https://www.google.com/search?q=${encodeURIComponent(`Fotmob ${player.nom_complet || player.nom}`)}`;
  // Le groupe Gardien ne s'affiche que pour les vrais gardiens (présence d'arrêts),
  // sinon clean_sheet_team_title (stat d'équipe) le ferait apparaître pour tous.
  const hasGroup = (g) =>
    g.key === "gGk"
      ? stats?.arrets != null
      : g.items.some((k) => stats?.[k] != null && stats[k] !== "");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            {t(lang, "session.fotmob.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats && (
              <Button onClick={fetchStats} disabled={loading} variant="ghost" size="sm" className="h-7 w-7 p-0">
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
            <a href={fmUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-orange-500 hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> {t(lang, "session.fotmob.view")}
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!stats && !loading && !error && (
          <div className="text-center py-6 px-4">
            <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 mb-3">{t(lang, "session.fotmob.subtitle")}</p>
            <Button onClick={fetchStats} size="sm" variant="outline" className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50">
              <BarChart2 className="w-3.5 h-3.5" /> {t(lang, "session.fotmob.load")}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            <span className="text-sm">{t(lang, "session.fotmob.loading")}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-b-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <Button onClick={fetchStats} size="sm" variant="ghost" className="h-7 gap-1 text-red-500 hover:text-red-700">
              <RefreshCw className="w-3 h-3" /> {t(lang, "session.fotmob.retry")}
            </Button>
          </div>
        )}

        {stats && !loading && (
          <div className="px-4 pb-4 space-y-4">
            {GROUPS.filter(hasGroup).map((g) => (
              <div key={g.key}>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t(lang, `session.fotmob.${g.key}`)}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {g.items.filter((k) => stats[k] != null && stats[k] !== "").map((k) => (
                    <div key={k} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 truncate">{t(lang, `session.fotmob.l.${k}`)}</span>
                      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{stats[k]}{SUFFIX[k] || ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {onApply && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-400">{t(lang, "session.fotmob.applyHint")}</span>
                <Button onClick={applyStats} size="sm" disabled={applied}
                  className={applied ? "bg-green-600 hover:bg-green-600" : "bg-orange-600 hover:bg-orange-700"}>
                  {applied ? <><Check className="w-3.5 h-3.5 mr-1" /> {t(lang, "session.fotmob.applied")}</> : <><Download className="w-3.5 h-3.5 mr-1" /> {t(lang, "session.fotmob.apply")}</>}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
