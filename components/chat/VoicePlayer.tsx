import React, { useEffect, useState } from 'react';
import { useVoice } from '../../hooks/useVoice';
import { Play, Pause, Square, Volume2, VolumeX, FastForward } from 'lucide-react';

export function VoicePlayer() {
  const { 
    isSupported, 
    state, 
    settings, 
    stopOutput, 
    pauseOutput, 
    resumeOutput, 
    updateSettings 
  } = useVoice();
  
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const randomHeights = [10, 14, 8, 12];

  // Close speed menu when clicking outside (simple approach: close on any click)
  useEffect(() => {
    if (showSpeedMenu) {
      const clickHandler = () => setShowSpeedMenu(false);
      document.addEventListener('click', clickHandler);
      return () => document.removeEventListener('click', clickHandler);
    }
  }, [showSpeedMenu]);

  if (!isSupported) return null;

  const isActive = state === 'speaking' || state === 'paused';
  if (!isActive) return null;

  const isPaused = state === 'paused';
  const isMuted = settings?.isMuted || false;
  const currentSpeed = settings?.playbackSpeed || 1.0;

  return (
    <div className="mx-4 mb-2 flex items-center justify-between px-4 py-2.5 bg-[#1a233a]/80 backdrop-blur-md border border-violet-500/20 rounded-xl shadow-lg animate-fade-in-up">
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={isPaused ? resumeOutput : pauseOutput}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 hover:text-white transition-colors"
          aria-label={isPaused ? "Resume voice" : "Pause voice"}
        >
          {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Stop */}
        <button
          onClick={stopOutput}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          aria-label="Stop voice"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Animation Wave */}
        <div className="flex items-center gap-0.5 h-4 ml-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-violet-400 rounded-full transition-all duration-300 ${!isPaused ? 'animate-pulse' : 'h-1'}`}
              style={{
                height: !isPaused ? `${randomHeights[i]}px` : '4px',
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        {/* Speed Control */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSpeedMenu(!showSpeedMenu);
          }}
          className="flex items-center gap-1 text-[10px] font-medium text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1.5 rounded-lg transition-colors"
        >
          <FastForward className="w-3 h-3" />
          {currentSpeed}x
        </button>

        {showSpeedMenu && (
          <div className="absolute bottom-full right-8 mb-2 py-1 bg-[#151d35] border border-violet-500/20 rounded-lg shadow-xl overflow-hidden z-50">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
              <button
                key={speed}
                onClick={() => updateSettings({ playbackSpeed: speed })}
                className={`w-full text-left px-4 py-1.5 text-xs hover:bg-violet-500/20 transition-colors ${currentSpeed === speed ? 'text-white bg-violet-500/10' : 'text-slate-400'}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}

        {/* Mute/Unmute */}
        <button
          onClick={() => updateSettings({ isMuted: !isMuted })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isMuted ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-violet-300 hover:text-white bg-violet-500/10 hover:bg-violet-500/20'
          }`}
          aria-label={isMuted ? "Unmute voice" : "Mute voice"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
