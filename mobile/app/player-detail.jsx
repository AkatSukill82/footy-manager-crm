import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Star, Edit2, Trash2, Phone, FileText, Plus, Sparkles, Clock, Mic } from 'lucide-react-native';
import { Image } from 'expo-image';
import { base44, uploadFileRN } from '../src/api/base44Client';
import { getToken } from '../src/lib/app-params';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Modal from '../src/components/ui/Modal';
import Input from '../src/components/ui/Input';
import Select from '../src/components/ui/Select';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import VoiceNoteRecorder from '../src/components/ui/VoiceNoteRecorder';
import { formatCurrency, formatDate, daysUntil, getPositionColor } from '../src/utils';

const STATUTS_TRANSFER = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'en négociation', label: 'En négociation' },
  { value: 'non disponible', label: 'Non disponible' },
  { value: 'prêt', label: 'Prêt' },
];

const CONTACT_TYPES = [
  { value: 'appel', label: 'Appel téléphonique' },
  { value: 'email', label: 'Email' },
  { value: 'réunion', label: 'Réunion' },
  { value: 'message', label: 'Message' },
];

const CONTACT_BADGE = {
  appel: 'blue',
  email: 'secondary',
  réunion: 'purple',
  message: 'default',
};

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
  const [showQuickContact, setShowQuickContact] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [audioUri, setAudioUri] = useState(null);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [quickContactForm, setQuickContactForm] = useState({ type: 'appel', notes: '', prochainContact: '' });

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

  const { data: playerContacts = [] } = useQuery({
    queryKey: ['player-contacts', id],
    queryFn: async () => {
      if (!player) return [];
      const fullName = [player.prenom, player.nom].filter(Boolean).join(' ');
      return base44.entities.Contact.filter({ nom_joueur: fullName });
    },
    enabled: !!player,
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
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.PlayerNote.create({ player_id: id, created_by: user.email, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-notes', id] });
      closeNoteModal();
    },
  });

  const quickContactMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const fullName = [player?.prenom, player?.nom].filter(Boolean).join(' ');
      return base44.entities.Contact.create({
        nom_joueur: fullName,
        type_contact: data.type,
        notes: data.notes || undefined,
        date_contact: new Date().toISOString(),
        prochain_contact: data.prochainContact || undefined,
        created_by: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-contacts', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowQuickContact(false);
      setQuickContactForm({ type: 'appel', notes: '', prochainContact: '' });
    },
  });

  const closeNoteModal = () => {
    setNoteText('');
    setAudioUri(null);
    setShowNoteModal(false);
  };

  const handleGenerateAINote = async () => {
    if (!player) return;
    setIsGeneratingNote(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant scout de football professionnel. L'agent vient d'observer ${player.prenom || ''} ${player.nom} (${player.poste || 'poste inconnu'}, ${player.club_actuel || 'sans club'}, ${player.age || '?'} ans, ${player.nationalite || ''}).
Statistiques saison: buts: ${player.buts_saison ?? player.buts ?? 0}, passes décisives: ${player.passes_saison ?? player.passes_decisives ?? 0}, note moyenne: ${player.note_moyenne || '?'}/10, minutes jouées: ${player.minutes_jouees || '?'}.
Points forts connus: ${player.forces || 'non renseignés'}. Axes d'amélioration: ${player.faiblesses || 'non renseignés'}.

Génère un rapport de scouting concis (4 à 5 phrases) en français que l'agent pourra personnaliser. Structure: 1) Profil général du joueur, 2) Points forts observables, 3) Axes de progression, 4) Recommandation scout (acquisition, suivi, ou passer).
Réponds en JSON: {"note": "texte complet du rapport ici"}`,
        response_json_schema: {
          type: 'object',
          properties: { note: { type: 'string' } },
        },
      });
      if (result?.note) setNoteText(result.note);
    } catch (e) {
      console.error('AI note generation failed', e);
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText && !audioUri) return;
    const noteData = { contenu: noteText };

    if (audioUri) {
      try {
        const token = await getToken();
        const ext = audioUri.split('.').pop() || 'm4a';
        const uploaded = await uploadFileRN({ uri: audioUri, name: `note-vocale.${ext}`, mimeType: `audio/${ext}` }, token);
        if (uploaded?.file_url) noteData.audio_url = uploaded.file_url;
      } catch {
        // audio upload failed — save text note anyway
      }
    }

    addNoteMutation.mutate(noteData);
  };

  const handleDelete = () => {
    Alert.alert('Supprimer le joueur', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading) return <LoadingSpinner message="Chargement du joueur..." />;
  if (!player) return <View className="flex-1 items-center justify-center"><Text className="text-slate-500">Joueur introuvable</Text></View>;

  const posColor = getPositionColor(player.poste);
  const contractDays = daysUntil(player.date_fin_contrat ?? player.contrat_fin);
  const sortedContacts = [...playerContacts].sort((a, b) => new Date(b.date_contact) - new Date(a.date_contact));

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
                <StatBox label="Buts" value={player.buts_saison ?? player.buts} color="green" />
                <StatBox label="Passes D" value={player.passes_saison ?? player.passes_decisives} color="blue" />
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
                    <Text className="text-sm text-slate-600">Salaire</Text>
                    <Text className="font-semibold text-slate-900">{formatCurrency(player.salaire)}</Text>
                  </View>
                ) : null}
                {(player.date_fin_contrat || player.contrat_fin) ? (
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-sm text-slate-600">Fin de contrat</Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm text-slate-900">{formatDate(player.date_fin_contrat ?? player.contrat_fin)}</Text>
                      {contractDays !== null && contractDays <= 365 && contractDays >= 0 ? (
                        <Badge variant={contractDays <= 90 ? 'destructive' : 'warning'}>{contractDays}j</Badge>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            </CardContent>
          </Card>

          {/* Profil */}
          <Card>
            <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
            <CardContent>
              <View className="gap-2">
                {[
                  { label: 'Pied fort', value: player.pied_fort },
                  { label: 'Taille', value: player.taille ? `${player.taille} cm` : null },
                  { label: 'Poids', value: player.poids ? `${player.poids} kg` : null },
                  { label: 'Agent', value: player.agent },
                  { label: 'Statut transfert', value: player.statut_transfert },
                ].filter(i => i.value).map(i => (
                  <View key={i.label} className="flex-row justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <Text className="text-sm text-slate-500">{i.label}</Text>
                    <Text className="text-sm font-medium text-slate-900">{i.value}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Notes de scouting */}
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
                <Text className="text-sm text-slate-400 text-center py-4">Aucune note — appuyez sur + pour ajouter</Text>
              ) : (
                notes.map(n => (
                  <View key={n.id} className="py-2 border-b border-slate-50 last:border-0">
                    <View className="flex-row items-center gap-2 mb-1">
                      {n.audio_url ? <Mic size={12} color="#8b5cf6" /> : null}
                      <Text className="text-xs text-slate-400">{formatDate(n.created_date)}</Text>
                    </View>
                    {n.contenu ? (
                      <Text className="text-sm text-slate-700">{n.contenu}</Text>
                    ) : (
                      <Text className="text-sm text-purple-500 italic">Note vocale enregistrée</Text>
                    )}
                  </View>
                ))
              )}
            </CardContent>
          </Card>

          {/* Contacts récents */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Phone size={14} color="#16a34a" />
                  <CardTitle>Contacts récents</CardTitle>
                  {sortedContacts.length > 0 && (
                    <View className="bg-green-100 rounded-full px-2 py-0.5">
                      <Text className="text-xs font-bold text-green-700">{sortedContacts.length}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => setShowQuickContact(true)} className="p-1">
                  <Plus size={18} color="#16a34a" />
                </TouchableOpacity>
              </View>
            </CardHeader>
            <CardContent>
              {sortedContacts.length === 0 ? (
                <Text className="text-sm text-slate-400 text-center py-4">Aucun contact enregistré</Text>
              ) : (
                <>
                  {sortedContacts.slice(0, 3).map(c => (
                    <View key={c.id} className="py-2 border-b border-slate-50 last:border-0">
                      <View className="flex-row items-center justify-between mb-1">
                        <Badge variant={CONTACT_BADGE[c.type_contact] || 'secondary'}>{c.type_contact}</Badge>
                        <Text className="text-xs text-slate-400">{formatDate(c.date_contact)}</Text>
                      </View>
                      {c.notes ? (
                        <Text className="text-sm text-slate-600" numberOfLines={2}>{c.notes}</Text>
                      ) : null}
                      {c.prochain_contact ? (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Clock size={10} color="#f59e0b" />
                          <Text className="text-xs text-amber-600 font-medium">
                            Prochain contact: {formatDate(c.prochain_contact)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                  {sortedContacts.length > 3 && (
                    <TouchableOpacity onPress={() => router.push('/contacts')} className="mt-2 py-1">
                      <Text className="text-xs text-green-600 font-semibold text-center">
                        Voir tout ({sortedContacts.length} contacts)
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
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

      {/* Note modal — avec note vocale + aide IA */}
      <Modal visible={showNoteModal} onClose={closeNoteModal} title="Ajouter une note">
        <View className="gap-4">
          <VoiceNoteRecorder onRecordingComplete={(uri) => setAudioUri(uri)} />

          {audioUri && !isGeneratingNote && (
            <TouchableOpacity
              onPress={handleGenerateAINote}
              className="flex-row items-center gap-2 px-4 py-2.5 bg-purple-50 rounded-xl border border-purple-200"
            >
              <Sparkles size={14} color="#8b5cf6" />
              <Text className="text-sm font-medium text-purple-700">Générer un brouillon avec l'IA</Text>
            </TouchableOpacity>
          )}

          {isGeneratingNote && (
            <View className="flex-row items-center gap-3 px-4 py-2.5 bg-purple-50 rounded-xl">
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text className="text-sm text-purple-600">L'IA rédige votre note de scouting...</Text>
            </View>
          )}

          <Input
            label="Note de scouting"
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={5}
            placeholder="Vos observations sur ce joueur..."
          />

          <View className="flex-row gap-3 pt-2">
            <Button variant="outline" onPress={closeNoteModal} className="flex-1">Annuler</Button>
            <Button
              onPress={handleSaveNote}
              loading={addNoteMutation.isPending}
              disabled={!noteText && !audioUri}
              className="flex-1"
            >
              Ajouter
            </Button>
          </View>
        </View>
      </Modal>

      {/* Quick contact modal */}
      <Modal visible={showQuickContact} onClose={() => setShowQuickContact(false)} title="Log un contact">
        <View className="gap-4">
          <Select
            label="Type de contact"
            value={quickContactForm.type}
            onChange={v => setQuickContactForm(f => ({ ...f, type: v }))}
            options={CONTACT_TYPES}
          />
          <Input
            label="Notes rapides"
            value={quickContactForm.notes}
            onChangeText={v => setQuickContactForm(f => ({ ...f, notes: v }))}
            multiline
            numberOfLines={3}
            placeholder="Résumé de l'échange..."
          />
          <Input
            label="Prochain contact (AAAA-MM-JJ)"
            value={quickContactForm.prochainContact}
            onChangeText={v => setQuickContactForm(f => ({ ...f, prochainContact: v }))}
            placeholder="2025-06-15"
          />
          <View className="flex-row gap-3 pt-2">
            <Button variant="outline" onPress={() => setShowQuickContact(false)} className="flex-1">Annuler</Button>
            <Button
              onPress={() => quickContactMutation.mutate(quickContactForm)}
              loading={quickContactMutation.isPending}
              className="flex-1"
            >
              Enregistrer
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
