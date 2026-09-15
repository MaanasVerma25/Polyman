import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  FileCode, 
  GitBranch, 
  RefreshCw, 
  Copy, 
  Check, 
  Search, 
  FileText 
} from 'lucide-react';
import type { ProjectFile } from '../../types';

interface WorkspaceExplorerProps {
  apiBase: string;
}

export const WorkspaceExplorer: React.FC<WorkspaceExplorerProps> = ({ apiBase }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [gitStatus, setGitStatus] = useState<string>('');
  const [gitDiff, setGitDiff] = useState<string>('');
  const [activeView, setActiveView] = useState<'editor' | 'diff'>('editor');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/projects/files`);
      const data = await res.json();
      setFiles(data.files || []);

      const gitRes = await fetch(`${apiBase}/api/projects/git`);
      const gitData = await gitRes.json();
      setGitStatus(gitData.status || '');
      setGitDiff(gitData.diff || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const loadFileContent = async (path: string) => {
    setSelectedFile(path);
    setActiveView('editor');
    try {
      const res = await fetch(`${apiBase}/api/projects/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setFileContent(data.content || '');
    } catch (e) {
      setFileContent(`Error loading file: ${e}`);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = files.filter(f => 
    !searchQuery.trim() || f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      height: 'calc(100vh - 100px)',
      gap: '16px',
      paddingTop: '20px',
      paddingBottom: '20px'
    }}>
      {/* Sidebar: File Tree & Git Controls */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-muted)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
            Code Studio Explorer
          </span>
          <button
            onClick={fetchFiles}
            className="button-ghost"
            style={{ width: '28px', height: '28px', padding: 0 }}
            title="Refresh Files"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* View Switcher: Files vs Git Diff */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border)', 
          padding: '4px', 
          gap: '4px', 
          backgroundColor: 'var(--background-alternative)' 
        }}>
          <button
            onClick={() => setActiveView('editor')}
            className="button-ghost"
            style={{
              flex: 1,
              height: '28px',
              padding: '0 8px',
              fontSize: '11px',
              fontWeight: activeView === 'editor' ? 600 : 500,
              backgroundColor: activeView === 'editor' ? 'var(--surface)' : 'transparent',
              color: activeView === 'editor' ? 'var(--foreground)' : 'var(--foreground-secondary)',
              border: activeView === 'editor' ? '1px solid var(--border)' : '1px solid transparent'
            }}
          >
            Files ({files.length})
          </button>
          <button
            onClick={() => setActiveView('diff')}
            className="button-ghost"
            style={{
              flex: 1,
              height: '28px',
              padding: '0 8px',
              fontSize: '11px',
              fontWeight: activeView === 'diff' ? 600 : 500,
              backgroundColor: activeView === 'diff' ? 'var(--surface)' : 'transparent',
              color: activeView === 'diff' ? 'var(--foreground)' : 'var(--foreground-secondary)',
              border: activeView === 'diff' ? '1px solid var(--border)' : '1px solid transparent'
            }}
          >
            <GitBranch size={12} />
            <span>Git Tree</span>
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            border: '1px solid var(--border)'
          }}>
            <Search size={12} style={{ color: 'var(--foreground-muted)' }} />
            <input
              type="text"
              placeholder="Filter paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--foreground)',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* File List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {filteredFiles.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '12px' }}>
              No matching files found.
            </div>
          ) : (
            filteredFiles.map((f) => {
              const isSelected = selectedFile === f.path;
              const isDir = f.type === 'directory';

              return (
                <div
                  key={f.path}
                  onClick={() => !isDir && loadFileContent(f.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: isSelected ? 'var(--brand-dark)' : 'var(--foreground)',
                    backgroundColor: isSelected ? 'var(--brand-soft)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--brand)' : '2px solid transparent',
                    cursor: isDir ? 'default' : 'pointer',
                    userSelect: 'none',
                    marginBottom: '1px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    {isDir ? (
                      <Folder size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    ) : f.path.endsWith('.md') ? (
                      <FileText size={14} style={{ color: 'var(--info)', flexShrink: 0 }} />
                    ) : (
                      <FileCode size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontWeight: isDir ? 600 : isSelected ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {f.path}
                    </span>
                  </div>

                  {!isDir && f.size !== undefined && (
                    <span style={{ fontSize: '10px', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)' }}>
                      {f.size > 1024 ? `${(f.size / 1024).toFixed(1)}k` : `${f.size}b`}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor / Content Preview */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={14} style={{ color: 'var(--brand)' }} />
            <span style={{
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}>
              {activeView === 'editor' ? (selectedFile || 'Select a file to inspect') : 'Git Working Tree Changes'}
            </span>
          </div>

          {activeView === 'editor' && selectedFile && (
            <button
              onClick={copyCode}
              className="button-ghost"
              style={{
                height: '28px',
                padding: '0 8px',
                fontSize: '11px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)'
              }}
            >
              {copied ? <Check size={12} style={{ color: 'var(--brand)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Content'}</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--background)' }}>
          {activeView === 'editor' ? (
            selectedFile ? (
              <div style={{ display: 'flex', minHeight: '100%' }}>
                {/* Line numbers column */}
                <div style={{
                  padding: '14px 10px',
                  backgroundColor: 'var(--background-subtle)',
                  borderRight: '1px solid var(--border)',
                  userSelect: 'none',
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--foreground-muted)',
                  lineHeight: '1.6'
                }}>
                  {fileContent.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Code display */}
                <pre style={{
                  flex: 1,
                  padding: '14px 16px',
                  margin: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: 'var(--foreground)',
                  overflowX: 'auto',
                  whiteSpace: 'pre'
                }}>
                  {fileContent}
                </pre>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--foreground-muted)',
                gap: '8px'
              }}>
                <FileCode size={32} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: '13px' }}>Select any file on the left to inspect its contents.</span>
              </div>
            )
          ) : (
            /* Git Diff Panel */
            <div style={{ padding: '16px' }}>
              <div style={{
                padding: '8px 12px',
                marginBottom: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--foreground-secondary)'
              }}>
                <strong>Status:</strong> {gitStatus || 'Working tree clean'}
              </div>

              {gitDiff ? (
                <div className="code-block" style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  {gitDiff.split('\n').map((line, idx) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                    const isDel = line.startsWith('-') && !line.startsWith('---');
                    const isHunk = line.startsWith('@@');

                    let bg = 'transparent';
                    let color = 'var(--foreground)';
                    if (isAdd) {
                      bg = 'var(--brand-soft)';
                      color = 'var(--brand-dark)';
                    } else if (isDel) {
                      bg = 'var(--danger-soft)';
                      color = 'var(--danger)';
                    } else if (isHunk) {
                      color = 'var(--info)';
                    }

                    return (
                      <div key={idx} style={{ backgroundColor: bg, color: color, padding: '0 4px' }}>
                        {line || ' '}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--foreground-muted)', textAlign: 'center', padding: '32px', fontSize: '13px' }}>
                  No uncommitted working tree differences detected.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
