export interface CalendarAdapter {
  provider: string;
  generateBookingUrl(meetingType?: string, prefillData?: Record<string, unknown>): string;
}

export class CalendlyAdapter implements CalendarAdapter {
  provider = 'Calendly';

  generateBookingUrl(meetingType?: string, prefillData?: Record<string, unknown>): string {
    void meetingType;
    // Mock implementation for Calendly
    const baseUrl = 'https://calendly.com/xaivon/discovery';
    const params = new URLSearchParams();
    
    if (prefillData) {
      if (typeof prefillData.email === 'string') params.append('email', prefillData.email);
      if (typeof prefillData.fullName === 'string') params.append('name', prefillData.fullName);
      if (typeof prefillData.company === 'string') params.append('a1', prefillData.company); // Custom field
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
}

export class GoogleCalendarAdapter implements CalendarAdapter {
  provider = 'Google Calendar';

  generateBookingUrl(): string {
    // Mock implementation for Google Appointment Scheduling
    return `https://calendar.google.com/calendar/appointments/schedules/xaivon-mock-id`;
  }
}

export class OutlookAdapter implements CalendarAdapter {
  provider = 'Outlook Bookings';

  generateBookingUrl(): string {
    // Mock implementation for MS Bookings
    return `https://outlook.office365.com/owa/calendar/xaivon@mock.com/bookings/`;
  }
}

export class ManualBookingAdapter implements CalendarAdapter {
  provider = 'Manual';

  generateBookingUrl(): string {
    return 'manual'; // Frontend interprets this as "Show success message, we will email you"
  }
}

// Factory to get the active calendar adapter
export function getCalendarAdapter(): CalendarAdapter {
  const provider = process.env.CALENDAR_PROVIDER || 'calendly';
  
  switch (provider.toLowerCase()) {
    case 'google':
      return new GoogleCalendarAdapter();
    case 'outlook':
      return new OutlookAdapter();
    case 'manual':
      return new ManualBookingAdapter();
    case 'calendly':
    default:
      return new CalendlyAdapter();
  }
}
