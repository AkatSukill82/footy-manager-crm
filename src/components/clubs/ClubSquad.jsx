import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { Users, Loader2, RefreshCw, User, CheckCircle2, UserPlus } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const SQUAD_SCHEMA = {
  type: "object",
  properties: {
    joueurs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nom:              { type: "string" },
          poste:            { type: "string", description: "Poste en français (Gardien, Défenseur central, Milieu, Attaquant, Ailier…)" },
          numero:           { type: "number", description: "Numéro de maillot" },
          age:              { type: "number" },
          nationalite:      { type: "string" },
          valeur_marchande: { type: "number", description: "Valeur marchande en M€ (Transfermarkt)" },
        },
        required: ["nom"],
      },
    },
  },
};

async function fetchSquad(club) {
  const data = await base44.integrations.Core.InvokeLLM({
    prompt: `Liste l'effectif professionnel ACTUEL (équipe première) du club de football "${club}".
Source de référence : la page effectif de Transfermarkt et le site officiel du club.

Pour chaque joueur : nom complet, poste (en français), numéro de maillot, âge, nationalité, valeur marchande en M€.
RÈGLE ABSOLUE : ne liste que des joueurs réellement dans l'effectif actuel. Si tu n'es pas sûr, retourne moins de joueurs plutôt que d'inventer. Trie des gardiens aux attaquants.`,
    add_context_from_internet: true,
    response_json_schema: SQUAD_SCHEMA,
  });
  return data?.joueurs || [];
}

// Regroupe un poste libre dans l'une des 4 lignes.
const lineOf = (poste = "") => {
  const p = poste.toLowerCase();
  if (p.includes("gardien") || p === "gk") return "Gardiens";
  if (p.includes("défenseur") || p.includes("defenseur") || p.includes("latéral") || p.includes("lateral") || p.includes("arrière") || p.includes("back")) return "Défenseurs";
  if (p.includes("milieu") || p.includes("midfield")) return "Milieux";
  if (p.includes("ailier") || p.includes("attaquant") || p.includes("avant") || p.includes("buteur") || p.includes("wing") || p.includes("forward") || p.includes("striker")) return "Attaquants";
  return "Autres";
};
const LINE_ORDER = ["Gardiens", "Défenseurs", "Milieux", "Attaquants", "Autres"];
const LINE_KEY = { Gardiens: "gk", Défenseurs: "def", Milieux: "mid", Attaquants: "att", Autres: "other" };

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// Convertit un poste libre (LLM) vers une valeur de l'enum Player (requise à la création).
const toEnumPoste = (poste = "") => {
  const p = poste.toLowerCase();
  if (p.includes("gardien") || p === "gk") return "Gardien";
  if (p.includes("latéral droit") || p.includes("lateral droit") || p.includes("right back") || p.includes("right-back") || p.includes("arrière droit")) return "Latéral droit";
  if (p.includes("latéral gauche") || p.includes("lateral gauche") || p.includes("left back") || p.includes("left-back") || p.includes("arrière gauche")) return "Latéral gauche";
  if (p.includes("milieu défensif") || p.includes("milieu defensif") || p.includes("defensive mid") || p.includes("sentinelle")) return "Milieu défensif";
  if (p.includes("milieu offensif") || p.includes("attacking mid") || p.includes("meneur")) return "Milieu offensif";
  if (p.includes("ailier droit") || p.includes("right wing")) return "Ailier droit";
  if (p.includes("ailier gauche") || p.includes("left wing")) return "Ailier gauche";
  if (p.includes("défenseur") || p.includes("defenseur") || p.includes("back") || p.includes("centre-back") || p.includes("center-back")) return "Défenseur central";
  if (p.includes("milieu") || p.includes("midfield")) return "Milieu central";
  if (p.includes("ailier") || p.includes("wing")) return "Ailier droit";
  if (p.includes("attaquant") || p.includes("avant") || p.includes("buteur") || p.includes("forward") || p.includes("striker")) return "Attaquant";
  return "Milieu central"; // défaut sûr (valeur enum valide)
};

