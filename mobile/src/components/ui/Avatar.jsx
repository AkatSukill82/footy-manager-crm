import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

export default function Avatar({ src, name, size = 40, className = '' }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const bgColors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
  const colorIndex = name ? name.charCodeAt(0) % bgColors.length : 0;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        className={className}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`${bgColors[colorIndex]} items-center justify-center ${className}`}
    >
      <Text style={{ fontSize: size * 0.35 }} className="text-white font-bold">
        {initials}
      </Text>
    </View>
  );
}
