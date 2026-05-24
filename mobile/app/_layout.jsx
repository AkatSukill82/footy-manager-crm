import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/lib/AuthContext';
import { queryClientInstance } from '../src/lib/query-client';
import { ToastProvider } from '../src/components/ui/Toast';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="player-detail" options={{ headerShown: false }} />
                <Stack.Screen name="club-detail" options={{ headerShown: false }} />
                <Stack.Screen name="team-detail" options={{ headerShown: false }} />
                <Stack.Screen name="watchlist" options={{ headerShown: false }} />
                <Stack.Screen name="alerts" options={{ headerShown: false }} />
                <Stack.Screen name="reports" options={{ headerShown: false }} />
                <Stack.Screen name="contacts" options={{ headerShown: false }} />
                <Stack.Screen name="agent-network" options={{ headerShown: false }} />
                <Stack.Screen name="player-search" options={{ headerShown: false }} />
                <Stack.Screen name="predictive" options={{ headerShown: false }} />
                <Stack.Screen name="news" options={{ headerShown: false }} />
                <Stack.Screen name="scouting-ia" options={{ headerShown: false }} />
                <Stack.Screen name="import-excel" options={{ headerShown: false }} />
              </Stack>
            </ToastProvider>
          </QueryClientProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
