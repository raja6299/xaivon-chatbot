"use client";

import { BrainCircuit, Search, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LATENCY_DATA = [
  { time: '00:00', latency: 120 },
  { time: '04:00', latency: 180 },
  { time: '08:00', latency: 150 },
  { time: '12:00', latency: 250 },
  { time: '16:00', latency: 190 },
  { time: '20:00', latency: 130 },
];

export default function RAGAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">RAG Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Retrieval-Augmented Generation performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-violet-400 mb-2">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Top Queries</span>
          </div>
          <ul className="space-y-2 mt-4 text-sm text-slate-300">
            <li className="flex justify-between"><span>&quot;Pricing plans&quot;</span> <span className="text-slate-500">4,210</span></li>
            <li className="flex justify-between"><span>&quot;API limits&quot;</span> <span className="text-slate-500">2,841</span></li>
            <li className="flex justify-between"><span>&quot;Integration docs&quot;</span> <span className="text-slate-500">1,992</span></li>
          </ul>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <BrainCircuit className="w-4 h-4" />
            <span className="text-sm font-medium">Avg Similarity Score</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">0.89</p>
          <p className="text-xs text-slate-500 mt-2">Highly relevant retrievals</p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">Avg Retrieval Latency</span>
          </div>
          <p className="text-3xl font-bold text-white mt-2">175ms</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Retrieval Latency (ms)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={LATENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Area type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
