export interface Agent {
  id: string;
  role: string;
  name: string;
  avatar: string;
  color: string;
  description: string;
  system_prompt: string;
  default_provider: string;
  default_model: string;
  tools: string[];
  is_builtin: boolean;
}

export interface DAGNode {
  id: string;
  run_id?: string;
  agent_role: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  dependencies: string[];
  input_data?: any;
  output_data?: any;
  started_at?: string;
  completed_at?: string;
}

export interface AgentLog {
  id: number;
  run_id: string;
  node_id?: string;
  agent_role: string;
  event_type: string;
  content: string;
  created_at: string;
}

export interface Run {
  id: string;
  project_id?: string;
  task_prompt: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  summary?: string;
  created_at: string;
  updated_at: string;
  nodes?: DAGNode[];
  logs?: AgentLog[];
}

export interface ProjectFile {
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface ReportItem {
  category: 'legal' | 'audit' | 'financial' | 'architecture';
  filename: string;
  rel_path: string;
  content: string;
}

export interface SettingsData {
  workspace_dir: string;
  openai_configured: boolean;
  anthropic_configured: boolean;
  gemini_configured: boolean;
  groq_configured?: boolean;
  ollama_base_url: string;
  keys_masked: {
    openai: string;
    anthropic: string;
    gemini: string;
    groq?: string;
  };
  gemini_pool_count?: number;
  gemini_pool_masked?: string[];
  gemini_agent_keys?: Record<string, string>;
  agent_models: Record<string, { provider: string; model: string }>;
}
