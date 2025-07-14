import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { candidateSchema } from '../validation/candidateSchema';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];

const CandidateForm = ({ initial, onClose, onSubmitSuccess }) => {
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState(
    initial ?? {
      name: '',
      email: '',
      phone: '',
      position: '',
      skills: '',
      experience_years: '',
      status: 'applied',
      notes: '',
    }
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        experience_years: initial.experience_years !== null ? String(initial.experience_years) : '',
        notes: initial.notes || '',
      });
    } else {
      setForm({
        name: '', email: '', phone: '', position: '', skills: '',
        experience_years: '', status: 'applied', notes: '',
      });
    }
    setErrors({});
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'experience_years' ? value.replace(/[^\d]/g, '') : value,
    }));
  };

  const handleBlur = async (field) => {
    try {
      await candidateSchema.pick({ [field]: true }).parseAsync({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (e) {
      const msg = e?.issues?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!user && !authLoading) {
      toast.error('You must be logged in to submit candidates.');
      console.warn('🚫 Unauthorized submission attempt');
      setLoading(false);
      return;
    }

    try {
      const parsedData = await candidateSchema.parseAsync(form);

      if (initial) {
        await API.put(`/candidates/${initial.id}`, parsedData);
        toast.success('✅ Candidate updated successfully!');
      } else {
        await API.post('/candidates', parsedData);
        toast.success('🎉 Candidate added successfully!');
        setForm({
          name: '', email: '', phone: '', position: '', skills: '',
          experience_years: '', status: 'applied', notes: '',
        });
      }

      onSubmitSuccess();
    } catch (err) {
      if (err?.name === 'ZodError') {
        const zodErrors = {};
        const messages = ['Please correct the following errors:'];

        err.issues.forEach(({ message, path }) => {
          const field = path[0];
          zodErrors[field] = message;
          messages.push(`• ${message}`);
        });

        setErrors(zodErrors);
        toast.error(messages.join('\n'), {
          autoClose: false,
          style: { whiteSpace: 'pre-line' },
        });
      } else if (err?.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else {
        console.error('🔥 Form submission error:', err);
        API.post('/logs/frontend-error', {
          context: 'CandidateForm Submission',
          message: err.message || 'An unknown error occurred.',
          stack: err.stack,
          url: window.location.href,
          method: initial ? 'PUT' : 'POST',
          response_status: err.response?.status,
          response_data: err.response?.data,
          timestamp: new Date().toISOString(),
        });
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="candidate-form" noValidate>
      <label htmlFor="candidate-name">
        Name<span className="required-star">*</span>
        <input
          id="candidate-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={() => handleBlur('name')}
          disabled={loading}
          placeholder="e.g., John Doe"
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-invalid={!!errors.name}
        />
        {errors.name && <small id="name-error" role="alert" className="error-message">{errors.name}</small>}
      </label>

      <label htmlFor="candidate-email">
        Email<span className="required-star">*</span>
        <input
          id="candidate-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          onBlur={() => handleBlur('email')}
          disabled={loading}
          placeholder="e.g., john.doe@example.com"
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && <small id="email-error" role="alert" className="error-message">{errors.email}</small>}
      </label>

      <label htmlFor="candidate-phone">
        Phone (Optional)
        <input
          id="candidate-phone"
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={() => handleBlur('phone')}
          disabled={loading}
          placeholder="e.g., +60123456789 or 0123456789"
          aria-describedby={errors.phone ? "phone-error" : undefined}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && <small id="phone-error" role="alert" className="error-message">{errors.phone}</small>}
      </label>

      <label htmlFor="candidate-position">
        Position<span className="required-star">*</span>
        <input
          id="candidate-position"
          name="position"
          value={form.position}
          onChange={handleChange}
          onBlur={() => handleBlur('position')}
          disabled={loading}
          placeholder="e.g., Software Engineer, Project Manager"
          aria-describedby={errors.position ? "position-error" : undefined}
          aria-invalid={!!errors.position}
        />
        {errors.position && <small id="position-error" role="alert" className="error-message">{errors.position}</small>}
      </label>

      <label htmlFor="candidate-skills">
        Skills (comma-separated, Optional)
        <input
          id="candidate-skills"
          name="skills"
          value={form.skills}
          onChange={handleChange}
          onBlur={() => handleBlur('skills')}
          disabled={loading}
          placeholder="e.g., React, Node.js, SQL"
          aria-describedby={errors.skills ? "skills-error" : undefined}
          aria-invalid={!!errors.skills}
        />
        {errors.skills && <small id="skills-error" role="alert" className="error-message">{errors.skills}</small>}
      </label>

      <label htmlFor="candidate-experience">
        Years of Experience (Optional)
        <input
          id="candidate-experience"
          type="number"
          name="experience_years"
          value={form.experience_years}
          onChange={handleChange}
          onBlur={() => handleBlur('experience_years')}
          disabled={loading}
          min="0"
          max="50"
          placeholder="e.g., 5"
          aria-describedby={errors.experience_years ? "experience-years-error" : undefined}
          aria-invalid={!!errors.experience_years}
        />
        {errors.experience_years && <small id="experience-years-error" role="alert" className="error-message">{errors.experience_years}</small>}
      </label>

      <label htmlFor="candidate-status">
        Status<span className="required-star">*</span>
        <select
          id="candidate-status"
          name="status"
          value={form.status}
          onChange={handleChange}
          onBlur={() => handleBlur('status')}
          disabled={loading}
          aria-describedby={errors.status ? "status-error" : undefined}
          aria-invalid={!!errors.status}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
        {errors.status && <small id="status-error" role="alert" className="error-message">{errors.status}</small>}
      </label>

      <label htmlFor="candidate-notes">
        Notes (Optional)
        <textarea
          id="candidate-notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          disabled={loading}
          rows="3"
          placeholder="e.g., Strong communication skills, interviewed well."
          aria-describedby={errors.notes ? "notes-error" : undefined}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && <small id="notes-error" role="alert" className="error-message">{errors.notes}</small>}
      </label>

      <div className="form-actions">
        <button type="submit" disabled={loading || authLoading} className="btn btn-primary">
          {loading ? (initial ? 'Updating...' : 'Adding...') : initial ? 'Update Candidate' : 'Add Candidate'}
        </button>
        <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CandidateForm;
