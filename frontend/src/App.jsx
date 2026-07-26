import React, { useState, useEffect } from 'react';
import {
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  ExternalLink,
  RefreshCw,
  Trash2,
  Layers,
  FileText,
  Mail,
  Users,
  Calendar,
  Settings,
  Activity,
  Download,
  Filter,
  Search,
  Server
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'pipeline' | 'leads' | 'guide'

  // Health state
  const [health, setHealth] = useState({
    backendOnline: false,
    n8nOnline: false,
    n8nEditorUrl: 'http://localhost:5678',
    n8nError: null,
    loading: true
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    source: 'Lead Magnet Funnel',
    is_test_mode: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  // Leads DB state
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Workflow Metadata
  const [workflowInfo, setWorkflowInfo] = useState(null);

  // Fetch Health & Workflow Metadata on mount
  useEffect(() => {
    checkHealth();
    fetchWorkflowInfo();
    fetchLeads();

    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth({
          backendOnline: data.backend?.online || false,
          n8nOnline: data.n8n?.online || false,
          n8nEditorUrl: data.n8n?.editor_url || 'http://localhost:5678',
          n8nError: data.n8n?.error || null,
          loading: false
        });
      } else {
        setHealth(prev => ({ ...prev, backendOnline: false, loading: false }));
      }
    } catch (err) {
      setHealth({
        backendOnline: false,
        n8nOnline: false,
        n8nEditorUrl: 'http://localhost:5678',
        n8nError: err.message,
        loading: false
      });
    }
  };

  const fetchWorkflowInfo = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflow`);
      if (res.ok) {
        const data = await res.json();
        setWorkflowInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch workflow info:', err);
    }
  };

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setSubmitting(true);
    setLastResponse(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/leads/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setLastResponse(data);
      if (res.ok) {
        fetchLeads(); // refresh database table
      }
    } catch (err) {
      setLastResponse({
        status: 'failed',
        error: `Backend Connection Error: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!confirm(`Are you sure you want to delete lead #${id}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const fillSampleLead = () => {
    const randomId = Math.floor(Math.random() * 899 + 100);
    setFormData({
      name: `Alex Morgan ${randomId}`,
      email: `alex.morgan${randomId}@example.com`,
      source: 'Lead Magnet Funnel',
      is_test_mode: false
    });
  };

  const exportLeadsJSON = () => {
    const jsonStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SENT' && l.n8n_status === 'sent') ||
      (statusFilter === 'FAILED' && l.n8n_status === 'failed') ||
      (statusFilter === 'TEST' && l.is_test_mode);
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '16px 32px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Zap size={24} color="#FFF" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', lineHeight: '1.2' }}>
                n8n Lead Magnet Funnel Portal
              </h1>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                FastAPI Backend (8000) &bull; Frontend (3000) &bull; n8n (5678)
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Backend Status */}
            <div
              className="glass-panel"
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem'
              }}
            >
              <div
                className={`pulse-dot ${health.backendOnline ? 'online' : 'offline'}`}
              />
              <span style={{ color: 'var(--text-muted)' }}>Backend (8000):</span>
              <strong
                style={{
                  color: health.backendOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              >
                {health.backendOnline ? 'Online' : 'Offline'}
              </strong>
            </div>

            {/* n8n Status */}
            <div
              className="glass-panel"
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem'
              }}
            >
              <div className={`pulse-dot ${health.n8nOnline ? 'online' : 'offline'}`} />
              <span style={{ color: 'var(--text-muted)' }}>n8n Engine:</span>
              <strong
                style={{
                  color: health.n8nOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              >
                {health.n8nOnline ? 'Running' : 'Offline'}
              </strong>
            </div>

            {/* n8n Editor Link */}
            <a
              href={health.n8nEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.825rem', borderRadius: '9999px' }}
            >
              Open n8n UI <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 15, 26, 0.6)',
          padding: '0 32px'
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          <button
            onClick={() => setActiveTab('form')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'none',
              color: activeTab === 'form' ? '#FFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'form' ? '2px solid #8B5CF6' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} /> Webhook Lead Tester
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'none',
              color: activeTab === 'pipeline' ? '#FFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'pipeline' ? '2px solid #8B5CF6' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={16} /> Workflow Pipeline Visualizer
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'none',
              color: activeTab === 'leads' ? '#FFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'leads' ? '2px solid #8B5CF6' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Database size={16} /> Submissions Log ({leads.length})
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'none',
              color: activeTab === 'guide' ? '#FFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'guide' ? '2px solid #8B5CF6' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} /> Setup & Credentials Guide
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: Lead Webhook Form & Response */}
        {activeTab === 'form' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            {/* Form Box */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Submit Lead Data</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Fires POST request to n8n webhook endpoint at <code>/webhook/lead-magnet-signup</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillSampleLead}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  Auto Fill Demo Lead
                </button>
              </div>

              <form onSubmit={handleSubmitLead}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. john@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lead Source</label>
                  <select
                    className="form-select"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    <option value="Lead Magnet Funnel">Lead Magnet Funnel</option>
                    <option value="Website Form">Website Form</option>
                    <option value="Social Campaign">Social Campaign</option>
                    <option value="Direct API">Direct API</option>
                  </select>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    id="test_mode"
                    checked={formData.is_test_mode}
                    onChange={(e) => setFormData({ ...formData, is_test_mode: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="test_mode" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Use Test Webhook (<code>/webhook-test/lead-magnet-signup</code>)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px', padding: '14px' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      Triggering n8n Webhook...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Trigger Lead Magnet Webhook
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Response Card */}
            <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--accent-purple)" /> Real-Time Response Log
              </h2>

              {!lastResponse ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-dim)'
                  }}
                >
                  <Send size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No webhook triggered yet.</p>
                  <p style={{ fontSize: '0.8rem' }}>Fill in lead details and click "Trigger Lead Magnet Webhook".</p>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Status Banner */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: lastResponse.status === 'sent'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(244, 63, 94, 0.12)',
                      border: lastResponse.status === 'sent'
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(244, 63, 94, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {lastResponse.status === 'sent' ? (
                      <CheckCircle2 size={24} color="var(--accent-emerald)" />
                    ) : (
                      <AlertCircle size={24} color="var(--accent-rose)" />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {lastResponse.status === 'sent'
                          ? 'Webhook Accepted by n8n!'
                          : 'Webhook Execution Failed'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Lead ID: #{lastResponse.lead_id} &bull; Target:{' '}
                        <code>{lastResponse.n8n_result?.target_url || 'Unknown'}</code>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HTTP Status Code</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: lastResponse.n8n_result?.success ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {lastResponse.n8n_result?.status_code || 'Err'}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latency</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {lastResponse.n8n_result?.latency_ms ? `${lastResponse.n8n_result.latency_ms} ms` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Response Payload */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Response Body Output:
                    </div>
                    <pre className="code-block" style={{ flex: 1, maxHeight: '220px' }}>
                      {JSON.stringify(lastResponse.n8n_result?.response || lastResponse, null, 2)}
                    </pre>
                  </div>

                  {lastResponse.n8n_result?.error && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.1)', padding: '10px', borderRadius: '8px' }}>
                      <strong>Error details:</strong> {lastResponse.n8n_result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Workflow Pipeline Visualizer */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>
                n8n Workflow Execution Diagram
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Visual map of nodes parsed directly from <code>data/node.json</code> ("Lead Magnet Funnel - Notion + Teams")
              </p>
            </div>

            {/* Pipeline Step Cards Horizontal/Vertical layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Step 1: Webhook */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-purple">Trigger Node</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#1</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} color="var(--accent-purple)" /> Lead Form Webhook
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  POST Endpoint: <code>/webhook/lead-magnet-signup</code>
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Input: <code>{`{ name, email }`}</code>
                </div>
              </div>

              {/* Step 2: Set Node */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-warning">Transform</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#2</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} color="var(--accent-blue)" /> Normalize Lead Data
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Standardizes variables &amp; adds timestamp <code>submittedAt</code>.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Fields: name, email, source, submittedAt
                </div>
              </div>

              {/* Step 3: Notion */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-emerald)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-success">Notion CRM</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#3</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} color="var(--accent-emerald)" /> Log Lead to Notion
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Creates page in Notion DB with Status: "New".
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Database ID: <code>YOUR_NOTION_DATABASE_ID</code>
                </div>
              </div>

              {/* Step 4: Email Send */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-amber)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-warning">Email SMTP</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#4</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={18} color="var(--accent-amber)" /> Deliver Lead Magnet Email
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Sends HTML email with guide download link.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Subject: "Here's your free guide!"
                </div>
              </div>

              {/* Step 5: MS Teams */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid #3B82F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-purple">Teams Bot</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#5</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#3B82F6" /> Notify Sales Team (Teams)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Posts notification to Teams sales channel.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Channel: Sales Alerts
                </div>
              </div>

              {/* Step 6: Wait Node */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Delay</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#6</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--text-muted)" /> Wait 2 Days
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Pauses workflow execution for 2 days.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Duration: 2 Days
                </div>
              </div>

              {/* Step 7: Follow up */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-pink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-danger">Follow Up</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#7</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={18} color="var(--accent-pink)" /> Send Follow-up Email
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Sends call booking link follow-up.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Link: "Book a call"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Submissions Database Log */}
        {activeTab === 'leads' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Toolbar */}
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={16}
                    color="var(--text-dim)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search leads by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>

                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SENT">Sent to n8n</option>
                  <option value="FAILED">Failed</option>
                  <option value="TEST">Test Mode</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={fetchLeads} className="btn btn-secondary">
                  <RefreshCw size={16} className={loadingLeads ? 'spin' : ''} /> Refresh
                </button>
                <button onClick={exportLeadsJSON} className="btn btn-secondary">
                  <Download size={16} /> Export JSON
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(10, 15, 26, 0.8)',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      <th style={{ padding: '16px 24px' }}>ID</th>
                      <th style={{ padding: '16px 24px' }}>Name</th>
                      <th style={{ padding: '16px 24px' }}>Email</th>
                      <th style={{ padding: '16px 24px' }}>Source</th>
                      <th style={{ padding: '16px 24px' }}>Submitted At</th>
                      <th style={{ padding: '16px 24px' }}>n8n Webhook Status</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                          No leads found in SQLite database.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.2s'
                          }}
                        >
                          <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            #{lead.id}
                          </td>
                          <td style={{ padding: '16px 24px', fontWeight: 600 }}>{lead.name}</td>
                          <td style={{ padding: '16px 24px', color: 'var(--accent-blue)' }}>{lead.email}</td>
                          <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{lead.source}</td>
                          <td style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {new Date(lead.submitted_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span
                              className={`badge ${
                                lead.n8n_status === 'sent'
                                  ? 'badge-success'
                                  : lead.n8n_status === 'failed'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                              }`}
                            >
                              {lead.n8n_status}
                              {lead.is_test_mode ? ' (Test)' : ''}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="btn btn-danger"
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Setup & Credentials Guide */}
        {activeTab === 'guide' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={24} color="var(--accent-emerald)" /> n8n Workflow Setup Checklist
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Extracted directly from n8n sticky note node in <code>data/node.json</code>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-purple)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>1. Webhook Destination</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Production URL: <code>http://localhost:5678/webhook/lead-magnet-signup</code>
                  <br />
                  Paste this into your form tool (Tally, Typeform, Webflow) or use our FastAPI backend submit button.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-emerald)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>2. Notion Database Integration</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Add Notion API credentials in n8n, then replace <code>YOUR_NOTION_DATABASE_ID</code> and match property names (Name, Email, Source, Status="New").
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-amber)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>3. Email Delivery (x2 Nodes)</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Add SMTP or Gmail credentials in n8n, set the From address, and customize the lead-magnet download &amp; follow-up call links.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #3B82F6' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>4. Microsoft Teams Channel Alerts</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Add Microsoft Teams OAuth2 credentials in n8n, then pick your Team and Channel for lead alert notifications.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-pink)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>5. Activate Workflow</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Open n8n at <code>http://localhost:5678</code> and toggle the workflow to <strong>Active</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
