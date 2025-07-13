import React, { useEffect, useState, useCallback } from 'react';
import API from '../services/api';
import CandidateForm from './CandidateForm';
import './badges.css';
import './CandidateSummaryCards.css';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];

const CandidateList = () => {
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      // Combine filters example: uncomment if backend supports both query and status simultaneously
      /*
      let url = '/candidates';
      const params = [];
      if (query) params.push(`q=${encodeURIComponent(query)}`);
      if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
      if (params.length > 0) url += '/search?' + params.join('&');
      */

      // Current logic prioritizes query over status filter
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
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await API.delete(`/candidates/${id}`);
      toast.success('Candidate deleted');
      fetchCandidates();
    } catch (err) {
      console.error('❌ Delete failed:', err);
      toast.error('Failed to delete candidate');
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

  return (
    <div className="candidate-list">
      {/* Add Candidate button */}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => { setEditingCandidate(null); setShowForm(true); }}>
          ➕ Add Candidate
        </button>
      </div>

      {/* Filters */}
      <div className="controls" style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by name, position, or skills..."
          value={query}
          onChange={handleSearchChange}
          style={{ marginRight: '10px' }}
        />

        <select value={statusFilter} onChange={handleStatusChange}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Candidate List */}
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
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                aria-label={`Delete candidate ${c.name}`}
                style={{ marginLeft: '8px' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Candidate Modal */}
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
    </div>
  );
};

export default CandidateList;
