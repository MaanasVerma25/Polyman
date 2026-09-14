import React, { useState, useEffect } from 'react';
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/projects/reports`);
      const data = await res.json();
      setReports(data.reports || []);
      if (data.reports && data.reports.length > 0 && !selectedReport) {
        setSelectedReport(data.reports[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [apiBase]);

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
        return { label: 'Legal & License', icon: Scale, color: '#f59e0b', bg: 'var(--warning-bg)' };
      case 'audit':
        return { label: 'Security & Quality', icon: ShieldCheck, color: '#ef4444', bg: 'var(--danger-bg)' };
      case 'financial':
        return { label: 'FinOps & Budget', icon: Calculator, color: '#8b5cf6', bg: 'var(--purple-bg)' };
      case 'architecture':
        return { label: 'System Design', icon: Layers, color: '#0ea5e9', bg: 'var(--info-bg)' };
      default:
        return { label: category, icon: FileText, color: '#64748b', bg: 'var(--bg-tertiary)' };
    }
  };

  const filteredReports = categoryFilter === 'all'
    ? reports
    : reports.filter(r => r.category === categoryFilter);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      height: 'calc(100vh - 120px)',
      gap: '20px',
      padding: '20px 28px'
    }}>
      {/* Report List */}
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
            Deliverables Showcase
          </span>
          <button onClick={fetchReports} title="Refresh Reports">
            <RefreshCw size={15} color="var(--text-muted)" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'legal', 'audit', 'financial', 'architecture'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: categoryFilter === cat ? 'var(--accent-gradient)' : 'var(--bg-primary)',
                color: categoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                textTransform: 'capitalize'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {filteredReports.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              <FileText size={32} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
              No reports synthesized yet. Run an autonomous mission to generate documents.
            </div>
          ) : (
            filteredReports.map((rep) => {
              const meta = getCategoryMeta(rep.category);
              const Icon = meta.icon;
              const isSelected = selectedReport?.rel_path === rep.rel_path;

              return (
                <div
                  key={rep.rel_path}
                  onClick={() => setSelectedReport(rep)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                    border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: meta.bg,
                      color: meta.color,
                      textTransform: 'uppercase'
                    }}>
                      <Icon size={11} />
                      {meta.label}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      .md
                    </span>
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {rep.filename}
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {rep.rel_path}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Report Reader */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {selectedReport ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 24px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedReport.filename}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Workspace Path: {selectedReport.rel_path}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>

                <button
                  onClick={downloadReport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '28px', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{
                maxWidth: '860px',
                margin: '0 auto',
                backgroundColor: 'var(--bg-secondary)',
                padding: '36px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <pre style={{
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.7',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedReport.content}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Select any report on the left panel to inspect full markdown content.
          </div>
        )}
      </div>
    </div>
  );
};
