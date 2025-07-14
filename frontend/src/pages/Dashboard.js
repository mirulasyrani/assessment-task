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

const CANDIDATE_STATUSES = ['all', 'applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const logFrontendErrorToBackend = useCallback(async (error, context) => {
    try {
      const errorDetails = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        context,
        response_data: error.response?.data,
        response_status: error.response?.status,
        url: error.config?.url || window.location.href,
        method: error.config?.method || 'GET',
        timestamp: new Date().toISOString(),
      };
      console.warn('Sending frontend error log:', errorDetails);
      await API.post('/logs/frontend-error', errorDetails);
    } catch (logError) {
      console.error('Failed to send error log to backend:', logError);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(filter !== 'all' && { status: filter }),
        ...(search && { search }),
        sortBy,
      };

      const res = await API.get('/candidates', { params });
      console.log('📥 /candidates response:', res.data);

      if (Array.isArray(res.data)) {
        setCandidates(res.data);
      } else if (Array.isArray(res.data.data)) {
        setCandidates(res.data.data);
      } else if (Array.isArray(res.data.candidates)) {
        setCandidates(res.data.candidates);
      } else {
        console.warn('⚠️ Unexpected /candidates response format:', res.data);
        setCandidates([]);
      }
    } catch (err) {
      console.error('❌ Error fetching candidates:', err);
      logFrontendErrorToBackend(err, 'fetch_candidates_failure');
      toast.error('Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  }, [filter, search, sortBy, logFrontendErrorToBackend]);

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchCandidates();
    }, 300);
    return () => clearTimeout(debounceFetch);
  }, [fetchCandidates]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    try {
      setLoading(true);
      await API.delete(`/candidates/${id}`);
      toast.info('Candidate deleted successfully!');
      fetchCandidates();
    } catch (err) {
      console.error('❌ Error deleting candidate:', err);
      logFrontendErrorToBackend(err, `delete_candidate_failure_id_${id}`);
      toast.error('Failed to delete candidate.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate);
    setShowFormModal(true);
  };

  const handleFormSubmitSuccess = () => {
    setShowFormModal(false);
    setSelectedCandidate(null);
    fetchCandidates();
    toast.success('Candidate saved successfully!');
  };

  const handleStatusChange = async (candidateId, newStatus) => {
    const originalCandidates = [...candidates];
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
    );

    try {
      const res = await API.get(`/candidates/${candidateId}`);
      const currentCandidateData = res.data;

      const updatedCandidatePayload = {
        ...currentCandidateData,
        status: newStatus,
        name: currentCandidateData.name || '',
        email: currentCandidateData.email || '',
        position: currentCandidateData.position || '',
        skills: currentCandidateData.skills || '',
        notes: currentCandidateData.notes || '',
        phone: currentCandidateData.phone || '',
        experience_years: Number(currentCandidateData.experience_years) || 0,
      };

      await API.put(`/candidates/${candidateId}`, updatedCandidatePayload);
      toast.success('Candidate status updated!');
      fetchCandidates();
    } catch (err) {
      console.error('🔥 Error updating status:', err?.response?.data || err);
      logFrontendErrorToBackend(err, `status_update_failure_id_${candidateId}`);
      toast.error('Failed to update status.');
      setCandidates(originalCandidates);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4 }}
        className="dashboard-container"
      >
        <h1 className="dashboard-title">Candidate Dashboard</h1>
        <CandidateSummaryCards />

        <div className="dashboard-controls-section">
          <div className="search-sort-group">
            <input
              type="text"
              placeholder="Search by name, position, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              aria-label="Search candidates"
            />

            <label className="sort-label">
              Sort by:
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
                aria-label="Sort candidates by"
              >
                <option value="date">Date (Newest)</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </label>
          </div>

          <div className="filter-add-group">
            {CANDIDATE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <button className="add-candidate-btn" onClick={() => setShowFormModal(true)}>+ Add Candidate</button>
          </div>
        </div>

        <p className="candidate-count">
          <strong>{loading ? 'Fetching...' : candidates.length}</strong> candidates found
          {filter !== 'all' && ` in "${filter}" status.`}
        </p>

        {loading ? (
          <Loader />
        ) : !Array.isArray(candidates) ? (
          <p className="error-message">⚠️ Unexpected data format. Please contact support.</p>
        ) : candidates.length === 0 ? (
          <p className="no-candidates-message">No candidates match your criteria. Try changing filters or add a new one.</p>
        ) : (
          <ul className="candidate-list">
            {candidates.map((c) => (
              <li className="candidate-card" key={c.id}>
                <div className="card-header">
                  <h3 className="candidate-name">{c.name}</h3>
                  <span className={`status-badge status-${c.status}`}>{c.status}</span>
                </div>
                <p className="candidate-position">{c.position}</p>

                <div className="status-update-group">
                  <label htmlFor={`status-${c.id}`} className="visually-hidden">Update status for {c.name}</label>
                  <select
                    id={`status-${c.id}`}
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    className="candidate-status-select"
                  >
                    {CANDIDATE_STATUSES.filter((s) => s !== 'all').map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="candidate-details">
                  {c.email && <p><small>📧 Email: {c.email}</small></p>}
                  {c.phone && <p><small>📞 Phone: {c.phone}</small></p>}
                  {c.experience_years !== null && (
                    <p><small>💼 Experience: {c.experience_years} {c.experience_years === 1 ? 'year' : 'years'}</small></p>
                  )}
                  {c.skills && <p><small>🛠 Skills: {c.skills}</small></p>}
                  {c.created_at && <p><small>📅 Added: {formatDate(c.created_at)}</small></p>}
                </div>

                <div className="card-actions">
                  <button onClick={() => handleEdit(c)} title="Edit Candidate">✏️</button>
                  <button onClick={() => handleDelete(c.id)} title="Delete Candidate">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <Modal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedCandidate(null);
        }}
        ariaLabelledBy="candidate-form-title"
        ariaDescribedBy="candidate-form-description"
      >
        <CandidateForm
          initial={selectedCandidate}
          onClose={() => {
            setShowFormModal(false);
            setSelectedCandidate(null);
          }}
          onSubmitSuccess={handleFormSubmitSuccess}
        />
      </Modal>
    </Layout>
  );
};

export default Dashboard;
