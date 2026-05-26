import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('general'); // 'general', 'hr', 'admin', 'administrator', 'it'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // OTP-specific states
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [simulatedOtp, setSimulatedOtp] = useState('');

  // ── Forgot Password States ──────────────────────────────────────
  // step: null | 'fp-email' | 'fp-otp' | 'fp-newpass'
  const [fpStep, setFpStep] = useState(null);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState(['', '', '', '', '', '']);
  const [fpSimulatedOtp, setFpSimulatedOtp] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [fpConfirmPass, setFpConfirmPass] = useState('');
  const [fpShowPass, setFpShowPass] = useState(false);
  const [fpSuccess, setFpSuccess] = useState(false);
  // ──────────────────────────────────────────────────────────────── 

  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(email, password, role);
      if (result.success) {
        if (result.otpRequired) {
          setOtpRequired(true);
          setSimulatedOtp(result.simulatedOtp || '');
          setOtp(['', '', '', '', '', '']);
        } else {
          navigate('/');
        }
      } else {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter a complete 6-digit code.');
      setSubmitting(false);
      return;
    }

    try {
      const result = await verifyOtp(email, otpCode, role);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Invalid OTP code. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred during verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next input
    if (element.value !== '' && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      
      // Focus the last input
      const container = e.target.parentNode;
      const inputs = container.querySelectorAll('input');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    }
  };

  // ── Forgot Password Handlers ──────────────────────────────────────

  const handleFpSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setFpSimulatedOtp(data.simulated_otp || '');
        setFpOtp(['', '', '', '', '', '']);
        setFpStep('fp-otp');
      } else {
        setError(data.detail || 'Failed to send reset code.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFpVerifyOtp = (e) => {
    e.preventDefault();
    setError('');
    const code = fpOtp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setFpStep('fp-newpass');
  };

  const handleFpReset = async (e) => {
    e.preventDefault();
    setError('');
    if (fpNewPass !== fpConfirmPass) {
      setError('Passwords do not match.');
      return;
    }
    if (fpNewPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp.join(''), new_password: fpNewPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setFpSuccess(true);
      } else {
        setError(data.detail || 'Reset failed. Please try again.');
        // If OTP error, step back to OTP entry
        if (data.detail?.toLowerCase().includes('code')) {
          setFpStep('fp-otp');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFpOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const next = [...fpOtp];
    next[index] = element.value;
    setFpOtp(next);
    if (element.value !== '' && element.nextSibling) element.nextSibling.focus();
  };

  const handleFpOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && fpOtp[index] === '' && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleFpOtpPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').trim();
    if (p.length === 6 && /^\d+$/.test(p)) {
      setFpOtp(p.split(''));
    }
  };

  const exitForgotPassword = () => {
    setFpStep(null);
    setFpEmail('');
    setFpOtp(['', '', '', '', '', '']);
    setFpSimulatedOtp('');
    setFpNewPass('');
    setFpConfirmPass('');
    setFpSuccess(false);
    setError('');
  };

  // ────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] relative overflow-hidden p-4">
      {/* Ambient background orbs */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-500/8 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md z-10 animate-fadeIn">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 shadow-xl shadow-purple-500/20 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {fpStep === 'fp-email' ? 'Reset Password'
              : fpStep === 'fp-otp' ? 'Check Your Email'
              : fpStep === 'fp-newpass' ? 'Set New Password'
              : otpRequired ? 'Verification Required'
              : 'Welcome back'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {fpStep === 'fp-email' ? 'Enter your account email to receive a reset code'
              : fpStep === 'fp-otp' ? 'Enter the 6-digit code sent to your email'
              : fpStep === 'fp-newpass' ? 'Choose a strong new password'
              : otpRequired ? 'Enter the security code to continue'
              : 'Sign in to your WorkPulse account'}
          </p>
        </div>

        {/* Development Helper Card */}
        {otpRequired && simulatedOtp && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 shadow-lg shadow-amber-500/5 animate-fadeIn">
            <div className="flex gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 h-10 w-10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-9-3h.01M5.071 19.071A9 9 0 1118.93 5.07M12 11V9m0-4h.01" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Dev OTP Assistant</h4>
                <p className="text-white/50 text-[11px] mt-0.5 leading-relaxed">
                  We simulated sending an email code. For testing, please enter:
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-amber-300 font-mono text-sm tracking-widest font-black shadow-inner">
                  {simulatedOtp}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

          <div className="p-7">
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2 animate-shake">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ── FORGOT PASSWORD STEPS ───────────────────────────────── */}
            {fpStep ? (
              <div className="animate-fadeIn">

                {/* ── Success state ── */}
                {fpSuccess ? (
                  <div className="space-y-5 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">Password Updated!</p>
                      <p className="text-white/40 text-xs mt-1">You can now sign in with your new password.</p>
                    </div>
                    <button
                      onClick={exitForgotPassword}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl transition-all cursor-pointer hover:from-purple-600 hover:to-blue-700"
                    >
                      Back to Sign In
                    </button>
                  </div>

                ) : fpStep === 'fp-email' ? (
                  /* Step FP-1: Email entry */
                  <form onSubmit={handleFpSendOtp} className="space-y-5">
                    <div>
                      <label htmlFor="fp-email" className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Account Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          id="fp-email"
                          value={fpEmail}
                          onChange={(e) => setFpEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                          placeholder="you@example.com"
                          required
                          autoFocus
                        />
                        <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl transition-all duration-300 disabled:opacity-50 cursor-pointer">
                      {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending Code…</span> : 'Send Reset Code'}
                    </button>
                    <button type="button" onClick={exitForgotPassword} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer">← Back to Sign In</button>
                  </form>

                ) : fpStep === 'fp-otp' ? (
                  /* Step FP-2: OTP verification */
                  <form onSubmit={handleFpVerifyOtp} className="space-y-5">
                    {/* DEV hint */}
                    {fpSimulatedOtp && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25">
                        <div className="flex gap-3 items-center">
                          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-9-3h.01M5.071 19.071A9 9 0 1118.93 5.07M12 11V9m0-4h.01" /></svg>
                          </div>
                          <div>
                            <p className="text-amber-200 text-[10px] font-bold uppercase tracking-wider">Dev Reset Code</p>
                            <p className="text-white/50 text-[10px] mt-0.5">Use this code to test:</p>
                            <span className="font-mono font-black text-amber-300 tracking-widest text-sm">{fpSimulatedOtp}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-center text-[10px] font-black uppercase tracking-widest text-white/40 mb-3.5">Reset Code</label>
                      <div className="flex justify-between gap-2.5" onPaste={handleFpOtpPaste}>
                        {fpOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleFpOtpChange(e.target, idx)}
                            onKeyDown={(e) => handleFpOtpKeyDown(e, idx)}
                            className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-white text-xl font-bold font-mono focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all shadow-inner"
                            required
                          />
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl transition-all cursor-pointer">Verify Code</button>
                    <button type="button" onClick={() => { setFpStep('fp-email'); setError(''); }} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer">← Resend Code</button>
                  </form>

                ) : fpStep === 'fp-newpass' ? (
                  /* Step FP-3: New password */
                  <form onSubmit={handleFpReset} className="space-y-5">
                    <div>
                      <label htmlFor="fp-newpass" className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={fpShowPass ? 'text' : 'password'}
                          id="fp-newpass"
                          value={fpNewPass}
                          onChange={(e) => setFpNewPass(e.target.value)}
                          className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                          placeholder="Min. 6 characters"
                          required
                          minLength={6}
                          autoFocus
                        />
                        <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <button type="button" onClick={() => setFpShowPass(!fpShowPass)} className="absolute right-3.5 top-3.5 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                          {fpShowPass
                            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          }
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="fp-confirm" className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={fpShowPass ? 'text' : 'password'}
                          id="fp-confirm"
                          value={fpConfirmPass}
                          onChange={(e) => setFpConfirmPass(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none transition-all ${
                            fpConfirmPass && fpNewPass !== fpConfirmPass
                              ? 'border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                              : 'border-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400'
                          }`}
                          placeholder="Re-enter password"
                          required
                        />
                        <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        {fpConfirmPass && fpNewPass === fpConfirmPass && (
                          <span className="absolute right-3.5 top-3.5 text-emerald-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                      </div>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl transition-all duration-300 disabled:opacity-50 cursor-pointer">
                      {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating Password…</span> : 'Reset Password'}
                    </button>
                  </form>
                ) : null}
              </div>

            ) : !otpRequired ? (
              // Step 1: Login Credentials & Role Selection
              <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
                {/* Role Cards */}
                {/* Role Dropdown Selector */}
                <div>
                  <label htmlFor="role" className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                    Select Your Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all appearance-none cursor-pointer font-bold uppercase tracking-widest text-xs"
                    >
                      <option value="hr" className="bg-slate-950 text-white font-bold py-2">hr</option>
                      <option value="admin" className="bg-slate-950 text-white font-bold py-2">admin</option>
                      <option value="administrator" className="bg-slate-950 text-white font-bold py-2">administrator</option>
                      <option value="it" className="bg-slate-950 text-white font-bold py-2">it</option>
                      <option value="general" className="bg-slate-950 text-white font-bold py-2">general</option>
                    </select>
                    {/* Dynamic Left Icon */}
                    <div className="absolute left-3.5 top-3.5 pointer-events-none text-sm select-none">
                      {role === 'hr' ? '💼' : role === 'admin' ? '🔑' : role === 'administrator' ? '🛡️' : role === 'it' ? '💻' : '👤'}
                    </div>
                    {/* Custom Chevron Indicator */}
                    <div className="absolute right-4 top-4 pointer-events-none text-white/30 text-[9px] select-none">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                      placeholder="you@example.com"
                      required
                    />
                    <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me / Forgot */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer" />
                    <span className="text-white/50 group-hover:text-white/70 transition-colors">Remember me</span>
                  </label>
                  <button type="button" onClick={() => { setFpStep('fp-email'); setError(''); }} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer">Forgot password?</button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Verifying account…
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>
            ) : (
              // Step 2: 6-Digit OTP Verification Form
              <form onSubmit={handleOtpSubmit} className="space-y-6 animate-fadeIn">
                <div className="text-center">
                  <p className="text-white/50 text-xs leading-relaxed">
                    A code has been issued for <span className="text-purple-300 font-semibold">{email}</span>.
                  </p>
                </div>

                {/* 6-Digit passcode inputs */}
                <div>
                  <label className="block text-center text-[10px] font-black uppercase tracking-widest text-white/40 mb-3.5">
                    Security Passcode
                  </label>
                  <div className="flex justify-between gap-2.5" onPaste={handleOtpPaste}>
                    {otp.map((data, index) => (
                      <input
                        key={index}
                        type="text"
                        name="otp-digit"
                        maxLength="1"
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-white text-xl font-bold font-mono focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all shadow-inner"
                        required
                      />
                    ))}
                  </div>
                </div>

                {/* OTP Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Verifying Code…
                      </span>
                    ) : 'Verify Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequired(false);
                      setError('');
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Signup prompt removed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;