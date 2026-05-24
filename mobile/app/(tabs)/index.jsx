import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, LayoutDashboard, TrendingUp, Star, ArrowRightLeft, Bell, Users } from 'lucide-react-native';
import { base44 } from '../../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/Card';
import LoadingSpinner from '../../src/components/ui/LoadingSpinner';
import Badge from '../../src/components/ui/Badge';
import { formatCurrency, daysUntil } from '../../src/utils';

function StatsCard({ title, value, subtitle, color = 'blue' }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', val: 'text-blue-700' },
    green: { bg: 'bg-green-50', text: 'text-green-600', val: 'text-green-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', val: 'text-purple-700' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', val: 'text-orange-700' },
  };
  const c = colors[color] || colors.blue;
  return (
    <View className={`flex-1 ${c.bg} rounded-2xl p-4 min-w-[44%]`}>
      <Text className={`text-xs font-medium ${c.text} mb-1`}>{title}</Text>
      <Text className={`text-2xl font-bold ${c.val}`}>{value}</Text>
      <Text className="text-xs text-slate-400 mt-0.5">{subtitle}</Text>
    </View>
  );
}

function SectionHeader({ title, icon: Icon }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <Icon size={16} color="#16a34a" />
      <Text className="text-sm font-bold text-slate-900">{title}</Text>
    </View>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState('perso');
  const [refreshing, setRefreshing] = useState(false);

  const { data: players = [], isLoading, refetch } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: watchList = [], refetch: refetchWL } = useQuery({
    queryKey: ['my-watchlist'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const { data: negociations = [], refetch: refetchNeg } = useQuery({
    queryKey: ['dashboard-negociations'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TransferNegociation.filter({ created_by: user.email });
    },
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['dashboard-reminders'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Reminder.filter({ created_by: user.email });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchWL(), refetchNeg()]);
    setRefreshing(false);
  };

  if (isLoading) return <LoadingSpinner message="Chargement des statistiques..." />;

  const totalValue = players.reduce((s, p) => s + (p.valeur_marchande || 0), 0);
  const watchedIds = new Set(watchList.map(w => w.player_id));
  const watchValue = players.filter(p => watchedIds.has(p.id)).reduce((s, p) => s + (p.valeur_marchande || 0), 0);
  const expiringContracts = players.filter(p => {
    const days = daysUntil(p.date_fin_contrat);
    return days !== null && days <= 180 && days >= 0;
  });
  const pendingNeg = negociations.filter(n => n.statut !== 'finalisé');
  const urgentReminders = reminders.filter(r => {
    const days = daysUntil(r.date_rappel);
    return days !== null && days <= 7 && days >= 0;
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Tableau de bord</Text>
            <Text className="text-sm text-slate-400">{players.length} joueurs dans la base</Text>
          </View>
          <View className="w-10 h-10 bg-green-600 rounded-2xl items-center justify-center">
            <Users size={20} color="white" />
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-slate-100 rounded-2xl p-1 gap-1">
          {[
            { key: 'perso', label: 'Personnalisé', icon: LayoutDashboard },
            { key: 'analytics', label: 'Analyses', icon: BarChart3 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${tab === t.key ? 'bg-white shadow-sm' : ''}`}
              >
                <Icon size={14} color={tab === t.key ? '#16a34a' : '#64748b'} />
                <Text className={`text-xs font-semibold ${tab === t.key ? 'text-slate-900' : 'text-slate-500'}`}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'perso' ? (
          <View className="gap-4">
            {/* Alertes rapides */}
            {(expiringContracts.length > 0 || urgentReminders.length > 0 || pendingNeg.length > 0) && (
              <Card>
                <CardHeader>
                  <SectionHeader title="Alertes du moment" icon={Bell} />
                </CardHeader>
                <CardContent>
                  {expiringContracts.length > 0 && (
                    <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                      <Text className="text-sm text-slate-700">Contrats expirant bientôt</Text>
                      <Badge variant="warning">{expiringContracts.length}</Badge>
                    </View>
                  )}
                  {pendingNeg.length > 0 && (
                    <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                      <Text className="text-sm text-slate-700">Négociations en cours</Text>
                      <Badge variant="blue">{pendingNeg.length}</Badge>
                    </View>
                  )}
                  {urgentReminders.length > 0 && (
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-sm text-slate-700">Rappels urgents (7j)</Text>
                      <Badge variant="destructive">{urgentReminders.length}</Badge>
                    </View>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Watchlist rapide */}
            <Card>
              <CardHeader>
                <SectionHeader title="Ma liste de surveillance" icon={Star} />
              </CardHeader>
              <CardContent>
                {watchList.length === 0 ? (
                  <Text className="text-sm text-slate-400 text-center py-4">Aucun joueur suivi</Text>
                ) : (
                  watchList.slice(0, 5).map(w => {
                    const player = players.find(p => p.id === w.player_id);
                    if (!player) return null;
                    return (
                      <View key={w.id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <Text className="text-sm font-medium text-slate-900">{player.nom} {player.prenom}</Text>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs text-slate-400">{player.poste}</Text>
                          {player.valeur_marchande ? (
                            <Badge variant="secondary">{formatCurrency(player.valeur_marchande)}</Badge>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Négociations actives */}
            <Card>
              <CardHeader>
                <SectionHeader title="Négociations actives" icon={ArrowRightLeft} />
              </CardHeader>
              <CardContent>
                {pendingNeg.length === 0 ? (
                  <Text className="text-sm text-slate-400 text-center py-4">Aucune négociation en cours</Text>
                ) : (
                  pendingNeg.slice(0, 4).map(n => (
                    <View key={n.id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <Text className="text-sm font-medium text-slate-900 flex-1 mr-2" numberOfLines={1}>{n.nom_joueur}</Text>
                      <Badge variant={n.statut === 'accepté' ? 'default' : 'blue'}>{n.statut}</Badge>
                    </View>
                  ))
                )}
              </CardContent>
            </Card>
          </View>
        ) : (
          <View className="gap-4">
            {/* KPIs */}
            <View className="flex-row flex-wrap gap-3">
              <StatsCard title="Total joueurs" value={players.length} subtitle="Dans la base" color="blue" />
              <StatsCard title="Ma liste" value={watchList.length} subtitle="Joueurs suivis" color="purple" />
              <StatsCard title="Valeur totale" value={formatCurrency(totalValue)} subtitle="Base complète" color="green" />
              <StatsCard title="Valeur ma liste" value={formatCurrency(watchValue)} subtitle="Joueurs suivis" color="orange" />
            </View>

            {/* Top joueurs par valeur */}
            <Card>
              <CardHeader>
                <SectionHeader title="Top joueurs — Valeur marchande" icon={TrendingUp} />
              </CardHeader>
              <CardContent>
                {[...players]
                  .filter(p => p.valeur_marchande)
                  .sort((a, b) => (b.valeur_marchande || 0) - (a.valeur_marchande || 0))
                  .slice(0, 8)
                  .map((p, i) => (
                    <View key={p.id} className="flex-row items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <View className="w-6 h-6 bg-slate-100 rounded-full items-center justify-center">
                        <Text className="text-xs font-bold text-slate-500">{i + 1}</Text>
                      </View>
                      <Text className="flex-1 text-sm font-medium text-slate-900">{p.nom} {p.prenom}</Text>
                      <Text className="text-xs text-slate-400">{p.poste}</Text>
                      <Text className="text-sm font-semibold text-green-700">{formatCurrency(p.valeur_marchande)}</Text>
                    </View>
                  ))}
              </CardContent>
            </Card>

            {/* Contrats expirant */}
            {expiringContracts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contrats expirant dans 6 mois</CardTitle>
                </CardHeader>
                <CardContent>
                  {expiringContracts.slice(0, 6).map(p => {
                    const days = daysUntil(p.date_fin_contrat);
                    return (
                      <View key={p.id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <Text className="text-sm font-medium text-slate-900">{p.nom} {p.prenom}</Text>
                        <Badge variant={days <= 30 ? 'destructive' : 'warning'}>{days}j</Badge>
                      </View>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
