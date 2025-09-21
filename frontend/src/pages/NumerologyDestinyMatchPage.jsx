import React, { useState } from 'react';
import { destinyMatch } from '../services/numerologyService';

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

  return <div style={{ maxWidth:500 }}>
    <h2>Destiny Match</h2>
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      <input placeholder='First Name' value={firstName} onChange={e=>setFirstName(e.target.value)} required />
      <input placeholder='Second Name' value={secondName} onChange={e=>setSecondName(e.target.value)} required />
      <button type='submit' disabled={loading}>{loading ? 'Calculating...' : 'Match'}</button>
    </form>
    {result && <div style={{ marginTop:'1rem' }}>
      <h3>Result</h3>
      <p>First Number: {result.first.number}</p>
      <p>Second Number: {result.second.number}</p>
      <p>Compatibility: {result.compatibility}%</p>
      <pre style={{ background:'#111', color:'#0f0', padding:'0.5rem', overflow:'auto' }}>{JSON.stringify(result,null,2)}</pre>
    </div>}
  </div>;
}
