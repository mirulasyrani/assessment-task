import React, { useEffect, useState, useCallback } from 'react';
import API from '../services/api';
import CandidateForm from './CandidateForm';
import './badges.css';
import './CandidateSummaryCards.css';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth'; // ✅ Use hook instead of custom call

const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];

// ✅ Optional helper to avoid repeating
const logFrontendError = (context, err) => {
  API.post('/logs/frontend-error', {
    context,
    message: err?.message || 'Unknown frontend error',
    stack: err?.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  });
};

const CandidateList = () => {
  const { user, loading: authLoading } = useAuth();
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/candidates';
      if (query) {
        url = `/candidates/search?q=${encodeURIComponent(query)}`;
      } else if (statusFilter) {
        url = `/candidates/filter?status=${statusFilter}`;
      }
      const res = await API.get(url);
      setFiltered(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch candidates:', err);
      toast.error('Failed to load candidates');
      logFrontendError('CandidateList Fetch Candidates', err);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    if (user) {
      fetchCandidates();
    }
  }, [fetchCandidates, user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await API.delete(`/candidates/${id}`);
      toast.success('Candidate deleted');
      fetchCandidates();
    } catch (err) {
      console.error('❌ Delete failed:', err);
      toast.error('Failed to delete candidate');
      logFrontendError('CandidateList Delete', err);
    }
  };

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setEditingCandidate(null);
    setShowForm(false);
  };

  const handleSearchChange = (e) => setQuery(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);

  if (authLoading) {
    return <p>Checking authentication...</p>;
  }

  return (
    <div className="candidate-list">
      {!user ? (
        <p style={{ color: 'red' }}>⚠️ You must be logged in to view or manage candidates.</p>
      ) : (
        <>
          {/* ➕ Add Candidate */}
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={() => {
                setEditingCandidate(null);
                setShowForm(true);
              }}
              disabled={loading}
            >
              ➕ Add Candidate
            </button>
          </div>

          {/* 🔍 Filters */}
          <div className="controls" style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search by name, position, or skills..."
              value={query}
              onChange={handleSearchChange}
              style={{ marginRight: '10px' }}
              disabled={loading}
            />
            <select value={statusFilter} onChange={handleStatusChange} disabled={loading}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* 📄 Candidate List */}
          {loading ? (
            <p>Loading candidates...</p>
          ) : filtered.length === 0 ? (
            <p>No candidates found.</p>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="candidate-card card">
                <h3>{c.name}</h3>
                <p>{c.position}</p>
                <p><strong>Experience:</strong> {c.experience_years || 0} years</p>
                <p><strong>Email:</strong> {c.email}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge status-${c.status}`}>{c.status}</span>
                </p>
                <div className="actions" style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => handleEdit(c)}
                    aria-label={`Edit candidate ${c.name}`}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    aria-label={`Delete candidate ${c.name}`}
                    style={{ marginLeft: '8px' }}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          {/* 🧾 Modal Form */}
          {showForm && (
            <div className="modal">
              <CandidateForm
                initial={editingCandidate}
                onClose={handleFormClose}
                onSubmitSuccess={() => {
                  fetchCandidates();
                  handleFormClose();
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CandidateList;
