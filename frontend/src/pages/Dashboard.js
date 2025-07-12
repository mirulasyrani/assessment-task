import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import API from '../services/api';
import CandidateForm from '../components/CandidateForm';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatDate';
import { toast } from 'react-toastify';
import CandidateSummaryCards from '../components/CandidateSummaryCards';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

    // --- NEW FUNCTION TO LOG ERRORS TO BACKEND ---
    const logFrontendErrorToBackend = useCallback(async (error, context) => {
        try {
            // Prepare error data to send to backend
            const errorDetails = {
                message: error.message || 'Unknown error',
                stack: error.stack,
                context: context, // e.g., 'status_update_failure', 'fetch_candidates_failure'
                response_data: error.response?.data, // Capture backend response data if available
                response_status: error.response?.status, // Capture backend response status
                url: error.config?.url, // Capture the URL that caused the error
                method: error.config?.method, // Capture the HTTP method
                timestamp: new Date().toISOString(),
            };
            console.warn('Attempting to send error log to backend:', errorDetails);
            await API.post('/logs/frontend-error', errorDetails);
        } catch (logError) {
            console.error('Failed to send error log to backend:', logError);
        }
    }, []);
    // ---------------------------------------------

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/candidates';
      if (filter !== 'all') url = `/candidates/filter?status=${filter}`;
      const res = await API.get(url);

      let filtered = res.data.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.position.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.toLowerCase().includes(search.toLowerCase())
      );

      if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      setCandidates(filtered);
    } catch (err) {
      console.error('Error fetching candidates:', err);
        logFrontendErrorToBackend(err, 'fetch_candidates_failure'); // Log this error to backend too
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  }, [filter, search, sortBy, logFrontendErrorToBackend]); // Add logFrontendErrorToBackend to dependency array

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCandidates();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCandidates]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try {
      await API.delete(`/candidates/${id}`);
      fetchCandidates();
      toast.info('Candidate deleted');
    } catch (err) {
        logFrontendErrorToBackend(err, `delete_candidate_failure_id_${id}`); // Log this error to backend
      toast.error('Delete failed');
    }
  };

  const handleEdit = (candidate) => {
    setSelected(candidate);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelected(null);
    fetchCandidates();
    toast.success('Candidate saved successfully!');
  };

  const statusCounts = candidates.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4 }}
      >
        <h2>Dashboard</h2>

        <CandidateSummaryCards
          total={candidates.length}
          statusCounts={statusCounts}
        />

        <input
          type="text"
          placeholder="Search by name, position, skills"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: '12px' }}
        />

        <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {['all', 'applied', 'screening', 'interview', 'offer', 'hired', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
          <button className="filter-btn" onClick={() => setShowForm(true)}>+ Add Candidate</button>

          <label style={{ marginLeft: 'auto' }}>
            Sort by:{' '}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px' }}
            >
              <option value="date">Date (Newest)</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </label>
        </div>

        <p><strong>{candidates.length}</strong> candidates found.</p>

        {loading ? (
          <Loader />
        ) : candidates.length === 0 ? (
          <p style={{ marginTop: '20px' }}>No candidates found. Try changing filters or add a new one.</p>
        ) : (
          <ul>
            {candidates.map((c) => (
              <li className="card" key={c.id}>
                <strong>{c.name}</strong> - {c.position}<br />

                <select
                  value={c.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;

                    const updatedCandidate = {
                      name: c.name ?? '',
                      email: c.email ?? '',
                      phone: c.phone ?? '',
                      position: c.position ?? '',
                      skills: c.skills ?? '',
                      experience_years:
                        c.experience_years !== null &&
                        c.experience_years !== undefined &&
                        !isNaN(Number(c.experience_years))
                          ? Number(c.experience_years)
                          : 0,
                      status: newStatus,
                      notes: c.notes ?? '',
                    };

                    try {
                      await API.put(`/candidates/${c.id}`, updatedCandidate);
                      toast.success('Status updated!');
                      fetchCandidates();
                    } catch (err) {
                      console.error('🔥 Error updating status:', err?.response?.data || err);
                        logFrontendErrorToBackend(err, `status_update_failure_id_${c.id}`); // Log this specific error
                      toast.error('Failed to update status');
                    }
                  }}
                >
                  {['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select><br />

                <small>📧 Email: {c.email}</small><br />
                {c.phone && <small>📞 Phone: {c.phone}</small>}<br />
                {c.experience_years !== null && (
                  <small>💼 Experience: {c.experience_years} {c.experience_years === 1 ? 'year' : 'years'}</small>
                )}<br />
                <small>🛠 Skills: {c.skills}</small><br />
                <small>📅 Added: {formatDate(c.created_at)}</small><br /><br />
                <div className="card-actions">
                  <button onClick={() => handleEdit(c)} title="Edit">✏️</button>
                  <button onClick={() => handleDelete(c.id)} title="Delete">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <Modal
        show={showForm}
        onClose={() => {
          setShowForm(false);
          setSelected(null);
        }}
      >
        <CandidateForm
          initial={selected}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
          }}
          onSubmitSuccess={handleFormSubmit}
        />
      </Modal>
    </Layout>
  );
};

export default Dashboard;