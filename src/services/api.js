/**
 * API entry point. Every screen imports `api` from here.
 *
 * - Default: the Go backend (backend/) via ./httpApi.js
 * - VITE_USE_MOCK=true: the in-browser mock via ./mockApi.js (no backend needed)
 */
import { httpApi } from './httpApi';
import { mockApi } from './mockApi';

export const USING_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const api = USING_MOCK ? mockApi : httpApi;
