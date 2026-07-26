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
  Server,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';
const NOTION_DB_ID = '3a875e373f5480918a8eec701d1fe5d4';

export default function App() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'pipeline' | 'campaigns' | 'guide'

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
    campaign_name: '',
    channel: 'Paid Social',
    status: 'Active',
    monthly_budget: 4000,
    start_date: '2026-01-07',
    is_test_mode: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  // Campaigns DB state
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Workflow Metadata
  const [workflowInfo, setWorkflowInfo] = useState(null);

  // Fetch Health & Workflow Metadata on mount
  useEffect(() => {
    checkHealth();
    fetchWorkflowInfo();
    fetchCampaigns();

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

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSubmitCampaign = async (e) => {
    e.preventDefault();
    if (!formData.campaign_name) return;

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
        fetchCampaigns(); // refresh database table
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

  const handleDeleteCampaign = async (id) => {
    if (!confirm(`Are you sure you want to delete campaign #${id}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const fillSampleCampaign = () => {
    const samples = [
      { name: 'Summer Awareness Push', channel: 'Paid Social', status: 'Active', budget: 4000, start: '2026-01-07' },
      { name: 'SEO Content Refresh', channel: 'Content/SEO', status: 'Active', budget: 2500, start: '2026-01-07' },
      { name: 'Fall Conference', channel: 'Email Marketing', status: 'Active', budget: 800, start: '2026-06-15' },
      { name: 'Welcome Email Series', channel: 'Events', status: 'Planned', budget: 3000, start: '2026-10-09' }
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    const randomSuffix = Math.floor(Math.random() * 90 + 10);
    setFormData({
      campaign_name: `${picked.name} v${randomSuffix}`,
      channel: picked.channel,
      status: picked.status,
      monthly_budget: picked.budget,
      start_date: picked.start,
      is_test_mode: false
    });
  };

  const exportCampaignsJSON = () => {
    const jsonStr = JSON.stringify(campaigns, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const filteredCampaigns = campaigns.filter(c => {
    const name = c.campaign_name || c.name || '';
    const channel = c.channel || c.email || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Active' && c.status === 'Active') ||
      (statusFilter === 'Planned' && c.status === 'Planned') ||
      (statusFilter === 'SENT' && c.n8n_status === 'sent') ||
      (statusFilter === 'FAILED' && c.n8n_status === 'failed') ||
      (statusFilter === 'TEST' && c.is_test_mode);
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
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <TrendingUp size={24} color="#FFF" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', lineHeight: '1.2' }}>
                Marketing Campaigns &amp; Notion Portal
              </h1>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Notion DB: <code>Marketing_Campaigns_Database</code> ({NOTION_DB_ID}) &bull; n8n (5678)
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
              <ExternalLink size={14} /> Open n8n UI
            </a>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '0 32px'
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            gap: '8px'
          }}
        >
          <button
            onClick={() => setActiveTab('form')}
            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
          >
            <Send size={16} /> Campaign Creator Form
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          >
            <Layers size={16} /> Workflow Pipeline Visualizer
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
          >
            <Database size={16} /> Campaigns Database Log ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
          >
            <FileText size={16} /> Notion DB Setup &amp; Guide
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px' }}>
        {/* TAB 1: Campaign Creator Form & Live Response */}
        {activeTab === 'form' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '32px' }}>
            {/* Left Card: Form */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                    Create Marketing Campaign
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Fires POST request to n8n webhook and creates page in Notion <code>Marketing_Campaigns_Database</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillSampleCampaign}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  Auto Fill Demo Campaign
                </button>
              </div>

              <form onSubmit={handleSubmitCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="form-label">Campaign Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Summer Awareness Push"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Channel</label>
                    <select
                      className="form-select"
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    >
                      <option value="Paid Social">Paid Social</option>
                      <option value="Content/SEO">Content/SEO</option>
                      <option value="Email Marketing">Email Marketing</option>
                      <option value="Events">Events</option>
                      <option value="Influencer/PR">Influencer/PR</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Planned">Planned</option>
                      <option value="Paused">Paused</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Monthly Budget ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="4000"
                      value={formData.monthly_budget}
                      onChange={(e) => setFormData({ ...formData, monthly_budget: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="test_mode"
                    checked={formData.is_test_mode}
                    onChange={(e) => setFormData({ ...formData, is_test_mode: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-purple)' }}
                  />
                  <label htmlFor="test_mode" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Use Test Webhook ( <code>/webhook-test/lead-magnet-signup</code> )
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px', padding: '14px' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={18} className="spin" /> Triggering n8n Webhook...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Submit Campaign to Notion
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Card: Live Response Log */}
            <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    color: 'var(--text-dim)',
                    textAlign: 'center',
                    padding: '40px 20px',
                    border: '2px dashed rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <Zap size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p>No campaign submitted yet in this session.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Fill out the form and submit to see live execution trace.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Status Box */}
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-md)',
                      background: lastResponse.status === 'sent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      border: `1px solid ${lastResponse.status === 'sent' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {lastResponse.status === 'sent' ? (
                        <CheckCircle2 size={24} color="var(--accent-emerald)" />
                      ) : (
                        <AlertCircle size={24} color="var(--accent-rose)" />
                      )}
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                          {lastResponse.status === 'sent' ? 'Webhook Executed Successfully' : 'Webhook Execution Failed'}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Campaign ID: #{lastResponse.campaign_id || lastResponse.lead_id} &bull; Target: {lastResponse.n8n_result?.target_url}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>HTTP Status Code</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: lastResponse.n8n_result?.status_code === 200 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {lastResponse.n8n_result?.status_code || 500}
                      </p>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Latency</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {lastResponse.n8n_result?.latency_ms || 0} ms
                      </p>
                    </div>
                  </div>

                  {/* Raw Output */}
                  <div>
                    <label className="form-label">Response Body Output:</label>
                    <pre
                      style={{
                        background: 'rgba(10, 15, 26, 0.9)',
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        color: 'var(--accent-cyan)',
                        overflowX: 'auto',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {JSON.stringify(lastResponse.n8n_result?.response || lastResponse, null, 2)}
                    </pre>
                  </div>
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
                Visual map of nodes parsed directly from <code>data/node.json</code> ("Marketing Campaigns Funnel - Notion Integration")
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
                  Input: <code>{`{ campaign_name, channel, monthly_budget, start_date }`}</code>
                </div>
              </div>

              {/* Step 2: Set Node */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-warning">Transform</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#2</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} color="var(--accent-blue)" /> Normalize Campaign Data
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Standardizes variables &amp; adds timestamp <code>submittedAt</code>.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Fields: campaign_name, channel, status, monthly_budget, start_date
                </div>
              </div>

              {/* Step 3: Notion */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-emerald)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-success">Notion DB</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#3</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} color="var(--accent-emerald)" /> Log Campaign to Notion
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Creates page in <code>Marketing_Campaigns_Database</code>.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Database ID: <code>{NOTION_DB_ID}</code>
                </div>
              </div>

              {/* Step 4: Email Send */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-amber)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-warning">Email Alert</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#4</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={18} color="var(--accent-amber)" /> Deliver Confirmation Email
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Sends HTML email summary of campaign parameters.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Subject: "🚀 New Campaign Created"
                </div>
              </div>

              {/* Step 5: Email Notification */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid #3B82F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-purple">Team Notification</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#5</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={18} color="#3B82F6" /> Notify Sales &amp; Marketing Team
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Sends internal email alert to team on new campaign.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  To: sales@mydomain.com
                </div>
              </div>

              {/* Step 6: Follow up (Immediate) */}
              <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', borderTop: '4px solid var(--accent-pink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-danger">Checklist</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#6</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={18} color="var(--accent-pink)" /> Send Campaign Follow-up
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Sends campaign activation checklist immediately.
                </p>
                <div style={{ fontSize: '0.75rem', background: 'rgba(15,23,42,0.6)', padding: '8px', borderRadius: '6px' }}>
                  Subject: "Campaign Activation Checklist"
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Campaigns Database Log */}
        {activeTab === 'campaigns' && (
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
                    placeholder="Search campaigns by name or channel..."
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
                  <option value="Active">Active</option>
                  <option value="Planned">Planned</option>
                  <option value="SENT">Sent to n8n</option>
                  <option value="FAILED">Failed</option>
                  <option value="TEST">Test Mode</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={fetchCampaigns} className="btn btn-secondary">
                  <RefreshCw size={16} className={loadingCampaigns ? 'spin' : ''} /> Refresh
                </button>
                <button onClick={exportCampaignsJSON} className="btn btn-secondary">
                  <Download size={16} /> Export JSON
                </button>
              </div>
            </div>

            {/* Campaigns Table */}
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
                      <th style={{ padding: '16px 24px' }}>Campaign Name</th>
                      <th style={{ padding: '16px 24px' }}>Channel</th>
                      <th style={{ padding: '16px 24px' }}>Status</th>
                      <th style={{ padding: '16px 24px' }}>Monthly Budget</th>
                      <th style={{ padding: '16px 24px' }}>Start Date</th>
                      <th style={{ padding: '16px 24px' }}>n8n Status</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                          No campaigns found in SQLite database.
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.map((c) => (
                        <tr
                          key={c.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.2s'
                          }}
                        >
                          <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            #{c.id}
                          </td>
                          <td style={{ padding: '16px 24px', fontWeight: 600, color: '#FFF' }}>
                            {c.campaign_name || c.name}
                          </td>
                          <td style={{ padding: '16px 24px', color: 'var(--accent-blue)' }}>
                            {c.channel || c.email}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span
                              className={`badge ${
                                c.status === 'Active' ? 'badge-success' : 'badge-warning'
                              }`}
                            >
                              {c.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                            ${(c.monthly_budget || 4000).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {c.start_date || '2026-01-07'}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span
                              className={`badge ${
                                c.n8n_status === 'sent'
                                  ? 'badge-success'
                                  : c.n8n_status === 'failed'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                              }`}
                            >
                              {c.n8n_status || 'pending'}
                              {c.is_test_mode ? ' (Test)' : ''}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteCampaign(c.id)}
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
              <CheckCircle2 size={24} color="var(--accent-emerald)" /> Notion Marketing_Campaigns_Database Integration Guide
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
                  Fires POST requests containing campaign parameters (name, channel, status, monthly_budget, start_date).
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-emerald)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>2. Notion Database Property Mapping</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Target Notion Database: <code>Marketing_Campaigns_Database</code> (ID: <code>{NOTION_DB_ID}</code>)
                </p>
                <div style={{ fontSize: '0.8rem', background: 'rgba(10,15,26,0.8)', padding: '12px', borderRadius: '6px' }}>
                  <ul>
                    <li><code>Campaign name</code> (Title) &bull; e.g. "Summer Awareness Push"</li>
                    <li><code>Channel</code> (Select) &bull; "Paid Social", "Content/SEO", "Email Marketing", "Events"</li>
                    <li><code>Status</code> (Select) &bull; "Active", "Planned", "Paused"</li>
                    <li><code>Monthly Budget</code> (Number) &bull; e.g. 4000</li>
                    <li><code>Start Date</code> (Date) &bull; e.g. 2026-01-07</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-amber)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>3. Email Delivery &amp; Notifications</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Sends launch summaries and team alerts whenever a new marketing campaign is added.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-pink)' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>4. Activate Workflow</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Open n8n at <code>http://localhost:5678/workflow/h1AhBG0r8zPvXkrb</code> and toggle the workflow to <strong>Active</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
