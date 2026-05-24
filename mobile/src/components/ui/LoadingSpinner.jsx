import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function LoadingSpinner({ message = 'Chargement...', size = 'large' }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-12">
      <ActivityIndicator size={size} color="#16a34a" />
      <Text className="text-slate-500 text-sm">{message}</Text>
    </View>
  );
}
