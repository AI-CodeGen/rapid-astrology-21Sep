import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMe, updateMe } from '../services/authService';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Pencil } from 'lucide-react';

export default function ProfilePage() {
  const { token } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState({ name: false, email: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getMe();
      setProfile(data.user);
      setName(data.user.name || '');
      setEmail(data.user.email || '');
    }
    if (token) load();
  }, [token]);

  const dirty = useMemo(()=>{
    if (!profile) return false;
    return (name !== (profile.name || '')) || (email !== (profile.email || ''));
  }, [name, email, profile]);

  async function save() {
    if (!dirty) return; // guard
    try {
      setSaving(true);
      const upd = await updateMe({ name, email });
      setProfile(upd.user);
      setEditing({ name: false, email: false });
      toast.success('Profile updated successfully.');
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (!token) return <Box><p className="text-sm text-slate-600 dark:text-slate-300 text-center">Please login.</p></Box>;
  if (!profile) return <Box><p className="text-sm text-slate-600 dark:text-slate-300 text-center">Loading...</p></Box>;

  const phone = profile.phone || '';

  const iconButtonBase = 'absolute inset-y-0 right-0 px-3 inline-flex items-center text-slate-500 hover:text-brand-500 transition outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-md';

  return (
    <Box>
      <div className="max-w-3xl mx-auto w-full">
        <Card title="Profile" centerTitle actions={
          <button onClick={save} disabled={saving || !dirty} className="btn-primary px-6 py-2 rounded-lg text-sm font-medium justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : (dirty ? 'Save Changes' : 'Saved')}
          </button>
        }>
          <div className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Name</label>
              <div className="relative group">
                <Input
                  value={name}
                  onChange={e=>{ setName(e.target.value); if (!editing.name) setEditing(ed=>({...ed, name: true})); }}
                  disabled={!editing.name}
                  className={!editing.name ? 'pr-12 cursor-default bg-slate-100 dark:bg-slate-800/50' : 'pr-12'}
                  aria-readonly={!editing.name}
                  aria-label="Name"
                />
                <button
                  type="button"
                  onClick={()=>setEditing(ed=>({...ed, name: !ed.name}))}
                  className={iconButtonBase}
                  aria-pressed={editing.name}
                  aria-label={editing.name ? 'Lock name field' : 'Edit name'}
                >
                  <Pencil className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">{editing.name ? 'Finish editing name' : 'Edit name'}</span>
                </button>
                {!editing.name && <span className="pointer-events-none absolute -top-6 right-0 text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition">Edit</span>}
              </div>
            </div>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <div className="relative group">
                <Input
                  type="email"
                  value={email}
                  onChange={e=>{ setEmail(e.target.value); if (!editing.email) setEditing(ed=>({...ed, email: true})); }}
                  disabled={!editing.email}
                  className={!editing.email ? 'pr-12 cursor-default bg-slate-100 dark:bg-slate-800/50' : 'pr-12'}
                  aria-readonly={!editing.email}
                  aria-label="Email"
                />
                <button
                  type="button"
                  onClick={()=>setEditing(ed=>({...ed, email: !ed.email}))}
                  className={iconButtonBase}
                  aria-pressed={editing.email}
                  aria-label={editing.email ? 'Lock email field' : 'Edit email'}
                >
                  <Pencil className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">{editing.email ? 'Finish editing email' : 'Edit email'}</span>
                </button>
                {!editing.email && <span className="pointer-events-none absolute -top-6 right-0 text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition">Edit</span>}
              </div>
            </div>
            {/* Phone (Read-only) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Mobile Number</label>
              <Input value={phone} disabled className="bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed text-slate-500" aria-readonly="true" aria-label="Mobile Number" />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Phone number can’t be changed.</p>
            </div>
          </div>
        </Card>
      </div>
    </Box>
  );
}
