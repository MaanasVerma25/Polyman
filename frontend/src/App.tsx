import { useState, useEffect, useRef } from 'react';
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
  Activity
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('polyman-theme') as 'light' | 'dark') || 'dark';
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
  }, []);

  const fetchRecentRuns = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/runs?limit=5`);
      if (res.ok) {
        const data = await res.json();
        setRecentRuns(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

      // Poll periodically as safety net to refresh full status
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

      const sb = supabase;
      return () => {
        if (sb) {
          sb.removeChannel(channel);
        }
        clearInterval(pollInterval);
      };
    }

    // 2. Fallback: Local dev WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = API_BASE ? API_BASE.replace(/^https?:\/\//, '') : window.location.host;
    const wsUrl = `${protocol}//${host}/api/runs/ws/${activeRun.id}`;
    
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, data } = msg;

          if (type === 'DAG_CREATED') {
            setDagNodes(data.nodes || []);
          } else if (type === 'NODE_STARTED') {
            setDagNodes(prev => prev.map(n => n.id === data.node_id ? { ...n, status: 'running' } : n));
          } else if (type === 'NODE_COMPLETED') {
            setDagNodes(prev => prev.map(n => n.id === data.node_id ? { ...n, status: 'completed', output_data: data.output } : n));
          } else if (type === 'NODE_FAILED') {
            setDagNodes(prev => prev.map(n => n.id === data.node_id ? { ...n, status: 'failed' } : n));
          } else if (type.startsWith('AGENT_')) {
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

    // Safety polling interval
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
  }, [activeRun?.id]);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        workspacePath={workspacePath}
        isEngineConnected={isEngineConnected}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'mission' && (
          <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '28px' }}>
            {/* Stat Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Active Subagents
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    6 Domain Personas
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--info-bg)',
                  color: 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    DAG Nodes
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dagNodes.length} Pipeline Tasks
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Completed
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dagNodes.filter(n => n.status === 'completed').length} / {dagNodes.length} Nodes
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--purple-bg)',
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Activity size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Live Event Stream
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {logs.length} Telemetry Points
                  </div>
                </div>
              </div>
            </div>

            {/* Task Prompt Box with Glowing Border Accent */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-md)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--accent-primary)" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Autonomous Mission Launchpad
                  </span>
                </div>

                {activeRun && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={handlePauseResume}
                      disabled={!isRunning}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        opacity: !isRunning ? 0.5 : 1
                      }}
                    >
                      {isPaused ? <Play size={13} /> : <Pause size={13} />}
                      {isPaused ? 'Resume Mission' : 'Pause'}
                    </button>

                    <button
                      onClick={handleAbort}
                      disabled={!isRunning}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: 'var(--danger-bg)',
                        color: 'var(--danger)',
                        opacity: !isRunning ? 0.5 : 1
                      }}
                    >
                      <Square size={13} />
                      Abort
                    </button>
                  </div>
                )}
              </div>

              {/* Textarea */}
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={3}
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="State your engineering goal (e.g. 'Build an encrypted user auth service with rate limiter, compliance terms, and cost estimation')..."
                  disabled={isRunning}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    lineHeight: '1.6'
                  }}
                />
                <button
                  onClick={handleStartMission}
                  disabled={isRunning || !taskPrompt.trim()}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                    opacity: (isRunning || !taskPrompt.trim()) ? 0.6 : 1
                  }}
                >
                  <Send size={14} />
                  {isRunning ? 'Synthesizing DAG...' : 'Launch Agents'}
                </button>
              </div>

              {/* Scenario chips */}
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Curated Scenarios:
                </span>
                {suggestedScenarios.map((sc, i) => (
                  <button
                    key={i}
                    onClick={() => setTaskPrompt(sc.prompt)}
                    disabled={isRunning}
                    style={{
                      fontSize: '12px',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 500
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
                  gap: '10px',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: 'var(--text-muted)'
                }}>
                  <Clock size={13} />
                  <span style={{ fontWeight: 600 }}>Recent Executions:</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {recentRuns.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => loadPreviousRun(r.id)}
                        style={{
                          fontSize: '11px',
                          color: 'var(--accent-primary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--accent-subtle)'
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              {/* DAG Canvas */}
              <DAGVisualizer nodes={dagNodes} />

              {/* Streaming Live Logs */}
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
