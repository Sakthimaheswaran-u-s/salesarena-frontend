/**
 * API entry point. Every screen imports `api` from here.
 *
 * The app is fully self-contained: all data comes from the in-browser sample
 * API in ./mockApi.js (deterministic history + localStorage for logins and
 * accounts created through the UI).
 */
export { mockApi as api } from './mockApi';
