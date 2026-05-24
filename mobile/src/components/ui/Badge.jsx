import React from 'react';
import { View, Text } from 'react-native';

const variants = {
  default: { container: 'bg-green-100', text: 'text-green-700' },
  secondary: { container: 'bg-slate-100', text: 'text-slate-600' },
  destructive: { container: 'bg-red-100', text: 'text-red-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-700' },
  blue: { container: 'bg-blue-100', text: 'text-blue-700' },
  purple: { container: 'bg-purple-100', text: 'text-purple-700' },
  outline: { container: 'bg-transparent border border-slate-300', text: 'text-slate-600' },
};

export default function Badge({ children, variant = 'default', className = '' }) {
  const v = variants[variant] || variants.default;
  return (
    <View className={`px-2 py-0.5 rounded-full ${v.container} ${className}`}>
      <Text className={`text-xs font-medium ${v.text}`}>{children}</Text>
    </View>
  );
}
