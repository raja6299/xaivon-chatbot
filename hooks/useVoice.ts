import { useState, useEffect, useCallback } from 'react';
import { getVoiceManager } from '../lib/voice/VoiceManager';
import { VoiceState, VoiceSettings } from '../lib/voice/types';

export function useVoice() {
  const manager = getVoiceManager();
  
  const [state, setState] = useState<VoiceState>(manager.getState());
  const [settings, setSettings] = useState<VoiceSettings | null>(manager.getSettings());
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>('');
  
  useEffect(() => {
    // Subscriptions
    const unsubState = manager.subscribeToState((s) => setState(s));
    const unsubSettings = manager.subscribeToSettings((s) => setSettings(s));
    const unsubError = manager.subscribeToError((err) => setError(err));
    const unsubText = manager.subscribeToText((text, isFinal) => {
      setInterimText(text);
      if (isFinal) {
        // Reset interim when final arrives, allowing parent component to handle it
        setTimeout(() => setInterimText(''), 50);
      }
    });

    return () => {
      unsubState();
      unsubSettings();
      unsubError();
      unsubText();
    };
  }, [manager]);

  const startListening = useCallback(() => {
    setError(null);
    setInterimText('');
    manager.startListening();
  }, [manager]);

  const stopListening = useCallback(() => {
    manager.stopListening();
  }, [manager]);

  const abortListening = useCallback(() => {
    manager.abortListening();
  }, [manager]);

  const speak = useCallback((text: string) => {
    manager.speakResponse(text);
  }, [manager]);

  const stopOutput = useCallback(() => {
    manager.interruptOutput();
  }, [manager]);
  
  const pauseOutput = useCallback(() => {
    manager.pauseOutput();
  }, [manager]);

  const resumeOutput = useCallback(() => {
    manager.resumeOutput();
  }, [manager]);

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    manager.updateSettings(newSettings);
  }, [manager]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    isSupported: manager.isSupported,
    state,
    settings,
    error,
    interimText,
    startListening,
    stopListening,
    abortListening,
    speak,
    stopOutput,
    pauseOutput,
    resumeOutput,
    updateSettings,
    dismissError,
  };
}
