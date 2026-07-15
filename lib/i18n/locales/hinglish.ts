import { Translations } from '../types';

export const hinglish: Translations = {
  chat: {
    placeholder: 'Ask about XAIVON...',
    send: 'Bhejo',
    listening: 'Listening...',
    upload: 'Upload Document',
    voice: 'Voice Input',
    settings: 'Settings',
    clear: 'Clear Chat',
    greeting: 'Hi, main XAIVON AI Consultant hoon. How can I help you today?',
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
    success: 'Thank you! Hamari team aapko jaldi contact karegi.',
    error: 'Failed to submit request. Please try again.'
  },
  errors: {
    rateLimit: 'Too many requests. Thodi der baad try karein.',
    generic: 'Kuch galat ho gaya. Please try again.',
    uploadFailed: 'Failed to upload file.',
    fileTooLarge: 'File bahut badi hai (max 10MB).'
  }
};
