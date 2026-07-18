import { useState, useEffect, useCallback } from 'react';
import { getVoiceManager } from '../lib/voice/VoiceManager';
import { VoiceState, VoiceSettings } from '../lib/voice/types';

export function useVoice(onResult?: (text: string, isFinal: boolean) => void) {
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
      if (onResult) {
        onResult(text, isFinal);
      }
      if (isFinal) {
        // Reset interim when final arrives
        setTimeout(() => setInterimText(''), 50);
      }
    });

    return () => {
      unsubState();
      unsubSettings();
      unsubError();
      unsubText();
    };
  }, [manager, onResult]);

  const startListening = useCallback((prefixText: string = '') => {
    setError(null);
    setInterimText('');
    manager.startListening(prefixText);
  }, [manager]);

  const stopListening = useCallback(() => {
    manager.stopListening();
  }, [manager]);

  const abortListening = useCallback(() => {
    manager.abortListening();
  }, [manager]);

  const speak = useCallback((text: string) => {
    manager.speakResponse(text, true);
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
    getAvailableVoices: useCallback(() => manager.getAvailableVoices(), [manager]),
  };
}
