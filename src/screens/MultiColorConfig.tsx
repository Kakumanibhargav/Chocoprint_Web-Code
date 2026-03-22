import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Palette, SlidersHorizontal, Layers } from 'lucide-react';
import { useMachineStore } from '../store/machineStore';
import { defaultPrinterParameters } from '../models/PrinterModels';
import type { PrinterParameters } from '../models/PrinterModels';
import type { SimulationState } from '../models/MachineModels';

export default function MultiColorConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    shape: storeShape, 
    numColors: storeNumColors, 
    incrementXY: storeIncrementXY, 
    baseSize: storeBaseSize, 
    printMode: storePrintMode, 
    params: storeParams,
    setSimulationParams, 
    clearSimulationData,
    hasHydrated 
  } = useMachineStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-darker">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const [shape, setShape] = useState(location.state?.shape || storeShape || 'Heart');
  const [numColors, setNumColors] = useState(location.state?.numColors || storeNumColors || 3);
  const [incrementXY, setIncrementXY] = useState(location.state?.incrementXY || storeIncrementXY || 10);
  const [baseSize, setBaseSize] = useState(location.state?.baseSize || storeBaseSize || 30);
  const [printMode, setPrintMode] = useState<'Border Only' | 'Infill Only' | 'Both'>(location.state?.printMode || storePrintMode || 'Both');

  const [params, setParams] = useState<PrinterParameters>(location.state?.params || storeParams || defaultPrinterParameters);

  const updateStateAndClearCache = (setter: Function, value: any, key: keyof SimulationState) => {
    setter(value);
    setSimulationParams({ [key]: value });
    clearSimulationData();
  };

  const handleSimulate = () => {
    setSimulationParams({ 
      shape, numColors, incrementXY, baseSize, printMode, params, 
      isMultiColor: true 
    });
    navigate('/multi-simulation', {
      state: { shape, numColors, incrementXY, baseSize, printMode, params }
    });
  };

  return (
    <div className="min-h-screen p-6 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/select')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Multi-Color Art</h1>
          <p className="text-brand-light text-sm">Design layered masterpieces</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Config */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-brand-accent" />
            <h2 className="text-white font-black tracking-widest text-sm uppercase">Design Setup</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-brand-light">Base Shape</label>
              <select 
                value={shape} 
                onChange={e => updateStateAndClearCache(setShape, e.target.value, 'shape')}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
              >
                <option value="Heart">Heart</option>
                <option value="Star">Star</option>
                <option value="Circle">Circle</option>
                <option value="Hexagon">Hexagon</option>
                <option value="Pentagon">Pentagon</option>
                <option value="Triangle">Triangle</option>
                <option value="Diamond">Diamond</option>
                <option value="Moon">Moon</option>
                <option value="Parallelogram">Parallelogram</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Butterfly">Butterfly</option>
                <option value="Fish">Fish</option>
              </select>
            </div>

            <ConfigSlider label="Number of Colors/Layers" value={numColors} min={2} max={10} onChange={(v) => updateStateAndClearCache(setNumColors, v, 'numColors')} />
            <ConfigSlider label="Base Size (mm)" value={baseSize} min={20} max={100} onChange={(v) => updateStateAndClearCache(setBaseSize, v, 'baseSize')} />
            <ConfigSlider label="Layer Increment (mm)" value={incrementXY} min={5} max={30} onChange={(v) => updateStateAndClearCache(setIncrementXY, v, 'incrementXY')} />

            <div className="pt-2">
              <label className="text-sm font-medium text-brand-light block mb-2">Print Mode</label>
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                {(['Border Only', 'Infill Only', 'Both'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => updateStateAndClearCache(setPrintMode, m, 'printMode')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${printMode === m ? 'bg-brand-accent text-black shadow-sm' : 'text-brand-light hover:text-white'}`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Global Params */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="w-5 h-5 text-brand-accent" />
            <h2 className="text-white font-black tracking-widest text-sm uppercase">Printer Params</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-brand-light">Print Speed (mm/s)</label>
              <input type="number" value={params.printSpeed} onChange={e => {
                const next = {...params, printSpeed: e.target.value};
                setParams(next);
                setSimulationParams({ params: next });
                clearSimulationData();
              }} className="w-20 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-white text-right" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-brand-light">Z Layer Height (mm)</label>
              <input type="number" value={params.layerHeight} onChange={e => {
                const next = {...params, layerHeight: e.target.value};
                setParams(next);
                setSimulationParams({ params: next });
                clearSimulationData();
              }} className="w-20 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-white text-right" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-4xl mx-auto z-50">
        <button 
          onClick={handleSimulate}
          className="w-full bg-brand-accent text-brand-darker shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:scale-[1.02] py-4 rounded-2xl font-black tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          <span>SIMULATE & GENERATE G-CODE</span>
          <Layers className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ConfigSlider({ label, value, min, max, onChange }: { label: string, value: number, min: number, max: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-brand-light">{label}</label>
        <span className="text-white font-mono font-bold">{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-brand-accent h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
