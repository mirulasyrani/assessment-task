import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import API from '../services/api';
import CandidateForm from '../components/CandidateForm';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatDate';
import { toast } from 'react-toastify';
import CandidateSummaryCards from '../components/CandidateSummaryCards'; // Assuming this component fetches its own summary

// Define available statuses (should match your backend enum)
const CANDIDATE_STATUSES = ['all', 'applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']; // Added 'withdrawn'

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' for created_at (newest), 'name' for alphabetical
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Renamed for clarity
  const [showFormModal, setShowFormModal] = useState(false); // Renamed for clarity
  const [loading, setLoading] = useState(false);

  // --- Utility for Frontend Error Logging ---
  const logFrontendErrorToBackend = useCallback(async (error, context) => {
    try {
      const errorDetails = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        context: context,
        // Safely access properties from Axios error objects
        response_data: error.response?.data,
        response_status: error.response?.status,
        url: error.config?.url || window.location.href, // Fallback to current URL
        method: error.config?.method || 'GET', // Fallback method
        timestamp: new Date().toISOString(),
      };
      console.warn('Sending frontend error log:', errorDetails);
      await API.post('/logs/frontend-error', errorDetails);
    } catch (logError) {
      console.error('Failed to send error log to backend:', logError);
    }
  }, []);

  // --- Fetch Candidates Function ---
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      // ⭐ RECOMMENDED: Modify to use backend for filtering, searching, and sorting
      // This assumes your backend has query parameters for these operations
      const params = {
        ...(filter !== 'all' && { status: filter }), // Add status filter if not 'all'
        ...(search && { search: search }),           // Add search query if not empty
        sortBy: sortBy,                              // Add sort by parameter
      };

      // Axios automatically handles query parameters from `params` object
      const res = await API.get('/candidates', { params });

      // If backend handles filtering/sorting, no need for client-side .filter/.sort
      setCandidates(res.data);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      logFrontendErrorToBackend(err, 'fetch_candidates_failure');
      toast.error('Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  }, [filter, search, sortBy, logFrontendErrorToBackend]);

  // --- Debounce search and filter changes ---
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchCandidates();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceFetch);
  }, [fetchCandidates]); // Re-run effect when fetchCandidates changes (due to its dependencies)

  // --- CRUD Operations ---

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true); // Show loading while deleting
      await API.delete(`/candidates/${id}`);
      toast.info('Candidate deleted successfully!');
      fetchCandidates(); // Re-fetch all candidates to update the list
    } catch (err) {
      console.error('Error deleting candidate:', err);
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

  // Callback after form submission (add/edit)
  const handleFormSubmitSuccess = () => {
    setShowFormModal(false);
    setSelectedCandidate(null); // Clear selected candidate state
    fetchCandidates(); // Re-fetch candidates to reflect changes
    toast.success('Candidate saved successfully!');
  };

  // Helper for updating status inline
  const handleStatusChange = async (candidateId, newStatus) => {
    // Optimistic update: Update UI first for responsiveness, then confirm with backend
    const originalCandidates = [...candidates]; // Store current state for rollback
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
    
    try {
      // Fetch the full candidate data to ensure all required fields are sent for PUT request
      // This avoids issues if the current `candidates` state is a partial view
      const res = await API.get(`/candidates/${candidateId}`);
      const currentCandidateData = res.data;

      // Construct payload for PUT request, ensuring all required fields are present
      const updatedCandidatePayload = {
        ...currentCandidateData, // Spread all existing fields
        status: newStatus,       // Override the status
        // Ensure other non-nullable fields are not sent as null if they were fetched as null
        // (though backend validation should handle this if not nullable)
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
      // No need to fetchCandidates() if optimistic update was successful
      // Unless you want to ensure the list is consistent with backend immediately after update
      // For simplicity, re-fetch for now to update summary cards and re-sort if status affects order
      fetchCandidates(); 

    } catch (err) {
      console.error('🔥 Error updating status:', err?.response?.data || err);
      logFrontendErrorToBackend(err, `status_update_failure_id_${candidateId}`);
      toast.error('Failed to update status.');
      // Rollback UI on error
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
        className="dashboard-container" // Add a class for dashboard specific layout
      >
        <h1 className="dashboard-title">Candidate Dashboard</h1> {/* Use h1 for main page title */}

        {/* Candidate Summary Cards - Assuming this component fetches its own data */}
        <CandidateSummaryCards />

        {/* Controls Section: Search, Sort, Add Candidate */}
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

          {/* Filter Buttons & Add Candidate Button */}
          <div className="filter-add-group">
            {CANDIDATE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} {/* Capitalize status */}
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
        ) : candidates.length === 0 ? (
          <p className="no-candidates-message">No candidates match your criteria. Try changing filters or add a new one.</p>
        ) : (
          <ul className="candidate-list"> {/* Added class for styling */}
            {candidates.map((c) => (
              <li className="candidate-card" key={c.id}> {/* Changed from 'card' to 'candidate-card' for specificity */}
                <div className="card-header">
                    <h3 className="candidate-name">{c.name}</h3>
                    <span className={`status-badge status-${c.status}`}>{c.status}</span> {/* Re-added status badge */}
                </div>
                <p className="candidate-position">{c.position}</p>

                {/* Status Update Dropdown */}
                <div className="status-update-group">
                  <label htmlFor={`status-${c.id}`} className="visually-hidden">Update status for {c.name}</label>
                  <select
                    id={`status-${c.id}`}
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    className="candidate-status-select"
                  >
                    {CANDIDATE_STATUSES.filter(s => s !== 'all').map((s) => ( // Exclude 'all' from status options
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)} {/* Capitalize option text */}
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

      {/* Modal for Add/Edit Candidate Form */}
      <Modal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedCandidate(null); // Clear selected candidate on close
        }}
        ariaLabelledBy="candidate-form-title" // ID of the h2/h3 inside CandidateForm
        ariaDescribedBy="candidate-form-description" // Optional: ID of a description
      >
        <CandidateForm
          initialData={selectedCandidate} // Renamed for clarity
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