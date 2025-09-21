import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPaymentStatus } from '../services/paymentService';
import { useAuth } from '../context/AuthContext.jsx';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const txnid = params.get('txnid');
  const { token } = useAuth();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token && txnid) {
      getPaymentStatus(token, txnid).then(r => setPayment(r.payment)).catch(e => setError(e.message));
    }
  }, [token, txnid]);

  return (
    <div>
      <h2>Payment Success</h2>
      <p>Transaction ID: {txnid}</p>
      {payment && <pre style={{background:'#f7f7f7', padding:'1rem'}}>{JSON.stringify(payment, null, 2)}</pre>}
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  );
}
