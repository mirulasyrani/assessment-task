import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { candidateSchema } from '../validation/candidateSchema';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

// ✅ Move outside component to avoid redefinition on every render
const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  position: '',
  skills: '',
  experience_years: '',
  status: 'applied',
  notes: '',
};

const CandidateForm = ({ initial, onClose, onSubmitSuccess }) => {
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...EMPTY_FORM,
        ...initial,
        experience_years: initial.experience_years !== null ? String(initial.experience_years) : '',
        notes: initial.notes || '',
      };
    }
    return EMPTY_FORM;
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        ...EMPTY_FORM,
        ...initial,
        experience_years: initial.experience_years !== null ? String(initial.experience_years) : '',
        notes: initial.notes || '',
      });
    } else {
      setForm(EMPTY_FORM);
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
      console.warn('🚫 Unauthorized candidate submission attempt.');
      setLoading(false);
      return;
    }

    try {
      const parsed = await candidateSchema.parseAsync(form);

      if (initial) {
        await API.put(`/candidates/${initial.id}`, parsed);
        toast.success('✅ Candidate updated successfully!');
      } else {
        await API.post('/candidates', parsed);
        toast.success('🎉 Candidate added successfully!');
        setForm(EMPTY_FORM); // Reset form after success
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
      } else {
        console.error('🔥 Form submission error:', err);

        await API.post('/logs/frontend-error', {
          context: 'CandidateForm Submission',
          message: err.message || 'Unknown error',
          stack: err.stack,
          url: window.location.href,
          method: initial ? 'PUT' : 'POST',
          response_status: err.response?.status,
          response_data: err.response?.data,
          timestamp: new Date().toISOString(),
        });

        toast.error(err?.response?.data?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="candidate-form" noValidate>
      {/* Reusable Input Fields */}
      {[
        { id: 'name', label: 'Name', required: true, type: 'text' },
        { id: 'email', label: 'Email', required: true, type: 'email' },
        { id: 'phone', label: 'Phone (Optional)', type: 'tel' },
        { id: 'position', label: 'Position', required: true, type: 'text' },
        { id: 'skills', label: 'Skills (Optional)', type: 'text' },
        { id: 'experience_years', label: 'Years of Experience (Optional)', type: 'number', min: 0, max: 50 },
      ].map(({ id, label, required, ...rest }) => (
        <label key={id} htmlFor={`candidate-${id}`}>
          {label}{required && <span className="required-star">*</span>}
          <input
            id={`candidate-${id}`}
            name={id}
            value={form[id]}
            onChange={handleChange}
            onBlur={() => handleBlur(id)}
            disabled={loading}
            aria-invalid={!!errors[id]}
            aria-describedby={errors[id] ? `${id}-error` : undefined}
            placeholder={`e.g., ${label.includes('Email') ? 'john@example.com' : label}`}
            {...rest}
          />
          {errors[id] && (
            <small id={`${id}-error`} role="alert" className="error-message">
              {errors[id]}
            </small>
          )}
        </label>
      ))}

      {/* Status Dropdown */}
      <label htmlFor="candidate-status">
        Status<span className="required-star">*</span>
        <select
          id="candidate-status"
          name="status"
          value={form.status}
          onChange={handleChange}
          onBlur={() => handleBlur('status')}
          disabled={loading}
          aria-invalid={!!errors.status}
          aria-describedby={errors.status ? 'status-error' : undefined}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
        {errors.status && <small id="status-error" role="alert" className="error-message">{errors.status}</small>}
      </label>

      {/* Notes Textarea */}
      <label htmlFor="candidate-notes">
        Notes (Optional)
        <textarea
          id="candidate-notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          disabled={loading}
          rows="3"
          placeholder="e.g., Interviewed well, good culture fit."
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? 'notes-error' : undefined}
        />
        {errors.notes && (
          <small id="notes-error" role="alert" className="error-message">
            {errors.notes}
          </small>
        )}
      </label>

      {/* Form Actions */}
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
