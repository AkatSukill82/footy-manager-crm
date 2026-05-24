import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';

export default function Modal({ visible, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'flex-1',
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className={`bg-white rounded-2xl w-full ${sizes[size]} max-h-[85%]`}>
            {title ? (
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
                <Text className="text-lg font-bold text-slate-900">{title}</Text>
                <TouchableOpacity onPress={onClose} className="p-1">
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ) : null}
            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
              <View className="p-5">{children}</View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
