import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Filter, X, ChevronRight, RefreshCw } from 'lucide-react-native';
import { base44 } from '../../src/api/base44Client';
import { Card, CardContent } from '../../src/components/ui/Card';
import SearchBar from '../../src/components/ui/SearchBar';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import Modal from '../../src/components/ui/Modal';
import Select from '../../src/components/ui/Select';
import Input from '../../src/components/ui/Input';
import LoadingSpinner from '../../src/components/ui/LoadingSpinner';
import EmptyState from '../../src/components/ui/EmptyState';
import Avatar from '../../src/components/ui/Avatar';
import { formatCurrency, daysUntil, getPositionColor } from '../../src/utils';

const POSTES = [
  { value: 'all', label: 'Tous les postes' },
  { value: 'Gardien', label: 'Gardien' },
  { value: 'Défenseur', label: 'Défenseur' },
  { value: 'Milieu', label: 'Milieu' },
  { value: 'Attaquant', label: 'Attaquant' },
];

function PlayerCard({ player, inWatchList, onPress }) {
  const posColor = getPositionColor(player.poste);
  const contractDays = daysUntil(player.date_fin_contrat);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card className="mb-3">
        <CardContent className="pt-4">
          <View className="flex-row items-center gap-3">
            <Avatar src={player.photo_url} name={`${player.prenom} ${player.nom}`} size={48} />
            <View className="flex-1 min-w-0">
              <Text className="font-bold text-slate-900 text-base" numberOfLines={1}>
                {player.prenom} {player.nom}
              </Text>
              <Text className="text-sm text-slate-500" numberOfLines={1}>
                {player.club_actuel || 'Club inconnu'} · {player.nationalite || ''}
              </Text>
            </View>
            <ChevronRight size={16} color="#94a3b8" />
          </View>

          <View className="flex-row items-center gap-2 mt-3 flex-wrap">
            <View style={{ backgroundColor: posColor + '20', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: posColor, fontSize: 11, fontWeight: '600' }}>{player.poste}</Text>
            </View>
            {player.age ? <Badge variant="secondary">{player.age} ans</Badge> : null}
            {player.valeur_marchande ? <Badge variant="default">{formatCurrency(player.valeur_marchande)}</Badge> : null}
            {inWatchList ? <Badge variant="purple">⭐ Suivi</Badge> : null}
            {contractDays !== null && contractDays <= 180 && contractDays >= 0 ? (
              <Badge variant={contractDays <= 30 ? 'destructive' : 'warning'}>Contrat {contractDays}j</Badge>
            ) : null}
          </View>

          {(player.buts_saison || player.passes_saison || player.note_moyenne) ? (
            <View className="flex-row gap-4 mt-3 pt-3 border-t border-slate-100">
              {player.buts_saison !== undefined && (
                <View className="items-center">
                  <Text className="text-base font-bold text-slate-900">{player.buts_saison}</Text>
                  <Text className="text-xs text-slate-400">Buts</Text>
                </View>
              )}
              {player.passes_saison !== undefined && (
                <View className="items-center">
                  <Text className="text-base font-bold text-slate-900">{player.passes_saison}</Text>
                  <Text className="text-xs text-slate-400">Passes</Text>
                </View>
              )}
              {player.note_moyenne !== undefined && (
                <View className="items-center">
                  <Text className="text-base font-bold text-green-600">{Number(player.note_moyenne).toFixed(1)}</Text>
                  <Text className="text-xs text-slate-400">Note</Text>
                </View>
              )}
            </View>
          ) : null}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

function AddPlayerModal({ visible, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ nom: '', prenom: '', poste: '', age: '', club_actuel: '', nationalite: '', tm_url: '' });
  const [fetchingTM, setFetchingTM] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFetchFromTM = async () => {
    if (!form.tm_url) return;
    setFetchingTM(true);
    try {
      const res = await base44.functions.invoke('enrichPlayerFromAPI', {
        playerName: '',
        tmUrl: form.tm_url.trim(),
      });
      if (res?.data) {
        const d = res.data;
        setForm(f => ({
          ...f,
          nom:        d.nom        || f.nom,
          prenom:     d.prenom     || f.prenom,
          poste:      d.poste      || f.poste,
          age:        d.age        ? String(d.age) : f.age,
          club_actuel: d.club_actuel || f.club_actuel,
          nationalite: d.nationalite || f.nationalite,
        }));
      }
    } catch (e) {
      // silently fail — user can still fill form manually
    } finally {
      setFetchingTM(false);
    }
  };

  const handleSubmit = () => {
    if (!form.nom || !form.poste) return;
    const { tm_url, ...data } = form;
    onSubmit({ ...data, age: data.age ? parseInt(data.age) : undefined, lien: tm_url || undefined });
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Ajouter un joueur">
      <View className="gap-4">
        {/* Lien Transfermarkt — pré-remplissage automatique */}
        <View className="gap-2">
          <Input
            label="Lien Transfermarkt (optionnel)"
            value={form.tm_url}
            onChangeText={v => set('tm_url', v)}
            placeholder="https://www.transfermarkt.com/.../spieler/12345"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {form.tm_url.includes('transfermarkt') && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleFetchFromTM}
              loading={fetchingTM}
              icon={fetchingTM ? null : <RefreshCw size={13} color="#3b82f6" />}
            >
              Récupérer les données depuis TM
            </Button>
          )}
        </View>

        <View className="h-px bg-slate-100" />

        <View className="flex-row gap-3">
          <Input label="Prénom" value={form.prenom} onChangeText={v => set('prenom', v)} className="flex-1" />
          <Input label="Nom *" value={form.nom} onChangeText={v => set('nom', v)} className="flex-1" />
        </View>
        <Select label="Poste *" value={form.poste} onChange={v => set('poste', v)}
          options={POSTES.slice(1)} placeholder="Sélectionner un poste" />
        <View className="flex-row gap-3">
          <Input label="Âge" value={form.age} onChangeText={v => set('age', v)} keyboardType="numeric" className="flex-1" />
          <Input label="Nationalité" value={form.nationalite} onChangeText={v => set('nationalite', v)} className="flex-1" />
        </View>
        <Input label="Club actuel" value={form.club_actuel} onChangeText={v => set('club_actuel', v)} />
        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" onPress={onClose} className="flex-1">Annuler</Button>
          <Button onPress={handleSubmit} loading={loading} disabled={!form.nom || !form.poste} className="flex-1">Créer</Button>
        </View>
      </View>
    </Modal>
  );
}

