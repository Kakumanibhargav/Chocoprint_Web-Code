import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function SignIn() {
  const navigate = useNavigate();
  const { login, authState, resetAuthState } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    resetAuthState();
  }, [resetAuthState]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  useEffect(() => {
    if (authState.status === 'success') {
      navigate('/home');
    }
  }, [authState.status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-light/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-brand-light/80 text-sm">Sign in to continue to ChocoPrint</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            {authState.status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{authState.message}</p>
              </div>
            )}

            <div className="space-y-4">
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-brand-border text-brand-accent focus:ring-brand-accent bg-white/5" />
                <span className="text-brand-light">Remember me</span>
              </label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-brand-accent hover:text-white transition-colors font-medium">
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={authState.status === 'loading'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {authState.status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SIGNING IN...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>SIGN IN</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-brand-light text-sm">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-brand-accent font-bold hover:text-white transition-colors">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
