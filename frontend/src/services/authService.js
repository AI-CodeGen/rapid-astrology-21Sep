import api from './api';

export async function requestOTP(phone) {
  const { data } = await api.post('/auth/otp/request', { phone });
  return data;
}
export async function verifyOTP(phone, otp) {
  const { data } = await api.post('/auth/otp/verify', { phone, otp });
  // Returns full envelope: { success, message, data: { token, user } }
  return data;
}
export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}
export async function updateMe(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data;
}
