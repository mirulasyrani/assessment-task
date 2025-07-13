import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Loader from './Loader';
import './CandidateSummaryCards.css';
// import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
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

        const res = await API.get('/candidates/summary');
        const data = res.data;

        // ✅ Log backend response for debugging
        console.log('📊 Summary data from backend:', data);

        const initialCounts = STATUS_OPTIONS.reduce((acc, status) => {
          acc[status] = data[status] || 0;
          return acc;
        }, { total: data.total || 0 });

        setSummary(initialCounts);
      } catch (err) {
        console.error('❌ Failed to fetch summary from backend:', err);
        setError('Failed to load candidate summary. Please try again later.');
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
    return <p className="error-message" role="alert">{error}</p>;
  }

  if ((summary.total ?? 0) === 0) {
    return <p className="no-data-message">No candidates available to summarize.</p>;
  }

  return (
    <div className="candidate-summary-cards-container" aria-label="Candidate Summary Overview">
      <h2 className="summary-title">Candidate Pipeline Summary</h2>
      <div className="summary-cards-grid">
        <div className="summary-card total" tabIndex="0" role="status">
          <span className="card-label">Total Candidates:</span>
          <span className="card-value">{summary.total ?? 0}</span>
        </div>

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
