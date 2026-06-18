import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import GoogleCalendarService from "@/services/googleCalendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Trophy, MapPin, CalendarPlus, Loader2, Check, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const MATCHES_SCHEMA = {
  type: "object",
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date:        { type: "string", description: "Date du match au format YYYY-MM-DD" },
          heure:       { type: "string", description: "Heure locale HH:MM, vide si inconnue" },
          competition: { type: "string", description: "Compétition (ex: Premier League, Ligue des Champions)" },
          adversaire:  { type: "string", description: "Nom de l'équipe adverse" },
          domicile:    { type: "boolean", description: "true si le club joue à domicile" },
          lieu:        { type: "string", description: "Stade / ville, si connu" },
        },
        required: ["date", "adversaire"],
      },
    },
  },
};

// Recherche web (backend LLM) des prochains matchs du club.
async function fetchUpcomingMatches(club, playerName) {
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const data = await base44.integrations.Core.InvokeLLM({
    prompt: `Nous sommes le ${today}. Cherche sur le web le calendrier officiel à venir du club de football "${club}"${playerName ? ` (club actuel de ${playerName})` : ""}.

Retourne les 5 prochains matchs OFFICIELS programmés (championnat, coupe, compétition européenne, sélection), du plus proche au plus lointain. Pour chacun :
- "date" : date au format YYYY-MM-DD
- "heure" : heure locale HH:MM (vide si pas encore annoncée)
- "competition" : nom de la compétition
- "adversaire" : équipe adverse
- "domicile" : true si "${club}" reçoit, false sinon
- "lieu" : stade ou ville si connu

RÈGLE ABSOLUE : ne retourne que des matchs réellement programmés et datés dans le futur. Si tu n'es pas certain du calendrier, retourne une liste vide plutôt que d'inventer.`,
    add_context_from_internet: true,
    response_json_schema: MATCHES_SCHEMA,
  });
  const list = (data?.matches || []).filter((m) => m.date && new Date(m.date) >= new Date(new Date().toDateString()));
  return list.slice(0, 5);
}

function MatchRow({ match, club }) {
  const { lang } = useLanguage();
  const [state, setState] = useState("idle"); // idle | adding | added | error
  const home = match.domicile ? club : match.adversaire;
  const away = match.domicile ? match.adversaire : club;
  const matchDate = new Date(`${match.date}T${match.heure && /^\d{1,2}:\d{2}$/.test(match.heure) ? match.heure : "20:00"}:00`);
  const isToday    = format(matchDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isTomorrow = format(matchDate, "yyyy-MM-dd") === format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

  const addToAgenda = async () => {
    setState("adding");
    try {
      if (!GoogleCalendarService.isConnected()) {
        await GoogleCalendarService.connect();
      }
      const end = new Date(matchDate.getTime() + 105 * 60000); // 1h45
      const calId = GoogleCalendarService.getSelectedCalendar()?.id || "primary";
      await GoogleCalendarService.createEvent({
        summary: `⚽ ${home} vs ${away}`,
        description: [match.competition, match.lieu].filter(Boolean).join(" · "),
        location: match.lieu || undefined,
        start: { dateTime: matchDate.toISOString() },
        end:   { dateTime: end.toISOString() },
        colorId: "10",
      }, calId);
      setState("added");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-green-200 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-slate-900">{home}</span>
          <span className="text-slate-400 text-xs">vs</span>
          <span className="font-medium text-slate-900">{away}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            <span>
              {isToday ? t(lang, "session.upcoming.today") : isTomorrow ? t(lang, "session.upcoming.tomorrow") : format(matchDate, "EEEE d MMMM", { locale: fr })}
              {match.heure && /^\d{1,2}:\d{2}$/.test(match.heure) ? ` · ${match.heure}` : ""}
            </span>
          </div>
          {match.competition && (
            <div className="flex items-center gap-1"><Trophy className="w-3 h-3" /><span>{match.competition}</span></div>
          )}
          {match.lieu && (
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{match.lieu}</span></div>
          )}
        </div>
      </div>

      <Button
        size="sm"
        variant={state === "added" ? "outline" : "ghost"}
        className={`flex-shrink-0 h-8 text-xs ${state === "added" ? "text-green-700 border-green-200" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
        onClick={addToAgenda}
        disabled={state === "adding" || state === "added"}
        title={t(lang, "session.upcoming.addTooltip")}
      >
        {state === "adding" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : state === "added" ? <><Check className="w-3.5 h-3.5 mr-1" /> {t(lang, "session.upcoming.added")}</>
          : state === "error" ? t(lang, "session.upcoming.retry")
          : <><CalendarPlus className="w-3.5 h-3.5 mr-1" /> {t(lang, "session.upcoming.agenda")}</>}
      </Button>
    </div>
  );
}

export default function UpcomingMatches({ playerClub, playerName }) {
  const { lang } = useLanguage();
  const { data: matches = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["upcomingMatches", playerClub],
    queryFn: () => fetchUpcomingMatches(playerClub, playerName),
    enabled: !!playerClub,
    staleTime: 1000 * 60 * 60 * 6,  // 6h : le calendrier bouge peu
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
  });

  if (!playerClub) return null;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">{t(lang, "session.upcoming.title")}</h3>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50" title={t(lang, "session.upcoming.refresh")}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "session.upcoming.searching")}
          </div>
        ) : isError ? (
          <div className="text-slate-500 text-sm text-center py-4">{t(lang, "session.upcoming.error")}</div>
        ) : matches.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">{t(lang, "session.upcoming.none")}</div>
        ) : (
          matches.map((match, i) => <MatchRow key={`${match.date}-${i}`} match={match} club={playerClub} />)
        )}
      </CardContent>
    </Card>
  );
}
