import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, TrendingUp, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

const categorieColors = {
  "Elite": "bg-purple-100 text-purple-800",
  "Premier plan": "bg-blue-100 text-blue-800",
  "Intermédiaire": "bg-green-100 text-green-800",
  "En développement": "bg-yellow-100 text-yellow-800"
};

export default function ClubCard({ club }) {
  const navigate = useNavigate();

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer"
      onClick={() => navigate(createPageUrl("ClubDetail") + `?id=${club.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.nom} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{club.nom}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{club.ville}, {club.pays}</span>
            </div>
          </div>
          {club.categorie && (
            <Badge className={categorieColors[club.categorie]}>
              {club.categorie}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {club.entraineur && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700">{club.entraineur}</span>
            </div>
          )}
          {club.budget_transfert && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-600">{club.budget_transfert}M€</span>
            </div>
          )}
          {club.stade && (
            <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
              <Building2 className="w-4 h-4" />
              <span>{club.stade} {club.capacite_stade && `(${club.capacite_stade.toLocaleString()} places)`}</span>
            </div>
          )}
        </div>

        {club.palmares && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="line-clamp-1">{club.palmares.split(',').slice(0, 3).join(', ')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}