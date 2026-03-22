import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function VerificationCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, authState, resetAuthState } = useAuthStore();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
    resetAuthState();
  }, [email, navigate, resetAuthState]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (authState.status === 'error') resetAuthState();

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.join('');
    if (otp.length === 6) {
      await verifyOtp({ email, otp });
    }
  };

  useEffect(() => {
    if (authState.status === 'success') {
      const timer = setTimeout(() => {
        resetAuthState(); // ✅ Clear success state before moving to the next step
        navigate('/reset-password');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authState.status, navigate, resetAuthState]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 text-brand-light hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="relative z-10 mt-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Enter OTP</h1>
            <p className="text-brand-light/80 text-sm">We've sent a 6-digit code to {email}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-8">
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

            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl text-brand-accent font-bold focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-transparent transition-all"
                  required
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={authState.status === 'loading' || code.join('').length !== 6}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {authState.status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>VERIFYING...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>VERIFY CODE</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button className="flex items-center justify-center gap-2 mx-auto text-brand-light hover:text-white transition-colors text-sm font-medium">
              <RefreshCw className="w-4 h-4" />
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
