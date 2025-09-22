import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPaymentStatus } from '../services/paymentService';
import { useAuth } from '../context/AuthContext.jsx';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';

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
    <Box>
      <div className="max-w-2xl space-y-6">
        <Card title="Payment Success">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Transaction ID: {txnid}</p>
          {payment && <pre className="rounded-md bg-slate-900 text-brand-400 text-xs p-3 max-h-72 overflow-auto">{JSON.stringify(payment, null, 2)}</pre>}
          {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
        </Card>
      </div>
    </Box>
  );
}
