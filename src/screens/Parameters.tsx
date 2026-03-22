import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, SlidersHorizontal } from 'lucide-react';
import { defaultPrinterParameters } from '../models/PrinterModels';
import { useMachineStore } from '../store/machineStore';
import type { PrinterParameters } from '../models/PrinterModels';

export default function Parameters() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    shape: storeShape, 
    customPaths: storePaths, 
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

  const shape = location.state?.shape || storeShape || 'Unknown Shape';
  const customPaths = location.state?.customPaths || storePaths || null;
  
  const [params, setParams] = useState<PrinterParameters>(location.state?.params || storeParams || defaultPrinterParameters);
  const [printMode, setPrintMode] = useState<'Border Only' | 'Infill Only' | 'Both'>('Both');

  const handleParamChange = (key: keyof typeof params, value: string | number) => {
    const nextParams = { ...params, [key]: value };
    setParams(nextParams);
    setSimulationParams({ params: nextParams, shape, customPaths });
    clearSimulationData();
  };

  return (
    <div className="min-h-screen p-6 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/select')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Parameters</h1>
          <p className="text-brand-light text-sm">Configure {shape}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Style Selection */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
            <h2 className="text-white font-black tracking-widest text-xs uppercase">Print Style</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['Border Only', 'Infill Only', 'Both'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPrintMode(mode)}
                className={`py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all border ${
                  printMode === mode 
                    ? 'bg-brand-accent text-brand-darker border-brand-accent shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-[1.02]'
                    : 'bg-white/5 text-brand-light border-white/10 hover:bg-white/10'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="w-5 h-5 text-brand-accent" />
            <h2 className="text-white font-black tracking-widest text-sm uppercase">Basic Settings</h2>
          </div>

          <div className="space-y-4">
            <ParamInput label="Shape Width (mm)" value={params.shapeWidth} onChange={(v) => handleParamChange('shapeWidth', v)} />
            <ParamInput label="Shape Height (mm)" value={params.shapeHeight} onChange={(v) => handleParamChange('shapeHeight', v)} />
            <ParamInput label="Number of Layers" value={params.numLayers} onChange={(v) => handleParamChange('numLayers', v)} />
            <ParamInput label="Print Speed (mm/s)" value={params.printSpeed} onChange={(v) => handleParamChange('printSpeed', v)} />
            <ParamInput label="Layer Height (mm)" value={params.layerHeight} onChange={(v) => handleParamChange('layerHeight', v)} />
            
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-bold text-brand-light tracking-wide uppercase">Infill Density (%)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={params.infillDensity} 
                  onChange={(e) => handleParamChange('infillDensity', parseInt(e.target.value))}
                  className="w-full accent-brand-accent h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white font-mono w-12 text-right">{params.infillDensity}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-white font-black tracking-widest text-sm uppercase mb-4">Advanced Settings</h2>
          <div className="space-y-4">
            <ParamInput label="Nozzle Diameter (mm)" value={params.nozzleDiameter} onChange={(v) => handleParamChange('nozzleDiameter', v)} />
            <ParamInput label="Extrusion Multiplier" value={params.flowRate} onChange={(v) => handleParamChange('flowRate', v)} />
            <ParamInput label="Travel Speed (mm/s)" value={params.travelSpeed} onChange={(v) => handleParamChange('travelSpeed', v)} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-4xl mx-auto z-50">
        <button 
          onClick={() => {
            setSimulationParams({ isMultiColor: false });
            navigate('/simulation', { state: { shape, params, customPaths, printMode } });
          }}
          className="w-full bg-brand-accent text-brand-darker shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:scale-[1.02] py-4 rounded-2xl font-black tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          <span>SIMULATE & GENERATE G-CODE</span>
          <Play className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
}

function ParamInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm font-medium text-brand-light">{label}</label>
      <input 
        type="number" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-right focus:outline-none focus:border-brand-accent transition-colors font-mono"
      />
    </div>
  );
}
