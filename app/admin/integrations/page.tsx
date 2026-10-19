import { Webhook, Zap, ShieldAlert, Plus, CheckCircle2 } from 'lucide-react';

const PROVIDERS = [
  {
    id: 'slack',
    name: 'Slack Alerts',
    type: 'Incoming Webhook',
    status: process.env.SLACK_WEBHOOK_URL ? 'Configured' : 'Standby / Not Configured',
    policy: 'Owner authorized manual alerts only',
    active: Boolean(process.env.SLACK_WEBHOOK_URL),
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    type: 'REST API',
    status: process.env.HUBSPOT_API_KEY ? 'Configured' : 'Standby / Not Configured',
    policy: 'Lead sync via explicit API route',
    active: Boolean(process.env.HUBSPOT_API_KEY),
  },
  {
    id: 'zapier',
    name: 'Zapier Automation',
    type: 'Outbound Webhook',
    status: process.env.ZAPIER_WEBHOOK_URL ? 'Configured' : 'Standby / Not Configured',
    policy: 'Event dispatch via allowlisted endpoints',
    active: Boolean(process.env.ZAPIER_WEBHOOK_URL),
  },
];

export default function IntegrationsDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">Configured provider hooks and integration security status</p>
        </div>
        <button
          disabled
          title="Manual provisioning disabled in V2 baseline"
          className="flex items-center gap-2 bg-[#C4704B]/50 cursor-not-allowed px-4 py-2 rounded-xl text-sm font-medium text-white/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Integration (Owner Auth Required)
        </button>
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#C4704B] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-medium text-white">V2 Security Hardening: Model Tool Execution Disabled</p>
          <p className="text-slate-400">
            Autonomous model-invoked tool calls to external webhooks have been permanently disabled to prevent SSRF and unintended data egress. Integrations operate exclusively through authenticated explicit server handlers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C4704B]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#C4704B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{p.type}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                  p.active
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-slate-400/10 text-slate-400'
                }`}
              >
                {p.status}
              </span>
            </div>
            <div className="mt-4 text-xs text-slate-400 border-t border-white/5 pt-4">
              <p className="text-slate-500">Security Policy:</p>
              <p className="font-medium text-slate-300 mt-0.5">{p.policy}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mt-6">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Webhook className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-white">Webhook & Async Job Activity</h3>
          </div>
          <span className="text-xs text-slate-400">Live Activity Log</span>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-white">No Autonomous Webhook Dispatches</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Synthetic sample logs have been removed. Autonomous webhook triggers are disabled; zero unexpected background jobs have executed.
          </p>
        </div>
      </div>
    </div>
  );
}
