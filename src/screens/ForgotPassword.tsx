import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Send, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, authState, resetAuthState } = useAuthStore();
  const [email, setEmail] = useState('');

  useEffect(() => {
    resetAuthState();
  }, [resetAuthState]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPassword({ email });
  };

  useEffect(() => {
    if (authState.status === 'success') {
      const timer = setTimeout(() => {
        navigate('/verify', { state: { email } });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authState.status, navigate, email]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 text-brand-light hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="relative z-10 mt-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Recover Account</h1>
            <p className="text-brand-light/80 text-sm">Enter your email to receive a verification code</p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-6">
            {authState.status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{authState.message}</p>
              </div>
            )}

            {authState.status === 'success' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-500 text-sm animate-in fade-in slide-in-from-top-4">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <p>{authState.message}. Redirecting...</p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-brand-accent/70" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authState.status === 'error') resetAuthState();
                }}
                className="input-field pl-11"
                placeholder="Email Address"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={authState.status === 'loading'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {authState.status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SENDING...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>SEND OTP</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
