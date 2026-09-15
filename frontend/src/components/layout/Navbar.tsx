import React, { useState } from 'react';
import { 
  Bot, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  FolderGit2, 
  Activity, 
  FileCode2, 
  Users, 
  FileText,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'mission', label: 'Mission Control', icon: Activity },
    { id: 'workspace', label: 'Code Studio', icon: FileCode2 },
    { id: 'reports', label: 'Deliverables', icon: FileText },
    { id: 'agents', label: 'Agent Roster', icon: Users },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '58px',
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(8px)'
    }}>
      {/* Brand & Workspace info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Supabase-style compact technical logo mark */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--brand)',
            color: 'var(--brand-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Bot size={18} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontFamily: 'var(--font-heading)',
                fontSize: '16px', 
                fontWeight: 700, 
                letterSpacing: '-0.03em',
                color: 'var(--foreground)' 
              }}>
                Polyman
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-soft)',
                color: 'var(--brand-dark)',
                border: '1px solid var(--border)'
              }}>
                v2.0
              </span>
            </div>

            {/* Status indicator row */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '11px', 
              color: 'var(--foreground-muted)' 
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: isEngineConnected ? 'var(--brand)' : 'var(--danger)',
                fontWeight: 500
              }}>
                <span className={isEngineConnected ? "live-dot" : ""} style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isEngineConnected ? 'var(--brand)' : 'var(--danger)',
                  display: 'inline-block'
                }} />
                {isEngineConnected ? 'Engine Ready' : 'Offline'}
              </span>

              {workspacePath && (
                <>
                  <span>•</span>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px'
                  }} title={workspacePath}>
                    <FolderGit2 size={11} />
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {workspacePath.split(/[/\\]/).pop() || 'workspace'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav 
          aria-label="Main navigation" 
          style={{
            display: 'none',
            gap: '2px',
            marginLeft: '12px'
          }}
          className="desktop-nav"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`tab ${isActive ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--foreground)' : 'var(--foreground-secondary)',
                  borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                  borderRadius: '0',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} style={{ color: isActive ? 'var(--brand)' : 'var(--foreground-muted)' }} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Utility & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="button-ghost"
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface-control)',
            color: 'var(--foreground-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          aria-label="Engine Settings and API Keys"
          className="button-secondary"
          style={{
            height: '34px',
            padding: '0 12px',
            fontSize: '13px',
            fontWeight: 500,
            gap: '6px'
          }}
        >
          <SettingsIcon size={14} style={{ color: 'var(--foreground-muted)' }} />
          <span>Settings</span>
        </button>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="button-ghost mobile-menu-btn"
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '58px',
          left: 0,
          right: 0,
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'var(--shadow-dropdown)',
          zIndex: 60
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--brand-dark)' : 'var(--foreground)',
                  backgroundColor: isActive ? 'var(--brand-soft)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--brand)' : 'var(--foreground-muted)' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};
