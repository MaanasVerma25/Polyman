import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  BrainCircuit, 
  Layers, 
  Code2, 
  Scale, 
  ShieldCheck, 
  Calculator, 
  Trash2, 
  Bot, 
  Cpu, 
  X,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { Agent } from '../../types';

interface AgentRosterProps {
  apiBase: string;
}

export const AgentRoster: React.FC<AgentRosterProps> = ({ apiBase }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Test Agent Chat Drawer
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [testInput, setTestInput] = useState<string>('');
  const [testResponse, setTestResponse] = useState<string>('');
  const [testLoading, setTestLoading] = useState<boolean>(false);

  // New Agent Form
  const [formRole, setFormRole] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const formAvatar = 'Bot';
  const formColor = '#3ecf8e';
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrompt, setFormPrompt] = useState<string>('');
  const [formProvider, setFormProvider] = useState<string>('gemini');
  const [formModel, setFormModel] = useState<string>('gemini-2.0-flash');

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/agents`);
      const data = await res.json();
      setAgents(data);
    } catch (e) {
      console.error(e);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Keyboard accessibility for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (testingAgent) setTestingAgent(null);
        if (showModal) setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testingAgent, showModal]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRole || !formName || !formPrompt) return;

    try {
      const res = await fetch(`${apiBase}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formRole.toLowerCase().replace(/\s+/g, '_'),
          name: formName,
          avatar: formAvatar,
          color: formColor,
          description: formDescription,
          system_prompt: formPrompt,
          default_provider: formProvider,
          default_model: formModel,
          tools: ['file_reader', 'doc_writer'],
          is_builtin: false
        })
      });

      if (res.ok) {
        setShowModal(false);
        setFormRole('');
        setFormName('');
        setFormDescription('');
        setFormPrompt('');
        fetchAgents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (confirm('Delete this custom agent?')) {
      await fetch(`${apiBase}/api/agents/${id}`, { method: 'DELETE' });
      fetchAgents();
    }
  };

  const runAgentTest = async () => {
    if (!testInput.trim() || !testingAgent || testLoading) return;
    setTestLoading(true);
    setTestResponse('');

    try {
      const res = await fetch(`${apiBase}/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_prompt: `[DIRECT AGENT TEST FOR @${testingAgent.role}]: ${testInput}`,
          selected_agents: [testingAgent.role]
        })
      });
      const data = await res.json();
      setTestResponse(`Test mission launched successfully with run ID: ${data.run_id}. Head to Mission Control to observe the real-time execution!`);
      fetch(`${apiBase}/api/runs/${data.run_id}/execute`, { method: 'POST' }).catch(() => {});
    } catch (e) {
      setTestResponse(`Execution error: ${e}`);
    } finally {
      setTestLoading(false);
    }
  };

  const getAgentMeta = (role: string) => {
    switch (role.toLowerCase()) {
      case 'architect': return { icon: Layers, color: 'var(--info)', bg: 'var(--info-soft)' };
      case 'sde': return { icon: Code2, color: 'var(--brand)', bg: 'var(--brand-soft)' };
      case 'lawyer': return { icon: Scale, color: 'var(--warning)', bg: 'var(--warning-soft)' };
      case 'auditor': return { icon: ShieldCheck, color: 'var(--danger)', bg: 'var(--danger-soft)' };
      case 'accountant': return { icon: Calculator, color: 'var(--purple)', bg: 'var(--purple-bg)' };
      case 'orchestrator': return { icon: BrainCircuit, color: 'var(--foreground)', bg: 'var(--surface-control)' };
      default: return { icon: Bot, color: 'var(--brand)', bg: 'var(--brand-soft)' };
    }
  };

  return (
    <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
      {/* Editorial Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--brand-dark)',
            backgroundColor: 'var(--brand-soft)',
            border: '1px solid var(--border)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            marginBottom: '8px'
          }}>
            <span>Domain-Specialized Workforce</span>
            <ArrowRight size={11} />
          </div>

          <h2 className="section-title" style={{ marginBottom: '6px' }}>
            Specialized Subagent Roster
          </h2>
          <p className="body-copy" style={{ maxWidth: '600px' }}>
            Domain-trained autonomous personas equipped with targeted directives, toolchains, and LLM backends.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="button-primary"
        >
          <Plus size={15} />
          <span>Create Custom Subagent</span>
        </button>
      </div>

      {/* Grid of Agents */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px'
      }}>
        {agents.map((agent) => {
          const meta = getAgentMeta(agent.role);
          const Icon = meta.icon;

          return (
            <div
              key={agent.id}
              className="card-hoverable"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Agent Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      background: meta.bg,
                      color: meta.color,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {agent.name}
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)' }}>
                        @{agent.role}
                      </span>
                    </div>
                  </div>

                  <span className={agent.is_builtin ? "status-pill neutral" : "status-pill success"} style={{ fontSize: '10px' }}>
                    {agent.is_builtin ? 'Core Agent' : 'Custom'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                  {agent.description}
                </p>

                {/* System Prompt snippet */}
                <div style={{
                  backgroundColor: 'var(--background-alternative)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  marginBottom: '14px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Core Directive
                  </div>
                  <p style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--foreground-secondary)',
                    lineHeight: '1.5',
                    marginTop: '4px',
                    maxHeight: '44px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    "{agent.system_prompt}"
                  </p>
                </div>
              </div>

              {/* Footer: Model & Test Action */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)' }}>
                  <Cpu size={13} style={{ color: 'var(--brand)' }} />
                  <span>{agent.default_provider.toUpperCase()}: <strong style={{ color: 'var(--foreground)' }}>{agent.default_model}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => {
                      setTestingAgent(agent);
                      setTestInput(`Perform initial domain assessment for project tasks.`);
                    }}
                    className="button-ghost"
                    style={{
                      height: '28px',
                      padding: '0 8px',
                      fontSize: '11px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)'
                    }}
                  >
                    <MessageSquare size={11} />
                    <span>Test</span>
                  </button>

                  {!agent.is_builtin && (
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="button-ghost"
                      style={{ height: '28px', width: '28px', padding: 0, color: 'var(--danger)' }}
                      title="Delete custom agent"
                      aria-label={`Delete ${agent.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Agent Drawer / Dialog */}
      {testingAgent && (
        <div className="dialog-backdrop" onClick={() => setTestingAgent(null)}>
          <div 
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--brand)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Test Subagent: {testingAgent.name}
                </h3>
              </div>
              <button 
                onClick={() => setTestingAgent(null)} 
                className="button-ghost"
                style={{ width: '28px', height: '28px', padding: 0 }}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '6px' }}>
                Test Prompt Directive
              </label>
              <textarea
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="textarea"
                style={{ fontSize: '13px' }}
              />
            </div>

            {testResponse && (
              <div style={{
                backgroundColor: 'var(--background-alternative)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--foreground)',
                marginBottom: '14px',
                lineHeight: '1.5'
              }}>
                {testResponse}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setTestingAgent(null)}
                className="button-secondary"
              >
                Close
              </button>
              <button
                onClick={runAgentTest}
                disabled={testLoading}
                className="button-primary"
              >
                {testLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Trigger Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showModal && (
        <div className="dialog-backdrop" onClick={() => setShowModal(false)}>
          <div 
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>
                Create Custom Specialized Subagent
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="button-ghost"
                style={{ width: '28px', height: '28px', padding: 0 }}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '4px' }}>
                  Role Identifier (e.g. devops, copywriter, tax_auditor)
                </label>
                <input
                  type="text"
                  required
                  placeholder="qa_specialist"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '4px' }}>
                  Agent Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="QA Automation Specialist"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Validates edge cases, generates Playwright tests, and runs benchmark assertions."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '4px' }}>
                  System Prompt Directive
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="You are a specialized QA engineer. You review code diffs and generate unit/integration test cases..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '4px' }}>
                    LLM Provider
                  </label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    className="select"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="ollama">Ollama (Local)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button-primary"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
