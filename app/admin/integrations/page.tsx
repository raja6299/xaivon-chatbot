import { Webhook, Zap, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';

const PROVIDERS = [
  { id: 'slack', name: 'Slack', type: 'webhook', status: 'Active', health: '100%', latency: '45ms' },
  { id: 'hubspot', name: 'HubSpot CRM', type: 'api_key', status: 'Active', health: '99.9%', latency: '210ms' },
  { id: 'zapier', name: 'Zapier', type: 'webhook', status: 'Configured', health: '100%', latency: '120ms' },
];

const LOGS = [
  { id: 'JOB-9921', provider: 'Slack', action: 'Send Notification', status: 'Success', duration: '45ms', time: '2 mins ago' },
  { id: 'JOB-9920', provider: 'HubSpot CRM', action: 'Create Contact', status: 'Success', duration: '250ms', time: '15 mins ago' },
  { id: 'JOB-9919', provider: 'Webhook', action: 'Sync Data', status: 'Failed', duration: '5000ms', time: '1 hour ago', retries: 3 },
  { id: 'JOB-9918', provider: 'Zapier', action: 'Trigger Workflow', status: 'Success', duration: '120ms', time: '2 hours ago' },
];

export default function IntegrationsDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">Manage webhooks, connected providers, and background jobs</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-violet-500/20">
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROVIDERS.map(p => (
          <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{p.type}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                p.status === 'Active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'
              }`}>
                {p.status}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400 border-t border-white/5 pt-4">
              <div>
                <p className="text-xs">Health</p>
                <p className="font-medium text-white">{p.health}</p>
              </div>
              <div className="text-right">
                <p className="text-xs">Latency</p>
                <p className="font-medium text-white">{p.latency}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mt-6">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Webhook className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-white">Webhook & Async Job Logs</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">Job ID</th>
              <th className="px-6 py-4 font-medium">Provider</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Duration</th>
              <th className="px-6 py-4 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {LOGS.map(log => (
              <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-xs">{log.id}</td>
                <td className="px-6 py-4 font-medium text-white">{log.provider}</td>
                <td className="px-6 py-4">{log.action}</td>
                <td className="px-6 py-4">
                  {log.status === 'Success' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full text-xs font-medium" title={`Retries: ${log.retries}`}>
                      <XCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" /> {log.duration}
                </td>
                <td className="px-6 py-4">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
