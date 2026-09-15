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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
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
        return { label: 'Thought', icon: Lightbulb, color: 'var(--warning)', bg: 'var(--warning-soft)' };
      case 'tool_call':
        return { label: 'Action', icon: Wrench, color: 'var(--info)', bg: 'var(--info-soft)' };
      case 'tool_result':
        return { label: 'Result', icon: Check, color: 'var(--brand)', bg: 'var(--brand-soft)' };
      case 'output':
        return { label: 'Deliverable', icon: MessageSquare, color: 'var(--purple)', bg: 'var(--purple-bg)' };
      case 'error':
        return { label: 'Error', icon: AlertTriangle, color: 'var(--danger)', bg: 'var(--danger-soft)' };
      default:
        return { label: 'System', icon: Terminal, color: 'var(--foreground-muted)', bg: 'var(--surface-control)' };
    }
  };

  const getAgentColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'architect': return 'var(--info)';
      case 'sde': return 'var(--brand)';
      case 'lawyer': return 'var(--warning)';
      case 'auditor': return 'var(--danger)';
      case 'accountant': return 'var(--purple)';
      case 'orchestrator': return 'var(--foreground)';
      default: return 'var(--foreground-secondary)';
    }
  };

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '460px',
      overflow: 'hidden'
    }}>
      {/* Console Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-control)',
            border: '1px solid var(--border)',
            color: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Terminal size={13} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
            Agent Execution Feed & Telemetry
          </span>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            backgroundColor: 'var(--surface-control)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            color: 'var(--foreground-muted)'
          }}>
            {filteredLogs.length} events
          </span>
        </div>

        {/* Filters and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Search box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px'
          }}>
            <Search size={12} style={{ color: 'var(--foreground-muted)' }} />
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
                color: 'var(--foreground)',
                width: '90px'
              }}
            />
          </div>

          {/* Subagent filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="select"
            style={{
              fontSize: '12px',
              minHeight: '28px',
              padding: '2px 6px',
              width: 'auto'
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
            className="button-ghost"
            style={{
              height: '28px',
              padding: '0 8px',
              fontSize: '11px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)'
            }}
            title="Copy Full Transcript"
          >
            <Copy size={11} />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="button-ghost"
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              border: '1px solid var(--border)',
              backgroundColor: autoScroll ? 'var(--brand-soft)' : 'var(--surface)',
              color: autoScroll ? 'var(--brand-dark)' : 'var(--foreground-muted)'
            }}
            title="Toggle Auto-Scroll"
          >
            <ArrowDown size={12} />
          </button>
        </div>
      </div>

      {/* Terminal Feed Body */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          backgroundColor: 'var(--background-alternative)'
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '13px' }}>
            <Terminal size={24} style={{ opacity: 0.3, margin: '0 auto 6px auto' }} />
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
                  gap: '10px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)'
                }}
              >
                {/* Agent Tag */}
                <div style={{
                  minWidth: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: agentColor,
                    fontFamily: 'var(--font-mono)',
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
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    width: 'fit-content'
                  }}>
                    <BadgeIcon size={9} />
                    {badge.label}
                  </span>
                </div>

                {/* Content */}
                <div style={{
                  flex: 1,
                  color: 'var(--foreground)',
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
      </div>
    </div>
  );
};
