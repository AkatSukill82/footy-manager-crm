import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, AlertTriangle, Clock, Calendar } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import EmptyState from '../src/components/ui/EmptyState';
import { daysUntil, formatDate } from '../src/utils';

function AlertItem({ title, subtitle, badge, badgeVariant }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <View className="flex-1 mr-2">
        <Text className="text-sm font-medium text-slate-900">{title}</Text>
        {subtitle ? <Text className="text-xs text-slate-400 mt-0.5">{subtitle}</Text> : null}
      </View>
      <Badge variant={badgeVariant}>{badge}</Badge>
    </View>
  );
}

export default function AlertsPage() {
  const router = useRouter();

  const { data: players = [], isLoading: loadPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: negociations = [], isLoading: loadNeg } = useQuery({
    queryKey: ['negociations'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TransferNegociation.filter({ created_by: user.email });
    },
  });

  const { data: reminders = [], isLoading: loadRem } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Reminder.filter({ created_by: user.email });
    },
  });

  const { expiringContracts, urgentReminders, pendingNeg, deadlineNeg } = useMemo(() => {
    const now = new Date();
    return {
      expiringContracts: players.filter(p => {
        const d = daysUntil(p.date_fin_contrat);
        return d !== null && d >= 0 && d <= 180;
      }).sort((a, b) => daysUntil(a.date_fin_contrat) - daysUntil(b.date_fin_contrat)),

      urgentReminders: reminders.filter(r => {
        const d = daysUntil(r.date_rappel);
        return d !== null && d >= 0 && d <= 30;
      }).sort((a, b) => daysUntil(a.date_rappel) - daysUntil(b.date_rappel)),

      pendingNeg: negociations.filter(n => n.statut === 'en négociation' || n.statut === 'initial'),

      deadlineNeg: negociations.filter(n => {
        const d = daysUntil(n.date_limite);
        return d !== null && d >= 0 && d <= 14;
      }),
    };
  }, [players, reminders, negociations]);

  const isLoading = loadPlayers || loadNeg || loadRem;
  if (isLoading) return <LoadingSpinner message="Chargement des alertes..." />;

  const totalAlerts = expiringContracts.length + urgentReminders.length + deadlineNeg.length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Bell size={20} color="#f59e0b" />
        <View className="flex-1">
          <Text className="text-xl font-bold text-slate-900">Alertes</Text>
          {totalAlerts > 0 ? (
            <Text className="text-sm text-amber-500">{totalAlerts} alerte{totalAlerts > 1 ? 's' : ''} active{totalAlerts > 1 ? 's' : ''}</Text>
          ) : (
            <Text className="text-sm text-green-500">Tout est en ordre ✓</Text>
          )}
        </View>
      </View>

      {totalAlerts === 0 ? (
        <EmptyState icon={Bell} title="Aucune alerte" description="Tous vos joueurs et transferts sont en ordre." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {expiringContracts.length > 0 && (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={16} color="#f59e0b" />
                  <CardTitle>Contrats expirant</CardTitle>
                  <Badge variant="warning">{expiringContracts.length}</Badge>
                </View>
              </CardHeader>
              <CardContent>
                {expiringContracts.map(p => (
                  <AlertItem
                    key={p.id}
                    title={`${p.prenom} ${p.nom}`}
                    subtitle={`${p.club_actuel || ''} · Fin le ${formatDate(p.date_fin_contrat)}`}
                    badge={`${daysUntil(p.date_fin_contrat)}j`}
                    badgeVariant={daysUntil(p.date_fin_contrat) <= 30 ? 'destructive' : 'warning'}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {deadlineNeg.length > 0 && (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <Clock size={16} color="#ef4444" />
                  <CardTitle>Délais négociations</CardTitle>
                  <Badge variant="destructive">{deadlineNeg.length}</Badge>
                </View>
              </CardHeader>
              <CardContent>
                {deadlineNeg.map(n => (
                  <AlertItem
                    key={n.id}
                    title={n.nom_joueur}
                    subtitle={`${n.club_vendeur || ''} → ${n.club_acheteur || ''}`}
                    badge={`${daysUntil(n.date_limite)}j`}
                    badgeVariant="destructive"
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {urgentReminders.length > 0 && (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="#8b5cf6" />
                  <CardTitle>Rappels urgents</CardTitle>
                  <Badge variant="purple">{urgentReminders.length}</Badge>
                </View>
              </CardHeader>
              <CardContent>
                {urgentReminders.map(r => (
                  <AlertItem
                    key={r.id}
                    title={r.titre || r.contenu}
                    subtitle={`Rappel le ${formatDate(r.date_rappel)}`}
                    badge={`${daysUntil(r.date_rappel)}j`}
                    badgeVariant="purple"
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {pendingNeg.length > 0 && (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <Bell size={16} color="#3b82f6" />
                  <CardTitle>Négociations actives</CardTitle>
                  <Badge variant="blue">{pendingNeg.length}</Badge>
                </View>
              </CardHeader>
              <CardContent>
                {pendingNeg.map(n => (
                  <AlertItem
                    key={n.id}
                    title={n.nom_joueur}
                    subtitle={`${n.club_vendeur || ''} → ${n.club_acheteur || ''}`}
                    badge={n.statut}
                    badgeVariant="blue"
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
