import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Building2, Users } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import { formatCurrency } from '../src/utils';

export default function ClubDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: club, isLoading } = useQuery({
    queryKey: ['club', id],
    queryFn: async () => {
      const list = await base44.entities.Club.filter({ id });
      return list[0] || null;
    },
    enabled: !!id,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['club-players', id],
    queryFn: () => base44.entities.Player.filter({ club_actuel: club?.nom }),
    enabled: !!club?.nom,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['club-contacts', id],
    queryFn: () => base44.entities.ClubContact.filter({ club_id: id }),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner message="Chargement du club..." />;
  if (!club) return <View className="flex-1 items-center justify-center"><Text className="text-slate-500">Club introuvable</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white border-b border-slate-100 px-4 py-3 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={22} color="#334155" />
          </TouchableOpacity>
          <View className="w-10 h-10 bg-slate-100 rounded-2xl items-center justify-center">
            <Building2 size={20} color="#64748b" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{club.nom}</Text>
            <Text className="text-sm text-slate-500">{club.ligue} · {club.pays}</Text>
          </View>
        </View>

        <View className="px-4 mt-4 gap-4">
          <Card>
            <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
            <CardContent>
              {[
                { label: 'Ligue', value: club.ligue },
                { label: 'Pays', value: club.pays },
                { label: 'Ville', value: club.ville },
                { label: 'Stade', value: club.stade },
                { label: 'Budget transfert', value: club.budget_transfert ? formatCurrency(club.budget_transfert) : null },
                { label: 'Masse salariale', value: club.masse_salariale ? formatCurrency(club.masse_salariale) : null },
              ].filter(i => i.value).map(i => (
                <View key={i.label} className="flex-row justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <Text className="text-sm text-slate-500">{i.label}</Text>
                  <Text className="text-sm font-semibold text-slate-900">{i.value}</Text>
                </View>
              ))}
            </CardContent>
          </Card>

          {players.length > 0 && (
            <Card>
              <CardHeader>
                <View className="flex-row items-center justify-between">
                  <CardTitle>Joueurs associés</CardTitle>
                  <Badge variant="secondary">{players.length}</Badge>
                </View>
              </CardHeader>
              <CardContent>
                {players.slice(0, 10).map(p => (
                  <View key={p.id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <Text className="text-sm font-medium text-slate-900">{p.prenom} {p.nom}</Text>
                    <View className="flex-row gap-2">
                      <Text className="text-xs text-slate-400">{p.poste}</Text>
                      {p.valeur_marchande ? <Badge variant="default">{formatCurrency(p.valeur_marchande)}</Badge> : null}
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {contacts.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Contacts du club</CardTitle></CardHeader>
              <CardContent>
                {contacts.map(c => (
                  <View key={c.id} className="py-2 border-b border-slate-50 last:border-0">
                    <Text className="text-sm font-semibold text-slate-900">{c.nom}</Text>
                    <Text className="text-xs text-slate-500">{c.role} · {c.email || c.telephone || ''}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
