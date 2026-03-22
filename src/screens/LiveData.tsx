import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, ArrowDownToLine } from 'lucide-react';
import { useMachineStore } from '../store/machineStore';

export default function LiveData() {
  const navigate = useNavigate();
  const { wPos, mPos } = useMachineStore();

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Live Data</h1>
          <p className="text-brand-light text-sm">Real-time coordinates</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Work Position */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <h2 className="text-white font-bold">Work Position (WPOS)</h2>
              <p className="text-brand-light text-xs">Relative to G92 origin</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <CoordinateRow axis="X" value={wPos.x} color="text-red-400" />
            <CoordinateRow axis="Y" value={wPos.y} color="text-green-400" />
            <CoordinateRow axis="Z" value={wPos.z} color="text-blue-400" />
          </div>
        </div>

        {/* Machine Position */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-brand-light" />
            </div>
            <div>
              <h2 className="text-white font-bold">Machine Position (MPOS)</h2>
              <p className="text-brand-light text-xs">Absolute hardware coordinates</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 opacity-70">
            <CoordinateRow axis="X" value={mPos.x} color="text-white" />
            <CoordinateRow axis="Y" value={mPos.y} color="text-white" />
            <CoordinateRow axis="Z" value={mPos.z} color="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CoordinateRow({ axis, value, color }: { axis: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between bg-black/20 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-4">
        <span className={`text-2xl font-black ${color}`}>{axis}</span>
      </div>
      <div className="text-3xl font-mono text-white tracking-wider flex items-baseline gap-1">
        {value.toFixed(2)} <span className="text-xs text-brand-light/50 font-sans tracking-normal">mm</span>
      </div>
    </div>
  );
}
