import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

export default function SearchBar({ value, onChangeText, placeholder = 'Rechercher...', className = '' }) {
  return (
    <View className={`flex-row items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 ${className}`}>
      <Search size={16} color="#94a3b8" />
      <TextInput
        className="flex-1 text-sm text-slate-900"
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
    </View>
  );
}
