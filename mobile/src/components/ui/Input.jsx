import React from 'react';
import { View, TextInput, Text } from 'react-native';

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  className = '',
  inputClassName = '',
  editable = true,
  ...props
}) {
  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <TextInput
        className={`border ${error ? 'border-red-400' : 'border-slate-200'} rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white ${!editable ? 'bg-slate-50 text-slate-400' : ''} ${inputClassName}`}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        editable={editable}
        {...props}
      />
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
