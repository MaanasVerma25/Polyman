import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Scale, 
  ShieldCheck, 
  Calculator, 
  Layers, 
  Copy, 
  Check, 
  RefreshCw, 
  Download 
} from 'lucide-react';
import type { ReportItem } from '../../types';

interface ReportsViewerProps {
  apiBase: string;
}

export const ReportsViewer: React.FC<ReportsViewerProps> = ({ apiBase }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/projects/reports`);
      const data = await res.json();
      const loadedReports: ReportItem[] = data.reports || [];
      setReports(loadedReports);
      if (loadedReports.length > 0) {
        setSelectedReport(prev => prev || loadedReports[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const copyToClipboard = () => {
    if (selectedReport) {
      navigator.clipboard.writeText(selectedReport.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadReport = () => {
    if (!selectedReport) return;
    const blob = new Blob([selectedReport.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedReport.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'legal':
        return { label: 'Legal & License', icon: Scale, color: 'var(--warning)', bg: 'var(--warning-soft)' };
      case 'audit':
        return { label: 'Security & Quality', icon: ShieldCheck, color: 'var(--danger)', bg: 'var(--danger-soft)' };
      case 'financial':
        return { label: 'FinOps & Budget', icon: Calculator, color: 'var(--purple)', bg: 'var(--purple-bg)' };
      case 'architecture':
        return { label: 'System Design', icon: Layers, color: 'var(--info)', bg: 'var(--info-soft)' };
      default:
        return { label: category, icon: FileText, color: 'var(--foreground-muted)', bg: 'var(--surface-control)' };
    }
  };

  const filteredReports = categoryFilter === 'all'
    ? reports
    : reports.filter(r => r.category === categoryFilter);

  return (
    <div className="container" style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      height: 'calc(100vh - 100px)',
      gap: '16px',
      paddingTop: '20px',
      paddingBottom: '20px'
    }}>
      {/* Report List Sidebar */}
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
            Deliverables Showcase
          </span>
          <button 
            onClick={fetchReports} 
            className="button-ghost"
            style={{ width: '28px', height: '28px', padding: 0 }}
            title="Refresh Deliverables"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          gap: '4px', 
          flexWrap: 'wrap',
          backgroundColor: 'var(--background-alternative)'
        }}>
          {['all', 'legal', 'audit', 'financial', 'architecture'].map(cat => {
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="button-ghost"
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  height: '24px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'var(--brand)' : 'var(--surface)',
                  color: isActive ? 'var(--brand-foreground)' : 'var(--foreground-secondary)',
                  border: isActive ? '1px solid var(--brand)' : '1px solid var(--border)',
                  fontWeight: isActive ? 600 : 500,
                  textTransform: 'capitalize'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {filteredReports.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '12px' }}>
              No deliverables available for this filter.
            </div>
          ) : (
            filteredReports.map((item) => {
              const isSelected = selectedReport?.filename === item.filename;
              const meta = getCategoryMeta(item.category);
              const MetaIcon = meta.icon;

              return (
                <div
                  key={item.filename}
                  onClick={() => setSelectedReport(item)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--brand-soft)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--brand)' : '2px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    transition: 'background-color 160ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: 'var(--radius-sm)',
                      background: meta.bg,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border)'
                    }}>
                      <MetaIcon size={11} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'var(--brand-dark)' : 'var(--foreground)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.filename}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    fontSize: '10px', 
                    color: 'var(--foreground-muted)', 
                    paddingLeft: '26px' 
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{meta.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{item.filename}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Deliverable Document Panel */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {selectedReport ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--surface-muted)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {selectedReport.filename}
                  </span>
                  <span className="status-pill info" style={{ fontSize: '10px' }}>
                    {selectedReport.category.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {selectedReport.filename}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={copyToClipboard}
                  className="button-ghost"
                  style={{
                    height: '28px',
                    padding: '0 8px',
                    fontSize: '11px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)'
                  }}
                >
                  {copied ? <Check size={11} style={{ color: 'var(--brand)' }} /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={downloadReport}
                  className="button-ghost"
                  style={{
                    height: '28px',
                    padding: '0 8px',
                    fontSize: '11px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)'
                  }}
                >
                  <Download size={11} />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: 'var(--background)'
            }}>
              <div style={{
                maxWidth: '780px',
                margin: '0 auto',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 28px'
              }}>
                <pre style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  lineHeight: '1.65',
                  color: 'var(--foreground)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0
                }}>
                  {selectedReport.content}
                </pre>
              </div>
            </div>
          </>
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
            <FileText size={32} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '13px' }}>Select any deliverable to view its content.</span>
          </div>
        )}
      </div>
    </div>
  );
};
