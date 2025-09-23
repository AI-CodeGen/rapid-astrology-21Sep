import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';

export default function OTPInput({ length=4, value, onChange, disabled=false, className='' }) {
  const inputsRef = useRef([]);

  useEffect(()=>{
    // Adjust value length if config changes
    if (value.length > length) {
      onChange(value.slice(0, length));
    }
  }, [length]);

  function handleChange(idx, char) {
    if (!/^[0-9a-zA-Z]?$/.test(char)) return; // restrict
    const chars = value.split('');
    chars[idx] = char;
    const next = chars.join('').padEnd(length, '');
    onChange(next.trimEnd());
    if (char && idx < length - 1) {
      inputsRef.current[idx+1]?.focus();
    }
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx-1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx-1]?.focus();
    if (e.key === 'ArrowRight' && idx < length-1) inputsRef.current[idx+1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').slice(0, length);
    if (!text) return;
    const sanitized = text.replace(/[^0-9a-zA-Z]/g,'').slice(0,length);
    onChange(sanitized);
    inputsRef.current[Math.min(sanitized.length, length-1)]?.focus();
  }

  return (
    <div className={clsx('flex gap-2 justify-center', className)} onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputsRef.current[i] = el}
          inputMode='text'
            autoComplete='one-time-code'
          maxLength={1}
          className={clsx('w-10 h-12 text-center text-lg rounded-lg border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500', disabled && 'opacity-50')}
          value={value[i] || ''}
          onChange={e=>handleChange(i, e.target.value.slice(-1))}
          onKeyDown={e=>handleKeyDown(e,i)}
          disabled={disabled}
          aria-label={`OTP character ${i+1}`}
        />
      ))}
    </div>
  );
}