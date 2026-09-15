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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Multi-Key & Multi-Agent Parallel Settings
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.4'
        }}>
          💡 <strong>Multi-Key Simultaneous Execution:</strong> Polyman divides project tasks across specialized agents using separate API keys running concurrently. Enter multiple Gemini keys separated by commas to scale parallel throughput and prevent rate limits.
        </div>

        {/* Active Multi-Key Distribution Panel */}
        {settings?.gemini_agent_keys && Object.keys(settings.gemini_agent_keys).length > 0 && (
          <div style={{
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              <Layers size={14} />
              <span>Active Multi-Key Agent Partitioning</span>
              {settings.gemini_pool_count && settings.gemini_pool_count > 1 && (
                <span style={{
                  fontSize: '10px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: 'auto'
                }}>
                  {settings.gemini_pool_count} Active Keys in Pool
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {Object.entries(settings.gemini_agent_keys).map(([role, maskedKey]) => (
                <div key={role} style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {role}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'monospace' }}>
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
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} color="var(--accent-primary)" />
                Google Gemini API Key(s)
              </label>
              {settings?.gemini_configured && (
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ {settings.gemini_pool_count ? `${settings.gemini_pool_count} Keys Active` : 'Configured'} ({settings.keys_masked.gemini})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="AQ.Ab8... (or comma-separated keys for pool: key1, key2)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
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
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Separate multiple Gemini keys with commas to distribute them across concurrent agents.
            </div>
          </div>

          {/* Groq */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} color="#f59e0b" />
                Groq API Key (Ultra-Fast Inference)
              </label>
              {settings?.groq_configured && (
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Configured ({settings.keys_masked?.groq || 'Active'})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
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

          {/* Anthropic */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Anthropic Claude API Key
              </label>
              {settings?.anthropic_configured && (
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Configured ({settings.keys_masked.anthropic})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="sk-ant-api03-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
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

          {/* OpenAI */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                OpenAI API Key
              </label>
              {settings?.openai_configured && (
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Configured ({settings.keys_masked.openai})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
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

          {/* Ollama Base URL */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Ollama Local API Endpoint
            </label>
            <input
              type="text"
              placeholder="http://localhost:11434"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {saved ? <Check size={14} /> : null}
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
