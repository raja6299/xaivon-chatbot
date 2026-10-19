"use client";

import React from 'react';
import { Calendar, Mail, Phone, ExternalLink, X } from 'lucide-react';
import { XAIVON_APPROVED_FACTS } from '@/lib/knowledge/XAIVON_APPROVED_FACTS';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-canvas)]/80 backdrop-blur-md animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-label="Connect with XAIVON Strategy Team"
    >
      <div className="w-full max-w-sm bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-glass)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--copper-primary)]" />
            <h3 className="text-[var(--text-primary)] font-semibold text-sm font-heading">
              Discovery & Strategy Call
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Discuss your workflow bottlenecks, automation scope, and infrastructure architecture directly with Raja Babu (Founder & CEO).
          </p>

          {/* Action 1: Official Calendly Link */}
          <a
            href="https://calendly.com/xaivon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--copper-glow)] hover:border-[var(--copper-primary)] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--copper-glow)] text-[var(--copper-primary)] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Open Booking Calendar
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Pick a convenient 30-min strategy slot
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--copper-primary)] transition-colors" />
          </a>

          {/* Action 2: Direct Email Option */}
          <a
            href={`mailto:${XAIVON_APPROVED_FACTS.email}?subject=XAIVON%20Workflow%20Strategy%20Inquiry`}
            className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-surface)] hover:bg-[var(--copper-glow)] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--border-glass)] text-[var(--copper-primary)] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Direct Email
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {XAIVON_APPROVED_FACTS.email}
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--copper-primary)] transition-colors" />
          </a>

          {/* Action 3: Direct Phone */}
          <div className="p-3 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-surface)]/60 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--border-glass)] text-[var(--text-secondary)] flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Direct Line: <span className="font-mono">{XAIVON_APPROVED_FACTS.phone}</span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Available IST / EST business hours
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Continue conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
