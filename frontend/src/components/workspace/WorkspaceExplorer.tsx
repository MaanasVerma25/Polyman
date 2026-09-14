import React, { useState, useEffect } from 'react';
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

  const fetchFiles = async () => {
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
  };

  useEffect(() => {
    fetchFiles();
  }, [apiBase]);

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
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      height: 'calc(100vh - 120px)',
      gap: '20px',
      padding: '20px 28px'
    }}>
      {/* Sidebar: File Tree & Git Controls */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Code Studio Explorer
          </span>
          <button
            onClick={fetchFiles}
            title="Refresh Files"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* View Switcher: Files vs Git Diff */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '6px', gap: '4px', backgroundColor: 'var(--bg-primary)' }}>
          <button
            onClick={() => setActiveView('editor')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeView === 'editor' ? 700 : 500,
              backgroundColor: activeView === 'editor' ? 'var(--bg-secondary)' : 'transparent',
              color: activeView === 'editor' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: activeView === 'editor' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Workspace Files ({files.length})
          </button>
          <button
            onClick={() => setActiveView('diff')}
            style={{
              flex: 1,
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeView === 'diff' ? 700 : 500,
              backgroundColor: activeView === 'diff' ? 'var(--bg-secondary)' : 'transparent',
              color: activeView === 'diff' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeView === 'diff' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <GitBranch size={13} />
            Git Working Tree
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '6px',
            padding: '6px 10px',
            border: '1px solid var(--border-color)'
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search file path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* File List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredFiles.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No files match filter.
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
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    cursor: isDir ? 'default' : 'pointer',
                    userSelect: 'none',
                    marginBottom: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {isDir ? (
                      <Folder size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                    ) : f.path.endsWith('.md') ? (
                      <FileText size={15} color="#0ea5e9" style={{ flexShrink: 0 }} />
                    ) : (
                      <FileCode size={15} color="#10b981" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontWeight: isDir ? 700 : isSelected ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {f.path}
                    </span>
                  </div>

                  {!isDir && f.size !== undefined && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {f.size > 1024 ? `${(f.size / 1024).toFixed(1)}k` : `${f.size}b`}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor / Content Preview with line numbers */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {activeView === 'editor' ? (selectedFile || 'Select a file to inspect') : 'Git Working Tree Diff'}
            </span>
          </div>

          {activeView === 'editor' && selectedFile && (
            <button
              onClick={copyCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          {activeView === 'editor' ? (
            selectedFile ? (
              <div style={{ display: 'flex', minHeight: '100%', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                {/* Line numbers column */}
                <div style={{
                  padding: '16px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRight: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  userSelect: 'none',
                  textAlign: 'right',
                  lineHeight: '1.6'
                }}>
                  {fileContent.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Code content */}
                <div style={{ padding: '16px 20px', flex: 1, overflowX: 'auto', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  <pre style={{ margin: 0, fontFamily: 'inherit' }}>{fileContent}</pre>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '120px', fontSize: '14px' }}>
                <FileCode size={40} style={{ opacity: 0.3, margin: '0 auto 12px auto' }} />
                Select any source, config, or doc file from the left sidebar to preview code.
              </div>
            )
          ) : (
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Git Working Status:
                </h4>
                <pre style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  {gitStatus || 'Working tree clean. All subagent changes committed or tracked.'}
                </pre>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Unified Diff Output:
                </h4>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  lineHeight: '1.6'
                }}>
                  {gitDiff ? (
                    gitDiff.split('\n').map((line, idx) => {
                      const isAdd = line.startsWith('+') && !line.startsWith('+++');
                      const isDel = line.startsWith('-') && !line.startsWith('---');
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: isAdd ? 'rgba(16, 185, 129, 0.15)' : isDel ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            color: isAdd ? 'var(--success)' : isDel ? 'var(--danger)' : 'var(--text-primary)',
                            padding: '0 4px',
                            borderRadius: '2px'
                          }}
                        >
                          {line}
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No unstaged file modifications.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
