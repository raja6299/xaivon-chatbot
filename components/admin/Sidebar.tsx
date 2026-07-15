"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  KanbanSquare,
  BookOpen,
  FileText,
  BrainCircuit,
  Mic,
  Cpu,
  Calendar,
  Shield,
  Activity,
  ScrollText,
  Settings,
  Webhook,
} from 'lucide-react';

const NAVIGATION = [
  {
    title: 'Overview',
    items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Live Chat', href: '/admin/analytics/chat', icon: MessageSquare },
      { name: 'RAG Performance', href: '/admin/analytics/rag', icon: BrainCircuit },
      { name: 'Voice Usage', href: '/admin/analytics/voice', icon: Mic },
      { name: 'AI Models', href: '/admin/analytics/ai', icon: Cpu },
    ],
  },
  {
    title: 'CRM',
    items: [
      { name: 'Leads Management', href: '/admin/crm', icon: Users },
      { name: 'Sales Pipeline', href: '/admin/pipeline', icon: KanbanSquare },
    ],
  },
  {
    title: 'Content',
    items: [
      { name: 'Knowledge Base', href: '/admin/knowledge', icon: BookOpen },
      { name: 'Documents', href: '/admin/documents', icon: FileText },
      { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Security', href: '/admin/security', icon: Shield },
      { name: 'System Health', href: '/admin/health', icon: Activity },
      { name: 'Audit Logs', href: '/admin/logs', icon: ScrollText },
      { name: 'Integrations', href: '/admin/integrations', icon: Webhook },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen flex-shrink-0 bg-[#0a0e1a]/80 backdrop-blur-xl border-r border-violet-500/10 flex flex-col hidden md:flex sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-violet-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold tracking-wide">XAIVON <span className="text-violet-400 font-medium">ADMIN</span></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-6 px-4 space-y-8">
        {NAVIGATION.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-violet-500/10 text-violet-400 shadow-sm shadow-violet-500/5'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-violet-500/10">
        <div className="flex items-center gap-3 px-3 py-2 bg-black/20 rounded-xl border border-white/5">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
            <span className="text-xs text-white font-medium">AD</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
