import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Shield, Zap, Star } from "lucide-react";

// Normalize a value to 0–10 relative to a reference max
const norm = (val, max) => val == null ? null : Math.min(Math.max(val / max * 10, 0), 10);

function rateLabel(score) {
  if (score == null) return null;
  if (score >= 8.5) return { text: "Exceptionnel", color: "text-green-600" };
  if (score >= 7) return { text: "Très bon", color: "text-green-500" };
  if (score >= 5.5) return { text: "Correct", color: "text-amber-500" };
  if (score >= 3.5) return { text: "Faible", color: "text-orange-500" };
  return { text: "Très faible", color: "text-red-500" };
}

function categoryScore(scores) {
  const valid = scores.filter((s) => s != null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function ScoreBar({ score }) {
  if (score == null) return <span className="text-xs text-slate-300 ml-auto">—</span>;
  const pct = Math.round(score * 10);
  const color = score >= 7 ? "bg-green-500" : score >= 5 ? "bg-amber-400" : "bg-red-400";
  const label = rateLabel(score);
  return (
    <div className="flex items-center gap-2 ml-auto">
      <span className={`text-xs font-semibold ${label?.color}`}>{score.toFixed(1)}/10</span>
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>);

}

function StatRow({ label, value, unit = "", max, note }) {
  if (value == null) return null;
  const score = max != null ? norm(value, max) : null;
  const rLabel = rateLabel(score);
  const pct = score != null ? Math.round(score * 10) : null;
  const barColor = score != null ?
  score >= 7 ? "bg-green-400" : score >= 5 ? "bg-amber-300" : "bg-red-300" :
  "bg-slate-200";

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-600 flex-1">{label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {rLabel && <span className={`text-[11px] font-medium ${rLabel.color}`}>{rLabel.text}</span>}
          <span className="text-sm font-bold text-slate-800 min-w-[36px] text-right">
            {value}{unit}
          </span>
        </div>
      </div>
      {pct != null &&
      <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      }
      {note && <p className="text-[11px] text-slate-400 mt-0.5 italic leading-snug">{note}</p>}
    </div>);

}

function Category({ icon: Icon, title, iconColor, score, children }) {
  const validChildren = React.Children.toArray(children).filter(Boolean);
  if (!validChildren.length) return null;
  // Only render if at least one child rendered (StatRow returns null for null values)
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <ScoreBar score={score} />
      </div>
      <div className="pl-1">{children}</div>
    </div>);

}

export default function PlayerStatsPanel({ player }) {
  if (!player) return null;

  const p = player;
  const isGK = p.poste === "Gardien";

  // ── Scores par catégorie ──────────────────────────────────────────────────
  const attackScore = categoryScore([
  norm(p.buts, 20), norm(p.passes_decisives, 15),
  norm(p.xg, 15), norm(p.xa, 10),
  norm(p.tirs_cadres_pct, 50), norm(p.grandes_chances, 15)]
  );

  const creationScore = categoryScore([
  norm(p.passes_reussies_pct, 90), norm(p.passes_cles, 3),
  norm(p.dribbles_reussis, 80), norm(p.dribbles_pct, 60)]
  );

  const defenseScore = categoryScore([
  norm(p.tacles, 80), norm(p.interceptions, 40),
  norm(p.duels_gagnes_pct, 70), norm(p.duels_aeriens_pct, 65)]
  );

  const formeScore = categoryScore([
  norm(p.note_moyenne, 10), norm(p.matchs_joues, 35),
  norm(p.titularisations, 30)]
  );

  const gkScore = categoryScore([
  norm(p.arrets, 100), norm(p.clean_sheets, 20), norm(p.note_moyenne, 10)]
  );

  // Note finisseur
  const efficaciteNote = p.buts != null && p.xg != null && p.xg > 0 ? (() => {
    const ratio = p.buts / p.xg;
    if (ratio >= 1.5) return "Finisseur exceptionnel — marque bien plus que ses occasions ne le prévoient";
    if (ratio >= 1.1) return "Bon finisseur — légèrement au-dessus de son xG";
    if (ratio >= 0.85) return "Efficacité dans la normale";
    return "Sous-performe par rapport aux occasions créées";
  })() : null;

  const hasAnyAttack = [p.buts, p.passes_decisives, p.xg, p.xa, p.tirs, p.tirs_cadres_pct, p.grandes_chances].some((v) => v != null);
  const hasAnyCreation = [p.passes_reussies_pct, p.passes_cles, p.dribbles_reussis, p.dribbles_pct].some((v) => v != null);
  const hasAnyDefense = [p.tacles, p.interceptions, p.duels_gagnes_pct, p.duels_aeriens_pct].some((v) => v != null);
  const hasAnyForme = [p.note_moyenne, p.matchs_joues, p.titularisations, p.minutes_jouees].some((v) => v != null);
  const hasAnyGK = [p.arrets, p.clean_sheets, p.buts_encaisses].some((v) => v != null);
  const hasAnyDisc = [p.cartons_jaunes, p.cartons_rouges, p.fautes_commises, p.hors_jeu].some((v) => v != null);

  if (!hasAnyAttack && !hasAnyDefense && !hasAnyForme && !hasAnyGK && !hasAnyCreation) return null;

  return null;





























































































































}