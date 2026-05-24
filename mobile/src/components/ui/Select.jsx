import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

export default function Select({ label, value, onChange, options = [], placeholder = 'Sélectionner...', className = '' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
      >
        <Text className={`text-sm ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="bg-white rounded-t-2xl max-h-96">
            <View className="px-4 py-3 border-b border-slate-100">
              <Text className="font-semibold text-slate-900 text-center">{label || 'Sélectionner'}</Text>
            </View>
            <ScrollView>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                  className="flex-row items-center justify-between px-4 py-3 border-b border-slate-50"
                >
                  <Text className={`text-sm ${opt.value === value ? 'text-green-600 font-semibold' : 'text-slate-700'}`}>
                    {opt.label}
                  </Text>
                  {opt.value === value && <Check size={16} color="#16a34a" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
