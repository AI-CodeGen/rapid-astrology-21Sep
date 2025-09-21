import api from './api';

export async function initiate(amount, productInfo) {
  const { data } = await api.post('/payments/initiate', { amount, productInfo });
  return data;
}

export async function getPaymentStatus(token, txnid) {
  const { data } = await api.get('/payments/tx/' + encodeURIComponent(txnid), { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
