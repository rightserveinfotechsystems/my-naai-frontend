// utils/bookingWindow.js
//
// ONE number for the booking-request answer window, as the panel speaks it.
//
// The window itself is the server's: it stamps `expires_at` on the request
// (five minutes, `WINDOW_SECONDS` in
// `src/services/bookingRequestLead.service.js` on the backend), and the panel
// never decides a deadline — it only counts down to the one it was given and
// says what happened when it passed.
//
// These constants exist so the WORDS cannot drift from that number: a row that
// expired is "no answer in 5 min" here, in the salon's app and in the customer's
// notification, and the next change to the window is one line, not a hunt
// through strings.

export const BOOKING_WINDOW_MINUTES = 5;

/** "5 minutes" — for a sentence. */
export const bookingWindowLabel = `${BOOKING_WINDOW_MINUTES} minutes`;

/** "5 min" — for a table cell. */
export const bookingWindowShort = `${BOOKING_WINDOW_MINUTES} min`;

/** "The 60 second window has closed" → "The 5-minute window has closed". */
export const bookingWindowClosedCopy = `The ${BOOKING_WINDOW_MINUTES}-minute answer window has closed`;

/** What an auto-cancelled request reads as, in the lifecycle. */
export const bookingWindowMissedCopy =
  `No answer within ${bookingWindowLabel}. The requested slot was released automatically.`;
