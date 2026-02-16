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
    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
              {player.photo_url ? (
                <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{player.nom}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <Calendar className="w-3 h-3" />
                <span>{player.age} ans</span>
                {player.nationalite && (
                  <>
                    <span>•</span>
                    <span>{player.nationalite}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {inWatchList && (
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className={posteColors[player.poste] || "bg-gray-100 text-gray-800"}>
            {player.poste}
          </Badge>
          {player.pied_fort && (
            <Badge variant="outline">{player.pied_fort}</Badge>
          )}
        </div>
        
        {player.club_actuel && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{player.club_actuel}</span>
          </div>
        )}
        
        {player.valeur_marchande && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-600">
              {player.valeur_marchande} M€
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}