import React, { useState } from "react";
import { withOrg } from "../lib/org";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../lib/useCurrentUser";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Trash2, Trophy, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import TeamForm from "../components/teams/TeamForm";
import TeamComposition from "../components/teams/TeamComposition";
import AddPlayerToTeam from "../components/teams/AddPlayerToTeam";
import MatchSimulator from "../components/teams/MatchSimulator";
import FootballPitch from "../components/teams/FootballPitch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeamDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ id: teamId });
      return teams[0];
    },
    enabled: !!teamId,
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players', teamId],
    queryFn: () => base44.entities.TeamPlayer.filter({ team_id: teamId }),
    enabled: !!teamId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const currentUser = useCurrentUser();
  const userEmail = currentUser?.email;
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', userEmail],
    queryFn: () => base44.entities.Team.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['matches', teamId],
    queryFn: async () => {
      const m1 = await base44.entities.Match.filter({ team1_id: teamId });
      const m2 = await base44.entities.Match.filter({ team2_id: teamId });
      return [...m1, ...m2].sort((a, b) => new Date(b.date_match) - new Date(a.date_match));
    },
    enabled: !!teamId,
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.update(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsEditing(false);
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour de l'équipe"),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: () => base44.entities.Team.delete(teamId),
    onSuccess: () => {
      navigate(createPageUrl("Teams"));
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la suppression de l'équipe"),
  });

  const addPlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamPlayer.create(withOrg(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-players'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de l'ajout du joueur"),
  });

  const removePlayerMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamPlayer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-players'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors du retrait du joueur"),
  });

  const simulateMatchMutation = useMutation({
    mutationFn: async (matchData) => {
      await base44.entities.Match.create(matchData);
      
      // Update team stats
      const team1Updates = {};
      const team2Updates = {};
      
      if (matchData.score_team1 > matchData.score_team2) {
        team1Updates.victoires = (team.victoires || 0) + 1;
      } else if (matchData.score_team1 < matchData.score_team2) {
        team1Updates.defaites = (team.defaites || 0) + 1;
      } else {
        team1Updates.nuls = (team.nuls || 0) + 1;
      }
      
      team1Updates.matchs_joues = (team.matchs_joues || 0) + 1;
      team1Updates.buts_pour = (team.buts_pour || 0) + matchData.score_team1;
      team1Updates.buts_contre = (team.buts_contre || 0) + matchData.score_team2;
      
      await base44.entities.Team.update(matchData.team1_id, team1Updates);
      
      // Update opponent stats
      const opponent = teams.find(tm => tm.id === matchData.team2_id);
      if (opponent) {
        if (matchData.score_team2 > matchData.score_team1) {
          team2Updates.victoires = (opponent.victoires || 0) + 1;
        } else if (matchData.score_team2 < matchData.score_team1) {
          team2Updates.defaites = (opponent.defaites || 0) + 1;
        } else {
          team2Updates.nuls = (opponent.nuls || 0) + 1;
        }
        
        team2Updates.matchs_joues = (opponent.matchs_joues || 0) + 1;
        team2Updates.buts_pour = (opponent.buts_pour || 0) + matchData.score_team2;
        team2Updates.buts_contre = (opponent.buts_contre || 0) + matchData.score_team1;
        
        await base44.entities.Team.update(matchData.team2_id, team2Updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la simulation du match"),
  });

  const { lang } = useLanguage();
  const LOCALE_MAP = { fr: 'fr-FR', es: 'es-ES', en: 'en-GB' };
  const dateLocale = LOCALE_MAP[lang] || 'fr-FR';

  if (!team) return null;

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setIsEditing(false)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t(lang,'common.cancel')}
        </Button>
        <TeamForm
          team={team}
          onSubmit={(data) => updateTeamMutation.mutate(data)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const points = (team.victoires * 3) + (team.nuls * 1);
  const goalDiff = team.buts_pour - team.buts_contre;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {mutationError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <Button variant="ghost" onClick={() => navigate(createPageUrl("Teams"))} size="sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t(lang,'common.back')}
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-xl md:text-3xl truncate">{team.nom}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">{team.formation}</Badge>
                {team.budget && (
                  <Badge className="bg-green-100 text-green-800">
                    {t(lang,'teamDetail.budget')}: {team.budget}M€
                  </Badge>
                )}
              </div>
              {team.description && (
                <p className="text-slate-600 mt-2 text-sm">{team.description}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (confirm(t(lang,'teamDetail.deleteConfirm'))) {
                    deleteTeamMutation.mutate();
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-2 md:gap-6">
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-blue-600">{team.matchs_joues || 0}</div>
              <div className="text-xs md:text-sm text-slate-600">{t(lang,'teamDetail.matches')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-yellow-600">{points}</div>
              <div className="text-xs md:text-sm text-slate-600">{t(lang,'teamDetail.points')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-3xl font-bold text-green-600">
                {team.victoires || 0}-{team.nuls || 0}-{team.defaites || 0}
              </div>
              <div className="text-xs md:text-sm text-slate-600">{t(lang,'teamDetail.vnd')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-purple-600">
                {goalDiff >= 0 ? '+' : ''}{goalDiff}
              </div>
              <div className="text-xs md:text-sm text-slate-600">{t(lang,'teamDetail.diff')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="builder" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="builder">🏟️ {t(lang,'teamDetail.terrainTab')}</TabsTrigger>
          <TabsTrigger value="manage">⚙️ {t(lang,'teamDetail.manageTab')}</TabsTrigger>
        </TabsList>

        {/* Builder FIFA-style */}
        <TabsContent value="builder">
          <FootballPitch
            formation={team.formation}
            players={players}
          />
        </TabsContent>

        {/* Gestion classique */}
        <TabsContent value="manage">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TeamComposition
                teamPlayers={teamPlayers}
                players={players}
                onRemovePlayer={(id) => removePlayerMutation.mutate(id)}
              />

              {matches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      {t(lang,'teamDetail.matchHistory')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {matches.map((match) => {
                        const isTeam1 = match.team1_id === teamId;
                        const teamScore = isTeam1 ? match.score_team1 : match.score_team2;
                        const opponentScore = isTeam1 ? match.score_team2 : match.score_team1;
                        const opponentId = isTeam1 ? match.team2_id : match.team1_id;
                        const opponent = teams.find(tm => tm.id === opponentId);
                        const result = teamScore > opponentScore ? "V" : teamScore < opponentScore ? "D" : "N";
                        const resultColor = result === "V" ? "text-green-600" : result === "D" ? "text-red-600" : "text-slate-600";
                        return (
                          <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <Badge className={resultColor}>{result}</Badge>
                              <span className="font-medium">vs {opponent?.nom || t(lang,'teamDetail.deletedTeam')}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-slate-600">{new Date(match.date_match).toLocaleDateString(dateLocale)}</span>
                              <Badge variant="outline" className="font-bold">{teamScore} - {opponentScore}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <AddPlayerToTeam
                players={players}
                teamId={teamId}
                existingPlayerIds={teamPlayers.map(tp => tp.player_id)}
                onAdd={(data) => addPlayerMutation.mutate(data)}
              />
              <MatchSimulator
                currentTeamId={teamId}
                allTeams={teams}
                onSimulate={(data) => simulateMatchMutation.mutate(data)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}