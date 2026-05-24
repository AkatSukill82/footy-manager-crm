import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated } from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';

const ToastContext = createContext();

const icons = {
  success: <CheckCircle size={18} color="#16a34a" />,
  error: <AlertCircle size={18} color="#dc2626" />,
  info: <Info size={18} color="#2563eb" />,
};

const styles = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'info' }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View className="absolute top-16 left-4 right-4 z-50 gap-2 pointer-events-none">
        {toasts.map(t => (
          <View
            key={t.id}
            className={`flex-row items-start gap-3 p-3 rounded-xl border shadow-lg ${styles[t.variant]}`}
          >
            {icons[t.variant]}
            <View className="flex-1">
              {t.title ? <Text className="text-sm font-semibold text-slate-900">{t.title}</Text> : null}
              {t.description ? <Text className="text-xs text-slate-600 mt-0.5">{t.description}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
