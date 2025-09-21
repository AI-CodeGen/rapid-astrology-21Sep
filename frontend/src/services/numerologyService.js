import api from './api';

export async function nameNumber(name) {
  const { data } = await api.post('/predictions/numerology/name-number', { name });
  return data;
}

export async function destinyMatch(firstName, secondName) {
  const { data } = await api.post('/predictions/numerology/destiny-match', { firstName, secondName });
  return data;
}
