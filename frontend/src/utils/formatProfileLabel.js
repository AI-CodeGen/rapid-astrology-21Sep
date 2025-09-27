// Utility: derive possessive first-name profile label
// Examples:
//   'Adam Hall'   -> "Adam's Profile"
//   'James Stone' -> "James' Profile" (name ends with s)
//   undefined/''  -> 'Profile'
export function formatProfileLabel(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Profile';
  const first = fullName.trim().split(/\s+/)[0];
  if (!first) return 'Profile';
  const possessive = /s$/i.test(first) ? `${first}'` : `${first}'s`;
  return `${possessive} Profile`;
}

export default formatProfileLabel;
