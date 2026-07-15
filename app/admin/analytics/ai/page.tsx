"use client";

import { Cpu, Zap, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TOKEN_DATA = [
  { day: 'Mon', prompt: 1.2, completion: 2.1 },
  { day: 'Tue', prompt: 1.5, completion: 2.8 },
  { day: 'Wed', prompt: 2.1, completion: 3.5 },
  { day: 'Thu', prompt: 1.8, completion: 3.2 },
  { day: 'Fri', prompt: 2.5, completion: 4.1 },
  { day: 'Sat', prompt: 0.8, completion: 1.2 },
  { day: 'Sun', prompt: 0.5, completion: 0.9 },
];

export default function AIAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">LLM token usage, cost, and latency metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Cpu className="w-4 h-4" />
            <span className="text-sm font-medium">Total Tokens (M)</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">28.2M</p>
          <div className="flex text-xs text-slate-400 gap-4 mt-2">
            <span>Prompt: 10.4M</span>
            <span>Completion: 17.8M</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Est. Cost</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">$42.80</p>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            ↓ 12% vs last week
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-violet-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Avg Streaming Latency</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">45ms</p>
          <p className="text-xs text-slate-500 mt-2">Time to first token</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Token Usage (Millions)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TOKEN_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrompt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="completion" stackId="1" stroke="#8b5cf6" fill="url(#colorCompletion)" />
              <Area type="monotone" dataKey="prompt" stackId="1" stroke="#3b82f6" fill="url(#colorPrompt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
