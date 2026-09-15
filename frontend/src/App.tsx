import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Send, 
  Sparkles, 
  Clock,
  Layers,
  Zap,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { DAGVisualizer } from './components/dag/DAGVisualizer';
import { LiveLogViewer } from './components/terminal/LiveLogViewer';
import { WorkspaceExplorer } from './components/workspace/WorkspaceExplorer';
import { ReportsViewer } from './components/reports/ReportsViewer';
import { AgentRoster } from './components/agents/AgentRoster';
import { SettingsModal } from './components/settings/SettingsModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { DAGNode, AgentLog, Run } from './types';

const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

export function App() {
  // Light-first developer-product interface by default
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('polyman-theme') as 'light' | 'dark') || 'light';
  });
  const [activeTab, setActiveTab] = useState<string>('mission');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEngineConnected, setIsEngineConnected] = useState<boolean>(false);
  const [workspacePath, setWorkspacePath] = useState<string>('');

  // Task Input & Execution State
  const [taskPrompt, setTaskPrompt] = useState<string>('');
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [dagNodes, setDagNodes] = useState<DAGNode[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('polyman-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchRecentRuns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/runs?limit=5`);
      if (res.ok) {
        const data = await res.json();
        setRecentRuns(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Health check and initial data
  useEffect(() => {
    const checkEngine = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) {
          const data = await res.json();
          setIsEngineConnected(true);
          setWorkspacePath(data.workspace || '');
        }
      } catch {
        setIsEngineConnected(false);
      }
    };

    checkEngine();
    fetchRecentRuns();
    const interval = setInterval(checkEngine, 10000);
    return () => clearInterval(interval);
  }, [fetchRecentRuns]);

  // Connect Realtime (Supabase Realtime in production, WebSocket in local dev)
  useEffect(() => {
    if (!activeRun?.id) return;

    // 1. If Supabase is configured, use Supabase Realtime Channels
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`run-channel-${activeRun.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'agent_logs', filter: `run_id=eq.${activeRun.id}` },
          (payload) => {
            const row = payload.new as any;
            setLogs(prev => [
              ...prev,
              {
                id: row.id,
                run_id: row.run_id,
                node_id: row.node_id,
                agent_role: row.agent_role,
                event_type: row.event_type,
                content: row.content,
                created_at: row.created_at
              }
            ]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'dag_nodes', filter: `run_id=eq.${activeRun.id}` },
          (payload) => {
            const row = payload.new as any;
            setDagNodes(prev => prev.map(n => n.id === row.id ? {
              ...n,
              status: row.status,
              output_data: typeof row.output_data === 'string' ? JSON.parse(row.output_data) : row.output_data
            } : n));
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'runs', filter: `id=eq.${activeRun.id}` },
          (payload) => {
            const row = payload.new as any;
            if (row.status === 'completed' || row.status === 'failed' || row.status === 'cancelled') {
              setIsRunning(false);
              fetchRecentRuns();
            } else if (row.status === 'paused') {
              setIsPaused(true);
            } else if (row.status === 'running') {
              setIsPaused(false);
            }
          }
        )
        .subscribe();

      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/runs/${activeRun.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.nodes) setDagNodes(data.nodes);
            if (data.logs) setLogs(data.logs);
            if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
              setIsRunning(false);
              clearInterval(pollInterval);
              fetchRecentRuns();
            }
          }
        } catch {}
      }, 4000);

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
        clearInterval(pollInterval);
      };
    }

    // 2. Local fallback WebSocket
    const wsUrl = API_BASE.replace(/^http/, 'ws') + `/api/ws/runs/${activeRun.id}`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;

          if (type === 'DAG_NODE_UPDATE') {
            setDagNodes(prev => prev.map(n => n.id === data.node_id ? {
              ...n,
              status: data.status,
              output_data: data.output_data
            } : n));
          } else if (type === 'AGENT_LOG') {
            setLogs(prev => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                run_id: activeRun.id,
                node_id: data.node_id,
                agent_role: data.agent_role,
                event_type: data.event_type,
                content: data.content,
                created_at: new Date().toISOString()
              }
            ]);
          } else if (type === 'RUN_COMPLETED') {
            setIsRunning(false);
            fetchRecentRuns();
          } else if (type === 'RUN_PAUSED') {
            setIsPaused(true);
          } else if (type === 'RUN_RESUMED') {
            setIsPaused(false);
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };
    } catch (e) {
      console.warn('Could not establish WebSocket connection, fallback polling enabled:', e);
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/runs/${activeRun.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.nodes) setDagNodes(data.nodes);
          if (data.logs) setLogs(data.logs);
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            setIsRunning(false);
            clearInterval(pollInterval);
            fetchRecentRuns();
          }
        }
      } catch {}
    }, 3000);

    return () => {
      if (ws) ws.close();
      clearInterval(pollInterval);
    };
  }, [activeRun?.id, fetchRecentRuns]);

  const handleStartMission = async () => {
    if (!taskPrompt.trim() || isRunning) return;

    setIsRunning(true);
    setIsPaused(false);
    setLogs([]);
    setDagNodes([]);

    try {
      const res = await fetch(`${API_BASE}/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_prompt: taskPrompt
        })
      });

      if (!res.ok) throw new Error('Failed to start run');
      const data = await res.json();
      setActiveRun({
        id: data.run_id,
        task_prompt: taskPrompt,
        status: 'running',
        summary: data.summary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setDagNodes(data.nodes || []);

      const triggerExecution = async (runId: string, depth = 0, maxDepth = 10) => {
        try {
          const execRes = await fetch(`${API_BASE}/api/runs/${runId}/execute`, { method: 'POST' });
          if (execRes.ok) {
            const execData = await execRes.json();
            if (execData.continue && depth < maxDepth) {
              triggerExecution(runId, depth + 1, maxDepth);
            }
          }
        } catch (err) {
          console.warn('Execution worker notification:', err);
        }
      };
      triggerExecution(data.run_id);
    } catch (e) {
      console.error(e);
      setIsRunning(false);
    }
  };

  const handlePauseResume = async () => {
    if (!activeRun) return;
    const action = isPaused ? 'resume' : 'pause';
    await fetch(`${API_BASE}/api/runs/${activeRun.id}/${action}`, { method: 'POST' });
    setIsPaused(!isPaused);
  };

  const handleAbort = async () => {
    if (!activeRun) return;
    await fetch(`${API_BASE}/api/runs/${activeRun.id}/cancel`, { method: 'POST' });
    setIsRunning(false);
    setIsPaused(false);
  };

  const loadPreviousRun = async (runId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveRun(data);
        setDagNodes(data.nodes || []);
        setLogs(data.logs || []);
        setTaskPrompt(data.task_prompt);
        setIsRunning(data.status === 'running');
        setActiveTab('mission');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const suggestedScenarios = [
    { title: "SaaS Microservice & MIT License", prompt: "Build a secure microservice API with JWT authentication, budget estimation, and MIT license compliance" },
    { title: "OWASP Vulnerability Audit", prompt: "Audit this workspace for OWASP Top 10 vulnerabilities and dependency licensing risks" },
    { title: "Cloud FinOps OpEx Model", prompt: "Design and scaffold an automated cloud infrastructure pipeline with FinOps OpEx forecast" },
    { title: "Full Architecture Blueprint & ADR", prompt: "Create a modular React/Node feature with unit tests and Architecture Decision Record" }
  ];

  const completedCount = dagNodes.filter(n => n.status === 'completed').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        workspacePath={workspacePath}
        isEngineConnected={isEngineConnected}
      />

      <main style={{ flex: 1, paddingBottom: '48px' }}>
        {activeTab === 'mission' && (
          <div className="container" style={{ paddingTop: '32px' }}>
            {/* Supabase-style Editorial Hero Area */}
            <div style={{ marginBottom: '28px' }}>
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
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                marginBottom: '12px'
              }}>
                <span>Autonomous Engineering System</span>
                <ArrowRight size={11} />
              </div>

              <h1 className="hero-title" style={{ marginBottom: '10px' }}>
                Multi-agent engineering <span className="accent">orchestration</span>
              </h1>

              <p className="body-copy" style={{ maxWidth: '640px' }}>
                Decompose complex engineering objectives into a concurrent DAG pipeline. Specialized AI personas build code, audit vulnerabilities, verify licenses, and model FinOps costs simultaneously.
              </p>
            </div>

            {/* Connected Technical Stat Grid */}
            <div className="connected-grid" style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              marginBottom: '24px'
            }}>
              <div className="connected-grid-cell" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-control)',
                  border: '1px solid var(--border)',
                  color: 'var(--brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Subagents
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                    6 Personas
                  </div>
                </div>
              </div>

              <div className="connected-grid-cell" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-control)',
                  border: '1px solid var(--border)',
                  color: 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    DAG Pipeline
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                    {dagNodes.length} Tasks
                  </div>
                </div>
              </div>

              <div className="connected-grid-cell" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-control)',
                  border: '1px solid var(--border)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Deliverables
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                    {completedCount} / {dagNodes.length} Done
                  </div>
                </div>
              </div>

              <div className="connected-grid-cell" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-control)',
                  border: '1px solid var(--border)',
                  color: 'var(--brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Activity size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Telemetry Stream
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
                    {logs.length} Points
                  </div>
                </div>
              </div>
            </div>

            {/* Task Prompt Launchpad */}
            <div className="card" style={{ padding: '20px 22px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: 'var(--brand)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                    Autonomous Mission Launchpad
                  </span>
                </div>

                {activeRun && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={handlePauseResume}
                      disabled={!isRunning}
                      className="button-secondary"
                      style={{ height: '30px', padding: '0 10px', fontSize: '12px' }}
                    >
                      {isPaused ? <Play size={12} /> : <Pause size={12} />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>

                    <button
                      onClick={handleAbort}
                      disabled={!isRunning}
                      className="button-ghost"
                      style={{
                        height: '30px',
                        padding: '0 10px',
                        fontSize: '12px',
                        color: 'var(--danger)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <Square size={12} />
                      Abort
                    </button>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={3}
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="State your engineering goal (e.g. 'Build an encrypted user auth service with rate limiter, compliance terms, and cost estimation')..."
                  disabled={isRunning}
                  className="textarea"
                  style={{
                    paddingRight: '140px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleStartMission}
                  disabled={isRunning || !taskPrompt.trim()}
                  className="button-primary"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    bottom: '12px',
                    minHeight: '34px',
                    padding: '6px 14px',
                    fontSize: '13px'
                  }}
                >
                  <Send size={13} />
                  {isRunning ? 'Synthesizing...' : 'Launch Agents'}
                </button>
              </div>

              {/* Scenario chips */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--foreground-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Scenarios:
                </span>
                {suggestedScenarios.map((sc, i) => (
                  <button
                    key={i}
                    onClick={() => setTaskPrompt(sc.prompt)}
                    disabled={isRunning}
                    className="button-ghost"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--surface-control)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground-secondary)'
                    }}
                  >
                    {sc.title}
                  </button>
                ))}
              </div>

              {/* Recent Runs bar */}
              {recentRuns.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '12px',
                  color: 'var(--foreground-muted)'
                }}>
                  <Clock size={12} />
                  <span style={{ fontWeight: 500 }}>Recent Executions:</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {recentRuns.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => loadPreviousRun(r.id)}
                        className="button-ghost"
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--brand-dark)',
                          backgroundColor: 'var(--brand-soft)',
                          border: '1px solid var(--border)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        {r.task_prompt.length > 40 ? `${r.task_prompt.slice(0, 37)}...` : r.task_prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Mission Grid: DAG Canvas + Live Terminal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <DAGVisualizer nodes={dagNodes} />
              <LiveLogViewer logs={logs} />
            </div>
          </div>
        )}

        {activeTab === 'workspace' && (
          <WorkspaceExplorer apiBase={API_BASE} />
        )}

        {activeTab === 'reports' && (
          <ReportsViewer apiBase={API_BASE} />
        )}

        {activeTab === 'agents' && (
          <AgentRoster apiBase={API_BASE} />
        )}
      </main>

      <SettingsModal
        apiBase={API_BASE}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
