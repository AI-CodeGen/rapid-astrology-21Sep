import React from 'react';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';

export default function PaymentPage() {
  return (
    <Box>
      <div className="max-w-xl">
        <Card title="Payment">
          <p className="text-sm text-slate-600 dark:text-slate-300">Initiate payments for reports here (placeholder).</p>
        </Card>
      </div>
    </Box>
  );
}
