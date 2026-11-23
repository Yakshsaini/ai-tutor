import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Brain, CalendarCheck, Files, GraduationCap, LayoutDashboard, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, Settings, TrendingUp, X } from 'lucide-react';
import { useApp } from '../context.jsx';

const NAV = [
  ['/', 'Dashboard', LayoutDashboard], ['/documents', 'My Documents', Files], ['/tutor', 'AI Tutor', MessageSquare],
  ['/quiz', 'Practice Quiz', Brain], ['/progress', 'Learning Progress', TrendingUp], ['/planner', 'Study Planner', CalendarCheck], ['/settings', 'Settings', Settings],
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { status, statusError } = useApp();
  const { pathname } = useLocation();
  const title = NAV.find(([to]) => to === pathname)?.[1] || 'LearnMate AI';

  const badge = statusError ? ['bg-rose-50 text-rose-700', 'Backend offline']
    : status?.demoMode ? ['bg-amber-50 text-amber-800', 'Demo Mode']
    : status?.effectiveMode === 'unavailable' ? ['bg-rose-50 text-rose-700', 'Gemini key missing']
    : status ? ['bg-emerald-50 text-emerald-700', 'Live · Gemini'] : null;

  return (
    <div className="flex h-full">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all lg:static ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'w-64 lg:w-20' : 'w-64'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white"><GraduationCap className="h-5 w-5" /></div>
          {!collapsed && <span className="text-lg font-bold">LearnMate <span className="text-indigo-600">AI</span></span>}
          <button className="ml-auto rounded-lg p-1 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} title={label}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="h-5 w-5 shrink-0" />{!collapsed && label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} className="m-3 hidden items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 lg:flex">
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <><PanelLeftClose className="h-5 w-5" />Collapse</>}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          {badge && <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge[0]}`}>{badge[1]}</span>}
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
      </div>
    </div>
  );
}
