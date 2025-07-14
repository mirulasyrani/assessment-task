import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Loader from './Loader';
import './CandidateSummaryCards.css';

const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
];

// 🔁 Memoized status formatter
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
        setError('');

        const res = await API.get('/candidates/summary');
        let data = res.data;

        // If response is wrapped with a `data` key
        if (data && typeof data === 'object' && 'data' in data && typeof data.data === 'object') {
          data = data.data;
        }

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from backend.');
        }

        const normalized = Object.fromEntries(
          STATUS_OPTIONS.map((status) => [status, data[status] || 0])
        );

        // Compute total from values if not provided
        const total =
          typeof data.total === 'number'
            ? data.total
            : Object.values(normalized).reduce((sum, val) => sum + val, 0);

        setSummary({ ...normalized, total });
      } catch (err) {
        console.error('❌ Failed to fetch candidate summary:', err);
        setError('Failed to load candidate summary. Please try again later.');

        await API.post('/logs/frontend-error', {
          context: 'CandidateSummaryCards Fetch Summary',
          message: err.message || 'Unknown error',
          stack: err.stack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }).catch(console.error);

        setSummary({});
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <Loader />;
  if (error) return <p className="error-message" role="alert">{error}</p>;
  if ((summary.total ?? 0) === 0) return <p className="no-data-message">No candidates available to summarize.</p>;

  return (
    <div className="candidate-summary-cards-container" aria-label="Candidate Pipeline Summary">
      <h2 className="summary-title">Candidate Pipeline Summary</h2>
      <div className="summary-cards-grid">
        <div
          className="summary-card total"
          tabIndex="0"
          role="region"
          aria-label={`Total candidates: ${summary.total}`}
        >
          <span className="card-label">Total Candidates:</span>
          <span className="card-value">{summary.total}</span>
        </div>

        {STATUS_OPTIONS.map((status) => (
          <div
            key={status}
            className={`summary-card status-${status}`}
            tabIndex="0"
            role="region"
            aria-label={`${formatStatus(status)}: ${summary[status]}`}
          >
            <span className="card-label">{formatStatus(status)}:</span>
            <span className="card-value">{summary[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateSummaryCards;
