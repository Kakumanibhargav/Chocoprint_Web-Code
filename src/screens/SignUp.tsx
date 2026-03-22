import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function SignUp() {
  const navigate = useNavigate();
  const { signup, authState, resetAuthState } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    resetAuthState();
  }, [resetAuthState]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // Custom error handling if needed, but the store/backend should handle it too
      return;
    }
    await signup({ fullName, email, password, confirmPassword });
  };

  useEffect(() => {
    if (authState.status === 'success') {
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    }
  }, [authState.status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Create Account</h1>
            <p className="text-brand-light/80 text-sm">Join the ChocoPrint community</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
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
                <p>{authState.message}. Redirecting to sign in...</p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-brand-accent/70" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (authState.status === 'error') resetAuthState();
                }}
                className="input-field pl-11"
                placeholder="Full Name"
                required
              />
            </div>

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

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-brand-accent/70" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authState.status === 'error') resetAuthState();
                }}
                className="input-field pl-11"
                placeholder="Password"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-brand-accent/70" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (authState.status === 'error') resetAuthState();
                }}
                className="input-field pl-11"
                placeholder="Confirm Password"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={authState.status === 'loading' || authState.status === 'success'}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {authState.status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>SIGN UP</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-brand-light text-sm">
              Already have an account?{' '}
              <button onClick={() => navigate('/signin')} className="text-brand-accent font-bold hover:text-white transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
