import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, TrendingUp, Zap } from "lucide-react";

function talentScore(player) {
  let score = 0;
  const signals = [];
  const age = player.age || 99;

  // Seulement les jeunes
  if (age > 23) return null;

  // Âge (plus jeune = plus de score)
  if (age <= 18) { score += 20; signals.push("Prodige"); }
  else if (age <= 20) { score += 15; signals.push("Pépite"); }
  else if (age <= 23) { score += 8; signals.push("Jeune talent"); }

  // Note SofaScore
  if (player.note_moyenne >= 7.8) { score += 20; signals.push(`Note ${player.note_moyenne}`); }
  else if (player.note_moyenne >= 7.3) { score += 12; signals.push(`Note ${player.note_moyenne}`); }
  else if (player.note_moyenne >= 7.0) { score += 6; }

  // Progression valeur (valeur actuelle vs peak)
  if (player.valeur_marchande && player.valeur_marchande_peak) {
    if (player.valeur_marchande >= player.valeur_marchande_peak) {
      score += 15; signals.push("Nouveau pic valeur");
    }
  }

  // xG élevé pour son âge
  if (player.xg >= 10) { score += 15; signals.push(`xG ${player.xg}`); }
  else if (player.xg >= 5) { score += 8; signals.push(`xG ${player.xg}`); }

  // Buts + passes
  const contrib = (player.buts || 0) + (player.passes_decisives || 0);
  if (contrib >= 15) { score += 15; signals.push(`${contrib} contributions`); }
  else if (contrib >= 8) { score += 8; signals.push(`${contrib} contributions`); }
  else if (contrib >= 4) score += 4;

  // Dribbles
  if (player.dribbles_reussis >= 50) { score += 8; signals.push("Dribbleur élite"); }

  // Valeur marchande absolue déjà élevée pour son âge
  const value = player.valeur_marchande || 0;
  if (age <= 20 && value >= 30) { score += 15; signals.push("Valeur > 30M€"); }
  else if (age <= 22 && value >= 20) { score += 10; signals.push("Valeur > 20M€"); }
  else if (value >= 10) { score += 5; }

  // Score note scout
  if (player.note_globale_scout >= 80) { score += 10; signals.push(`Scout ${player.note_globale_scout}/100`); }

  return { score, signals };
}

const TIER_CONFIG = {
  elite: { label: "Élite mondiale", color: "bg-purple-100 text-purple-800", dotColor: "bg-purple-500", min: 60 },
  top: { label: "Top talent", color: "bg-green-100 text-green-800", dotColor: "bg-green-500", min: 40 },
  promising: { label: "Prometteur", color: "bg-blue-100 text-blue-800", dotColor: "bg-blue-500", min: 20 },
};

function getTier(score) {
  if (score >= 60) return "elite";
  if (score >= 40) return "top";
  return "promising";
}

export default function EmergingTalents({ players }) {
  const talents = players
    .map(p => {
      const result = talentScore(p);
      if (!result) return null;
      return { ...p, ...result };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Talents émergents identifiés
        </CardTitle>
        <p className="text-xs text-slate-500">Joueurs de moins de 23 ans avec le meilleur potentiel détecté par analyse statistique</p>
      </CardHeader>
      <CardContent>
        {talents.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Aucun jeune joueur (≤23 ans) dans la base. Ajoutez des talents pour cette analyse.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {talents.map((player, i) => {
              const tier = getTier(player.score);
              const tierConfig = TIER_CONFIG[tier];
              return (
                <div
                  key={player.id}
                  className="relative border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  {i === 0 && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.nom} className="w-10 h-10 rounded-full object-cover border-2 border-purple-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-slate-900">{player.nom}</p>
                      <p className="text-xs text-slate-500">{player.age} ans · {player.poste}</p>
                    </div>
                  </div>

                  <Badge className={`${tierConfig.color} border-0 text-xs mb-3`}>{tierConfig.label}</Badge>

                  {/* Score bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Score talent</span>
                      <span className="font-bold text-slate-700">{player.score}/100</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all"
                        style={{ width: `${Math.min(100, player.score)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {player.signals.slice(0, 3).map((s, j) => (
                      <span key={j} className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-100">
                        {s}
                      </span>
                    ))}
                  </div>

                  {player.valeur_marchande > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Valeur marchande</span>
                      <span className="font-bold text-green-600">{player.valeur_marchande} M€</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}