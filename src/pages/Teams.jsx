import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import TeamCard from "../components/teams/TeamCard";
import TeamForm from "../components/teams/TeamForm";

export default function TeamsPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Team.filter({ created_by: user.email });
    },
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TeamPlayer.filter({ created_by: user.email });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowForm(false);
    },
  });

  const getPlayerCount = (teamId) => {
    return teamPlayers.filter(tp => tp.team_id === teamId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Chargement des équipes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
            <span className="truncate">Mes équipes</span>
          </h1>
          <p className="text-slate-600 mt-0.5 text-sm hidden md:block">Créez et gérez vos équipes virtuelles</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 flex-shrink-0" size="sm">
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Nouvelle équipe</span>
          <span className="md:hidden">Nouvelle</span>
        </Button>
      </div>

      {showForm && (
        <TeamForm
          onSubmit={(data) => createTeamMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {teams.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-lg">
          <Users className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            Aucune équipe créée
          </h3>
          <p className="text-slate-600 mb-4">
            Créez votre première équipe pour commencer
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              playersCount={getPlayerCount(team.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}