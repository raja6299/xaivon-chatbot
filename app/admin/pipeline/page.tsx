import { Plus } from 'lucide-react';

const STAGES = [
  { id: 'new', name: 'New Leads', count: 12 },
  { id: 'qualified', name: 'Qualified', count: 8 },
  { id: 'discovery', name: 'Discovery', count: 5 },
  { id: 'proposal', name: 'Proposal', count: 3 },
  { id: 'won', name: 'Closed Won', count: 24 },
];

const CARDS = [
  { id: 1, stage: 'qualified', name: 'Sarah Jenkins', company: 'TechCorp Inc.', value: '$24,000' },
  { id: 2, stage: 'discovery', name: 'Michael Chen', company: 'Nexus Dynamics', value: '$12,500' },
  { id: 3, stage: 'new', name: 'Emma Wilson', company: 'Global Solutions', value: 'Pending' },
  { id: 4, stage: 'proposal', name: 'David Kumar', company: 'Innovate AI', value: '$45,000' },
  { id: 5, stage: 'qualified', name: 'Alex Rodriguez', company: 'CloudSync', value: '$18,000' },
];

export default function PipelineManagement() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">Kanban board for lead progression</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-violet-500/20">
          <Plus className="w-4 h-4" />
          Add Deal
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
        {STAGES.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col bg-white/[0.02] border border-white/5 rounded-2xl h-full">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white">{stage.name}</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-medium text-slate-300">
                {stage.count}
              </span>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">
              {CARDS.filter(c => c.stage === stage.id).map((card) => (
                <div key={card.id} className="bg-[#0a0e1a] border border-white/5 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-violet-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white text-sm">{card.name}</h4>
                    <span className="text-xs font-semibold text-emerald-400">{card.value}</span>
                  </div>
                  <p className="text-xs text-slate-400">{card.company}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
