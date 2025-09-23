// Bridge to trigger auth side-effects (like debounced logout) from outside React tree.
export const authBridge = {
  expireSession: () => console.warn('authBridge not initialized: expireSession')
};

export function registerAuthBridge(api) {
  authBridge.expireSession = api.expireSession;
}
