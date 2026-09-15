import React, { useState, useEffect } from 'react';
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
  Sparkles
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
  const formColor = '#7c3aed';
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPrompt, setFormPrompt] = useState<string>('');
  const [formProvider, setFormProvider] = useState<string>('gemini');
  const [formModel, setFormModel] = useState<string>('gemini-2.0-flash');

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${apiBase}/api/agents`);
      const data = await res.json();
      setAgents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [apiBase]);

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
      // Direct prompt simulation
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
      // Trigger execution for serverless environments (Vercel)
      fetch(`${apiBase}/api/runs/${data.run_id}/execute`, { method: 'POST' }).catch(() => {});
    } catch (e) {
      setTestResponse(`Execution error: ${e}`);
    } finally {
      setTestLoading(false);
    }
  };

  const getAgentMeta = (role: string) => {
    switch (role.toLowerCase()) {
      case 'architect': return { icon: Layers, gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', color: '#0ea5e9' };
      case 'sde': return { icon: Code2, gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: '#10b981' };
      case 'lawyer': return { icon: Scale, gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', color: '#f59e0b' };
      case 'auditor': return { icon: ShieldCheck, gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', color: '#ef4444' };
      case 'accountant': return { icon: Calculator, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', color: '#8b5cf6' };
      case 'orchestrator': return { icon: BrainCircuit, gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: '#6366f1' };
      default: return { icon: Bot, gradient: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)', color: '#7c3aed' };
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Specialized Subagent Roster
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Domain-trained autonomous personas equipped with targeted directives, toolchains, and LLM backends.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent-gradient)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}
        >
          <Plus size={16} />
          Create Custom Subagent
        </button>
      </div>

      {/* Grid of Agents */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {agents.map((agent) => {
          const meta = getAgentMeta(agent.role);
          const Icon = meta.icon;

          return (
            <div
              key={agent.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                {/* Agent Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: meta.gradient,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 3px 10px ${meta.color}40`
                    }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {agent.name}
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        @{agent.role}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: agent.is_builtin ? 'var(--bg-tertiary)' : 'var(--accent-subtle)',
                    color: agent.is_builtin ? 'var(--text-secondary)' : 'var(--accent-primary)',
                    border: '1px solid var(--border-color)',
                    textTransform: 'uppercase'
                  }}>
                    {agent.is_builtin ? 'Core Agent' : 'Custom'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                  {agent.description}
                </p>

                {/* System Prompt snippet */}
                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Core Directive
                  </span>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
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
                paddingTop: '14px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Cpu size={14} color="var(--accent-primary)" />
                  <span>{agent.default_provider.toUpperCase()}: <strong style={{ color: 'var(--text-secondary)' }}>{agent.default_model}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setTestingAgent(agent);
                      setTestInput(`Perform initial domain assessment for project tasks.`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)'
                    }}
                  >
                    <MessageSquare size={12} />
                    Test
                  </button>

                  {!agent.is_builtin && (
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      style={{ color: 'var(--danger)', padding: '4px' }}
                      title="Delete custom agent"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Agent Drawer */}
      {testingAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            width: '100%',
            maxWidth: '540px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Test Subagent: {testingAgent.name}
                </h3>
              </div>
              <button onClick={() => setTestingAgent(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Prompt Input
              </label>
              <textarea
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  resize: 'none'
                }}
              />
            </div>

            {testResponse && (
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '14px',
                lineHeight: '1.5'
              }}>
                {testResponse}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setTestingAgent(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}
              >
                Close
              </button>
              <button
                onClick={runAgentTest}
                disabled={testLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'var(--accent-gradient)',
                  color: '#fff'
                }}
              >
                {testLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Trigger Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Create Custom Specialized Subagent
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Role Identifier (e.g. devops, copywriter, tax_auditor)
                </label>
                <input
                  type="text"
                  required
                  placeholder="qa_specialist"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Agent Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="QA Automation Specialist"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Validates edge cases, generates Playwright tests, and runs benchmark assertions."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  System Prompt Directive
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="You are a specialized QA engineer. You review code diffs and generate unit/integration test cases..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    LLM Provider
                  </label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="ollama">Ollama (Local)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'var(--accent-gradient)',
                    color: '#fff'
                  }}
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
