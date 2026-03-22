import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Square, AlertTriangle, Activity, ArrowLeft } from 'lucide-react';
import { useMachineStore } from '../store/machineStore';

export default function Operating() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isPaused, 
    printProgress, 
    elapsedTime, 
    currentLayer, 
    logs,
    isMultiColor
  } = useMachineStore();

  const handleBack = () => {
    const fromMultiColor = location.state?.fromMultiColor ?? isMultiColor;
    if (fromMultiColor) {
      navigate('/multi-simulation', { state: location.state });
    } else {
      navigate('/simulation', { state: location.state });
    }
  };

  const handlePauseResume = async () => {
    const { HardwareService } = await import('../services/HardwareService');
    if (isPaused) {
      HardwareService.resumePrint();
    } else {
      HardwareService.pausePrint();
    }
  };

  const handleCancel = async () => {
    const { HardwareService } = await import('../services/HardwareService');
    HardwareService.cancelPrint();
    navigate('/home');
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen p-6 pb-24 max-w-4xl mx-auto flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={handleBack} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Operating</h1>
            <p className="text-brand-success text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
              Printing in Progress
            </p>
          </div>
          <button 
            onClick={() => navigate('/live-data')}
            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors"
          >
            <Activity className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="flex justify-between items-end mb-2">
          <p className="text-brand-light text-xs font-bold tracking-widest">PROGRESS</p>
          <p className="text-3xl font-black text-brand-accent">{Math.floor(printProgress)}%</p>
        </div>
        
        {/* Progress Bar */}
        <div className="h-4 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-brand-accent to-[#f59e0b] rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${printProgress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-brand-light font-bold">ELAPSED TIME</p>
            <p className="text-white font-mono">{formatTime(elapsedTime)}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-light font-bold">EST. REMAINING</p>
            <p className="text-white font-mono">{formatTime((elapsedTime / (printProgress || 1)) * (100 - printProgress))}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-light font-bold">CURRENT LAYER</p>
            <p className="text-white font-mono">{currentLayer} / 10</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-light font-bold">Z HEIGHT</p>
            <p className="text-white font-mono">{(currentLayer * 0.6).toFixed(2)} mm</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={handlePauseResume}
          className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
             {isPaused ? <Play className="w-5 h-5 text-brand-accent fill-current" /> : <Pause className="w-5 h-5 text-brand-accent fill-current" />}
          </div>
          <span className="text-white font-bold text-sm tracking-wide">{isPaused ? 'RESUME' : 'PAUSE'}</span>
        </button>
        <button 
          onClick={handleCancel}
          className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group border-brand-error/20"
        >
          <div className="w-12 h-12 rounded-full bg-brand-error/20 flex items-center justify-center group-hover:scale-110 transition-transform">
             <Square className="w-5 h-5 text-brand-error fill-current" />
          </div>
          <span className="text-brand-error font-bold text-sm tracking-wide">CANCEL</span>
        </button>
      </div>

      {/* Terminal Log */}
      <div className="flex-1 glass-card p-4 flex flex-col min-h-[200px]">
        <h3 className="text-xs font-bold text-brand-light mb-3 tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> TRANSMISSION LOG
        </h3>
        <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-3 overflow-auto custom-scrollbar flex flex-col-reverse">
          {logs.map((log, i) => (
            <div key={i} className={`font-mono text-[10px] mb-1 leading-tight ${
              log.includes('WARNING') ? 'text-brand-error' : 
              log.includes('TX') ? 'text-brand-accent' : 
              log.includes('RX') ? 'text-brand-success' : 'text-brand-light/70'
            }`}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
