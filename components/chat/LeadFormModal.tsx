"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface LeadFormData {
  fullName: string;
  email: string;
  company: string;
  phone: string;
}

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
}

export function LeadFormModal({ isOpen, onClose, onSubmit }: LeadFormModalProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    email: '',
    company: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({ fullName: '', email: '', company: '', phone: '' });
    setError(null);
    onClose();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validation
    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitSuccess(true);
      // Auto-close after 2 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormData({ fullName: '', email: '', company: '', phone: '' });
        onClose();
      }, 2000);
    } catch (err) {
      setError('Submission failed. Please try again.');
      console.error('Lead form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not open, render null
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-[#111827] border border-violet-500/30 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Success state */}
        {submitSuccess ? (
          <div className="text-center py-8">
            <p className="text-lg text-violet-400 font-semibold">Thank you! We'll be in touch.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Get Your Free Consultation</h2>
            <p className="text-sm text-gray-400 mb-4">Share your details to receive personalized recommendations.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}