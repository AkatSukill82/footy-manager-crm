import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, TrendingUp, Trophy, Phone, Mail, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

const categorieColors = {
  "Elite": "bg-purple-100 text-purple-800",
  "Premier plan": "bg-blue-100 text-blue-800",
  "Intermédiaire": "bg-green-100 text-green-800",
  "En développement": "bg-yellow-100 text-yellow-800",
};

export default function ClubCard({ club }) {
  const navigate = useNavigate();

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer"
      onClick={() => navigate(createPageUrl("ClubDetail") + `?id=${club.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.nom} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
            ) : (
              <Building2 className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{club.nom}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{[club.ville, club.pays].filter(Boolean).join(', ')}</span>
            </div>
          </div>
          {club.categorie && (
            <Badge className={`text-xs flex-shrink-0 ${categorieColors[club.categorie] || "bg-slate-100 text-slate-700"}`}>
              {club.categorie}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          {club.entraineur && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{club.entraineur}</span>
            </div>
          )}
          {club.budget_transfert && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="font-semibold text-green-600">{club.budget_transfert}M€ transferts</span>
            </div>
          )}
          {club.stade && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{club.stade}{club.capacite_stade ? ` · ${club.capacite_stade.toLocaleString()}` : ''}</span>
            </div>
          )}
        </div>

        {/* Contact rapide */}
        {(club.telephone || club.email || club.site_web) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation()}>
            {club.telephone && (
              <a href={`tel:${club.telephone}`} title={club.telephone}
                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline truncate max-w-[80px]">{club.telephone}</span>
              </a>
            )}
            {club.email && (
              <a href={`mailto:${club.email}`} title={club.email}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                <Mail className="w-3 h-3" />
                <span className="hidden sm:inline truncate max-w-[80px]">{club.email}</span>
              </a>
            )}
            {club.site_web && (
              <a href={club.site_web} target="_blank" rel="noopener noreferrer" title={club.site_web}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                <Globe className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {club.palmares && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Trophy className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
              <span className="line-clamp-1">{club.palmares.split(',').slice(0, 3).join(', ')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
