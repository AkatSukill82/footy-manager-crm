import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight, Shield, Trophy } from 'lucide-react-native';
import { base44 } from '../../src/api/base44Client';
import { Card, CardContent } from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Modal from '../../src/components/ui/Modal';
import Input from '../../src/components/ui/Input';
import Select from '../../src/components/ui/Select';
import Badge from '../../src/components/ui/Badge';
import LoadingSpinner from '../../src/components/ui/LoadingSpinner';
import EmptyState from '../../src/components/ui/EmptyState';

const FORMATIONS = [
  { value: '4-3-3', label: '4-3-3' },
  { value: '4-4-2', label: '4-4-2' },
  { value: '4-2-3-1', label: '4-2-3-1' },
  { value: '3-5-2', label: '3-5-2' },
  { value: '3-4-3', label: '3-4-3' },
  { value: '5-3-2', label: '5-3-2' },
  { value: '4-1-4-1', label: '4-1-4-1' },
];

function TeamCard({ team, playerCount, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card className="mb-3">
        <CardContent className="pt-4">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-green-50 rounded-2xl items-center justify-center">
              <Shield size={22} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900 text-base">{team.nom}</Text>
              <Text className="text-sm text-slate-500">{team.formation || 'Formation non définie'}</Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </View>
          <View className="flex-row gap-2 mt-3">
            <Badge variant="secondary">{playerCount} joueurs</Badge>
            {team.competition ? <Badge variant="blue">{team.competition}</Badge> : null}
            {team.saison ? <Badge variant="secondary">{team.saison}</Badge> : null}
          </View>
          {(team.victoires !== undefined || team.points !== undefined) && (
            <View className="flex-row gap-4 mt-3 pt-3 border-t border-slate-100">
              {team.victoires !== undefined && <View className="items-center"><Text className="text-base font-bold text-green-600">{team.victoires}</Text><Text className="text-xs text-slate-400">V</Text></View>}
              {team.nuls !== undefined && <View className="items-center"><Text className="text-base font-bold text-slate-500">{team.nuls}</Text><Text className="text-xs text-slate-400">N</Text></View>}
              {team.defaites !== undefined && <View className="items-center"><Text className="text-base font-bold text-red-500">{team.defaites}</Text><Text className="text-xs text-slate-400">D</Text></View>}
              {team.points !== undefined && <View className="items-center"><Text className="text-base font-bold text-slate-900">{team.points}</Text><Text className="text-xs text-slate-400">Pts</Text></View>}
            </View>
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

function AddTeamModal({ visible, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ nom: '', formation: '4-3-3', competition: '', saison: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal visible={visible} onClose={onClose} title="Créer une équipe">
      <View className="gap-4">
        <Input label="Nom de l'équipe *" value={form.nom} onChangeText={v => set('nom', v)} />
        <Select label="Formation" value={form.formation} onChange={v => set('formation', v)} options={FORMATIONS} />
        <Input label="Compétition" value={form.competition} onChangeText={v => set('competition', v)} />
        <Input label="Saison" value={form.saison} onChangeText={v => set('saison', v)} placeholder="2024-2025" />
        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" onPress={onClose} className="flex-1">Annuler</Button>
          <Button onPress={() => form.nom && onSubmit(form)} loading={loading} className="flex-1">Créer</Button>
        </View>
      </View>
    </Modal>
  );
}

export default function TeamsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: teams = [], isLoading, refetch } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Team.filter({ created_by: user.email });
    },
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['teamPlayers'],
    queryFn: () => base44.entities.TeamPlayer.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setShowAdd(false); },
  });

  if (isLoading) return <LoadingSpinner message="Chargement des équipes..." />;

  const playerCountByTeam = teamPlayers.reduce((acc, tp) => {
    acc[tp.team_id] = (acc[tp.team_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Équipes</Text>
            <Text className="text-sm text-slate-400">{teams.length} équipe{teams.length > 1 ? 's' : ''}</Text>
          </View>
          <Button onPress={() => setShowAdd(true)} size="sm" icon={<Plus size={16} color="white" />}>Créer</Button>
        </View>
      </View>

      {teams.length === 0 ? (
        <EmptyState icon={Shield} title="Aucune équipe" description="Créez votre première équipe pour commencer." />
      ) : (
        <FlatList
          data={teams}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <TeamCard
                team={item}
                playerCount={playerCountByTeam[item.id] || 0}
                onPress={() => router.push({ pathname: '/team-detail', params: { id: item.id } })}
              />
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor="#16a34a" />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <AddTeamModal visible={showAdd} onClose={() => setShowAdd(false)} onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
    </SafeAreaView>
  );
}
