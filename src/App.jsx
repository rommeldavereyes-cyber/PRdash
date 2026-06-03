import { useState, useEffect } from 'react';
import { LotsProvider } from './context/LotsContext';
import InboundReceiving from './components/InboundReceiving';
import Processing from './components/Processing';
import Dashboard from './components/Dashboard';

const ROLES = [
  {
    key: 'sam',
    name: 'Sam',
    title: 'Inbound Receiving',
    description: 'Log incoming precious metal shipments with glove-friendly controls',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-.752a3.375 3.375 0 0 0-2.168-.833l-1.78-1.068A3.375 3.375 0 0 0 14.118 12H9.882a3.375 3.375 0 0 0-1.832.533l-1.78 1.068A3.375 3.375 0 0 0 4.127 14.5H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125H3.75" />
      </svg>
    ),
  },
  {
    key: 'nate',
    name: 'Nate',
    title: 'Processing',
    description: 'Record melt and assay results for approved lots',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
  },
  {
    key: 'margarita',
    name: 'Margarita',
    title: 'QC & Settlement',
    description: 'Review, approve, and manage all refinery lots',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
];

const NAV_ITEMS = [
  { key: 'inbound', label: 'Inbound', roleKey: 'sam', component: InboundReceiving },
  { key: 'processing', label: 'Processing', roleKey: 'nate', component: Processing },
  { key: 'dashboard', label: 'Dashboard', roleKey: 'margarita', component: Dashboard },
];

function GoldBarIcon() {
  return (
    <svg className="w-7 h-7 text-accent-gold" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 20h14l3-8H2l3 8zM7 4h10l2 6H5l2-6z" opacity="0.3" />
      <path d="M4.5 12h15l3-8h-21l3 8zm-1.5 1l3 8h12l3-8H3z" />
    </svg>
  );
}

function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <GoldBarIcon />
        <h1 className="text-3xl font-bold text-text-primary">Refinery Tracker</h1>
      </div>
      <p className="text-text-secondary mb-10">Select your role to get started</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full">
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => onSelect(role.key)}
            className="group bg-bg-surface border border-border rounded-2xl p-8 text-left hover:border-accent-gold/50 hover:bg-bg-elevated transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold mb-4 group-hover:bg-accent-gold/20 transition-colors">
              {role.icon}
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-1">{role.name}</h3>
            <p className="text-accent-gold font-semibold text-sm mb-2">{role.title}</p>
            <p className="text-text-muted text-sm">{role.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function AppShell({ role, onSwitchRole }) {
  const [activeView, setActiveView] = useState(() => {
    const roleNav = NAV_ITEMS.find((n) => n.roleKey === role);
    return roleNav ? roleNav.key : 'inbound';
  });

  const currentRole = ROLES.find((r) => r.key === role);
  const ActiveComponent = NAV_ITEMS.find((n) => n.key === activeView)?.component || InboundReceiving;

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex-shrink-0 bg-bg-surface border-b border-border px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <GoldBarIcon />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-text-primary leading-tight">Refinery Tracker</h1>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === item.key
                    ? 'bg-accent-gold/15 text-accent-gold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary hidden sm:block">
              <span className="text-text-muted">Signed in as </span>
              <span className="font-semibold text-text-primary">{currentRole?.name}</span>
            </span>
            <button
              onClick={onSwitchRole}
              className="text-xs px-3 py-1.5 rounded-lg bg-bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-bg-hover transition-colors"
            >
              Switch Role
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ActiveComponent />
      </main>

      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden flex-shrink-0 bg-bg-surface border-t border-border">
        <div className="flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeView === item.key
                  ? 'text-accent-gold'
                  : 'text-text-muted'
              }`}
            >
              {item.key === 'inbound' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5" />
                </svg>
              )}
              {item.key === 'processing' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                </svg>
              )}
              {item.key === 'dashboard' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5" />
                </svg>
              )}
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('refinery_role') || '');

  const handleSelectRole = (roleKey) => {
    localStorage.setItem('refinery_role', roleKey);
    setRole(roleKey);
  };

  const handleSwitchRole = () => {
    localStorage.removeItem('refinery_role');
    setRole('');
  };

  if (!role) {
    return <RoleSelector onSelect={handleSelectRole} />;
  }

  return (
    <LotsProvider>
        <AppShell role={role} onSwitchRole={handleSwitchRole} />
    </LotsProvider>
  );
}
