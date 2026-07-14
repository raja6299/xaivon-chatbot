import React, { useEffect } from 'react';
import { useVoice } from '../../hooks/useVoice';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const { 
    isSupported, 
    state, 
    startListening, 
    stopListening, 
    interimText 
  } = useVoice();

  // Feed text back to parent
  useEffect(() => {
    if (state === 'recognizing' || state === 'listening') {
      onTranscription(interimText, false);
    }
  }, [interimText, state, onTranscription]);

  if (!isSupported) {
    return null; // Don't show mic if totally unsupported
  }

  const isRecording = state === 'listening' || state === 'recognizing' || state === 'permission_request';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopListening();
      // On stop, if there is interim text, finalize it
      if (interimText) {
        onTranscription(interimText, true);
      }
    } else {
      startListening();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled && !isRecording}
        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
          isRecording 
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
            : 'text-slate-400 hover:text-violet-300 hover:bg-white/5 border border-transparent disabled:opacity-30'
        }`}
        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {state === 'permission_request' ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <>
            <Square className="w-4 h-4 fill-current mr-1.5" />
            <span className="text-xs font-medium animate-pulse">Stop</span>
          </>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Ripple Effect for active listening */}
      {isRecording && state !== 'permission_request' && (
        <span className="absolute -inset-1 rounded-xl bg-red-500/10 animate-ping -z-10 pointer-events-none" style={{ animationDuration: '2s' }}></span>
      )}
    </div>
  );
}
