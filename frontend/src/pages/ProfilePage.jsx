import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMe, updateMe } from '../services/authService';

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

  if (!token) return <p>Please login.</p>;
  if (!profile) return <p>Loading...</p>;
  return <div>
    <h2>Profile</h2>
    <div>
      <label>Name <input value={name} onChange={e=>setName(e.target.value)} /></label>
    </div>
    <div>
      <label>Email <input value={email} onChange={e=>setEmail(e.target.value)} /></label>
    </div>
    <button onClick={save}>Save</button>
    <pre>{JSON.stringify(profile, null, 2)}</pre>
  </div>;
}
