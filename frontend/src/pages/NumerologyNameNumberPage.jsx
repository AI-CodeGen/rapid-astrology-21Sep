import React, { useState } from 'react';
import { nameNumber } from '../services/numerologyService';

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

  return <div style={{ maxWidth:500 }}>
    <h2>Name Number</h2>
    <form onSubmit={submit}>
      <input placeholder='Enter Name' value={name} onChange={e=>setName(e.target.value)} />
      <button type='submit'>Calculate</button>
    </form>
    {result && <div style={{ marginTop:'1rem' }}>
      <h3>Result</h3>
      <p>Number: {result.number}</p>
      <p>Total: {result.total}</p>
      <p>Meaning: {result.meaning}</p>
      <button onClick={downloadJSON}>Download JSON</button>
      <a href={`/api/reports/predictions.csv`} style={{ marginLeft:'0.5rem' }}>Download CSV (All)</a>
    </div>}
  </div>;
}
