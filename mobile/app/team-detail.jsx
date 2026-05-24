import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Shield, Trash2 } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Modal from '../src/components/ui/Modal';
import Select from '../src/components/ui/Select';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import Avatar from '../src/components/ui/Avatar';
import { getPositionColor } from '../src/utils';

export default function TeamDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const list = await base44.entities.Team.filter({ id });
      return list[0] || null;
    },
    enabled: !!id,
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players', id],
    queryFn: () => base44.entities.TeamPlayer.filter({ team_id: id }),
    enabled: !!id,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (playerId) => {
      const player = allPlayers.find(p => p.id === playerId);
      return base44.entities.TeamPlayer.create({
        team_id: id,
        player_id: playerId,
        nom_joueur: `${player?.prenom} ${player?.nom}`,
        poste: player?.poste,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-players', id] });
      setShowAddPlayer(false);
      setSelectedPlayerId('');
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: (tpId) => base44.entities.TeamPlayer.delete(tpId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-players', id] }),
  });

  if (isLoading) return <LoadingSpinner message="Chargement de l'équipe..." />;
  if (!team) return <View className="flex-1 items-center justify-center"><Text className="text-slate-500">Équipe introuvable</Text></View>;

  const teamPlayerIds = new Set(teamPlayers.map(tp => tp.player_id));
  const availablePlayers = allPlayers.filter(p => !teamPlayerIds.has(p.id)).map(p => ({
    value: p.id,
    label: `${p.prenom} ${p.nom} — ${p.poste || ''} (${p.club_actuel || ''})`,
  }));

  const byPoste = teamPlayers.reduce((acc, tp) => {
    const pos = tp.poste || 'Autre';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(tp);
    return acc;
  }, {});

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white border-b border-slate-100 px-4 py-3 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={22} color="#334155" />
          </TouchableOpacity>
          <View className="w-10 h-10 bg-green-50 rounded-2xl items-center justify-center">
            <Shield size={20} color="#16a34a" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{team.nom}</Text>
            <Text className="text-sm text-slate-500">{team.formation} · {teamPlayers.length} joueurs</Text>
          </View>
          <Button size="sm" onPress={() => setShowAddPlayer(true)} icon={<Plus size={14} color="white" />}>Ajouter</Button>
        </View>

        <View className="px-4 mt-4 gap-4">
          {/* Stats */}
          {(team.victoires !== undefined || team.points !== undefined) && (
            <Card>
              <CardHeader><CardTitle>Résultats</CardTitle></CardHeader>
              <CardContent>
                <View className="flex-row gap-3">
                  {[
                    { label: 'Victoires', value: team.victoires, color: 'text-green-600' },
                    { label: 'Nuls', value: team.nuls, color: 'text-slate-500' },
                    { label: 'Défaites', value: team.defaites, color: 'text-red-500' },
                    { label: 'Points', value: team.points, color: 'text-slate-900' },
                  ].map(s => (
                    <View key={s.label} className="flex-1 items-center bg-slate-50 rounded-2xl py-3">
                      <Text className={`text-xl font-bold ${s.color}`}>{s.value ?? '—'}</Text>
                      <Text className="text-xs text-slate-400">{s.label}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Composition par poste */}
          {Object.entries(byPoste).map(([poste, joueurs]) => (
            <Card key={poste}>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getPositionColor(poste) }} />
                  <CardTitle>{poste}</CardTitle>
                  <Badge variant="secondary">{joueurs.length}</Badge>
                </View>
              </CardHeader>
              <CardContent>
                {joueurs.map(tp => {
                  const player = allPlayers.find(p => p.id === tp.player_id);
                  return (
                    <View key={tp.id} className="flex-row items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <Avatar src={player?.photo_url} name={tp.nom_joueur} size={36} />
                      <Text className="flex-1 text-sm font-medium text-slate-900">{tp.nom_joueur}</Text>
                      <TouchableOpacity
                        onPress={() => removePlayerMutation.mutate(tp.id)}
                        className="p-1.5 bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          {teamPlayers.length === 0 && (
            <View className="items-center py-12">
              <Shield size={40} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-sm">Aucun joueur dans cette équipe</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showAddPlayer} onClose={() => setShowAddPlayer(false)} title="Ajouter un joueur">
        <View className="gap-4">
          <Select
            label="Joueur"
            value={selectedPlayerId}
            onChange={setSelectedPlayerId}
            options={availablePlayers}
            placeholder="Sélectionner un joueur..."
          />
          <View className="flex-row gap-3">
            <Button variant="outline" onPress={() => setShowAddPlayer(false)} className="flex-1">Annuler</Button>
            <Button onPress={() => selectedPlayerId && addPlayerMutation.mutate(selectedPlayerId)} loading={addPlayerMutation.isPending} className="flex-1">Ajouter</Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
