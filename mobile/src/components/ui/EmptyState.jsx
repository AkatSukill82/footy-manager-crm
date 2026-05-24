import React from 'react';
import { View, Text } from 'react-native';
import { Inbox } from 'lucide-react-native';

export default function EmptyState({ icon, title, description, action }) {
  const Icon = icon || Inbox;
  return (
    <View className="flex-1 items-center justify-center py-16 px-6 gap-3">
      <View className="w-16 h-16 bg-slate-100 rounded-2xl items-center justify-center">
        <Icon size={28} color="#94a3b8" />
      </View>
      <Text className="text-base font-semibold text-slate-700 text-center">{title}</Text>
      {description ? <Text className="text-sm text-slate-400 text-center">{description}</Text> : null}
      {action || null}
    </View>
  );
}
