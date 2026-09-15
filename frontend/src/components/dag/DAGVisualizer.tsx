import React, { useState, useEffect } from 'react';
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

  // Keyboard accessibility: Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectNode) {
        setInspectNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectNode]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="card" style={{
        padding: '48px 24px',
        textAlign: 'center',
        border: '1px dashed var(--border-strong)',
        color: 'var(--foreground-muted)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-control)',
          border: '1px solid var(--border)',
          color: 'var(--brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px auto'
        }}>
          <BrainCircuit size={24} />
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
          Dynamic Execution DAG Pipeline
        </h3>
        <p style={{ fontSize: '13px', maxWidth: '440px', margin: '0 auto', lineHeight: '1.6', color: 'var(--foreground-secondary)' }}>
          Enter a task prompt above to initiate synthesis. The Orchestrator constructs a multi-stage dependency graph, streaming concurrent operations across specialized subagents.
        </p>
      </div>
    );
  }

  const getAgentMeta = (role: string) => {
    switch (role.toLowerCase()) {
      case 'architect':
        return { name: 'System Architect', color: 'var(--info)', bg: 'var(--info-soft)', icon: Layers, tag: 'Blueprint' };
      case 'sde':
        return { name: 'Software Engineer', color: 'var(--brand)', bg: 'var(--brand-soft)', icon: Code2, tag: 'Code & Tests' };
      case 'lawyer':
        return { name: 'Legal Counsel', color: 'var(--warning)', bg: 'var(--warning-soft)', icon: Scale, tag: 'Compliance' };
      case 'auditor':
        return { name: 'Security Auditor', color: 'var(--danger)', bg: 'var(--danger-soft)', icon: ShieldCheck, tag: 'Security' };
      case 'accountant':
        return { name: 'Financial Accountant', color: 'var(--purple)', bg: 'var(--purple-bg)', icon: Calculator, tag: 'FinOps' };
      default:
        return { name: role.toUpperCase(), color: 'var(--foreground)', bg: 'var(--surface-control)', icon: BrainCircuit, tag: 'Persona' };
    }
  };

  const getStatusBadge = (status: DAGNode['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          className: 'status-pill success'
        };
      case 'running':
        return {
          label: 'In Progress',
          icon: Loader2,
          className: 'status-pill',
          spin: true,
          style: { background: 'var(--brand-soft)', color: 'var(--brand-dark)', borderColor: 'var(--border)' }
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: AlertCircle,
          className: 'status-pill danger'
        };
      case 'skipped':
        return {
          label: 'Skipped',
          icon: AlertCircle,
          className: 'status-pill neutral'
        };
      default:
        return {
          label: 'Queued',
          icon: Clock,
          className: 'status-pill neutral'
        };
    }
  };

  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const progressPercent = Math.round((completedCount / Math.max(nodes.length, 1)) * 100);

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      {/* Header with Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-control)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand)'
          }}>
            <Sparkles size={15} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
              Execution DAG Graph
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
              {completedCount} of {nodes.length} subagent tasks completed
            </span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '120px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--brand)',
              transition: 'width 250ms ease'
            }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Nodes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
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
                if (onSelectNode) onSelectNode(node);
                setInspectNode(node);
              }}
              className={`card-hoverable ${isRunning ? 'pulsing-node' : ''}`}
              style={{
                position: 'relative',
                padding: '16px',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--brand)' : isRunning ? 'var(--brand)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--surface-muted)' : 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Agent Badge & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      background: meta.bg,
                      color: meta.color,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <AgentIcon size={15} />
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {meta.name}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--foreground-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                        {meta.tag}
                      </div>
                    </div>
                  </div>

                  <span className={status.className} style={status.style}>
                    <StatusIcon size={11} className={status.spin ? 'animate-spin' : ''} />
                    {status.label}
                  </span>
                </div>

                {/* Title & Description */}
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px', lineHeight: '1.4' }}>
                  {node.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--foreground-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                  {node.description}
                </p>
              </div>

              {/* Node Footer */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}>
                {node.dependencies && node.dependencies.length > 0 ? (
                  <div style={{ color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowRight size={11} />
                    <span>Awaits: <strong>{node.dependencies.length} parent</strong></span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--brand)', fontWeight: 500 }}>
                    Root Task
                  </span>
                )}

                {node.output_data ? (
                  <span style={{ color: 'var(--brand-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Deliverable <ExternalLink size={10} />
                  </span>
                ) : (
                  <span style={{ color: 'var(--foreground-muted)' }}>
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Node Dialog */}
      {inspectNode && (
        <div className="dialog-backdrop" onClick={() => setInspectNode(null)}>
          <div 
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px', padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Task Inspector
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>
                  {inspectNode.title}
                </h3>
              </div>
              <button 
                onClick={() => setInspectNode(null)} 
                className="button-ghost"
                style={{ width: '28px', height: '28px', padding: 0 }}
                aria-label="Close inspector modal"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              backgroundColor: 'var(--background-alternative)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--foreground-secondary)', marginBottom: '8px' }}>
                <span><strong>Role:</strong> {inspectNode.agent_role.toUpperCase()}</span>
                <span><strong>Status:</strong> {inspectNode.status.toUpperCase()}</span>
              </div>

              {inspectNode.output_data && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                    Output Data:
                  </div>
                  <pre className="code-block" style={{ maxHeight: '240px', fontSize: '12px' }}>
                    {JSON.stringify(inspectNode.output_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectNode(null)}
                className="button-secondary"
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
