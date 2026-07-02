import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { scorePlayerFromData } from "@/lib/recruitmentScoring";
import { useConfigVersion } from "@/lib/useRecruitmentConfig";

/**
 * « Note de recrutement » de la fiche joueur — désormais calculée par le MÊME
 * moteur que le formulaire de recrutement (mêmes barèmes, critères et seuils,
 * partagés par organisation). On ne note que les critères activés dont la donnée
 * est présente sur la fiche : le score et le tier restent comparables au module
 * de recrutement, sans logique parallèle divergente.
 */
const T = {
  fr: {
    title: "Note de recrutement", insufficient: "Données insuffisantes pour un score fiable.",
    crit: { age: "Âge", contract: "Contrat", level: "Niveau joué", production: "Production", market_value: "Valeur marchande", fit: "Fit profil cible" },
    tier: { priority: "Priorité A", contact: "Contact", watch: "Observation", abandon: "Abandon" },
  },
  en: {
    title: "Recruitment score", insufficient: "Not enough data for a reliable score.",
    crit: { age: "Age", contract: "Contract", level: "Level played", production: "Production", market_value: "Market value", fit: "Target-profile fit" },
    tier: { priority: "Priority A", contact: "Contact", watch: "Watchlist", abandon: "Drop" },
  },
  es: {
    title: "Nota de reclutamiento", insufficient: "Datos insuficientes para una nota fiable.",
    crit: { age: "Edad", contract: "Contrato", level: "Nivel jugado", production: "Producción", market_value: "Valor de mercado", fit: "Ajuste al perfil" },
    tier: { priority: "Prioridad A", contact: "Contacto", watch: "Seguimiento", abandon: "Descartar" },
  },
};

const noteColor = (n) => n >= 2.5 ? "text-green-600 bg-green-50 border-green-200"
  : n >= 1.5 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
  : n >= 1 ? "text-amber-600 bg-amber-50 border-amber-200"
  : "text-red-500 bg-red-50 border-red-200";

const tierColor = (c) => c === "green" ? "text-green-600" : c === "blue" ? "text-blue-600" : c === "amber" ? "text-amber-600" : "text-slate-500";
const fmt = (n) => (n % 1 === 0 ? n : n.toFixed(1));

export default function RecruitmentNote({ player }) {
  const { lang } = useLanguage();
  const L = T[lang] || T.fr;
  const cfgV = useConfigVersion();                       // recalcul si la config d'org change
  const r = useMemo(() => scorePlayerFromData(player || {}), [player, cfgV]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Target className="w-4 h-4 text-green-600" /> {L.title}</span>
          {r.hasData && (
            <span className="text-base font-bold text-slate-900">{fmt(r.total)}<span className="text-xs text-slate-400"> / {r.max}</span></span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {!r.hasData ? (
          <p className="text-xs text-slate-400">{L.insufficient}</p>
        ) : (
          <>
            <div className={`text-xs font-semibold ${tierColor(r.tier.color)}`}>{L.tier[r.tier.key] || r.tier.label}</div>
            {r.breakdown.map((b) => (
              <div key={b.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-500">{L.crit[b.key] || b.label}{b.weight > 1 ? ` ×${b.weight}` : ""}</span>
                <span className={`text-[11px] font-semibold rounded-md border px-1.5 py-0.5 min-w-[38px] text-center ${noteColor(b.note)}`}>
                  {fmt(b.note)}/3
                </span>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
