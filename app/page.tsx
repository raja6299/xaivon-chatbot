"use client";

import React from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ArrowUpRight, ShieldCheck, Cpu, Layers } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col transition-colors duration-200">
      {/* ─── Top Navigation Bar ─── */}
      <header className="border-b border-[var(--border-glass)] bg-[var(--bg-canvas)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-[var(--copper-primary)] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[var(--copper-glow)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              X
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide font-heading block leading-none">
                XAIVON
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium block mt-1">
                AI Business Infrastructure
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper-primary)] animate-pulse"></span>
              Consultant System Operational
            </div>

            <a
              href="https://xaivon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-surface)]"
            >
              Main Site <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <a
              href="mailto:raja@xaivon.com"
              className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-[var(--copper-primary)] hover:bg-[var(--copper-light)] text-white shadow-sm shadow-[var(--copper-glow)] transition-all duration-150"
            >
              Contact Raja
            </a>
          </div>
        </div>
      </header>

      {/* ─── Main Content Layout ─── */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Strategic Context & Overview */}
        <section className="lg:col-span-5 space-y-6 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--copper-glow)] border border-[var(--border-subtle)] text-[var(--copper-primary)] text-xs font-medium">
            <Cpu className="w-3.5 h-3.5" /> Enterprise AI Consultant
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] font-heading leading-tight">
              Decouple business growth from operational headcount.
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              XAIVON designs and deploys connected AI systems that eliminate manual data entry, accelerate transaction velocity, and automate complex workflows.
            </p>
          </div>

          {/* Pillars */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] flex items-start gap-3">
              <Layers className="w-4 h-4 text-[var(--copper-primary)] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)]">
                  Logistics & Freight Automation
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Automated quote intake, document parsing, and load dispatch workflows.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[var(--copper-primary)] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)]">
                  Secure Enterprise Infrastructure
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Production-grade security, zero-leakage RAG, and verified business facts.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Details Footnote */}
          <div className="pt-2 text-xs text-[var(--text-muted)] space-y-1 border-t border-[var(--border-glass)]">
            <p>Direct Inquiries: <a href="mailto:raja@xaivon.com" className="text-[var(--copper-primary)] hover:underline">raja@xaivon.com</a></p>
            <p>Telephone: <span className="text-[var(--text-secondary)]">+91-95211-90205</span></p>
            <p>Operated by ADABHRA GROUP (Sole Proprietorship), India</p>
          </div>
        </section>

        {/* Right Column: Embedded Interactive Chat Window */}
        <section className="lg:col-span-7 w-full h-[620px] sm:h-[660px] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-panel)] relative">
          <ChatWindow isEmbed={false} />
        </section>
      </div>

      {/* ─── Minimal Footer ─── */}
      <footer className="border-t border-[var(--border-glass)] py-4 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} XAIVON • All rights reserved • Confidential Enterprise AI Systems
      </footer>
    </main>
  );
}
