import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

/**
 * « Note de recrutement /4 » — barème fixe validé (Âge, Taille, Buts+Passes,
 * Temps de jeu), chaque critère noté 0 / 0,5 / 1. Autonome : calculé depuis les
 * données du joueur, sans toucher au moteur de scoring recrutement.
 *
 *  Âge          : <18 → 1 · <21 → 0,5 · ≥21 → 0
 *  Taille       : ≥180 → 1 · ≥175 → 0,5 · <175 → 0
 *  Buts+Passes  : ≥15 → 1 · ≥10 → 0,5 · <10 → 0
 *  Temps de jeu : ≥70% → 1 · ≥60% → 0,5 · <60% → 0
 *  Temps de jeu % = minutes ÷ (matchs × 90) × 100 (plafonné à 100).
 */
export function computeRecruitmentNote(player = {}) {
  const age = player.age != null && player.age !== "" ? Number(player.age) : null;
  const taille = player.taille != null && player.taille !== "" ? Number(player.taille) : null;
  const hasGA = player.buts != null || player.passes_decisives != null || player.matchs_joues != null;
  const ga = (Number(player.buts) || 0) + (Number(player.passes_decisives) || 0);
  const matchs = Number(player.matchs_joues) || 0;
  const minutes = Number(player.minutes_jouees) || 0;
  const tempsPct = matchs > 0 ? Math.min(100, Math.round((minutes / (matchs * 90)) * 100)) : null;

  const sAge = age != null ? (age < 18 ? 1 : age < 21 ? 0.5 : 0) : null;
  const sTaille = taille != null ? (taille >= 180 ? 1 : taille >= 175 ? 0.5 : 0) : null;
  const sGA = hasGA ? (ga >= 15 ? 1 : ga >= 10 ? 0.5 : 0) : null;
  const sTemps = tempsPct != null ? (tempsPct >= 70 ? 1 : tempsPct >= 60 ? 0.5 : 0) : null;

  const total = (sAge || 0) + (sTaille || 0) + (sGA || 0) + (sTemps || 0);
  return {
    total, tempsPct, ga,
    items: [
      { key: "age", score: sAge, value: age },
      { key: "taille", score: sTaille, value: taille },
      { key: "ga", score: sGA, value: hasGA ? ga : null },
      { key: "temps", score: sTemps, value: tempsPct },
    ],
  };
}

const RN = {
  fr: { title: "Note de recrutement", age: "Âge", taille: "Taille", ga: "Buts + passes", temps: "Temps de jeu", ans: "ans", na: "—" },
  en: { title: "Recruitment score", age: "Age", taille: "Height", ga: "Goals + assists", temps: "Playing time", ans: "yrs", na: "—" },
  es: { title: "Nota de reclutamiento", age: "Edad", taille: "Altura", ga: "Goles + asistencias", temps: "Tiempo de juego", ans: "años", na: "—" },
};

const scoreColor = (s) => s === 1 ? "text-green-600 bg-green-50 border-green-200"
  : s === 0.5 ? "text-amber-600 bg-amber-50 border-amber-200"
  : s === 0 ? "text-red-500 bg-red-50 border-red-200"
  : "text-slate-400 bg-slate-50 border-slate-200";

const fmtVal = (key, value, T) => {
  if (value == null) return T.na;
  if (key === "age") return `${value} ${T.ans}`;
  if (key === "taille") return `${value} cm`;
  if (key === "temps") return `${value}%`;
  return String(value);
};

export default function RecruitmentNote({ player }) {
  const { lang } = useLanguage();
  const T = RN[lang] || RN.fr;
  const { total, items } = computeRecruitmentNote(player);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Target className="w-4 h-4 text-green-600" /> {T.title}</span>
          <span className="text-base font-bold text-slate-900">{total % 1 === 0 ? total : total.toFixed(1)}<span className="text-xs text-slate-400"> / 4</span></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">{T[it.key]}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{fmtVal(it.key, it.value, T)}</span>
              <span className={`text-[11px] font-semibold rounded-md border px-1.5 py-0.5 min-w-[38px] text-center ${scoreColor(it.score)}`}>
                {it.score == null ? T.na : `${it.score % 1 === 0 ? it.score : it.score.toFixed(1)}/1`}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
