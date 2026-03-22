import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Code2 } from 'lucide-react';
import { useMachineStore } from '../store/machineStore';

export default function GCodePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { simulationGCode, isMultiColor } = useMachineStore();
  const gcode = location.state?.gcode || simulationGCode || '; No G-Code available\n';

  const handleBack = () => {
    const fromMultiColor = location.state?.fromMultiColor ?? isMultiColor;
    if (fromMultiColor) {
      navigate('/multi-simulation', { state: location.state });
    } else {
      navigate('/simulation', { state: location.state });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chocoprint.gcode';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = gcode.split('\n');
  const totalLines = lines.length;
  const DISPLAY_LIMIT = 2000;
  const isTruncated = totalLines > DISPLAY_LIMIT;
  const displayedGCode = isTruncated 
    ? lines.slice(0, DISPLAY_LIMIT).join('\n') + '\n\n... [TRUNCATED FOR SPEED: Download full file to see all lines] ...'
    : gcode;

  return (
    <div className="min-h-screen p-6 pb-24 max-w-4xl mx-auto flex flex-col">
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <button onClick={handleBack} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">G-Code</h1>
          <p className="text-brand-light text-sm">Raw Toolpath Data</p>
        </div>
      </div>

      <div className="flex-1 glass-card p-4 rounded-2xl overflow-hidden relative mb-6 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-brand-accent">
            <Code2 className="w-5 h-5" />
            <span className="font-bold tracking-widest text-sm">OUTPUT</span>
          </div>
          <span className="text-xs font-mono text-brand-light">
            {totalLines} lines {isTruncated && '(Truncated)'}
          </span>
        </div>
        
        {isTruncated && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-200 font-medium">
             PREVIEW MODE: Only showing first {DISPLAY_LIMIT} lines for performance. 
             Click "SAVE TRANSFER FILE" below to download the complete {totalLines} lines.
          </div>
        )}

        <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 overflow-auto custom-scrollbar">
          <pre className="font-mono text-[10px] text-brand-light/90 whitespace-pre-wrap pl-2 border-l-2 border-brand-accent/50 leading-relaxed">
            {displayedGCode}
          </pre>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-4xl mx-auto z-50">
        <button 
          onClick={handleDownload}
          className="w-full bg-brand-accent text-brand-darker shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:scale-[1.02] py-4 rounded-2xl font-black tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-5 h-5 fill-current" />
          <span>SAVE TRANSFER FILE</span>
        </button>
      </div>
    </div>
  );
}
