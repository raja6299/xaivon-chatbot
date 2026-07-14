"use client";

import React, { useState, useCallback } from 'react';

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

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export function LeadFormModal({ isOpen, onClose, onSubmit }: LeadFormModalProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    email: '',
    company: '',
    phone: '',
  });
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});

  const validateField = useCallback((name: keyof LeadFormData, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
        return '';
      default:
        return '';
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof LeadFormData]) {
      const error = validateField(name as keyof LeadFormData, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof LeadFormData, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleClose = () => {
    setFormData({ fullName: '', email: '', company: '', phone: '' });
    setFormStatus('idle');
    setErrorMessage('');
    setFieldErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const errors: Partial<Record<keyof LeadFormData, string>> = {};
    errors.fullName = validateField('fullName', formData.fullName);
    errors.email = validateField('email', formData.email);
    setFieldErrors(errors);

    if (errors.fullName || errors.email) return;

    setFormStatus('submitting');
    try {
      await onSubmit(formData);
      setFormStatus('success');
      setTimeout(() => {
        setFormData({ fullName: '', email: '', company: '', phone: '' });
        setFormStatus('idle');
        setFieldErrors({});
        onClose();
      }, 2500);
    } catch {
      setFormStatus('error');
      setErrorMessage('Submission failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="lead-form-overlay" role="dialog" aria-modal="true" aria-label="Consultation form">
      <div className="w-full max-w-[340px] mx-3 animate-slide-up">
        <div className="bg-[#111827]/95 border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/5 overflow-hidden">

          {/* Form Header */}
          <div className="px-5 pt-5 pb-3 border-b border-violet-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-sm">Get Your Free Consultation</h2>
                <p className="text-slate-400 text-[11px] mt-0.5">We&apos;ll get back to you within 24 hours.</p>
              </div>
              <button
                onClick={handleClose}
                disabled={formStatus === 'submitting'}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-40"
                aria-label="Close form"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="px-5 py-4 max-h-[55vh] overflow-y-auto scrollbar-thin">
            {formStatus === 'success' ? (
              <div className="text-center py-6 animate-fade-in-up">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <p className="text-white font-semibold text-sm">Thank you!</p>
                <p className="text-slate-400 text-xs mt-1">Our team will reach out soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {/* Full Name */}
                <div>
                  <label htmlFor="lead-fullName" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name <span className="text-violet-400">*</span>
                  </label>
                  <input
                    id="lead-fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={formStatus === 'submitting'}
                    placeholder="John Smith"
                    className={`w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-slate-600 transition-all duration-200 outline-none border ${
                      fieldErrors.fullName
                        ? 'border-red-500/50 focus:ring-1 focus:ring-red-500/30'
                        : 'border-violet-500/10 focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20'
                    } disabled:opacity-40`}
                    autoComplete="name"
                  />
                  {fieldErrors.fullName && (
                    <p className="text-red-400 text-[10px] mt-1 ml-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="lead-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email <span className="text-violet-400">*</span>
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={formStatus === 'submitting'}
                    placeholder="john@company.com"
                    className={`w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-slate-600 transition-all duration-200 outline-none border ${
                      fieldErrors.email
                        ? 'border-red-500/50 focus:ring-1 focus:ring-red-500/30'
                        : 'border-violet-500/10 focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20'
                    } disabled:opacity-40`}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-400 text-[10px] mt-1 ml-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="lead-company" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company
                  </label>
                  <input
                    id="lead-company"
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={formStatus === 'submitting'}
                    placeholder="Acme Inc."
                    className="w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-slate-600 transition-all duration-200 outline-none border border-violet-500/10 focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 disabled:opacity-40"
                    autoComplete="organization"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="lead-phone" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    id="lead-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={formStatus === 'submitting'}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-slate-600 transition-all duration-200 outline-none border border-violet-500/10 focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20 disabled:opacity-40"
                    autoComplete="tel"
                  />
                </div>

                {/* Error */}
                {formStatus === 'error' && (
                  <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/20 rounded-xl px-3 py-2.5 animate-fade-in-up">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                    <span className="text-red-300 text-xs">{errorMessage}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium text-sm py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 disabled:opacity-50 disabled:hover:from-violet-600 disabled:hover:to-purple-600 flex items-center justify-center gap-2"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Schedule Consultation
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}