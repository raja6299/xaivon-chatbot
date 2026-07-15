import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure AI, CRM, Security, and Localization parameters</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-violet-500/20">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {['AI Models', 'Voice Configuration', 'RAG Engine', 'CRM Setup', 'Localization', 'Security Rules'].map((item, idx) => (
            <button key={item} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${idx === 0 ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
              {item}
            </button>
          ))}
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <SettingsIcon className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">AI Model Configuration</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Primary Chat Model</label>
                <select className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/30">
                  <option>llama-3.1-70b-versatile</option>
                  <option>llama-3-70b-8192</option>
                  <option>mixtral-8x7b-32768</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">The core model used for the main conversational interface.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">System Temperature</label>
                <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full accent-violet-500" />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Deterministic (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <div>
                  <h4 className="text-sm font-medium text-white">Streaming Responses</h4>
                  <p className="text-xs text-slate-500">Enable real-time token streaming to the client.</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-violet-600 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
