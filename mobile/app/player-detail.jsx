import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Edit2, Trash2, Phone, FileText, Plus } from 'lucide-react-native';
import { Image } from 'expo-image';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Modal from '../src/components/ui/Modal';
import Input from '../src/components/ui/Input';
import Select from '../src/components/ui/Select';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, daysUntil, getPositionColor } from '../src/utils';

const STATUTS_TRANSFER = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'en négociation', label: 'En négociation' },
  { value: 'non disponible', label: 'Non disponible' },
  { value: 'prêt', label: 'Prêt' },
];

function StatBox({ label, value, color = 'slate' }) {
  const colors = { green: 'text-green-600', blue: 'text-blue-600', orange: 'text-orange-600', slate: 'text-slate-900' };
  return (
    <View className="flex-1 items-center py-3 bg-slate-50 rounded-2xl">
      <Text className={`text-xl font-bold ${colors[color]}`}>{value ?? '—'}</Text>
      <Text className="text-xs text-slate-400 mt-0.5">{label}</Text>
    </View>
  );
}

export default function PlayerDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editForm, setEditForm] = useState(null);

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      const list = await base44.entities.Player.filter({ id });
      return list[0] || null;
    },
    enabled: !!id,
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['player-notes', id],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.PlayerNote.filter({ player_id: id, created_by: user.email });
    },
    enabled: !!id,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['player-transfers', id],
    queryFn: () => base44.entities.Transfer.filter({ player_id: id }),
    enabled: !!id,
  });

  const watchEntry = watchList.find(w => w.player_id === id);

  const watchMutation = useMutation({
    mutationFn: async () => {
      if (watchEntry) {
        await base44.entities.WatchList.delete(watchEntry.id);
      } else {
        const user = await base44.auth.me();
        await base44.entities.WatchList.create({ player_id: id, created_by: user.email });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchList'] }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', id] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowEditModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Player.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      router.back();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (text) => {
      const user = await base44.auth.me();
      return base44.entities.PlayerNote.create({ player_id: id, contenu: text, created_by: user.email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-notes', id] });
      setNoteText('');
      setShowNoteModal(false);
    },
  });

  const handleDelete = () => {
    Alert.alert('Supprimer le joueur', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading) return <LoadingSpinner message="Chargement du joueur..." />;
  if (!player) return <View className="flex-1 items-center justify-center"><Text className="text-slate-500">Joueur introuvable</Text></View>;

  const posColor = getPositionColor(player.poste);
  const contractDays = daysUntil(player.date_fin_contrat);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="bg-white border-b border-slate-100">
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft size={22} color="#334155" />
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => watchMutation.mutate()}
                className={`p-2 rounded-xl ${watchEntry ? 'bg-yellow-50' : 'bg-slate-50'}`}
              >
                <Star size={20} color={watchEntry ? '#f59e0b' : '#94a3b8'} fill={watchEntry ? '#f59e0b' : 'none'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditForm({ ...player }); setShowEditModal(true); }} className="p-2 bg-slate-50 rounded-xl">
                <Edit2 size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-50 rounded-xl">
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Player hero */}
          <View className="px-4 pb-5">
            <View className="flex-row items-center gap-4">
              {player.photo_url ? (
                <Image source={{ uri: player.photo_url }} style={{ width: 80, height: 80, borderRadius: 40 }} contentFit="cover" />
              ) : (
                <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center">
                  <Text className="text-2xl font-bold text-slate-400">{player.prenom?.[0]}{player.nom?.[0]}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-2xl font-bold text-slate-900">{player.prenom} {player.nom}</Text>
                <Text className="text-base text-slate-500">{player.club_actuel || 'Sans club'}</Text>
                <View className="flex-row gap-2 mt-2 flex-wrap">
                  <View style={{ backgroundColor: posColor + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ color: posColor, fontSize: 12, fontWeight: '600' }}>{player.poste}</Text>
                  </View>
                  {player.nationalite ? <Badge variant="secondary">🏳 {player.nationalite}</Badge> : null}
                  {player.age ? <Badge variant="secondary">{player.age} ans</Badge> : null}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4 gap-4">
          {/* Stats saison */}
          <Card>
            <CardHeader><CardTitle>Statistiques saison</CardTitle></CardHeader>
            <CardContent>
              <View className="flex-row gap-2">
                <StatBox label="Buts" value={player.buts_saison} color="green" />
                <StatBox label="Passes D" value={player.passes_saison} color="blue" />
                <StatBox label="Minutes" value={player.minutes_jouees} />
                <StatBox label="Note moy." value={player.note_moyenne ? Number(player.note_moyenne).toFixed(1) : undefined} color="orange" />
              </View>
            </CardContent>
          </Card>

          {/* Infos financières */}
          <Card>
            <CardHeader><CardTitle>Informations financières</CardTitle></CardHeader>
            <CardContent>
              <View className="gap-2">
                {player.valeur_marchande ? (
                  <View className="flex-row justify-between items-center py-2 border-b border-slate-50">
                    <Text className="text-sm text-slate-600">Valeur marchande</Text>
                    <Text className="font-semibold text-green-600">{formatCurrency(player.valeur_marchande)}</Text>
                  </View>
                ) : null}
                {player.salaire ? (
                  <View className="flex-row justify-between items-center py-2 border-b border-slate-50">
                    <Text className="text-sm text-slate-600">Salaire mensuel</Text>
                    <Text className="font-semibold text-slate-900">{formatCurrency(player.salaire)}</Text>
                  </View>
                ) : null}
                {player.date_fin_contrat ? (
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-sm text-slate-600">Fin de contrat</Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm text-slate-900">{formatDate(player.date_fin_contrat)}</Text>
                      {contractDays !== null && contractDays <= 365 && contractDays >= 0 ? (
                        <Badge variant={contractDays <= 90 ? 'destructive' : 'warning'}>{contractDays}j</Badge>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <Card>
            <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
            <CardContent>
              <View className="gap-2">
                {[
                  { label: 'Pied fort', value: player.pied_fort },
                  { label: 'Taille', value: player.taille ? `${player.taille} cm` : null },
                  { label: 'Poids', value: player.poids ? `${player.poids} kg` : null },
                  { label: 'Agent', value: player.agent },
                  { label: 'Statut transfer', value: player.statut_transfert },
                ].filter(i => i.value).map(i => (
                  <View key={i.label} className="flex-row justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <Text className="text-sm text-slate-500">{i.label}</Text>
                    <Text className="text-sm font-medium text-slate-900">{i.value}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle>Notes de scouting</CardTitle>
                <TouchableOpacity onPress={() => setShowNoteModal(true)} className="p-1">
                  <Plus size={18} color="#16a34a" />
                </TouchableOpacity>
              </View>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <Text className="text-sm text-slate-400 text-center py-4">Aucune note</Text>
              ) : (
                notes.map(n => (
                  <View key={n.id} className="py-2 border-b border-slate-50 last:border-0">
                    <Text className="text-sm text-slate-700">{n.contenu}</Text>
                    <Text className="text-xs text-slate-400 mt-1">{formatDate(n.created_date)}</Text>
                  </View>
                ))
              )}
            </CardContent>
          </Card>

          {/* Historique de transferts */}
          {transfers.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Historique transferts</CardTitle></CardHeader>
              <CardContent>
                {transfers.map(t => (
                  <View key={t.id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <View>
                      <Text className="text-sm font-medium text-slate-900">{t.club_depart} → {t.club_arrivee}</Text>
                      <Text className="text-xs text-slate-400">{formatDate(t.date_transfert)}</Text>
                    </View>
                    {t.montant ? <Badge variant="default">{formatCurrency(t.montant)}</Badge> : <Badge variant="secondary">Prêt</Badge>}
                  </View>
                ))}
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Edit modal */}
      {editForm && (
        <Modal visible={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le joueur">
          <View className="gap-4">
            <View className="flex-row gap-3">
              <Input label="Prénom" value={editForm.prenom || ''} onChangeText={v => setEditForm(f => ({ ...f, prenom: v }))} className="flex-1" />
              <Input label="Nom" value={editForm.nom || ''} onChangeText={v => setEditForm(f => ({ ...f, nom: v }))} className="flex-1" />
            </View>
            <Select label="Statut transfert" value={editForm.statut_transfert || ''} onChange={v => setEditForm(f => ({ ...f, statut_transfert: v }))} options={STATUTS_TRANSFER} placeholder="Statut..." />
            <Input label="Valeur marchande (M€)" value={editForm.valeur_marchande?.toString() || ''} onChangeText={v => setEditForm(f => ({ ...f, valeur_marchande: parseFloat(v) || 0 }))} keyboardType="numeric" />
            <Input label="Club actuel" value={editForm.club_actuel || ''} onChangeText={v => setEditForm(f => ({ ...f, club_actuel: v }))} />
            <View className="flex-row gap-3 pt-2">
              <Button variant="outline" onPress={() => setShowEditModal(false)} className="flex-1">Annuler</Button>
              <Button onPress={() => updateMutation.mutate(editForm)} loading={updateMutation.isPending} className="flex-1">Sauvegarder</Button>
            </View>
          </View>
        </Modal>
      )}

      {/* Note modal */}
      <Modal visible={showNoteModal} onClose={() => setShowNoteModal(false)} title="Ajouter une note">
        <View className="gap-4">
          <Input label="Note" value={noteText} onChangeText={setNoteText} multiline numberOfLines={4} placeholder="Vos observations sur ce joueur..." />
          <View className="flex-row gap-3">
            <Button variant="outline" onPress={() => setShowNoteModal(false)} className="flex-1">Annuler</Button>
            <Button onPress={() => noteText && addNoteMutation.mutate(noteText)} loading={addNoteMutation.isPending} className="flex-1">Ajouter</Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
