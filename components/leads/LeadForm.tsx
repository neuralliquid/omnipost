/**
 * Lead Form Component
 * Form for creating and editing leads
 */

'use client';

import React, { useState } from 'react';
import type { Lead, CreateLeadInput, LeadSource } from '@/types/lead';
import styles from '@/styles/Leads.module.css';

/**
 * ReDoS-safe email validation for client-side
 * Matches the server-side validation in app/api/_utils/validation.ts
 */
function validateEmailFormat(email: string): boolean {
  // Length check to prevent DoS
  if (email.length > 254) {
    return false;
  }

  // Simple validation: must have exactly one @, something before and after, and a dot after @
  const atIndex = email.indexOf('@');
  const lastAtIndex = email.lastIndexOf('@');

  if (atIndex < 1 || atIndex !== lastAtIndex || atIndex >= email.length - 1) {
    return false;
  }

  const domain = email.slice(atIndex + 1);
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  return true;
}

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: CreateLeadInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'linkedin_sales_navigator', label: 'LinkedIn Sales Navigator' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'content_engagement', label: 'Content Engagement' },
  { value: 'survey', label: 'Survey' },
  { value: 'form', label: 'Form' },
  { value: 'event', label: 'Event' },
  { value: 'import', label: 'Import' },
  { value: 'manual', label: 'Manual Entry' },
  { value: 'other', label: 'Other' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

export const LeadForm: React.FC<LeadFormProps> = ({ lead, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    title: lead?.title || '',
    email: lead?.contact.email || '',
    phone: lead?.contact.phone || '',
    linkedinUrl: lead?.contact.linkedinUrl || '',
    twitterHandle: lead?.contact.twitterHandle || '',
    website: lead?.contact.website || '',
    companyName: lead?.company?.name || '',
    companyIndustry: lead?.company?.industry || '',
    companySize: lead?.company?.size || '',
    companyWebsite: lead?.company?.website || '',
    companyLocation: lead?.company?.location || '',
    source: lead?.source || ('manual' as LeadSource),
    sourceDetails: lead?.sourceDetails || '',
    notes: lead?.notes || '',
    tags: lead?.tags.join(', ') || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Type alias for form element change events (HTMLSelectElement requires eslint exception)
  type FormChangeEvent = React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement // eslint-disable-line no-undef
  >;

  const handleChange = (e: FormChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.email && !validateEmailFormat(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.linkedinUrl && !formData.linkedinUrl.includes('linkedin.com')) {
      newErrors.linkedinUrl = 'Invalid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CreateLeadInput = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      title: formData.title.trim() || undefined,
      contact: {
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        linkedinUrl: formData.linkedinUrl.trim() || undefined,
        twitterHandle: formData.twitterHandle.trim() || undefined,
        website: formData.website.trim() || undefined,
      },
      company: formData.companyName
        ? {
            name: formData.companyName.trim(),
            industry: formData.companyIndustry.trim() || undefined,
            size: formData.companySize || undefined,
            website: formData.companyWebsite.trim() || undefined,
            location: formData.companyLocation.trim() || undefined,
          }
        : undefined,
      source: formData.source,
      sourceDetails: formData.sourceDetails.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      tags: formData.tags
        ? formData.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        : undefined,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.leadForm}>
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Contact Information</h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.label}>
              First Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
              placeholder="John"
            />
            {errors.firstName && <span className={styles.errorMessage}>{errors.firstName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.label}>
              Last Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
              placeholder="Doe"
            />
            {errors.lastName && <span className={styles.errorMessage}>{errors.lastName}</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Job Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            placeholder="VP of Marketing"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="john@company.com"
            />
            {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.label}>
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={styles.input}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="linkedinUrl" className={styles.label}>
              LinkedIn URL
            </label>
            <input
              type="url"
              id="linkedinUrl"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              className={`${styles.input} ${errors.linkedinUrl ? styles.inputError : ''}`}
              placeholder="https://linkedin.com/in/johndoe"
            />
            {errors.linkedinUrl && (
              <span className={styles.errorMessage}>{errors.linkedinUrl}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="twitterHandle" className={styles.label}>
              Twitter Handle
            </label>
            <input
              type="text"
              id="twitterHandle"
              name="twitterHandle"
              value={formData.twitterHandle}
              onChange={handleChange}
              className={styles.input}
              placeholder="@johndoe"
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Company Information</h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="companyName" className={styles.label}>
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className={styles.input}
              placeholder="Acme Inc."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="companyIndustry" className={styles.label}>
              Industry
            </label>
            <input
              type="text"
              id="companyIndustry"
              name="companyIndustry"
              value={formData.companyIndustry}
              onChange={handleChange}
              className={styles.input}
              placeholder="Technology"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="companySize" className={styles.label}>
              Company Size
            </label>
            <select
              id="companySize"
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Select size...</option>
              {COMPANY_SIZE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="companyLocation" className={styles.label}>
              Location
            </label>
            <input
              type="text"
              id="companyLocation"
              name="companyLocation"
              value={formData.companyLocation}
              onChange={handleChange}
              className={styles.input}
              placeholder="San Francisco, CA"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="companyWebsite" className={styles.label}>
            Company Website
          </label>
          <input
            type="url"
            id="companyWebsite"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleChange}
            className={styles.input}
            placeholder="https://acme.com"
          />
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Lead Details</h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="source" className={styles.label}>
              Source <span className={styles.required}>*</span>
            </label>
            <select
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              className={styles.select}
            >
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sourceDetails" className={styles.label}>
              Source Details
            </label>
            <input
              type="text"
              id="sourceDetails"
              name="sourceDetails"
              value={formData.sourceDetails}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g., LinkedIn Sales Navigator search"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tags" className={styles.label}>
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className={styles.input}
            placeholder="prospect, enterprise, q4-target (comma separated)"
          />
          <span className={styles.helpText}>Separate multiple tags with commas</span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes" className={styles.label}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className={styles.textarea}
            rows={4}
            placeholder="Add any notes about this lead..."
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
};

export default LeadForm;
