import React, { useState } from 'react';
import { 
  Code2, 
  Scale, 
  ShieldCheck, 
  Calculator, 
  Layers, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  X
} from 'lucide-react';
import type { DAGNode } from '../../types';

interface DAGVisualizerProps {
  nodes: DAGNode[];
  onSelectNode?: (node: DAGNode) => void;
  selectedNodeId?: string;
}

export const DAGVisualizer: React.FC<DAGVisualizerProps> = ({
  nodes,
  onSelectNode,
  selectedNodeId
}) => {
  const [inspectNode, setInspectNode] = useState<DAGNode | null>(null);

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{
        padding: '56px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px dashed var(--border-strong)',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--accent-subtle)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <BrainCircuit size={32} />
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Dynamic Execution DAG Pipeline
        </h3>
        <p style={{ fontSize: '13px', maxWidth: '460px', margin: '0 auto', lineHeight: '1.6' }}>
          Enter a task prompt above. The Chief Orchestrator will synthesize the plan into a multi-stage dependency graph, streaming real-time work across specialized subagents.
        </p>
      </div>
    );
  }

  const getAgentMeta = (role: string) => {
    switch (role.toLowerCase()) {
      case 'architect':
        return { name: 'System Architect', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', icon: Layers, tag: 'Blueprint' };
      case 'sde':
        return { name: 'Software Engineer', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', icon: Code2, tag: 'Code & Tests' };
      case 'lawyer':
        return { name: 'Legal Counsel', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', icon: Scale, tag: 'Compliance' };
      case 'auditor':
        return { name: 'Security Auditor', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', icon: ShieldCheck, tag: 'Audit' };
      case 'accountant':
        return { name: 'Financial Accountant', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', icon: Calculator, tag: 'FinOps' };
      default:
        return { name: role.toUpperCase(), color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', icon: BrainCircuit, tag: 'Subagent' };
    }
  };

  const getStatusBadge = (status: DAGNode['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          bg: 'var(--success-bg)',
          color: 'var(--success)',
          border: 'rgba(16, 185, 129, 0.4)'
        };
      case 'running':
        return {
          label: 'In Progress',
          icon: Loader2,
          bg: 'var(--accent-subtle)',
          color: 'var(--accent-primary)',
          border: 'var(--border-glow)',
          spin: true
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: AlertCircle,
          bg: 'var(--danger-bg)',
          color: 'var(--danger)',
          border: 'rgba(239, 68, 68, 0.4)'
        };
      case 'skipped':
        return {
          label: 'Skipped',
          icon: AlertCircle,
          bg: 'var(--bg-hover)',
          color: 'var(--text-muted)',
          border: 'var(--border-color)'
        };
      default:
        return {
          label: 'Queued',
          icon: Clock,
          bg: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          border: 'var(--border-color)'
        };
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border-color)',
      padding: '24px',
      boxShadow: 'var(--shadow-md)',
      position: 'relative'
    }}>
      {/* Header with Pipeline Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Execution DAG Graph
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {nodes.filter(n => n.status === 'completed').length} of {nodes.length} subagent tasks completed
            </span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '140px',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: 'var(--bg-tertiary)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(nodes.filter(n => n.status === 'completed').length / Math.max(nodes.length, 1)) * 100}%`,
              height: '100%',
              background: 'var(--accent-gradient)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
            {Math.round((nodes.filter(n => n.status === 'completed').length / Math.max(nodes.length, 1)) * 100)}%
          </span>
        </div>
      </div>

      {/* Nodes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '16px'
      }}>
        {nodes.map((node) => {
          const meta = getAgentMeta(node.agent_role);
          const AgentIcon = meta.icon;
          const status = getStatusBadge(node.status);
          const StatusIcon = status.icon;
          const isSelected = selectedNodeId === node.id;
          const isRunning = node.status === 'running';

          return (
            <div
              key={node.id}
              onClick={() => {
                onSelectNode && onSelectNode(node);
                setInspectNode(node);
              }}
              className={isRunning ? 'pulsing-node' : ''}
              style={{
                position: 'relative',
                backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : isRunning ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isRunning ? '0 0 20px rgba(139, 92, 246, 0.25)' : 'none'
              }}
            >
              {/* Agent Badge & Status */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: meta.gradient,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 2px 8px ${meta.color}40`
                    }}>
                      <AgentIcon size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {meta.name}
                      </span>
                      <div style={{ fontSize: '10px', color: meta.color, fontWeight: 600 }}>
                        {meta.tag}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: status.bg,
                    color: status.color,
                    border: `1px solid ${status.border}`
                  }}>
                    <StatusIcon size={12} className={status.spin ? 'animate-spin' : ''} />
                    {status.label}
                  </span>
                </div>

                {/* Title & Description */}
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {node.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                  {node.description}
                </p>
              </div>

              {/* Node Footer */}
              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}>
                {node.dependencies && node.dependencies.length > 0 ? (
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowRight size={11} />
                    <span>Awaits: <strong>{node.dependencies.length} parent</strong></span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                    ⚡ Root Task
                  </span>
                )}

                {node.output_data ? (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    View Deliverable <ExternalLink size={11} />
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Pending run
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Node Modal */}
      {inspectNode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                  Subagent Deliverable Inspection
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {inspectNode.title}
                </h3>
              </div>
              <button onClick={() => setInspectNode(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <strong>Agent Role:</strong> {inspectNode.agent_role.toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <strong>Status:</strong> {inspectNode.status.toUpperCase()}
              </div>
              {inspectNode.output_data && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Output Summary:
                  </div>
                  <pre style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    padding: '10px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-primary)'
                  }}>
                    {JSON.stringify(inspectNode.output_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectNode(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
