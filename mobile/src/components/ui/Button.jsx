import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

const variants = {
  default: 'bg-green-600 active:bg-green-700',
  outline: 'bg-transparent border border-slate-300 active:bg-slate-50',
  ghost: 'bg-transparent active:bg-slate-100',
  destructive: 'bg-red-500 active:bg-red-600',
  secondary: 'bg-slate-100 active:bg-slate-200',
};

const textVariants = {
  default: 'text-white font-semibold',
  outline: 'text-slate-700 font-semibold',
  ghost: 'text-slate-700 font-semibold',
  destructive: 'text-white font-semibold',
  secondary: 'text-slate-700 font-semibold',
};

const sizes = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-3 rounded-xl',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

export default function Button({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'default' || variant === 'destructive' ? '#fff' : '#475569'} />
      ) : icon ? (
        <View>{icon}</View>
      ) : null}
      {typeof children === 'string' ? (
        <Text className={`${textVariants[variant]} ${textSizes[size]}`}>{children}</Text>
      ) : children}
    </TouchableOpacity>
  );
}
