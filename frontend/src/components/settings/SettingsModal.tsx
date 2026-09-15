import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Check, Cpu, Key, Layers } from 'lucide-react';
import type { SettingsData } from '../../types';

interface SettingsModalProps {
  apiBase: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ apiBase, isOpen, onClose }) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch(`${apiBase}/api/settings`)
        .then(res => res.json())
        .then(data => {
          setSettings(data);
          setOllamaUrl(data.ollama_base_url || 'http://localhost:11434');
        })
        .catch(console.error);
    }
  }, [isOpen, apiBase]);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ollama_base_url: ollamaUrl
    };
    if (openaiKey) payload.openai_api_key = openaiKey;
    if (anthropicKey) payload.anthropic_api_key = anthropicKey;
    if (geminiKey) {
      if (geminiKey.includes(',')) {
        payload.gemini_api_keys = geminiKey.split(',').map(k => k.trim()).filter(Boolean);
        payload.gemini_api_key = payload.gemini_api_keys[0];
      } else {
        payload.gemini_api_key = geminiKey.trim();
      }
    }
    if (groqKey) payload.groq_api_key = groqKey.trim();

    await fetch(`${apiBase}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div 
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
              <SettingsIcon size={15} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
              Multi-Key & Multi-Agent Parallel Settings
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="button-ghost"
            style={{ width: '28px', height: '28px', padding: 0 }}
            aria-label="Close settings dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{
          backgroundColor: 'var(--background-alternative)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--foreground-secondary)',
          lineHeight: '1.5'
        }}>
          💡 <strong>Multi-Key Simultaneous Execution:</strong> Polyman divides project tasks across specialized agents using separate API keys running concurrently. Enter multiple Gemini keys separated by commas to scale parallel throughput and prevent rate limits.
        </div>

        {/* Active Multi-Key Distribution Panel */}
        {settings?.gemini_agent_keys && Object.keys(settings.gemini_agent_keys).length > 0 && (
          <div style={{
            backgroundColor: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
              <Layers size={13} style={{ color: 'var(--brand)' }} />
              <span>Active Agent Key Partitioning</span>
              {settings.gemini_pool_count && settings.gemini_pool_count > 1 && (
                <span className="status-pill success" style={{ fontSize: '10px', marginLeft: 'auto' }}>
                  {settings.gemini_pool_count} Active Keys in Pool
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
              {Object.entries(settings.gemini_agent_keys).map(([role, maskedKey]) => (
                <div key={role} style={{
                  backgroundColor: 'var(--surface)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)', textTransform: 'capitalize' }}>
                    {role}
                  </div>
                  <div style={{ color: 'var(--foreground-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    🔑 {maskedKey || 'pool-rotated'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Gemini Multi-Key */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} style={{ color: 'var(--brand)' }} />
                <span>Google Gemini API Key(s)</span>
              </label>
              {settings?.gemini_configured && (
                <span className="status-pill success" style={{ fontSize: '10px' }}>
                  ✓ {settings.gemini_pool_count ? `${settings.gemini_pool_count} Active` : 'Configured'} ({settings.keys_masked?.gemini})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="AQ.Ab8... (or comma-separated keys for pool: key1, key2)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '3px' }}>
              Separate multiple Gemini keys with commas to distribute them across concurrent subagents.
            </div>
          </div>

          {/* Groq */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} style={{ color: 'var(--warning)' }} />
                <span>Groq API Key (Ultra-Fast Inference)</span>
              </label>
              {settings?.groq_configured && (
                <span className="status-pill success" style={{ fontSize: '10px' }}>
                  ✓ Configured ({settings.keys_masked?.groq || 'Active'})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Anthropic */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                Anthropic Claude API Key
              </label>
              {settings?.anthropic_configured && (
                <span className="status-pill success" style={{ fontSize: '10px' }}>
                  ✓ Configured ({settings.keys_masked?.anthropic})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="sk-ant-api03-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* OpenAI */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                OpenAI API Key
              </label>
              {settings?.openai_configured && (
                <span className="status-pill success" style={{ fontSize: '10px' }}>
                  ✓ Configured ({settings.keys_masked?.openai})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Ollama Base URL */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
              Ollama Local API Endpoint
            </label>
            <input
              type="text"
              placeholder="http://localhost:11434"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="input"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
            >
              {saved && <Check size={14} />}
              <span>{saved ? 'Settings Saved' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
