import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, Plus, Mail, MessageSquare } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Modal from '../src/components/ui/Modal';
import Input from '../src/components/ui/Input';
import Select from '../src/components/ui/Select';
import SearchBar from '../src/components/ui/SearchBar';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import EmptyState from '../src/components/ui/EmptyState';
import Avatar from '../src/components/ui/Avatar';
import { formatDate } from '../src/utils';

const TYPES = [
  { value: 'appel', label: 'Appel téléphonique' },
  { value: 'email', label: 'Email' },
  { value: 'réunion', label: 'Réunion' },
  { value: 'message', label: 'Message' },
];

function ContactCard({ contact, player, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card className="mb-3">
        <CardContent className="pt-4">
          <View className="flex-row items-center gap-3 mb-2">
            <Avatar src={player?.photo_url} name={contact.nom_joueur || '?'} size={40} />
            <View className="flex-1">
              <Text className="font-bold text-slate-900">{contact.nom_joueur || 'Joueur inconnu'}</Text>
              <Text className="text-xs text-slate-400">{formatDate(contact.date_contact)}</Text>
            </View>
            <Badge variant="secondary">{contact.type_contact}</Badge>
          </View>
          {contact.notes && <Text className="text-sm text-slate-600" numberOfLines={2}>{contact.notes}</Text>}
          {contact.prochain_contact && (
            <View className="flex-row items-center gap-1 mt-2">
              <Phone size={12} color="#94a3b8" />
              <Text className="text-xs text-slate-400">Prochain contact: {formatDate(contact.prochain_contact)}</Text>
            </View>
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

function AddContactModal({ visible, onClose, onSubmit, loading, players }) {
  const [form, setForm] = useState({ nom_joueur: '', type_contact: 'appel', notes: '', prochain_contact: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const playerOptions = players.map(p => ({ value: `${p.prenom} ${p.nom}`, label: `${p.prenom} ${p.nom}` }));
  return (
    <Modal visible={visible} onClose={onClose} title="Ajouter un contact">
      <View className="gap-4">
        <Select label="Joueur" value={form.nom_joueur} onChange={v => set('nom_joueur', v)} options={playerOptions} placeholder="Sélectionner un joueur" />
        <Select label="Type de contact" value={form.type_contact} onChange={v => set('type_contact', v)} options={TYPES} />
        <Input label="Notes" value={form.notes} onChangeText={v => set('notes', v)} multiline numberOfLines={3} />
        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" onPress={onClose} className="flex-1">Annuler</Button>
          <Button onPress={() => form.nom_joueur && onSubmit({ ...form, date_contact: new Date().toISOString() })} loading={loading} className="flex-1">Ajouter</Button>
        </View>
      </View>
    </Modal>
  );
}

export default function ContactsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Contact.filter({ created_by: user.email });
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Contact.create({ ...data, created_by: user.email });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setShowAdd(false); },
  });

  if (isLoading) return <LoadingSpinner message="Chargement des contacts..." />;

  const filtered = contacts.filter(c => !search || c.nom_joueur?.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => new Date(b.date_contact) - new Date(a.date_contact));

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Phone size={20} color="#16a34a" />
        <View className="flex-1">
          <Text className="text-xl font-bold text-slate-900">Contacts</Text>
          <Text className="text-sm text-slate-400">{contacts.length} entrées</Text>
        </View>
        <Button size="sm" onPress={() => setShowAdd(true)} icon={<Plus size={14} color="white" />}>Ajouter</Button>
      </View>

      <View className="px-4 py-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Rechercher par joueur..." />
      </View>

      {sorted.length === 0 ? (
        <EmptyState icon={Phone} title="Aucun contact" description="Enregistrez vos contacts avec les joueurs." />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const player = players.find(p => `${p.prenom} ${p.nom}` === item.nom_joueur);
            return <View className="px-4"><ContactCard contact={item} player={player} /></View>;
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <AddContactModal visible={showAdd} onClose={() => setShowAdd(false)} onSubmit={d => createMutation.mutate(d)} loading={createMutation.isPending} players={players} />
    </SafeAreaView>
  );
}
