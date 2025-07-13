// frontend\src\components\CandidateSummaryCards.jsx
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Loader from './Loader'; // Assuming you have this component
import './CandidateSummaryCards.css';
// import { toast } from 'react-toastify'; // Consider adding toast for error notifications

// These should match your CandidateStatus enum from candidateSchema.js
// If you modify the enum, update this array too.
const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn', // Added 'withdrawn' based on your latest schema
];

const formatStatus = (status) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const CandidateSummaryCards = () => {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        // ⭐ RECOMMENDED CHANGE: Call a dedicated backend summary endpoint
        // Example: If your backend has an endpoint like /api/candidates/summary
        const res = await API.get('/candidates/summary'); // <-- Change this API call
        const data = res.data; // Expected: { total: X, applied: Y, screening: Z, ... }

        // If the backend sends exact counts, you can directly set them
        // Ensure all STATUS_OPTIONS are initialized to 0 if the backend might omit them
        const initialCounts = STATUS_OPTIONS.reduce((acc, status) => {
          acc[status] = data[status] || 0;
          return acc;
        }, { total: data.total || 0 });

        setSummary(initialCounts);
      } catch (err) {
        console.error('❌ Failed to fetch summary from backend:', err);
        setError('Failed to load candidate summary. Please try again later.');
        // toast.error('Failed to load summary'); // Optional: Use toast notification
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <p className="error-message" role="alert">{error}</p>; // Added a specific class for error messages
  }

  // Ensure total is correctly displayed even if summary is empty or null
  if ((summary.total ?? 0) === 0) {
    return <p className="no-data-message">No candidates available to summarize.</p>; // Added specific class
  }

  return (
    <div className="candidate-summary-cards-container" aria-label="Candidate Summary Overview">
      <h2 className="summary-title">Candidate Pipeline Summary</h2>
      <div className="summary-cards-grid">
        {/* Total Card */}
        <div className="summary-card total" tabIndex="0" role="status">
          <span className="card-label">Total Candidates:</span>
          <span className="card-value">{summary.total ?? 0}</span>
        </div>

        {/* Status Cards */}
        {STATUS_OPTIONS.map((status) => (
          <div key={status} className={`summary-card status-${status}`} tabIndex="0" role="status">
            <span className="card-label">{formatStatus(status)}:</span>
            <span className="card-value">{summary[status] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateSummaryCards;