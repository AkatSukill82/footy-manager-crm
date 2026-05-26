import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Trophy, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function UpcomingMatches({ playerClub }) {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['upcomingMatches', playerClub],
    queryFn: async () => {
      const allMatches = await base44.entities.Match.filter({}, 'date_match');
      // Filter matches where the player's club is involved
      return allMatches.filter(match => 
        match.club1?.toLowerCase() === playerClub?.toLowerCase() ||
        match.club2?.toLowerCase() === playerClub?.toLowerCase()
      ).slice(0, 5); // Show next 5 matches
    },
    enabled: !!playerClub,
  });

  if (!playerClub) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500 text-sm">Chargement des matchs...</div>
      </div>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-slate-900">Prochains matchs</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">
            Aucun match prévu pour {playerClub}
          </div>
        ) : (
          matches.map((match) => {
            const isHome = match.club1?.toLowerCase() === playerClub?.toLowerCase();
            const opponent = isHome ? match.club2 : match.club1;
            const matchDate = new Date(match.date_match);
            const isToday = format(matchDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isTomorrow = format(matchDate, 'yyyy-MM-dd') === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

            return (
              <div
                key={match.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-green-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">
                      {isHome ? match.club1 : match.club2}
                    </span>
                    <span className="text-slate-400 text-xs">vs</span>
                    <span className="font-medium text-slate-900">
                      {opponent}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      <span>
                        {isToday ? "Aujourd'hui" : isTomorrow ? "Demain" : format(matchDate, 'EEEE d MMMM', { locale: fr })}
                      </span>
                    </div>
                    
                    {match.competition && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>{match.competition}</span>
                      </div>
                    )}
                    
                    {match.lieu && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{match.lieu}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-xs ${
                    match.type_match === 'Championnat'
                      ? 'border-blue-200 text-blue-700 bg-blue-50'
                      : match.type_match === 'Coupe'
                      ? 'border-orange-200 text-orange-700 bg-orange-50'
                      : 'border-slate-200 text-slate-600 bg-slate-50'
                  }`}
                >
                  {match.type_match}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}