import { Translations } from '../types';

export const hi: Translations = {
  chat: {
    placeholder: 'XAIVON ke baare mein puchein...',
    send: 'Bhejein',
    listening: 'Sun raha hoon...',
    upload: 'Document Upload Karein',
    voice: 'Voice Input',
    settings: 'Settings',
    clear: 'Chat Clear Karein',
    greeting: 'Namaste, main XAIVON AI Consultant hoon. Main aapki kya madad kar sakta hoon?',
  },
  settings: {
    title: 'Language Preference',
    auto: 'Auto Detect',
    en: 'English',
    hi: 'Hindi',
    hinglish: 'Hinglish',
    close: 'Band Karein'
  },
  form: {
    title: 'Consultation Book Karein',
    name: 'Pura Naam',
    email: 'Business Email',
    company: 'Company Ka Naam',
    phone: 'Phone Number (Optional)',
    submit: 'Call Schedule Karein',
    cancel: 'Cancel',
    success: 'Dhanyawad! Hamari team aapse jald hi sampark karegi.',
    error: 'Request submit nahi ho paayi. Kripya dobara koshish karein.'
  },
  errors: {
    rateLimit: 'Bahut saari requests aa rahi hain. Kripya thodi der baad try karein.',
    generic: 'Kuch galat ho gaya. Kripya dobara koshish karein.',
    uploadFailed: 'File upload fail ho gaya.',
    fileTooLarge: 'File ka size bahut bada hai (max 10MB).'
  }
};
