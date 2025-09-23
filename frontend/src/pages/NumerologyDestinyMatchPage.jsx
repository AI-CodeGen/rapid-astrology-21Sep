import React, { useState } from 'react';
import { destinyMatch } from '../services/numerologyService';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

export default function NumerologyDestinyMatchPage() {
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setLoading(true);
    try {
      const data = await destinyMatch(firstName, secondName);
      setResult(data.prediction.result);
    } finally { setLoading(false); }
  }

  return (
    <Box>
      <div className="max-w-xl space-y-6">
        <Card title="Destiny Match">
          <form onSubmit={submit} className="space-y-4">
            <Input placeholder='First Name' value={firstName} onChange={e=>setFirstName(e.target.value)} required />
            <Input placeholder='Second Name' value={secondName} onChange={e=>setSecondName(e.target.value)} required />
            <button type='submit' disabled={loading} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Calculating...' : 'Match'}
            </button>
          </form>
          {result && (
            <div className="mt-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Result</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/70">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">First Number</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{result.first.number}</div>
                </div>
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/70">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Second Number</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{result.second.number}</div>
                </div>
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/70">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Compatibility</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{result.compatibility}%</div>
                </div>
              </div>
              <pre className="rounded-md bg-slate-900 text-brand-400 text-xs p-3 max-h-64 overflow-auto">{JSON.stringify(result,null,2)}</pre>
            </div>
          )}
        </Card>
      </div>
    </Box>
  );
}
