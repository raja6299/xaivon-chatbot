"use client";

import { MessageSquare, Users, BookOpen, BrainCircuit, Mic, FileText, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const METRICS = [
  { label: "Total Conversations", value: "24,593", change: "+12.5%", trend: "up", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Qualified Leads", value: "1,204", change: "+8.2%", trend: "up", icon: Users, color: "text-violet-400", bg: "bg-violet-400/10" },
  { label: "Knowledge Docs", value: "342", change: "+2", trend: "up", icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Avg Response Time", value: "1.2s", change: "-0.3s", trend: "down", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
];

const SECONDARY_METRICS = [
  { label: "Voice Sessions", value: "4,210", icon: Mic },
  { label: "RAG Accuracy", value: "94.2%", icon: BrainCircuit },
  { label: "Docs Processed", value: "8,932", icon: FileText },
];

const ACTIVITY_DATA = [
  { time: '00:00', convos: 120, leads: 10 },
  { time: '04:00', convos: 80, leads: 5 },
  { time: '08:00', convos: 450, leads: 45 },
  { time: '12:00', convos: 890, leads: 92 },
  { time: '16:00', convos: 730, leads: 74 },
  { time: '20:00', convos: 320, leads: 28 },
];

const LEAD_DATA = [
  { day: 'Mon', count: 42 },
  { day: 'Tue', count: 58 },
  { day: 'Wed', count: 65 },
  { day: 'Thu', count: 48 },
  { day: 'Fri', count: 72 },
  { day: 'Sat', count: 24 },
  { day: 'Sun', count: 18 },
];

export default function AdminDashboardHome() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise AI performance and metrics</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30">
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          const isUp = metric.trend === 'up';
          return (
            <div key={metric.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {metric.change}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{metric.value}</h3>
              <p className="text-sm text-slate-400 font-medium">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Conversation Volume</h3>
            <span className="text-xs text-slate-400 font-medium px-3 py-1 bg-white/5 rounded-full">Hourly</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConvos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="convos" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorConvos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Leads Generated</h3>
          </div>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LEAD_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SECONDARY_METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{metric.label}</p>
                  <p className="text-xl font-bold text-white">{metric.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
