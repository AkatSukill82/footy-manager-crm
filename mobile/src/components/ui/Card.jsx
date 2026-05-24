import React from 'react';
import { View, Text } from 'react-native';

export function Card({ children, className = '' }) {
  return (
    <View className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <View className={`px-4 pt-4 pb-2 ${className}`}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <Text className={`text-base font-bold text-slate-900 ${className}`}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <View className={`px-4 pb-4 ${className}`}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <View className={`px-4 pb-4 pt-2 border-t border-slate-100 flex-row items-center ${className}`}>
      {children}
    </View>
  );
}
