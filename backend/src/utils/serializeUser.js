export function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    roles: user.roles,
    settings: user.settings || { },
    lastLoginAt: user.lastLoginAt,
    userBasicDetails: user.userBasicDetails ? {
      dob: user.userBasicDetails.dob,
      time: user.userBasicDetails.time ? {
        hour: user.userBasicDetails.time.hour,
        minute: user.userBasicDetails.time.minute,
        second: user.userBasicDetails.time.second ?? 0,
      } : undefined,
      timeString: user.userBasicDetails.timeString,
      place: user.userBasicDetails.place ? {
        name: user.userBasicDetails.place.name,
        description: user.userBasicDetails.place.description,
        district: user.userBasicDetails.place.district,
        state: user.userBasicDetails.place.state,
        country: user.userBasicDetails.place.country,
        latitude: user.userBasicDetails.place.latitude,
        longitude: user.userBasicDetails.place.longitude,
      } : undefined,
      placeString: user.userBasicDetails.placeString
    } : undefined
  };
}
