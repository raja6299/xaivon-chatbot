import { Server, Database, Brain, Globe, HardDrive } from 'lucide-react';

const SERVICES = [
  { name: 'API Server', status: 'Operational', uptime: '99.99%', latency: '45ms', icon: Server, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Supabase Database', status: 'Operational', uptime: '99.98%', latency: '12ms', icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Vector Store (RAG)', status: 'Operational', uptime: '100%', latency: '85ms', icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Web Speech API', status: 'Operational', uptime: '100%', latency: 'n/a', icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Storage Buckets', status: 'Operational', uptime: '99.95%', latency: '35ms', icon: HardDrive, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

export default function SystemHealth() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Health</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor the operational status of all enterprise services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.name} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${service.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${service.color}`} />
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-400/10 text-emerald-400">
                  {service.status}
                </span>
              </div>
              <h3 className="font-semibold text-white">{service.name}</h3>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-400 border-t border-white/5 pt-4">
                <div>
                  <p className="text-xs">Uptime</p>
                  <p className="font-medium text-white">{service.uptime}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs">Latency</p>
                  <p className="font-medium text-white">{service.latency}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
