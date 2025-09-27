import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMe, updateMe } from '../services/authService';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Pencil, Calendar, Clock, MapPin } from 'lucide-react';
// Removed static PLACE_SUGGESTIONS in favor of live backend powered autocomplete
import { Navigate, useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState({ name: false, email: false, dob: false, time: false, place: false, basic: false });
  // Basic details state
  const [dob, setDob] = useState(''); // ISO date string (yyyy-mm-dd)
  const [timeHour, setTimeHour] = useState('');
  const [timeMinute, setTimeMinute] = useState('');
  const [timeSecond, setTimeSecond] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [placeObject, setPlaceObject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [placeLoading, setPlaceLoading] = useState(false);
  const placeAbortRef = useRef(null);
  const placeInputRef = useRef(null);
  const dobInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const env = await getMe();
        if (cancelled) return;
        const user = env.data.user;
        setProfile(user);
        setName(user.name || '');
        setEmail(user.email || '');
        const bd = user.userBasicDetails || {};
        if (bd.dob) {
          try { setDob(new Date(bd.dob).toISOString().slice(0,10)); } catch { /* noop */ }
        }
        if (bd.time) {
          setTimeHour(bd.time.hour?.toString().padStart(2,'0') || '');
          setTimeMinute(bd.time.minute?.toString().padStart(2,'0') || '');
          setTimeSecond(bd.time.second?.toString().padStart(2,'0') || '');
        }
        if (bd.place) {
          if (typeof bd.place === 'string') setPlaceName(bd.place);
          else {
            setPlaceName(bd.place.name || '');
            setPlaceObject({
              name: bd.place.name,
              district: bd.place.district,
              state: bd.place.state,
              country: bd.place.country,
              latitude: bd.place.latitude,
              longitude: bd.place.longitude
            });
          }
        }
      } catch (e) {
        // Likely 401 -> force logout & redirect with toast
        try { logout({ delay: 0, expired: true }); } catch { /* noop */ }
        toast.info('Please login to view your profile.');
        navigate('/login', { replace: true });
      }
    }
    if (token) load();
    return () => { cancelled = true; };
  }, [token, logout, navigate, toast]);

  const dirty = useMemo(()=>{
    if (!profile) return false;
    const bd = profile.userBasicDetails || {};
    const originalDob = bd.dob ? new Date(bd.dob).toISOString().slice(0,10) : '';
    const originalHour = bd.time?.hour != null ? bd.time.hour.toString().padStart(2,'0') : '';
    const originalMinute = bd.time?.minute != null ? bd.time.minute.toString().padStart(2,'0') : '';
    const originalSecond = bd.time?.second != null ? bd.time.second.toString().padStart(2,'0') : '';
    const originalPlaceName = bd.place ? (typeof bd.place === 'string' ? bd.place : (bd.place.name || '')) : '';
    return (name !== (profile.name || '')) ||
      (email !== (profile.email || '')) ||
      (dob !== originalDob) ||
      (timeHour !== originalHour) ||
      (timeMinute !== originalMinute) ||
      (timeSecond !== originalSecond) ||
      (placeName !== originalPlaceName);
  }, [name, email, dob, timeHour, timeMinute, timeSecond, placeName, profile]);

  async function save() {
    if (!dirty) return; // guard
    try {
      setSaving(true);
      const payload = { name, email };
      const timeProvided = timeHour !== '' && timeMinute !== '';
      const basicDetails = {
        ...(dob ? { dob } : {}),
        ...(timeProvided ? { time: { hour: parseInt(timeHour,10), minute: parseInt(timeMinute,10), second: timeSecond !== '' ? parseInt(timeSecond,10) : 0 } } : {}),
        ...(placeObject ? { place: placeObject } : (placeName ? { place: { name: placeName } } : {}))
      };
      if (Object.keys(basicDetails).length > 0) payload.userBasicDetails = basicDetails;
  const upd = await updateMe(payload);
  // updateMe now returns an envelope with data.user
  setProfile(upd.data.user);
  setEditing({ name: false, email: false, dob: false, time: false, place: false, basic: false });
      toast.success('Profile updated successfully.');
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const phone = profile?.phone || '';

  const iconButtonBase = 'absolute inset-y-0 right-0 px-3 inline-flex items-center text-slate-500 hover:text-brand-500 transition outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-md';

  // Autocomplete: fetch from backend with debounce
  useEffect(()=>{
    if (placeQuery.length < 2) { setPlaceResults([]); return; }
    setPlaceLoading(true);
    const controller = new AbortController();
    if (placeAbortRef.current) placeAbortRef.current.abort();
    placeAbortRef.current = controller;
    const t = setTimeout(async ()=>{
      try {
  const resp = await fetch(`/api/v1/places/search?q=${encodeURIComponent(placeQuery)}&limit=3`, { signal: controller.signal, headers: { 'x-request-id': crypto.randomUUID?.() || '' } });
        if (!resp.ok) throw new Error('lookup failed');
        const json = await resp.json();
        // Support both enveloped { data: { results: [...] }} and flattened { results: [...] }
        const results = (json.data && Array.isArray(json.data.results)) ? json.data.results : (Array.isArray(json.results) ? json.results : []);
        setPlaceResults(results);
      } catch (e) {
        if (e.name !== 'AbortError') setPlaceResults([]);
      } finally { setPlaceLoading(false); }
    }, 300);
    return ()=>{ clearTimeout(t); controller.abort(); };
  }, [placeQuery]);

  const selectPlace = useCallback((val)=>{
    // val can be string or object from API
    if (typeof val === 'string') {
      setPlaceName(val);
      setPlaceObject({ name: val });
    } else {
      setPlaceName(val.name || '');
      setPlaceObject({
        name: val.name,
        district: val.district,
        state: val.state,
        country: val.country,
        latitude: val.latitude,
        longitude: val.longitude
      });
    }
    setPlaceQuery('');
    setPlaceResults([]);
    setShowPlaceDropdown(false);
    setEditing(ed=>({...ed, place:true}));
  },[]);

  useEffect(()=>{
    function onDocClick(e){
      if (!placeInputRef.current) return;
      if (!placeInputRef.current.parentElement.contains(e.target)) {
        setShowPlaceDropdown(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return ()=>document.removeEventListener('mousedown', onDocClick);
  },[]);

  function handlePlaceInput(e){
    const val = e.target.value;
  setPlaceName(val);
  setPlaceObject(null); // manual typing resets structured object until selection
    setPlaceQuery(val);
    if(!editing.place) setEditing(ed=>({...ed, place:true}));
    setShowPlaceDropdown(val.length >= 2);
  }

  function handleDobWrapperClick(){
    if (dobInputRef.current) {
      dobInputRef.current.showPicker?.();
      dobInputRef.current.focus();
    }
  }

  // Route is now wrapped in <ProtectedRoute/> which handles redirect to /login when no token.
  // This guard is a safety fallback; use /login to match requirement.
  if (!token) return <Navigate to="/login" replace />;

  return (
    <Box>
      <div className="max-w-3xl mx-auto w-full">
        <Card title="Profile" centerTitle actions={
          profile ? (
            <button onClick={save} disabled={saving || !dirty} className="btn-primary px-6 py-2 rounded-lg text-sm font-medium justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : (dirty ? 'Save Changes' : 'Saved')}
            </button>
          ) : null
        }>
          {!profile && (
            <div className="py-10"><p className="text-sm text-slate-600 dark:text-slate-300 text-center">Loading profile...</p></div>
          )}
          {profile && <div className="space-y-5">
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
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Mobile number can’t be changed.</p>
            </div>
            {/* Basic Details Section */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">Basic Details</h3>
                <button type="button" onClick={()=>setEditing(ed=>({...ed, basic: !ed.basic, dob: !ed.basic, time: !ed.basic, place: !ed.basic}))} className="text-xs font-medium text-brand-600 hover:text-brand-500 underline-offset-2 hover:underline">
                  {editing.basic ? 'Done' : ( (dob || placeName || (timeHour && timeMinute)) ? 'Edit' : 'Add')}
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Date of Birth</label>
                  {editing.basic ? (
                    <div className="relative group cursor-pointer" onClick={handleDobWrapperClick} role="button" tabIndex={0} onKeyDown={e=>{ if(e.key==='Enter') handleDobWrapperClick(); }} aria-label="Date of Birth Picker">
                      <Input ref={dobInputRef} type="date" value={dob} onChange={e=>{ setDob(e.target.value); if(!editing.dob) setEditing(ed=>({...ed, dob:true})); }} aria-label="Date of Birth" className="pr-10 pointer-events-none group-focus-within:pointer-events-auto" />
                      <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <span className="sr-only">Open date picker</span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 min-h-[40px] flex items-center">{dob || <span className="text-slate-400 italic">Not set</span>}</p>
                  )}
                </div>
                {/* Time of Birth */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Time of Birth (24h)</label>
                  {editing.basic ? (
                    <>
                      <div className="grid grid-cols-4 gap-2 items-center">
                        <select value={timeHour} onChange={e=>{ setTimeHour(e.target.value); if(!editing.time) setEditing(ed=>({...ed, time:true})); }} className="border rounded-md px-2 py-1 bg-white dark:bg-slate-800 dark:border-slate-600 text-sm w-full col-span-1">
                          <option value="">HH</option>
                          {Array.from({length:24},(_,i)=>i.toString().padStart(2,'0')).map(h=> <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select value={timeMinute} onChange={e=>{ setTimeMinute(e.target.value); if(!editing.time) setEditing(ed=>({...ed, time:true})); }} className="border rounded-md px-2 py-1 bg-white dark:bg-slate-800 dark:border-slate-600 text-sm w-full col-span-1">
                          <option value="">MM</option>
                          {Array.from({length:60},(_,i)=>i.toString().padStart(2,'0')).map(m=> <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={timeSecond} onChange={e=>{ setTimeSecond(e.target.value); if(!editing.time) setEditing(ed=>({...ed, time:true})); }} className="border rounded-md px-2 py-1 bg-white dark:bg-slate-800 dark:border-slate-600 text-sm w-full col-span-1">
                          <option value="">SS</option>
                          {Array.from({length:60},(_,i)=>i.toString().padStart(2,'0')).map(s=> <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="flex justify-center items-center col-span-1 h-full border rounded-md bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600">
                          <Clock className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Leave hour/minute blank if unknown. Seconds optional.</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 min-h-[40px] flex items-center">{(timeHour && timeMinute) ? `${timeHour}:${timeMinute}${timeSecond? ':'+timeSecond:''}` : <span className="text-slate-400 italic">Not set</span>}</p>
                  )}
                </div>
                {/* Place of Birth */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Place of Birth</label>
                  {editing.basic ? (
                    <>
                      <div className="relative group">
                        <Input ref={placeInputRef} value={placeName} onChange={handlePlaceInput} onFocus={()=>{ if(placeName.length>=2) setShowPlaceDropdown(true); }} placeholder="City, State, Country" aria-label="Place of Birth" className="pr-10" autoComplete="off" />
                        <MapPin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        {showPlaceDropdown && (
                          <ul className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm divide-y divide-slate-100 dark:divide-slate-700" role="listbox">
                            {placeLoading && <li className="px-3 py-2 text-sm text-slate-500">Searching...</li>}
                            {!placeLoading && placeResults.map(r=> (
                              <li key={r.name} role="option" tabIndex={0} onClick={()=>selectPlace(r)} onKeyDown={e=>{ if(e.key==='Enter') selectPlace(r); }} className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none">
                                <span className="block font-medium text-slate-700 dark:text-slate-200 truncate">{r.name}</span>
                                <span className="block text-[10px] text-slate-500">{r.district || r.state || r.country || ''}</span>
                              </li>
                            ))}
                            {!placeLoading && placeResults.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No places found</li>}
                          </ul>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Start typing (2+ chars) to see suggestions.</p>
                      {placeObject && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                          <div><span className="font-medium">Lat:</span> {placeObject.latitude}</div>
                          <div><span className="font-medium">Long:</span> {placeObject.longitude}</div>
                          <div className="col-span-2"><span className="font-medium">State:</span> {placeObject.state || '-'} | <span className="font-medium">Country:</span> {placeObject.country || '-'}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-slate-700 dark:text-slate-300 min-h-[40px]">
                      {placeName ? (
                        <div>
                          <p>{placeName}</p>
                          {placeObject && (
                            <p className="mt-1 text-[11px] text-slate-500">Lat: {placeObject.latitude}, Long: {placeObject.longitude} {placeObject.state ? `| ${placeObject.state}` : ''} {placeObject.country ? `| ${placeObject.country}` : ''}</p>
                          )}
                        </div>
                      ) : <span className="text-slate-400 italic">Not set</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>}
        </Card>
      </div>
    </Box>
  );
}
