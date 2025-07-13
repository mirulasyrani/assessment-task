import React, { useState, useEffect } from 'react';
import API from '../services/api';
// ✅ Import shared schema for consistent validation
import { candidateSchema } from '../validation/candidateSchema';
import { toast } from 'react-toastify';
// import CustomError from '../utils/customError'; // Removed: Defined but never used.

// Define status options directly in the component or from a shared constant
const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];

/**
 * Reusable form component for creating and updating candidate records.
 * Handles form state, client-side Zod validation, and API interactions.
 *
 * @param {Object} props
 * @param {Object} [props.initial] - Initial candidate data for editing. If null, it's a create form.
 * @param {Function} props.onClose - Callback function to close the form/modal.
 * @param {Function} props.onSubmitSuccess - Callback function to run after successful form submission.
 */
const CandidateForm = ({ initial, onClose, onSubmitSuccess }) => {
  // Initialize form state with initial data or default empty values
  const [form, setForm] = useState(
    initial ?? {
      name: '',
      email: '',
      phone: '',
      position: '',
      skills: '',
      experience_years: '', // Zod will coerce this to number
      status: 'applied',
      notes: '',
    }
  );

  const [errors, setErrors] = useState({}); // State to hold validation errors
  const [loading, setLoading] = useState(false); // State for submission loading status

  // Effect to update form if initial data changes (e.g., when opening form for different candidate)
  useEffect(() => {
    if (initial) {
      // Ensure experience_years is a string for input type="number" value prop
      setForm({
        ...initial,
        experience_years: initial.experience_years !== null ? String(initial.experience_years) : '',
        // Notes can be null from backend, ensure it's an empty string for textarea
        notes: initial.notes || '',
      });
    } else {
      // Reset form if initial is null (for create mode)
      setForm({
        name: '', email: '', phone: '', position: '', skills: '',
        experience_years: '', status: 'applied', notes: '',
      });
    }
    setErrors({}); // Clear errors on initial data change
  }, [initial]);


  /**
   * Handles input changes, including a specific clean-up for experience_years.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'experience_years' ? value.replace(/[^\d]/g, '') : value,
    }));
  };

  /**
   * Performs real-time validation on blur using Zod's .pick() method for individual fields.
   * @param {string} field - The name of the field to validate.
   */
  const handleBlur = async (field) => {
    try {
      // Use parseAsync for async validation (e.g., if you later add async checks)
      await candidateSchema.pick({ [field]: true }).parseAsync({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' })); // Clear error for this field
    } catch (e) {
      // ZodError issues will have 'path' and 'message'
      const msg = e?.issues?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: msg })); // Set error message for this field
    }
  };

  /**
   * Handles form submission, performing full Zod validation and API call.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({}); // Clear previous errors on new submission attempt

    try {
      // Validate the entire form data against the shared schema
      // Zod's parseAsync will automatically handle type coercion (e.g., experience_years from string to number)
      const parsedData = await candidateSchema.parseAsync(form);

      if (initial) {
        // Update existing candidate
        await API.put(`/candidates/${initial.id}`, parsedData);
        toast.success('✅ Candidate updated successfully!');
      } else {
        // Create new candidate
        await API.post('/candidates', parsedData);
        toast.success('🎉 Candidate added successfully!');
        // Reset form for new entry after successful creation
        setForm({
          name: '', email: '', phone: '', position: '', skills: '',
          experience_years: '', status: 'applied', notes: '',
        });
      }

      onSubmitSuccess(); // Call success callback (e.g., to refresh list or close modal)
    } catch (err) {
      if (err?.name === 'ZodError') {
        // Handle Zod validation errors from client-side validation
        const zodErrors = {};
        const messages = ['Please correct the following errors:'];

        err.issues.forEach(({ message, path }) => {
          const field = path[0]; // Get the field name
          zodErrors[field] = message;
          messages.push(`• ${message}`);
        });

        setErrors(zodErrors); // Update state to display errors next to fields
        toast.error(messages.join('\n'), {
          autoClose: false, // Keep toast open until user closes it
          style: { whiteSpace: 'pre-line' }, // Preserve newlines in toast message
        });
      } else if (err?.response?.data?.message) {
        // Handle custom errors from backend (e.g., "Unauthorized")
        toast.error(`Error: ${err.response.data.message}`);
      } else {
        // Fallback for unexpected errors (network, server down, etc.)
        console.error('🔥 Form submission error:', err);
        // Log to backend for unhandled client-side errors
        API.post('/logs/frontend-error', {
          context: 'CandidateForm Submission',
          message: err.message || 'An unknown error occurred during form submission.',
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
      setLoading(false); // Always stop loading, regardless of success or failure
    }
  };

  return (
    <form onSubmit={handleSubmit} className="candidate-form" noValidate> {/* Added noValidate */}
      {/* Name Field */}
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

      {/* Email Field */}
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

      {/* Phone Field */}
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

      {/* Position Field */}
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

      {/* Skills Field */}
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

      {/* Years of Experience Field */}
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

      {/* Status Select Field */}
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
              {opt.charAt(0).toUpperCase() + opt.slice(1)} {/* Capitalize first letter */}
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
          placeholder="e.g., Strong communication skills, interviewed well."
          aria-describedby={errors.notes ? "notes-error" : undefined}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && <small id="notes-error" role="alert" className="error-message">{errors.notes}</small>}
      </label>

      {/* Form Actions */}
      <div className="form-actions">
        <button type="submit" disabled={loading} className="btn btn-primary">
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