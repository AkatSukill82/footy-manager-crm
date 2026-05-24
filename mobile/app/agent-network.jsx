import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Network, Plus, Sparkles, Share2 } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Modal from '../src/components/ui/Modal';
import Input from '../src/components/ui/Input';
import Select from '../src/components/ui/Select';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import EmptyState from '../src/components/ui/EmptyState';
import { formatDate } from '../src/utils';

const TYPES = [
  { value: 'joueur_disponible', label: 'Joueur disponible' },
  { value: 'recherche_profil', label: 'Recherche profil' },
  { value: 'opportunite', label: 'Opportunité' },
  { value: 'info_marche', label: 'Info marché' },
];

export default function AgentNetworkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showShare, setShowShare] = useState(false);
  const [form, setForm] = useState({ titre: '', contenu: '', type: 'info_marche' });
  const [generatingInsight, setGeneratingInsight] = useState(false);

  const { data: sharedContent = [], isLoading } = useQuery({
    queryKey: ['shared-content'],
    queryFn: () => base44.entities.SharedContent.list('-created_date', 30),
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['insights'],
    queryFn: () => base44.entities.AgentInsight.list('-created_date', 10),
  });

  const shareMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.SharedContent.create({ ...data, auteur: user.email, created_by: user.email });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shared-content'] }); setShowShare(false); setForm({ titre: '', contenu: '', type: 'info_marche' }); },
  });

  const generateInsight = async () => {
    setGeneratingInsight(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Génère un insight professionnel pour un agent de football sur le marché des transferts actuel.
Inclus des tendances de marché, des opportunités et des conseils stratégiques.
Format JSON: {"titre": "...", "contenu": "...", "conseils": ["...", "...", "..."]}`,
        response_json_schema: {
          type: 'object',
          properties: {
            titre: { type: 'string' },
            contenu: { type: 'string' },
            conseils: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      if (result?.titre) {
        const user = await base44.auth.me();
        await base44.entities.AgentInsight.create({ titre: result.titre, contenu: result.contenu, conseils: result.conseils, created_by: user.email });
        queryClient.invalidateQueries({ queryKey: ['insights'] });
      }
    } catch (e) { console.error(e); }
    setGeneratingInsight(false);
  };

  if (isLoading) return <LoadingSpinner message="Chargement du réseau..." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Network size={20} color="#3b82f6" />
        <Text className="text-xl font-bold text-slate-900 flex-1">Réseau Agents</Text>
        <View className="flex-row gap-2">
          <Button size="sm" variant="secondary" onPress={generateInsight} loading={generatingInsight} icon={<Sparkles size={14} color="#64748b" />}>IA</Button>
          <Button size="sm" onPress={() => setShowShare(true)} icon={<Plus size={14} color="white" />}>Partager</Button>
        </View>
      </View>

      <FlatList
        data={[...insights.map(i => ({ ...i, _type: 'insight' })), ...sharedContent.map(s => ({ ...s, _type: 'shared' }))].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState icon={Network} title="Réseau vide" description="Partagez une information ou générez un insight IA." />}
        renderItem={({ item }) => (
          <Card>
            <CardContent className="pt-4">
              <View className="flex-row items-start justify-between mb-1">
                <Text className="font-bold text-slate-900 flex-1 mr-2">{item.titre}</Text>
                <Badge variant={item._type === 'insight' ? 'purple' : 'blue'}>
                  {item._type === 'insight' ? '✨ IA' : item.type}
                </Badge>
              </View>
              <Text className="text-sm text-slate-600 leading-relaxed" numberOfLines={3}>{item.contenu}</Text>
              {item.conseils?.length > 0 && (
                <View className="mt-2 gap-1">
                  {item.conseils.map((c, i) => (
                    <Text key={i} className="text-xs text-slate-500">• {c}</Text>
                  ))}
                </View>
              )}
              <Text className="text-xs text-slate-400 mt-2">{item.auteur || item.created_by} · {formatDate(item.created_date)}</Text>
            </CardContent>
          </Card>
        )}
      />

      <Modal visible={showShare} onClose={() => setShowShare(false)} title="Partager une information">
        <View className="gap-4">
          <Input label="Titre" value={form.titre} onChangeText={v => setForm(f => ({ ...f, titre: v }))} />
          <Select label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={TYPES} />
          <Input label="Contenu" value={form.contenu} onChangeText={v => setForm(f => ({ ...f, contenu: v }))} multiline numberOfLines={4} />
          <View className="flex-row gap-3 pt-2">
            <Button variant="outline" onPress={() => setShowShare(false)} className="flex-1">Annuler</Button>
            <Button onPress={() => form.titre && form.contenu && shareMutation.mutate(form)} loading={shareMutation.isPending} className="flex-1">Partager</Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
