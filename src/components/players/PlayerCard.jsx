import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, TrendingUp, Clock, Activity, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

const posteColors = {
  "Gardien": "bg-yellow-100 text-yellow-800",
  "Défenseur central": "bg-blue-100 text-blue-800",
  "Latéral droit": "bg-blue-100 text-blue-800",
  "Latéral gauche": "bg-blue-100 text-blue-800",
  "Milieu défensif": "bg-green-100 text-green-800",
  "Milieu central": "bg-green-100 text-green-800",
  "Milieu offensif": "bg-purple-100 text-purple-800",
  "Ailier droit": "bg-orange-100 text-orange-800",
  "Ailier gauche": "bg-orange-100 text-orange-800",
  "Attaquant": "bg-red-100 text-red-800"
};

function StatBox({ label, value, color = "bg-slate-50", textColor = "text-slate-900" }) {
  if (value == null || value === "") return null;
  return (
    <div className={`${color} rounded-lg p-2 text-center`}>
      <div className={`font-bold text-sm ${textColor}`}>{value}</div>
      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{label}</div>
    </div>
  );
}

export default function PlayerCard({ player, inWatchList }) {
  const navigate = useNavigate();

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
    >
      {/* Barre couleur top */}
      <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" />

      <CardContent className="pt-4 pb-4 px-4 space-y-3">

        {/* ── Identité ── */}
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover"
                onError={e => e.target.style.display = 'none'} />
            ) : (
              <User className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-bold text-base text-slate-900 leading-tight truncate">{player.nom}</h3>
              {inWatchList && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {player.poste && (
                <Badge className={`text-[10px] py-0 ${posteColors[player.poste] || "bg-gray-100 text-gray-800"}`}>
                  {player.poste}
                </Badge>
              )}
              {player.poste_secondaire && (
                <Badge variant="outline" className="text-[10px] py-0">{player.poste_secondaire}</Badge>
              )}
              {player.nationalite && (
                <Badge variant="outline" className="text-[10px] py-0">{player.nationalite}</Badge>
              )}
              {player.club_actuel && (
                <Badge className="text-[10px] py-0 bg-slate-800 text-white">{player.club_actuel}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Infos clés ── */}
        <div className="grid grid-cols-3 gap-1.5">
          <StatBox label="Âge" value={player.age ? `${player.age} ans` : null} />
          <StatBox label="Taille" value={player.taille ? `${player.taille} cm` : null} />
          <StatBox label="Pied fort" value={player.pied_fort} />
          <StatBox label="Valeur" value={player.valeur_marchande ? `${player.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
          <StatBox label="Fin contrat" value={player.contrat_fin ? player.contrat_fin.substring(0, 7) : null} color="bg-orange-50" textColor="text-orange-700" />
          <StatBox label="Ligue" value={player.ligue} />
        </div>

        {/* ── Stats saison ── */}
        {(player.buts != null || player.passes_decisives != null || player.note_moyenne != null || player.matchs_joues != null) && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Stats saison</p>
            <div className="grid grid-cols-4 gap-1">
              <StatBox label="MJ" value={player.matchs_joues} />
              <StatBox label="Buts" value={player.buts} color="bg-green-50" textColor="text-green-700" />
              <StatBox label="Passes D." value={player.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
              <StatBox label="Note" value={player.note_moyenne} color="bg-indigo-50" textColor="text-indigo-700" />
            </div>
          </div>
        )}

        {/* ── Stats avancées ── */}
        {(player.xg != null || player.duels_gagnes_pct != null || player.dribbles_pct != null) && (
          <div className="grid grid-cols-3 gap-1">
            {player.xg != null && <StatBox label="xG" value={player.xg} color="bg-purple-50" textColor="text-purple-700" />}
            {player.xa != null && <StatBox label="xA" value={player.xa} color="bg-purple-50" textColor="text-purple-700" />}
            {player.duels_gagnes_pct != null && <StatBox label="% duels" value={`${player.duels_gagnes_pct}%`} />}
            {player.dribbles_pct != null && <StatBox label="% dribbles" value={`${player.dribbles_pct}%`} />}
            {player.passes_reussies_pct != null && <StatBox label="% passes" value={`${player.passes_reussies_pct}%`} />}
            {player.interceptions != null && <StatBox label="Interceptions" value={player.interceptions} />}
          </div>
        )}

        {/* ── Agent / contrat ── */}
        {(player.agent || player.salaire) && (
          <div className="border-t border-slate-100 pt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
            {player.agent && <span>🤝 {player.agent}</span>}
            {player.salaire && <span>💰 {player.salaire} M€/an</span>}
          </div>
        )}

        {/* ── Palmarès / distinctions ── */}
        {player.palmares && (
          <div className="border-t border-slate-100 pt-2">
            <p className="text-[10px] font-semibold text-amber-600 uppercase mb-1">Palmarès</p>
            <p className="text-[11px] text-slate-600 line-clamp-2">{player.palmares}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}