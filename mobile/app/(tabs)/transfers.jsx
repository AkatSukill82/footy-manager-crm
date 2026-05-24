import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowRightLeft, TrendingUp, Clock } from 'lucide-react-native';
import { base44 } from '../../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import Modal from '../../src/components/ui/Modal';
import Input from '../../src/components/ui/Input';
import Select from '../../src/components/ui/Select';
import LoadingSpinner from '../../src/components/ui/LoadingSpinner';
import EmptyState from '../../src/components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../src/utils';

const STATUTS = [
  { value: 'initial', label: 'Initial' },
  { value: 'en négociation', label: 'En négociation' },
  { value: 'accepté', label: 'Accepté' },
  { value: 'refusé', label: 'Refusé' },
  { value: 'finalisé', label: 'Finalisé' },
];

const PRIORITES = [
  { value: 'haute', label: 'Haute' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'basse', label: 'Basse' },
];

const statusBadge = {
  'initial': 'secondary',
  'en négociation': 'blue',
  'accepté': 'default',
  'refusé': 'destructive',
  'finalisé': 'purple',
};

function NegCard({ neg, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card className="mb-3">
        <CardContent className="pt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-slate-900 text-base flex-1 mr-3" numberOfLines={1}>{neg.nom_joueur}</Text>
            <Badge variant={statusBadge[neg.statut] || 'secondary'}>{neg.statut}</Badge>
          </View>
          <View className="flex-row items-center gap-3 mb-2">
            <Text className="text-xs text-slate-400 flex-1" numberOfLines={1}>
              {neg.club_vendeur || '?'} → {neg.club_acheteur || '?'}
            </Text>
          </View>
          <View className="flex-row gap-2 flex-wrap">
            {neg.montant_propose ? <Badge variant="default">{formatCurrency(neg.montant_propose)} proposé</Badge> : null}
            {neg.montant_demande ? <Badge variant="secondary">{formatCurrency(neg.montant_demande)} demandé</Badge> : null}
            {neg.date_limite ? <Badge variant="warning">⏰ {formatDate(neg.date_limite)}</Badge> : null}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

function AddNegModal({ visible, onClose, onSubmit, loading, players }) {
  const [form, setForm] = useState({ nom_joueur: '', club_vendeur: '', club_acheteur: '', montant_propose: '', statut: 'initial', priorite: 'moyenne' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const playerOptions = players.map(p => ({ value: `${p.prenom} ${p.nom}`, label: `${p.prenom} ${p.nom} — ${p.club_actuel || ''}` }));

  return (
    <Modal visible={visible} onClose={onClose} title="Nouvelle négociation">
      <View className="gap-4">
        <Select label="Joueur *" value={form.nom_joueur} onChange={v => set('nom_joueur', v)} options={playerOptions} placeholder="Sélectionner un joueur" />
        <View className="flex-row gap-3">
          <Input label="Club vendeur" value={form.club_vendeur} onChangeText={v => set('club_vendeur', v)} className="flex-1" />
          <Input label="Club acheteur" value={form.club_acheteur} onChangeText={v => set('club_acheteur', v)} className="flex-1" />
        </View>
        <Input label="Montant proposé (M€)" value={form.montant_propose} onChangeText={v => set('montant_propose', v)} keyboardType="numeric" />
        <Select label="Statut" value={form.statut} onChange={v => set('statut', v)} options={STATUTS} />
        <Select label="Priorité" value={form.priorite} onChange={v => set('priorite', v)} options={PRIORITES} />
        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" onPress={onClose} className="flex-1">Annuler</Button>
          <Button onPress={() => form.nom_joueur && onSubmit({ ...form, montant_propose: form.montant_propose ? parseFloat(form.montant_propose) : undefined })} loading={loading} className="flex-1">Créer</Button>
        </View>
      </View>
    </Modal>
  );
}

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('negociations');
  const [refreshing, setRefreshing] = useState(false);

  const { data: negociations = [], isLoading, refetch } = useQuery({
    queryKey: ['negociations'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TransferNegociation.filter({ created_by: user.email });
    },
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => base44.entities.Transfer.list(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TransferNegociation.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['negociations'] }); setShowAdd(false); },
  });

  if (isLoading) return <LoadingSpinner message="Chargement des transferts..." />;

  const active = negociations.filter(n => n.statut !== 'finalisé' && n.statut !== 'refusé');
  const done = negociations.filter(n => n.statut === 'finalisé' || n.statut === 'refusé');
  const totalValue = transfers.reduce((s, t) => s + (t.montant || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Transferts</Text>
            <Text className="text-sm text-slate-400">{active.length} négociation{active.length > 1 ? 's' : ''} active{active.length > 1 ? 's' : ''}</Text>
          </View>
          <Button onPress={() => setShowAdd(true)} size="sm" icon={<Plus size={16} color="white" />}>Nouvelle</Button>
        </View>

        {/* KPIs */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-blue-50 rounded-2xl p-3">
            <Text className="text-2xl font-bold text-blue-700">{active.length}</Text>
            <Text className="text-xs text-blue-500">En cours</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-2xl p-3">
            <Text className="text-2xl font-bold text-green-700">{done.filter(n => n.statut === 'finalisé').length}</Text>
            <Text className="text-xs text-green-500">Finalisés</Text>
          </View>
          <View className="flex-1 bg-purple-50 rounded-2xl p-3">
            <Text className="text-lg font-bold text-purple-700">{formatCurrency(totalValue)}</Text>
            <Text className="text-xs text-purple-500">Valeur totale</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-slate-100 rounded-2xl p-1">
          {[
            { key: 'negociations', label: 'En cours', count: active.length },
            { key: 'archives', label: 'Archives', count: done.length },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${activeTab === t.key ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-semibold ${activeTab === t.key ? 'text-slate-900' : 'text-slate-500'}`}>{t.label}</Text>
              {t.count > 0 && <View className="bg-green-500 rounded-full w-4 h-4 items-center justify-center"><Text className="text-white text-[9px] font-bold">{t.count}</Text></View>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={activeTab === 'negociations' ? active : done}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <View className="px-4"><NegCard neg={item} /></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor="#16a34a" />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<EmptyState icon={ArrowRightLeft} title="Aucune négociation" description="Créez votre première négociation." />}
      />

      <AddNegModal visible={showAdd} onClose={() => setShowAdd(false)} onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} players={players} />
    </SafeAreaView>
  );
}
