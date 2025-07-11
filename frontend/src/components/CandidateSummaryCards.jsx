import React, { useEffect, useState } from 'react';
import API from '../services/api';
import './CandidateSummaryCards.css'; // Optional CSS file

const statuses = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

const CandidateSummaryCards = () => {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await API.get('/candidates');
        const data = res.data;

        const counts = { total: data.length };
        statuses.forEach(status => {
          counts[status] = data.filter(c => c.status === status).length;
        });

        setSummary(counts);
      } catch (err) {
        console.error('Failed to fetch summary', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <p>Loading summary...</p>;

  return (
    <div className="summary-cards">
      <div className="card total">Total: {summary.total}</div>
      {statuses.map((status) => (
        <div key={status} className={`card ${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}: {summary[status]}
        </div>
      ))}
    </div>
  );
};

export default CandidateSummaryCards;
