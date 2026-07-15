"use client";

import React, { useState, useEffect, useRef } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useTranslation } from '../../lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
type FieldName = keyof LeadFormData;

// ---------------------------------------------------------------------------
// Validation helpers (pure functions – no external deps)
// ---------------------------------------------------------------------------

/** Strip HTML tags from a string */
const stripHtml = (v: string): string => v.replace(/<[^>]*>/g, '');

/** Sanitise a raw input value: trim + strip HTML */
const sanitize = (v: string): string => stripHtml(v).trim();

/** Count letter characters (any script) */
const letterCount = (v: string): number => (v.match(/\p{L}/gu) ?? []).length;

/** Check if string is purely digits */
const isPureDigits = (v: string): boolean => /^\d+$/.test(v);

/** Check if string is purely non-letter / non-digit symbols */
const isPureSymbols = (v: string): boolean =>
  v.length > 0 && !/\p{L}/u.test(v) && !/\d/.test(v);

const NAME_RE = /^[a-zA-Z\s\-']+$/;
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

function validateField(name: FieldName, raw: string): string {
  const value = sanitize(raw);

  switch (name) {
    // ---- Full Name --------------------------------------------------------
    case 'fullName': {
      if (!value) return 'Please enter your full name.';
      if (value.length < 2) return 'Name must contain at least two letters.';
      if (value.length > 60) return 'Name is too long (maximum 60 characters).';
      if (!NAME_RE.test(value)) return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
      if (isPureDigits(value) || isPureSymbols(value) || letterCount(value) < 2)
        return 'Please enter a valid name.';
      return '';
    }

    // ---- Email ------------------------------------------------------------
    case 'email': {
      if (!value) return 'Please enter your email address.';
      if (!EMAIL_RE.test(value)) return 'Please enter a valid business email.';
      return '';
    }

    // ---- Company (NOW REQUIRED) -------------------------------------------
    case 'company': {
      if (!value) return 'Please enter your company name.';
      if (value.length < 2) return 'Company name looks incomplete.';
      if (value.length > 100) return 'Company name is too long (maximum 100 characters).';
      if (isPureDigits(value) || isPureSymbols(value) || letterCount(value) < 2)
        return 'Please enter a valid company name.';
      return '';
    }

    // ---- Phone (optional) -------------------------------------------------
    case 'phone': {
      if (!raw) return ''; // optional
      if (!isValidPhoneNumber(raw)) return 'Please enter a valid international phone number.';
      return '';
    }

    default:
      return '';
  }
}

/** Normalise phone for storage: keep E.164 format */
function normalizePhone(raw: string): string {
  // react-phone-number-input already gives us E.164 formatting
  return raw ? raw.trim() : '';
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#34d399"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ErrorXIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f87171"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeadFormModal({ isOpen, onClose, onSubmit }: LeadFormModalProps) {
  const { t } = useTranslation();

  // -- Form state -----------------------------------------------------------
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    email: '',
    company: '',
    phone: '',
  });
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  // -- Honeypot -------------------------------------------------------------
  const [honeypot, setHoneypot] = useState('');

  // -- Anti-bot render timestamp --------------------------------------------
  const renderTimestamp = useRef<number>(0);

  // -- Refs for focus management --------------------------------------------
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setFormData({ fullName: '', email: '', company: '', phone: '' });
    setFormStatus('idle');
    setErrorMessage('');
    setFieldErrors({});
    setTouched({});
    setHoneypot('');
    onClose();
  };

  // -- Reset everything when modal opens/closes -----------------------------
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ fullName: '', email: '', company: '', phone: '' });
      setFormStatus('idle');
      setErrorMessage('');
      setFieldErrors({});
      setTouched({});
      setHoneypot('');
      renderTimestamp.current = Date.now();

      // Focus first input after mount
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // -- Escape key closes modal ----------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && formStatus !== 'submitting') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formStatus]);

  // -- Focus trap -----------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'input:not([tabindex="-1"]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // -- Handlers -------------------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as FieldName;
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Live validation while typing for enterprise UX
    const error = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handlePhoneChange = (value?: string) => {
    const val = value || '';
    setFormData((prev) => ({ ...prev, phone: val }));
    const error = validateField('phone', val);
    setFieldErrors((prev) => ({ ...prev, phone: error }));
  };

  const handlePhoneBlur = () => {
    setTouched((prev) => ({ ...prev, phone: true }));
    const error = validateField('phone', formData.phone);
    setFieldErrors((prev) => ({ ...prev, phone: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as FieldName;
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // -- Honeypot check (silently succeed) --------------------------------
    if (honeypot) {
      setFormStatus('success');
      setTimeout(() => {
        handleClose();
      }, 2500);
      return;
    }

    // -- Speed check: if submitted within 2 s of render, silently succeed -
    if (Date.now() - renderTimestamp.current < 2000) {
      setFormStatus('success');
      setTimeout(() => {
        handleClose();
      }, 2500);
      return;
    }

    // -- Validate all fields ----------------------------------------------
    const fields: FieldName[] = ['fullName', 'email', 'company', 'phone'];
    const errors: Partial<Record<FieldName, string>> = {};
    const nowTouched: Partial<Record<FieldName, boolean>> = {};

    for (const field of fields) {
      errors[field] = validateField(field, formData[field]);
      nowTouched[field] = true;
    }

    setFieldErrors(errors);
    setTouched(nowTouched);

    if (errors.fullName || errors.email || errors.company || errors.phone) return;

    // -- Sanitise & normalise data ----------------------------------------
    const sanitizedData: LeadFormData = {
      fullName: sanitize(formData.fullName),
      email: sanitize(formData.email),
      company: sanitize(formData.company),
      phone: normalizePhone(formData.phone),
    };

    setFormStatus('submitting');
    try {
      await onSubmit(sanitizedData);
      setFormStatus('success');
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      setFormStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Submission failed. Please try again.',
      );
    }
  };

  // -- Derived helpers for inline validation icons --------------------------

  /** Returns 'valid' | 'invalid' | null (not yet touched) */
  const fieldState = (field: FieldName): 'valid' | 'invalid' | null => {
    if (!touched[field]) return null;
    if (fieldErrors[field]) return 'invalid';
    // For optional phone, blank is neither valid nor invalid
    if (field === 'phone' && !sanitize(formData[field])) return null;
    return 'valid';
  };

  // -- Don't render if closed -----------------------------------------------
  if (!isOpen) return null;

  // -- Input border class helper --------------------------------------------
  const inputBorderClass = (field: FieldName): string => {
    const state = fieldState(field);
    if (state === 'invalid')
      return 'border-red-500/50 focus:ring-1 focus:ring-red-500/30';
    if (state === 'valid')
      return 'border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20';
    return 'border-violet-500/10 focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20';
  };

  // -- Inline validation indicator ------------------------------------------
  const ValidationIndicator = ({ field }: { field: FieldName }) => {
    const state = fieldState(field);
    if (!state) return null;
    return (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {state === 'valid' ? <CheckIcon /> : <ErrorXIcon />}
      </span>
    );
  };


  return (
    <div
      className="lead-form-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a free consultation"
    >
      <div ref={modalRef} className="w-full max-w-[340px] mx-3 animate-slide-up">
        <div className="bg-[#111827]/95 border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/5 overflow-hidden">
          {/* ---- Header -------------------------------------------------- */}
          <div className="px-5 pt-5 pb-3 border-b border-violet-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-sm">
                  {t('form.title')}
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={formStatus === 'submitting'}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-40"
                aria-label="Close form"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ---- Body ---------------------------------------------------- */}
          <div className="px-5 py-4 max-h-[55vh] overflow-y-auto scrollbar-thin">
            {formStatus === 'success' ? (
              <div className="text-center py-6 animate-fade-in-up">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-white font-semibold text-sm">{t('form.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {/* ---- Honeypot (hidden anti-bot) ---- */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    opacity: 0,
                    height: 0,
                    width: 0,
                  }}
                />

                {/* ---- Full Name ---- */}
                <div>
                  <label
                    htmlFor="lead-fullName"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {t('form.name')} <span className="text-violet-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={firstInputRef}
                      id="lead-fullName"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={formStatus === 'submitting'}
                      placeholder="John Smith"
                      maxLength={60}
                      className={`w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2.5 pr-9 placeholder-slate-600 transition-all duration-200 outline-none border ${inputBorderClass('fullName')} disabled:opacity-40`}
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={fieldState('fullName') === 'invalid' || undefined}
                      aria-describedby={
                        fieldErrors.fullName ? 'lead-fullName-error' : undefined
                      }
                    />
                    {ValidationIndicator({ field: 'fullName' })}
                  </div>
                  {fieldErrors.fullName && (
                    <p
                      id="lead-fullName-error"
                      role="alert"
                      className="text-red-400 text-[10px] mt-1 ml-1"
                    >
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* ---- Email ---- */}
                <div>
                  <label
                    htmlFor="lead-email"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {t('form.email')} <span className="text-violet-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="lead-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={formStatus === 'submitting'}
                      placeholder="john@company.com"
                      className={`w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2.5 pr-9 placeholder-slate-600 transition-all duration-200 outline-none border ${inputBorderClass('email')} disabled:opacity-40`}
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={fieldState('email') === 'invalid' || undefined}
                      aria-describedby={
                        fieldErrors.email ? 'lead-email-error' : undefined
                      }
                    />
                    {ValidationIndicator({ field: 'email' })}
                  </div>
                  {fieldErrors.email && (
                    <p
                      id="lead-email-error"
                      role="alert"
                      className="text-red-400 text-[10px] mt-1 ml-1"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* ---- Company ---- */}
                <div>
                  <label
                    htmlFor="lead-company"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {t('form.company')} <span className="text-violet-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="lead-company"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={formStatus === 'submitting'}
                      placeholder="Acme Inc."
                      maxLength={100}
                      className={`w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2.5 pr-9 placeholder-slate-600 transition-all duration-200 outline-none border ${inputBorderClass('company')} disabled:opacity-40`}
                      autoComplete="organization"
                      aria-required="true"
                      aria-invalid={fieldState('company') === 'invalid' || undefined}
                      aria-describedby={
                        fieldErrors.company ? 'lead-company-error' : undefined
                      }
                    />
                    {ValidationIndicator({ field: 'company' })}
                  </div>
                  {fieldErrors.company && (
                    <p
                      id="lead-company-error"
                      role="alert"
                      className="text-red-400 text-[10px] mt-1 ml-1"
                    >
                      {fieldErrors.company}
                    </p>
                  )}
                </div>

                {/* ---- Phone ---- */}
                <div>
                  <label
                    htmlFor="lead-phone"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    {t('form.phone')}
                  </label>
                  <div className="relative">
                    <PhoneInput
                      id="lead-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      disabled={formStatus === 'submitting'}
                      placeholder="+1 (555) 000-0000"
                      defaultCountry="US"
                      className={`w-full bg-[#0c1120] text-white text-sm rounded-xl px-3.5 py-2 pr-9 placeholder-slate-600 transition-all duration-200 outline-none border ${inputBorderClass('phone')} disabled:opacity-40 [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon--border]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:text-white`}
                      autoComplete="tel"
                      aria-invalid={fieldState('phone') === 'invalid' || undefined}
                      aria-describedby={
                        fieldErrors.phone ? 'lead-phone-error' : undefined
                      }
                    />
                    {ValidationIndicator({ field: 'phone' })}
                  </div>
                  {fieldErrors.phone && (
                    <p
                      id="lead-phone-error"
                      role="alert"
                      className="text-red-400 text-[10px] mt-1 ml-1"
                    >
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* ---- Global error ---- */}
                {formStatus === 'error' && (
                  <div
                    className="flex items-center gap-2 bg-red-900/20 border border-red-500/20 rounded-xl px-3 py-2.5 animate-fade-in-up"
                    role="alert"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                    <span className="text-red-300 text-xs">{errorMessage}</span>
                  </div>
                )}

                {/* ---- Submit ---- */}
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className={`w-full font-medium text-sm py-2.5 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-violet-500/15 hover:shadow-violet-500/25 disabled:opacity-50 disabled:hover:from-violet-600 disabled:hover:to-purple-600`}
                  aria-label={
                    formStatus === 'submitting'
                      ? 'Submitting form'
                      : t('form.submit')
                  }
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <SpinnerIcon />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {t('form.submit')}
                      <ArrowIcon />
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