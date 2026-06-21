import React, { useState } from "react";
import { withOrg } from "../../lib/org";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { Sparkles, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";
import { cleanPlayerName } from "../../lib/cleanName";

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// Poste libre (LLM) → valeur de l'enum Player (requise à la création).
const toEnumPoste = (poste = "") => {
  const p = poste.toLowerCase();
  if (p.includes("gardien") || p === "gk") return "Gardien";
  if (p.includes("latéral droit") || p.includes("right back") || p.includes("arrière droit")) return "Latéral droit";
  if (p.includes("latéral gauche") || p.includes("left back") || p.includes("arrière gauche")) return "Latéral gauche";
  if (p.includes("milieu défensif") || p.includes("defensive mid")) return "Milieu défensif";
  if (p.includes("milieu offensif") || p.includes("attacking mid")) return "Milieu offensif";
  if (p.includes("ailier droit") || p.includes("right wing")) return "Ailier droit";
  if (p.includes("ailier gauche") || p.includes("left wing")) return "Ailier gauche";
  if (p.includes("défenseur") || p.includes("defenseur") || p.includes("back")) return "Défenseur central";
  if (p.includes("milieu") || p.includes("midfield")) return "Milieu central";
  if (p.includes("ailier") || p.includes("wing")) return "Ailier droit";
  if (p.includes("attaquant") || p.includes("forward") || p.includes("striker") || p.includes("buteur")) return "Attaquant";
  return "Milieu central";
};

const SCHEMA = {
  type: "object",
  properties: {
    joueurs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nom: { type: "string" }, club: { type: "string" }, age: { type: "number" },
          poste: { type: "string", description: "Poste en français" }, nationalite: { type: "string" },
          valeur_marchande: { type: "number", description: "Valeur marchande en M€" },
          raison: { type: "string", description: "Pourquoi ce joueur est intéressant à suivre (1 phrase)" },
        },
        required: ["nom"],
      },
    },
  },
};

async function fetchScouting() {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const data = await base44.integrations.Core.InvokeLLM({
    prompt: `Nous sommes le ${today}. Repère 8 joueurs de football actuellement INTÉRESSANTS À SUIVRE pour un agent : jeunes talents en progression, valeur marchande en hausse, forme remarquable récente, ou situation contractuelle opportune (fin de contrat proche).
Pour chacun : nom complet, club, âge, poste (en français), nationalité, valeur marchande en M€, et une phrase "raison" expliquant l'intérêt.
Sources : Transfermarkt, actualités football récentes. RÈGLE : joueurs réels et d'actualité uniquement, ne pas inventer.`,
    add_context_from_internet: true,
    response_json_schema: SCHEMA,
  });
  return data?.joueurs || [];
}

function ScoutRow({ j, inCrm, lang }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const payload = {
        nom: cleanPlayerName(j.nom), poste: toEnumPoste(j.poste), age: j.age ?? null,
        nationalite: j.nationalite ?? null, club_actuel: j.club ?? null,
        valeur_marchande: j.valeur_marchande ?? null,
      };
      Object.keys(payload).forEach((k) => { if (payload[k] == null) delete payload[k]; });
      const created = await base44.entities.Player.create(withOrg(payload));
      qc.invalidateQueries({ queryKey: ["players"] });
      navigate(createPageUrl("PlayerDetail") + `?id=${created.id}`);
    } catch {
      setAdding(false);
    }
  };

  const onClick = () => {
    if (inCrm) { navigate(createPageUrl("PlayerDetail") + `?id=${inCrm.id}`); return; }
    if (confirm(t(lang, "session.dash.integrateConfirm", { nom: j.nom }))) add();
  };

  return (
    <button type="button" onClick={onClick} disabled={adding}
      className={`group w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
        inCrm ? "border-green-200 bg-green-50/40 hover:bg-green-50" : "border-slate-100 bg-slate-50/50 hover:border-indigo-200 hover:bg-indigo-50/40"
      }`}>
      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{j.nom}</p>
          {j.valeur_marchande != null && <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{j.valeur_marchande}M€</span>}
        </div>
        <p className="text-[10px] text-slate-400 truncate">
          {[j.poste, j.age ? `${j.age} ${t(lang, "session.squad.years")}` : null, j.club, j.nationalite].filter(Boolean).join(" · ")}
        </p>
        {j.raison && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{j.raison}</p>}
      </div>
      {inCrm
        ? <span className="text-[9px] text-green-600 font-medium whitespace-nowrap flex-shrink-0">{t(lang, "session.dash.yourPlayer")}</span>
        : (adding ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500 flex-shrink-0" /> : <UserPlus className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 transition-colors" />)}
    </button>
  );
}

export default function DashboardScouting({ players = [] }) {
  const { lang } = useLanguage();
  const { data: joueurs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashScouting"],
    queryFn: fetchScouting,
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
  });

  const crmByName = new Map(players.map((p) => [norm(p.nom), p]));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> {t(lang, "session.dash.scoutTitle")}
        </p>
        <button onClick={() => refetch()} disabled={isFetching}
          className="text-slate-400 hover:text-slate-600 disabled:opacity-50" title={t(lang, "session.dash.refresh")}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">{t(lang, "session.dash.scoutSubtitle")}</p>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-5 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "session.dash.scoutLoading")}
        </div>
      ) : joueurs.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">{t(lang, "session.dash.scoutNone")}</p>
      ) : (
        <div className="space-y-2">
          {joueurs.map((j, i) => <ScoutRow key={`${j.nom}-${i}`} j={j} inCrm={crmByName.get(norm(j.nom))} lang={lang} />)}
          <p className="text-[10px] text-slate-300 pt-1">{t(lang, "session.dash.disclaimer")}</p>
        </div>
      )}
    </div>
  );
}
