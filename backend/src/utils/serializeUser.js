export function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    roles: user.roles,
    settings: user.settings || { },
    lastLoginAt: user.lastLoginAt
  };
}
