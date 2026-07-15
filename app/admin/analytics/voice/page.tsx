"use client";

import { Mic, Activity, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LANG_DATA = [
  { lang: 'English (US)', sessions: 2400 },
  { lang: 'Hindi (IN)', sessions: 1398 },
  { lang: 'English (IN)', sessions: 9800 },
  { lang: 'Hinglish', sessions: 3908 },
];

export default function VoiceAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Voice Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Enterprise Voice usage and speech recognition accuracy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">Total Voice Sessions</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">17,506</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Speech Accuracy</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">96.4%</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-violet-400 mb-2">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Primary Language</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">en-IN</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Language Distribution</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={LANG_DATA} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="lang" type="category" stroke="rgba(255,255,255,0.7)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Bar dataKey="sessions" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
