import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Check } from 'lucide-react';
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
    if (geminiKey) payload.gemini_api_key = geminiKey;

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
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        maxWidth: '540px',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              LLM Providers & Engine Settings
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
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
          💡 <strong>Multi-Provider BYOK:</strong> Enter keys to connect live AI models (OpenAI, Anthropic Claude, Google Gemini, Ollama). If keys are omitted, Polyman's intelligent offline domain generator runs automatically so you can test seamlessly without costs.
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Gemini */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Google Gemini API Key
              </label>
              {settings?.gemini_configured && (
                <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Configured ({settings.keys_masked.gemini})
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
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
                color: 'var(--text-secondary)'
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
                color: '#fff'
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
