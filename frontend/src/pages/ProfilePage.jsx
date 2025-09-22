import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMe, updateMe } from '../services/authService';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

export default function ProfilePage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getMe();
      setProfile(data.user);
      setName(data.user.name || '');
      setEmail(data.user.email || '');
    }
    if (token) load();
  }, [token]);

  async function save() {
    const upd = await updateMe({ name, email });
    setProfile(upd.user);
  }

  if (!token) return <Box><p className="text-sm text-slate-600 dark:text-slate-300">Please login.</p></Box>;
  if (!profile) return <Box><p className="text-sm text-slate-600 dark:text-slate-300">Loading...</p></Box>;
  return (
    <Box>
      <div className="max-w-xl space-y-6">
        <Card title="Profile" actions={<button onClick={save} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Save</button>}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Name</label>
              <Input value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <Input value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Raw Data</h3>
            <pre className="rounded-md bg-slate-900 text-brand-400 text-xs p-3 max-h-64 overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
          </div>
        </Card>
      </div>
    </Box>
  );
}