export default function PlayersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterPoste, setFilterPoste] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: players = [], isLoading, refetch } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('-created_date'),
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowAdd(false);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const watchListIds = useMemo(() => new Set(watchList.map(w => w.player_id)), [watchList]);

  const filtered = useMemo(() => players.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.nom?.toLowerCase().includes(q) || p.prenom?.toLowerCase().includes(q) || p.club_actuel?.toLowerCase().includes(q);
    const matchPoste = filterPoste === 'all' || p.poste === filterPoste;
    return matchSearch && matchPoste;
  }), [players, search, filterPoste]);

  if (isLoading) return <LoadingSpinner message="Chargement des joueurs..." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-3 bg-slate-50">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-2xl font-bold text-slate-900">Joueurs</Text>
              <Text className="text-sm text-slate-400">{filtered.length} / {players.length} joueurs</Text>
            </View>
            <Button onPress={() => setShowAdd(true)} size="sm" icon={<Plus size={16} color="white" />}>
              Ajouter
            </Button>
          </View>
          <View className="flex-row gap-2">
            <SearchBar value={search} onChangeText={setSearch} placeholder="Nom, club..." className="flex-1" />
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              className={`w-11 h-11 rounded-xl items-center justify-center border ${showFilters || filterPoste !== 'all' ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'}`}
            >
              <Filter size={18} color={filterPoste !== 'all' ? '#16a34a' : '#64748b'} />
            </TouchableOpacity>
          </View>

          {/* Poste pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 -mx-4 px-4">
            <View className="flex-row gap-2">
              {POSTES.map(p => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setFilterPoste(p.value)}
                  className={`px-3 py-1.5 rounded-full border ${filterPoste === p.value ? 'bg-green-600 border-green-600' : 'bg-white border-slate-200'}`}
                >
                  <Text className={`text-xs font-semibold ${filterPoste === p.value ? 'text-white' : 'text-slate-600'}`}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState title="Aucun joueur trouvé" description="Modifiez vos filtres ou ajoutez un joueur." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View className="px-4">
                <PlayerCard
                  player={item}
                  inWatchList={watchListIds.has(item.id)}
                  onPress={() => router.push({ pathname: '/player-detail', params: { id: item.id } })}
                />
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      <AddPlayerModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={d => createMutation.mutate(d)}
        loading={createMutation.isPending}
      />
    </SafeAreaView>
  );
}
