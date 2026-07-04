import { google } from 'googleapis';

/**
 * Pushes a task directly to the user's Google Calendar using a Service Account.
 * Requires GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in environment.
 */
export async function pushToGoogleCalendar(
  calendarId: string,
  title: string,
  description: string,
  startIso: string,
  endIso?: string
) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Calendar credentials not configured. Skipping calendar sync.');
      return { success: false, error: 'Calendar credentials not configured' };
    }
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startIso,
        timeZone: 'UTC', // AI outputs UTC by default
      },
      end: {
        dateTime: endIso || new Date(new Date(startIso).getTime() + 30 * 60000).toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: true,
      },
    };

    const res = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    return { success: true, eventId: res.data.id };
  } catch (error: any) {
    console.error('Google Calendar Sync Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Timezone helpers to safely get calendar segments in the user's local timezone.
 */
function getPartsInTimezone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  return {
    year: parseInt(findPart('year'), 10),
    month: parseInt(findPart('month'), 10) - 1, // 0-indexed
    day: parseInt(findPart('day'), 10),
    hour: parseInt(findPart('hour'), 10),
    minute: parseInt(findPart('minute'), 10),
    second: parseInt(findPart('second'), 10),
  };
}

function createDateInTimezone(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const tempDate = new Date(isoStr + 'Z');
  const tzParts = getPartsInTimezone(tempDate, timeZone);
  const diffMs = tempDate.getTime() - new Date(Date.UTC(tzParts.year, tzParts.month, tzParts.day, tzParts.hour, tzParts.minute, tzParts.second)).getTime();
  return new Date(tempDate.getTime() + diffMs);
}

function getWorkdays(startDate: Date, n: number, workWeekends: boolean, timeZone: string): Date[] {
  const workdays: Date[] = [];
  const current = new Date(startDate);
  let count = 0;
  let safety = 0;
  
  while (count < n && safety < 30) {
    safety++;
    const tzParts = getPartsInTimezone(current, timeZone);
    const dayOfWeek = new Date(tzParts.year, tzParts.month, tzParts.day).getDay(); // 0 is Sunday, 6 is Saturday
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (workWeekends || !isWeekend) {
      workdays.push(new Date(current));
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workdays;
}

function parseWindow(windowStr: string) {
  const match = windowStr.match(/^(\d{1,2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) return { sh: 9, sm: 0, eh: 17, em: 0 };
  return {
    sh: parseInt(match[1], 10),
    sm: parseInt(match[2], 10),
    eh: parseInt(match[3], 10),
    em: parseInt(match[4], 10),
  };
}

/**
 * Scans the Google Calendar for existing busy blocks and returns the first available
 * slot matching lookahead days, primary window, overflow window, and weekend options.
 */
export async function findAvailableSlot(
  calendarId: string,
  durationMins: number,
  urgency: 'Urgent' | 'High' | 'Low',
  timezone: string,
  settings: {
    primary_window: string;
    overflow_window: string;
    work_weekends: boolean;
  }
): Promise<{ start: Date; end: Date }> {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Calendar credentials not configured');
    }
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    
    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busyEvents = (res.data.items || [])
      .map(event => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        if (!start || !end) return null;
        return {
          start: new Date(start),
          end: new Date(end)
        };
      })
      .filter((e): e is { start: Date; end: Date } => e !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const primaryWin = parseWindow(settings.primary_window);
    const overflowWin = parseWindow(settings.overflow_window);
    const workWeekends = settings.work_weekends;
    
    const workdays = getWorkdays(now, 7, workWeekends, timezone);
    const durationMs = durationMins * 60 * 1000;
    const dontTouchBuffer = 60 * 60 * 1000; // 60 minutes lock-zone buffer
    const cutoffTime = new Date(now.getTime() + dontTouchBuffer);

    // If Low urgency, defer search by 2 workdays
    const deferDays = 2;
    const startDayIndex = (urgency === 'Low') ? Math.min(deferDays, workdays.length - 1) : 0;

    const checkWindow = (day: Date, win: { sh: number; sm: number; eh: number; em: number }) => {
      const tzParts = getPartsInTimezone(day, timezone);
      const winStart = createDateInTimezone(tzParts.year, tzParts.month, tzParts.day, win.sh, win.sm, timezone);
      const winEnd = createDateInTimezone(tzParts.year, tzParts.month, tzParts.day, win.eh, win.em, timezone);
      
      let cursor = new Date(winStart);
      if (cursor < cutoffTime) {
        cursor = new Date(cutoffTime);
      }
      
      if (cursor >= winEnd) return null;

      const relevantBusy = busyEvents.filter(e => e.end > cursor && e.start < winEnd);

      for (const event of relevantBusy) {
        if (event.end <= cursor) continue;
        if (event.start >= winEnd) break;
        
        const gapEnd = new Date(Math.min(event.start.getTime(), winEnd.getTime()));
        if (gapEnd.getTime() - cursor.getTime() >= durationMs) {
          return { start: new Date(cursor), end: new Date(cursor.getTime() + durationMs) };
        }
        
        if (event.end > cursor) {
          cursor = new Date(event.end);
        }
        if (cursor >= winEnd) return null;
      }

      if (winEnd.getTime() - cursor.getTime() >= durationMs) {
        return { start: new Date(cursor), end: new Date(cursor.getTime() + durationMs) };
      }
      
      return null;
    };

    // 1. Check primary window from startDayIndex onward
    for (let i = startDayIndex; i < workdays.length; i++) {
      const slot = checkWindow(workdays[i], primaryWin);
      if (slot) return slot;
    }

    // 2. Check overflow window if Urgent/High urgency
    if (urgency !== 'Low') {
      for (let i = startDayIndex; i < workdays.length; i++) {
        const slot = checkWindow(workdays[i], overflowWin);
        if (slot) return slot;
      }
    }

    // 3. Fallback: Search earlier days (before defer index)
    for (let i = 0; i < startDayIndex; i++) {
      const slot = checkWindow(workdays[i], primaryWin);
      if (slot) return slot;
      if (urgency !== 'Low') {
        const oSlot = checkWindow(workdays[i], overflowWin);
        if (oSlot) return oSlot;
      }
    }

    // 4. Ultimate fallback: schedule 2 hours from now
    const fallbackStart = new Date(cutoffTime.getTime() + 60 * 60 * 1000);
    return {
      start: fallbackStart,
      end: new Date(fallbackStart.getTime() + durationMs)
    };

  } catch (error: any) {
    console.error('findAvailableSlot Error:', error);
    const fallbackStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return {
      start: fallbackStart,
      end: new Date(fallbackStart.getTime() + durationMins * 60 * 1000)
    };
  }
}

/**
 * Removes a scheduled task event from the user's Google Calendar.
 */
export async function deleteFromGoogleCalendar(calendarId: string, eventId: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Google Calendar Delete Error:', error);
    return { success: false, error: error.message };
  }
}