// Ligne d'effectif : voir (si déjà dans le CRM) ou ajouter au CRM (+ ouvre la fiche).
function SquadPlayer({ j, crmPlayer, club, lang }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const view = () => { if (crmPlayer) navigate(createPageUrl("PlayerDetail") + `?id=${crmPlayer.id}`); };

  const add = async (e) => {
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      const payload = {
        nom: j.nom,
        poste: toEnumPoste(j.poste),
        age: j.age ?? null,
        nationalite: j.nationalite ?? null,
        club_actuel: club.nom,
        valeur_marchande: j.valeur_marchande ?? null,
        numero_maillot: j.numero ?? null,
      };
      Object.keys(payload).forEach((k) => { if (payload[k] == null) delete payload[k]; });
      const created = await base44.entities.Player.create(payload);
      qc.invalidateQueries({ queryKey: ["players"] });
      qc.invalidateQueries({ queryKey: ["players-by-club", club.nom] });
      navigate(createPageUrl("PlayerDetail") + `?id=${created.id}`);
    } catch {
      setAdding(false);
    }
  };

  const Tag = crmPlayer ? "button" : "div";
  return (
    <Tag
      onClick={crmPlayer ? view : undefined}
      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
        crmPlayer ? "border-green-200 bg-green-50/50 hover:bg-green-50 cursor-pointer" : "border-slate-100 bg-slate-50/50"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500 overflow-hidden">
        {crmPlayer?.photo_url
          ? <img src={crmPlayer.photo_url} alt={j.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => (e.target.style.display = "none")} />
          : j.numero != null ? j.numero : <User className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-xs font-semibold text-slate-900 truncate">{j.nom}</p>
          {crmPlayer && <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" title={t(lang, "session.squad.inCrm")} />}
        </div>
        <p className="text-[10px] text-slate-400 truncate">
          {[j.poste, j.age ? `${j.age} ${t(lang, "session.squad.years")}` : null, j.nationalite].filter(Boolean).join(" · ")}
        </p>
      </div>
      {j.valeur_marchande != null && (
        <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">{j.valeur_marchande}M€</span>
      )}
      {!crmPlayer && (
        <button onClick={add} disabled={adding} title={t(lang, "session.squad.addTooltip")}
          className="p-1 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex-shrink-0">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        </button>
      )}
    </Tag>
  );
}

export default function ClubSquad({ club, crmPlayers = [] }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { data: squad = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["clubSquad", club?.nom],
    queryFn: () => fetchSquad(club.nom),
    enabled: !!club?.nom,
    staleTime: 1000 * 60 * 60 * 24,  // l'effectif bouge peu
    gcTime: 1000 * 60 * 60 * 48,
    retry: false,
  });

  if (!club?.nom) return null;

  // Index des joueurs du CRM (pour lier/identifier).
  const crmByName = new Map(crmPlayers.map((p) => [norm(p.nom), p]));

  const grouped = LINE_ORDER
    .map((line) => ({ line, items: squad.filter((j) => lineOf(j.poste) === line) }))
    .filter((g) => g.items.length > 0);

  // Valeur totale de l'effectif (somme des valeurs marchandes connues).
  const totalValue = squad.reduce((s, j) => s + (Number(j.valeur_marchande) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" /> {t(lang, "session.squad.title")}{squad.length > 0 ? ` (${squad.length})` : ""}
          </p>
          {totalValue > 0 && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t(lang, "session.squad.totalValue")} : <span className="font-semibold text-slate-600">{Math.round(totalValue)} M€</span>
            </p>
          )}
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="text-slate-400 hover:text-slate-600 disabled:opacity-50" title={t(lang, "session.squad.refresh")}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "session.squad.loading")}
        </div>
      ) : (isError || squad.length === 0) ? (
        // Repli : si la recherche web n'a rien donné, on montre au moins les
        // joueurs du CRM rattachés à ce club.
        crmPlayers.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t(lang, "session.squad.yourPlayers")} ({crmPlayers.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {crmPlayers.map((p) => (
                <button key={p.id} onClick={() => navigate(createPageUrl("PlayerDetail") + `?id=${p.id}`)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-50 cursor-pointer text-left transition-all">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => (e.target.style.display = "none")} />
                      : <User className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.nom}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.poste}</p>
                  </div>
                  {p.valeur_marchande != null && (
                    <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">{p.valeur_marchande}M€</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-300 pt-2">{t(lang, "session.squad.fallbackNote")}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">{t(lang, "session.squad.none")}</p>
        )
      ) : (
        <div className="space-y-4">
          {grouped.map(({ line, items }) => (
            <div key={line}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t(lang, `session.squad.${LINE_KEY[line]}`)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((j, i) => (
                  <SquadPlayer key={`${j.nom}-${i}`} j={j} crmPlayer={crmByName.get(norm(j.nom))} club={club} lang={lang} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-300 pt-1">{t(lang, "session.squad.disclaimer")}</p>
        </div>
      )}
    </div>
  );
}
