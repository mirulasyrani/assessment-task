import React, { useState } from 'react';
import API from '../services/api';
import { candidateSchema } from '../validation/schemas';
import { toast } from 'react-toastify';

const CandidateForm = ({ initial, onClose, onSubmitSuccess }) => {
  const [form, setForm] = useState(
    initial || {
      name: '',
      email: '',
      phone: '',
      position: '',
      skills: '',
      experience_years: '',
      status: 'applied',
      notes: ''
    }
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'experience_years' ? Number(value) : value,
    }));
  };

  const handleBlur = (field) => {
    try {
      candidateSchema.pick({ [field]: true }).parse({ [field]: form[field] });
      setErrors((prev) => ({ ...prev, [field]: '' }));
    } catch (e) {
      const message = e?.errors?.[0]?.message || 'Invalid input';
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      candidateSchema.parse(form);

      if (initial) {
        await API.put(`/candidates/${initial.id}`, form);
        toast.success('Candidate updated');
      } else {
        await API.post('/candidates', form);
        toast.success('Candidate added');
      }

      onSubmitSuccess();
    } catch (err) {
      if (err.name === 'ZodError') {
        const fieldErrors = {};
        err.errors.forEach((e) => {
          const message = e?.message || 'Invalid input';
          fieldErrors[e?.path?.[0] || 'unknown'] = message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        placeholder="Candidate Name"
        value={form.name}
        onChange={handleChange}
        onBlur={() => handleBlur('name')}
      />
      {errors.name && <small>{errors.name}</small>}<br />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        onBlur={() => handleBlur('email')}
      />
      {errors.email && <small>{errors.email}</small>}<br />

      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
        onBlur={() => handleBlur('phone')}
      />
      {errors.phone && <small>{errors.phone}</small>}<br />

      <input
        name="position"
        placeholder="Position"
        value={form.position}
        onChange={handleChange}
        onBlur={() => handleBlur('position')}
      />
      {errors.position && <small>{errors.position}</small>}<br />

      <input
        name="skills"
        placeholder="Skills (comma-separated)"
        value={form.skills}
        onChange={handleChange}
        onBlur={() => handleBlur('skills')}
      />
      {errors.skills && <small>{errors.skills}</small>}<br />

      <input
        type="number"
        name="experience_years"
        placeholder="Years of Experience"
        value={form.experience_years}
        onChange={handleChange}
        onBlur={() => handleBlur('experience_years')}
      />
      {errors.experience_years && <small>{errors.experience_years}</small>}<br />

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        onBlur={() => handleBlur('status')}
      >
        <option value="applied">Applied</option>
        <option value="screening">Screening</option>
        <option value="interview">Interview</option>
        <option value="offer">Offer</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
      </select>
      {errors.status && <small>{errors.status}</small>}<br />

      <textarea
        name="notes"
        placeholder="Notes (optional)"
        value={form.notes || ''}
        onChange={handleChange}
      />

      <button type="submit" disabled={loading}>
        {loading ? (initial ? 'Updating...' : 'Adding...') : (initial ? 'Update' : 'Add')}
      </button>
      <button type="button" onClick={onClose} style={{ marginLeft: '8px' }}>
        Cancel
      </button>
    </form>
  );
};

export default CandidateForm;
