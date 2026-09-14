import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  ArrowDown, 
  MessageSquare, 
  Wrench, 
  Check, 
  AlertTriangle,
  Lightbulb,
  Copy,
  Search
} from 'lucide-react';
import type { AgentLog } from '../../types';

interface LiveLogViewerProps {
  logs: AgentLog[];
}

export const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ logs }) => {
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(l => {
    if (filterRole !== 'all' && l.agent_role.toLowerCase() !== filterRole.toLowerCase()) return false;
    if (searchQuery.trim() && !l.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const copyTranscript = () => {
    const text = logs.map(l => `[${l.created_at}] [${l.agent_role.toUpperCase()}] [${l.event_type}]: ${l.content}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEventBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'thought':
        return { label: 'Thought', icon: Lightbulb, color: '#f59e0b', bg: 'var(--warning-bg)' };
      case 'tool_call':
        return { label: 'Action', icon: Wrench, color: '#0ea5e9', bg: 'var(--info-bg)' };
      case 'tool_result':
        return { label: 'Result', icon: Check, color: '#10b981', bg: 'var(--success-bg)' };
      case 'output':
        return { label: 'Deliverable', icon: MessageSquare, color: '#8b5cf6', bg: 'var(--purple-bg)' };
      case 'error':
        return { label: 'Error', icon: AlertTriangle, color: '#ef4444', bg: 'var(--danger-bg)' };
      default:
        return { label: 'System', icon: Terminal, color: '#94a3b8', bg: 'var(--bg-tertiary)' };
    }
  };

  const getAgentColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'architect': return '#0ea5e9';
      case 'sde': return '#10b981';
      case 'lawyer': return '#f59e0b';
      case 'auditor': return '#ef4444';
      case 'accountant': return '#8b5cf6';
      case 'orchestrator': return '#6366f1';
      default: return '#64748b';
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '460px',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }}>
      {/* Terminal Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Terminal size={14} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Agent Execution Feed & Telemetry
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'var(--bg-hover)',
            padding: '2px 8px',
            borderRadius: '12px',
            color: 'var(--text-secondary)'
          }}>
            {filteredLogs.length} events
          </span>
        </div>

        {/* Filters and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '4px 8px'
          }}>
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--text-primary)',
                width: '100px'
              }}
            />
          </div>

          {/* Subagent filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="all">All Agents</option>
            <option value="orchestrator">Orchestrator</option>
            <option value="architect">Architect</option>
            <option value="sde">SDE</option>
            <option value="lawyer">Lawyer</option>
            <option value="auditor">Auditor</option>
            <option value="accountant">Accountant</option>
          </select>

          {/* Copy transcript button */}
          <button
            onClick={copyTranscript}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title="Copy Full Transcript"
          >
            <Copy size={12} />
            {copied ? 'Copied' : 'Copy'}
          </button>

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: autoScroll ? 'var(--accent-subtle)' : 'transparent',
              color: autoScroll ? 'var(--accent-primary)' : 'var(--text-muted)'
            }}
            title="Toggle Auto-Scroll"
          >
            <ArrowDown size={12} />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Terminal size={28} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
            Awaiting subagent mission launch...
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getEventBadge(log.event_type);
            const BadgeIcon = badge.icon;
            const agentColor = getAgentColor(log.agent_role);

            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Agent Tag */}
                <div style={{
                  minWidth: '105px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: agentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {log.agent_role}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    width: 'fit-content'
                  }}>
                    <BadgeIcon size={10} />
                    {badge.label}
                  </span>
                </div>

                {/* Content */}
                <div style={{
                  flex: 1,
                  color: 'var(--text-primary)',
                  wordBreak: 'break-word',
                  fontFamily: log.event_type.includes('tool') ? 'var(--font-mono)' : 'inherit',
                  fontSize: log.event_type.includes('tool') ? '12px' : '13px'
                }}>
                  {log.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
