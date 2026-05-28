import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react-native';

export default function VoiceNoteRecorder({ onRecordingComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | done | playing
  const [seconds, setSeconds] = useState(0);
  const [uri, setUri] = useState(null);
  const recRef = useRef(null);
  const soundRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      soundRef.current?.unloadAsync();
    };
  }, []);

  const start = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recRef.current = recording;
    setPhase('recording');
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const stop = async () => {
    clearInterval(timerRef.current);
    try {
      await recRef.current?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const recordedUri = recRef.current?.getURI();
      setUri(recordedUri);
      setPhase('done');
      onRecordingComplete?.(recordedUri);
    } catch (e) {
      setPhase('idle');
    }
  };

  const play = async () => {
    if (!uri) return;
    await soundRef.current?.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri });
    soundRef.current = sound;
    sound.setOnPlaybackStatusUpdate(s => { if (s.didJustFinish) setPhase('done'); });
    await sound.playAsync();
    setPhase('playing');
  };

  const pauseAudio = async () => {
    await soundRef.current?.pauseAsync();
    setPhase('done');
  };

  const reset = async () => {
    clearInterval(timerRef.current);
    await soundRef.current?.unloadAsync();
    setUri(null);
    setPhase('idle');
    setSeconds(0);
    onRecordingComplete?.(null);
  };

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (phase === 'idle') {
    return (
      <TouchableOpacity
        onPress={start}
        className="flex-row items-center gap-2 px-4 py-3 bg-purple-50 rounded-xl border border-purple-200"
      >
        <Mic size={16} color="#8b5cf6" />
        <Text className="text-sm font-medium text-purple-700">Enregistrer une note vocale</Text>
      </TouchableOpacity>
    );
  }

  if (phase === 'recording') {
    return (
      <View className="flex-row items-center gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
        <View className="w-2.5 h-2.5 bg-red-500 rounded-full" />
        <Text className="flex-1 text-sm font-semibold text-red-700">
          Enregistrement — {fmt(seconds)}
        </Text>
        <TouchableOpacity
          onPress={stop}
          className="flex-row items-center gap-1 px-3 py-1.5 bg-red-500 rounded-lg"
        >
          <Square size={12} color="white" />
          <Text className="text-white text-xs font-semibold">Arrêter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-3 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
      <TouchableOpacity
        onPress={phase === 'playing' ? pauseAudio : play}
        className="w-9 h-9 bg-green-600 rounded-full items-center justify-center"
      >
        {phase === 'playing' ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
      </TouchableOpacity>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-green-800">Note vocale prête</Text>
        <Text className="text-xs text-green-600">{fmt(seconds)}</Text>
      </View>
      <TouchableOpacity onPress={reset} className="p-1.5">
        <Trash2 size={16} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
