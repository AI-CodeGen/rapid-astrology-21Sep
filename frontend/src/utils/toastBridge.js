// Allows non-React modules (like axios interceptors) to dispatch toasts via an injected function.
export const toastBridge = {
  info: (msg) => { console.warn('toastBridge not initialized (info):', msg); },
  success: (msg) => { console.warn('toastBridge not initialized (success):', msg); },
  error: (msg) => { console.warn('toastBridge not initialized (error):', msg); }
};

export function registerToastBridge(api) {
  toastBridge.info = api.info;
  toastBridge.success = api.success;
  toastBridge.error = api.error;
}
