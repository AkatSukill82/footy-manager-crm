import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight, Building2 } from 'lucide-react-native';
import { base44 } from '../../src/api/base44Client';
import { Card, CardContent } from '../../src/components/ui/Card';
import SearchBar from '../../src/components/ui/SearchBar';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import Modal from '../../src/components/ui/Modal';
import Input from '../../src/components/ui/Input';
import Select from '../../src/components/ui/Select';
import LoadingSpinner from '../../src/components/ui/LoadingSpinner';
import EmptyState from '../../src/components/ui/EmptyState';
import { formatCurrency } from '../../src/utils';

const LIGUES = [
  { value: 'Ligue 1', label: 'Ligue 1' },
  { value: 'Premier League', label: 'Premier League' },
  { value: 'La Liga', label: 'La Liga' },
  { value: 'Bundesliga', label: 'Bundesliga' },
  { value: 'Serie A', label: 'Serie A' },
  { value: 'Ligue 2', label: 'Ligue 2' },
  { value: 'Championship', label: 'Championship' },
  { value: 'Autre', label: 'Autre' },
];

function ClubCard({ club, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card className="mb-3">
        <CardContent className="pt-4">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-slate-100 rounded-2xl items-center justify-center">
              <Building2 size={22} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900 text-base">{club.nom}</Text>
              <Text className="text-sm text-slate-500">{club.ligue} · {club.pays || ''}</Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </View>
          <View className="flex-row gap-2 mt-3 flex-wrap">
            {club.budget_transfert ? <Badge variant="default">{formatCurrency(club.budget_transfert)} budget</Badge> : null}
            {club.ville ? <Badge variant="secondary">{club.ville}</Badge> : null}
            {club.stade ? <Badge variant="secondary">🏟 {club.stade}</Badge> : null}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

function AddClubModal({ visible, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ nom: '', ligue: '', pays: '', ville: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal visible={visible} onClose={onClose} title="Ajouter un club">
      <View className="gap-4">
        <Input label="Nom du club *" value={form.nom} onChangeText={v => set('nom', v)} />
        <Select label="Ligue" value={form.ligue} onChange={v => set('ligue', v)} options={LIGUES} placeholder="Sélectionner une ligue" />
        <View className="flex-row gap-3">
          <Input label="Pays" value={form.pays} onChangeText={v => set('pays', v)} className="flex-1" />
          <Input label="Ville" value={form.ville} onChangeText={v => set('ville', v)} className="flex-1" />
        </View>
        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" onPress={onClose} className="flex-1">Annuler</Button>
          <Button onPress={() => form.nom && onSubmit(form)} loading={loading} className="flex-1">Créer</Button>
        </View>
      </View>
    </Modal>
  );
}

export default function ClubsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: clubs = [], isLoading, refetch } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => base44.entities.Club.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Club.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clubs'] }); setShowAdd(false); },
  });

  const filtered = useMemo(() => clubs.filter(c => {
    const q = search.toLowerCase();
    return !search || c.nom?.toLowerCase().includes(q) || c.ligue?.toLowerCase().includes(q) || c.pays?.toLowerCase().includes(q);
  }), [clubs, search]);

  if (isLoading) return <LoadingSpinner message="Chargement des clubs..." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pt-4 pb-3 bg-slate-50">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Clubs</Text>
            <Text className="text-sm text-slate-400">{clubs.length} clubs</Text>
          </View>
          <Button onPress={() => setShowAdd(true)} size="sm" icon={<Plus size={16} color="white" />}>Ajouter</Button>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Nom, ligue, pays..." />
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Aucun club trouvé" description="Ajoutez votre premier club." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <ClubCard club={item} onPress={() => router.push({ pathname: '/club-detail', params: { id: item.id } })} />
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor="#16a34a" />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <AddClubModal visible={showAdd} onClose={() => setShowAdd(false)} onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} />
    </SafeAreaView>
  );
}
