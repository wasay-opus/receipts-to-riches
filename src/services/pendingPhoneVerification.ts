// Kept in memory only: never put passwords or Google ID tokens in the URL or browser storage.
let pendingGoogleIdToken: string | null = null;
let pendingRegistration: { email: string; password: string } | null = null;
let pendingLogin: { email: string; password: string } | null = null;
let pendingVerificationToken: string | null = null;

export const pendingPhoneVerification = {
  setGoogleToken(token: string) { pendingGoogleIdToken = token; },
  getGoogleToken() { return pendingGoogleIdToken; },
  setRegistration(email: string, password: string) {
    pendingRegistration = { email, password };
  },
  getRegistration() { return pendingRegistration; },
  setLogin(email: string, password: string) { pendingLogin = { email, password }; },
  getLogin() { return pendingLogin; },
  setVerificationToken(token: string | null | undefined) { pendingVerificationToken = token || null; },
  getVerificationToken() { return pendingVerificationToken; },
  clearGoogleToken() { pendingGoogleIdToken = null; },
  clearRegistration() { pendingRegistration = null; },
  clearLogin() { pendingLogin = null; },
  clearVerificationToken() { pendingVerificationToken = null; },
};
