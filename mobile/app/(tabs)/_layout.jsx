import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart3, Users, Shield, ArrowRightLeft, Building2,
  Star, Bell, Phone, FileText, Network, SearchCheck,
  Sparkles, Newspaper, FileSpreadsheet, LogOut, X, Menu,
} from 'lucide-react-native';
import { useAuth } from '../../src/lib/AuthContext';

const navItems = [
  { name: 'index',        route: '/',              label: 'Dashboard',       icon: BarChart3 },
  { name: 'players',      route: '/players',       label: 'Joueurs',         icon: Users },
  { name: 'clubs',        route: '/clubs',         label: 'Clubs',           icon: Building2 },
  { name: 'teams',        route: '/teams',         label: 'Équipes',         icon: Shield },
  { name: 'transfers',    route: '/transfers',     label: 'Transferts',      icon: ArrowRightLeft },
];

const drawerItems = [
  { route: '/watchlist',      label: 'Ma liste',         icon: Star },
  { route: '/alerts',         label: 'Alertes',          icon: Bell },
  { route: '/contacts',       label: 'Contacts',         icon: Phone },
  { route: '/reports',        label: 'Rapports',         icon: FileText },
  { route: '/agent-network',  label: 'Réseau Agents',    icon: Network },
  { route: '/player-search',  label: 'Recherche IA',     icon: SearchCheck },
  { route: '/predictive',     label: 'Prédictif IA',     icon: Sparkles },
  { route: '/news',           label: 'Journal du jour',  icon: Newspaper },
  { route: '/scouting-ia',    label: 'Scouting IA',      icon: Sparkles },
  { route: '/import-excel',   label: 'Import Excel',     icon: FileSpreadsheet },
];

function CustomTabBar({ state, descriptors, navigation }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <>
      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row bg-white border-t border-slate-200 shadow-xl"
      >
        {navItems.map((item, index) => {
          const isFocused = state.index === index;
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              className="flex-1 items-center justify-center py-2 gap-0.5"
              activeOpacity={0.7}
            >
              <Icon size={22} color={isFocused ? '#16a34a' : '#94a3b8'} />
              <Text className={`text-[10px] font-medium ${isFocused ? 'text-green-600' : 'text-slate-400'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          className="flex-1 items-center justify-center py-2 gap-0.5"
          activeOpacity={0.7}
        >
          <Menu size={22} color={drawerOpen ? '#16a34a' : '#94a3b8'} />
          <Text className={`text-[10px] font-medium ${drawerOpen ? 'text-green-600' : 'text-slate-400'}`}>Plus</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setDrawerOpen(false)}
        />
        <View className="bg-white rounded-t-3xl" style={{ paddingBottom: insets.bottom + 8 }}>
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 bg-green-600 rounded-xl items-center justify-center">
                <Users size={16} color="white" />
              </View>
              <Text className="font-bold text-slate-900 text-base">Football CRM</Text>
            </View>
            <TouchableOpacity onPress={() => setDrawerOpen(false)} className="p-1">
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap p-4 gap-2">
            {drawerItems.map(item => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => { setDrawerOpen(false); router.push(item.route); }}
                  className="w-[30%] items-center gap-2 p-3 bg-slate-50 rounded-2xl"
                  activeOpacity={0.7}
                >
                  <Icon size={24} color="#475569" />
                  <Text className="text-xs font-medium text-slate-600 text-center leading-tight">{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="px-4">
            <TouchableOpacity
              onPress={() => { setDrawerOpen(false); logout(); }}
              className="flex-row items-center justify-center gap-2 py-3 bg-red-50 rounded-2xl"
            >
              <LogOut size={18} color="#dc2626" />
              <Text className="text-red-600 font-semibold text-sm">Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="players" options={{ title: 'Joueurs' }} />
      <Tabs.Screen name="clubs" options={{ title: 'Clubs' }} />
      <Tabs.Screen name="teams" options={{ title: 'Équipes' }} />
      <Tabs.Screen name="transfers" options={{ title: 'Transferts' }} />
    </Tabs>
  );
}
