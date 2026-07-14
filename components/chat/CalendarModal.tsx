"use client";

import React, { useEffect, useState } from 'react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  
  // We'll mock the booking process for now as requested by the adapter architecture
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRendered(true);
      // Small delay to allow DOM to render before adding visible class for animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Wait for exit animation before removing from DOM
      const timer = setTimeout(() => {
        setIsRendered(false);
        setBookingStatus('idle');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const handleBook = () => {
    setBookingStatus('booking');
    setTimeout(() => {
      setBookingStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100 bg-[#070b14]/90 backdrop-blur-md' : 'opacity-0 bg-transparent pointer-events-none'} lead-form-overlay`}>
      <div className={`w-full max-w-sm bg-[#111827]/95 border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-900/20 overflow-hidden flex flex-col transition-all duration-300 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-violet-500/10 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-white font-semibold text-[15px]">Schedule your call</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {bookingStatus === 'success' ? (
             <div className="flex flex-col items-center justify-center h-full text-center py-6 animate-fade-in-up">
               <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
                 <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               <h4 className="text-white font-semibold mb-2">Meeting Confirmed</h4>
               <p className="text-slate-400 text-sm">We&apos;ve sent the invitation to your email. Talk to you soon!</p>
             </div>
          ) : (
            <div className="space-y-5 animate-fade-in-up">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📅</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Connect with an Enterprise AI Specialist to discuss your requirements in detail.
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleBook}
                  disabled={bookingStatus === 'booking'}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-violet-500/20 bg-[#151d35] hover:bg-violet-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">Tomorrow, 10:00 AM</p>
                      <p className="text-slate-400 text-xs">30 Min Discovery Call</p>
                    </div>
                  </div>
                  <span className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bookingStatus === 'booking' ? (
                      <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    )}
                  </span>
                </button>
                
                <button 
                  onClick={handleBook}
                  disabled={bookingStatus === 'booking'}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-violet-500/20 bg-[#151d35] hover:bg-violet-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">Tomorrow, 2:00 PM</p>
                      <p className="text-slate-400 text-xs">30 Min Discovery Call</p>
                    </div>
                  </div>
                  <span className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bookingStatus === 'booking' ? (
                      <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    )}
                  </span>
                </button>
              </div>
              
              <div className="pt-2 text-center">
                 <button 
                    onClick={onClose}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                 >
                   I&apos;ll book later
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
