import React, { useState } from 'react';
import { nameNumber } from '../services/numerologyService';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

export default function NumerologyNameNumberPage() {
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const data = await nameNumber(name);
    setResult(data.prediction.result);
  }

  function downloadJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'numerology.json'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box>
      <div className="max-w-xl space-y-6">
        <Card title="Name Number">
          <form onSubmit={submit} className="space-y-4">
            <Input placeholder='Enter Name' value={name} onChange={e=>setName(e.target.value)} required />
            <button type='submit' className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Calculate</button>
          </form>
          {result && (
            <div className="mt-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Result</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/70">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Number</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{result.number}</div>
                </div>
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/70">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{result.total}</div>
                </div>
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/70 sm:col-span-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Meaning</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{result.meaning}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={downloadJSON} type="button" className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100">Download JSON</button>
                <a href={`/api/v1/reports/predictions.csv`} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100">Download CSV (All)</a>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Box>
  );
}
