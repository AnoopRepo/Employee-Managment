import React from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] relative overflow-hidden p-4">
      {/* Ambient background orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md z-10 animate-fadeIn text-center">
        {/* Shield Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-500 to-purple-600 shadow-xl shadow-red-500/10 mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">Public Sign Up Disabled</h1>
        <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
          To protect workspace security, self-registration is closed. Only workspace Administrators or Admins can register new employee accounts.
        </p>

        <div className="mt-8 backdrop-blur-2xl bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-2xl">
          <p className="text-xs text-white/50 leading-relaxed mb-6">
            If you are a new employee, please contact your systems manager to receive your pre-configured credentials and security passcode.
          </p>
          <Link
            to="/login"
            className="block w-full py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl transition-all"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
