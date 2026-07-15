import { Translations } from '../types';

export const en: Translations = {
  chat: {
    placeholder: 'Ask about XAIVON...',
    send: 'Send',
    listening: 'Listening...',
    upload: 'Upload Document',
    voice: 'Voice Input',
    settings: 'Settings',
    clear: 'Clear Chat',
    greeting: 'Hi, I am XAIVON AI Consultant. How can I help you today?',
  },
  settings: {
    title: 'Language Preference',
    auto: 'Auto Detect',
    en: 'English',
    hi: 'Hindi',
    hinglish: 'Hinglish',
    close: 'Close'
  },
  form: {
    title: 'Book a Consultation',
    name: 'Full Name',
    email: 'Business Email',
    company: 'Company Name',
    phone: 'Phone Number (Optional)',
    submit: 'Schedule Call',
    cancel: 'Cancel',
    success: 'Thank you! Our team will contact you shortly.',
    error: 'Failed to submit request. Please try again.'
  },
  errors: {
    rateLimit: 'Too many requests. Please try again later.',
    generic: 'Something went wrong. Please try again.',
    uploadFailed: 'Failed to upload file.',
    fileTooLarge: 'File is too large (max 10MB).'
  }
};
