import React from 'react';
import { 
  Bot, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  FolderGit2, 
  Activity, 
  FileCode2, 
  Users, 
  FileText
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenSettings: () => void;
  workspacePath: string;
  isEngineConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenSettings,
  workspacePath,
  isEngineConnected
}) => {
  const tabs = [
    { id: 'mission', label: 'Mission Control', icon: Activity },
    { id: 'workspace', label: 'Code Studio', icon: FileCode2 },
    { id: 'reports', label: 'Deliverables', icon: FileText },
    { id: 'agents', label: 'Agent Roster', icon: Users },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      height: '68px',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand & Workspace info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}>
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em' }}>
                Polyman
              </h1>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '20px',
                background: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-glow)'
              }}>
                Pro Max
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: isEngineConnected ? 'var(--success)' : 'var(--danger)',
                fontWeight: 600
              }}>
                <span className="live-dot" style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isEngineConnected ? 'var(--success)' : 'var(--danger)',
                  display: 'inline-block'
                }} />
                {isEngineConnected ? 'Engine Ready' : 'Disconnected'}
              </span>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={workspacePath}>
                <FolderGit2 size={13} />
                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {workspacePath.split('\\').pop() || 'Workspace'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation with sleek styling */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          marginLeft: '20px',
          padding: '4px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Theme Toggle & Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          onClick={onOpenSettings}
          title="Engine Settings & Model Keys"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)'
          }}
        >
          <SettingsIcon size={16} color="var(--accent-primary)" />
          Settings
        </button>
      </div>
    </header>
  );
};
