import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, TrendingUp, Star } from "lucide-react";
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

export default function PlayerCard({ player, inWatchList }) {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200 p-5 cursor-pointer hover:shadow-xl hover:scale-105 transition-all group"
      onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-slate-400" />
          )}
        </div>
        {inWatchList && (
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        )}
      </div>
      
      <h3 className="font-bold text-slate-950 text-lg mb-1 truncate">{player.nom}</h3>
      
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
        {player.age && <span>{player.age} ans</span>}
        {player.age && player.nationalite && <span>•</span>}
        {player.nationalite && <span>{player.nationalite}</span>}
      </div>

      <div className="space-y-2">
        <Badge className={`${posteColors[player.poste] || "bg-gray-100 text-gray-800"} rounded-xl`}>
          {player.poste}
        </Badge>
        
        {player.club_actuel && (
          <p className="text-sm text-slate-600 truncate">{player.club_actuel}</p>
        )}
        
        {player.valeur_marchande && (
          <div className="flex items-center gap-1 pt-2">
            <div className="text-2xl font-bold text-slate-950">{player.valeur_marchande}M</div>
            <div className="text-sm text-slate-400">€</div>
          </div>
        )}
      </div>
    </div>
  );
}