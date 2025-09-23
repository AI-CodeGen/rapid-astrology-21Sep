import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestOTP, verifyOTP } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import CountryCodeSelect from '../components/ui/CountryCodeSelect.jsx';
import OTPInput from '../components/ui/OTPInput.jsx';

export default function LoginPage() {
  const [countryCode, setCountryCode] = useState('+91');
  const [localPhone, setLocalPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('request');
  const [otpLength] = useState(() => parseInt(import.meta.env.OTP_LENGTH || '4', 10));
  const { login } = useAuth();
  const navigate = useNavigate();

  // If Google OAuth redirected back with a token (?token=...) handle it here
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    if (oauthToken) {
      // Fetch profile after setting token via existing flow (AuthContext login expects user object; we'll fetch /auth/me)
      // Slight duplication with OAuthCallback page; kept here to match backend redirect to /login?token=
      fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + oauthToken }})
        .then(r => r.json())
        .then(data => {
          if (data && data.user) {
            login(oauthToken, data.user);
            navigate('/');
          }
        })
        .catch(() => {/* ignore */});
    }
  }, [login, navigate]);

  useEffect(()=>{
    setPhone(countryCode + localPhone.replace(/[^0-9]/g,''));
  }, [countryCode, localPhone]);

  async function handleRequest(e) {
    e.preventDefault();
    await requestOTP(phone);
    setStage('verify');
  }
  async function handleVerify(e) {
    e.preventDefault();
    const data = await verifyOTP(phone, otp);
    login(data.token, data.user);
    navigate('/');
  }

  const googleEnabled = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED !== 'false';

  return (
    <Box>
      <div className="max-w-md mx-auto space-y-6">
        <Card title="Login" centerTitle>
          {googleEnabled && (
            <>
              <div className="mb-4">
                <a
                  href='/api/auth/google'
                  aria-label='Continue with Google'
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition text-center"
                >
                  <svg width='18' height='18' viewBox='0 0 533.5 544.3' aria-hidden='true'>
                    <path fill='#4285F4' d='M533.5 278.4c0-17.4-1.6-34.1-4.7-50.4H272v95.4h146.9c-6.4 34.6-25.9 63.8-55 83.4v68h88.7c51.9-47.8 81.9-118.3 81.9-196.4z'/>
                    <path fill='#34A853' d='M272 544.3c74.7 0 137.3-24.7 183.1-67.5l-88.7-68c-24.6 16.5-56.1 26-94.4 26-72.5 0-134-48.9-155.9-114.6H24.9v71.9c45.2 89.5 138 151.2 247.1 151.2z'/>
                    <path fill='#FBBC05' d='M116.1 320.2c-5.6-16.5-8.8-34.1-8.8-52.2s3.2-35.7 8.8-52.2v-71.9H24.9C9 192.8 0 224.7 0 268s9 75.2 24.9 123.9l91.2-71.7z'/>
                    <path fill='#EA4335' d='M272 107.7c40.7 0 77.2 14 106.1 41.5l79.4-79.4C409.2 24.7 346.6 0 272 0 163 0 70.2 61.7 24.9 151.2l91.2 71.9C138 156.6 199.5 107.7 272 107.7z'/>
                  </svg>
                  <span>Continue with Google</span>
                </a>
              </div>
              {/* Separator */}
              <div className="my-2">
                <div className="flex items-center gap-3">
                  <span className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
                  <span className="text-[11px] tracking-wider font-semibold text-slate-500 dark:text-slate-400 uppercase">Or OTP Login</span>
                  <span className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
                </div>
              </div>
            </>
          )}
          {!googleEnabled && (
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">Login with OTP</div>
          )}
          {stage === 'request' && (
            <form onSubmit={handleRequest} className="mt-4 space-y-4 text-center">
              <div className='flex'>
                <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                <Input
                  placeholder='Mobile Number'
                  value={localPhone}
                  onChange={e=>setLocalPhone(e.target.value)}
                  required
                  className='rounded-l-none text-center'
                  inputMode='tel'
                />
              </div>
              <button type='submit' className="w-full btn-primary justify-center px-4 py-2 rounded-lg text-sm font-medium text-center">Request OTP</button>
            </form>
          )}
          {stage === 'verify' && (
            <form onSubmit={handleVerify} className="mt-4 space-y-4 text-center">
              <div>
                <OTPInput length={otpLength} value={otp} onChange={setOtp} />
                <div className='mt-2 text-xs text-slate-500 dark:text-slate-400 text-center'>Enter the {otpLength}-character code sent to {phone}</div>
              </div>
              <button type='submit' disabled={otp.length !== otpLength} className="w-full btn-primary justify-center px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 text-center">Verify</button>
            </form>
          )}
        </Card>
      </div>
    </Box>
  );
}
