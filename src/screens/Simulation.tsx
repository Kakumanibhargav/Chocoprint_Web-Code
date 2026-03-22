import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { ArrowLeft, RefreshCw, Printer, Play, Pause, SkipBack, Layers, Code2 } from 'lucide-react';
import { GCodeGenerator } from '../utils/GCodeGenerator';
import { GCodeParser } from '../utils/GCodeParser';
import type { GCodeCommand } from '../utils/GCodeParser';
import type { PrinterParameters } from '../models/PrinterModels';

// Components for 3D simulation
function PrinterBed({ width = 200, depth = 200 }) {
  return (
    <mesh position={[0, 0, -0.1]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#222" transparent opacity={0.6} />
      <gridHelper args={[Math.max(width, depth), 20, '#555', '#333']} rotation={[Math.PI / 2, 0, 0]} />
    </mesh>
  );
}

function ToolpathLines({ commands, progress, showExtrusion = true, showTravel = true }: { commands: GCodeCommand[], progress: number, showExtrusion?: boolean, showTravel?: boolean }) {
  const visibleCommands = useMemo(() => commands.slice(0, progress), [commands, progress]);
  
  const segments = useMemo(() => {
    const pathSegments: { points: [number, number, number][], isExtruding: boolean }[] = [];
    
    let currentPath: [number, number, number][] = [];
    let lastExtrudingStatus = false;
    
    // We need complete coordinates
    let curX = 0, curY = 0, curZ = 0;

    visibleCommands.forEach(cmd => {
      // Re-apply state tracking (as the command objects have it)
      if (cmd.command === 'G0' || cmd.command === 'G1') {
         const nx = cmd.x !== null ? cmd.x : curX;
         const ny = cmd.y !== null ? cmd.y : curY;
         const nz = cmd.z !== null ? cmd.z : curZ;

         if (cmd.isExtruding !== lastExtrudingStatus && currentPath.length > 0) {
            pathSegments.push({ points: [...currentPath], isExtruding: lastExtrudingStatus });
            currentPath = [[curX, curY, curZ]];
         }
         
         if (currentPath.length === 0) {
           currentPath.push([curX, curY, curZ]);
         }
         
         currentPath.push([nx, ny, nz]);
         
         curX = nx; curY = ny; curZ = nz;
         lastExtrudingStatus = cmd.isExtruding;
      }
    });

    if (currentPath.length > 0) {
      pathSegments.push({ points: currentPath, isExtruding: lastExtrudingStatus });
    }

    // Filter based on visibility toggles
    return pathSegments.filter(seg => {
      if (seg.isExtruding) return showExtrusion;
      return showTravel;
    });
  }, [visibleCommands, showExtrusion, showTravel]);

  return (
    <group>
      {segments.map((seg, i) => (
        <Line 
          key={i} 
          points={seg.points} 
          color={seg.isExtruding ? '#FFD700' : '#475569'} // Gold for extrusion, Slate for travel
          lineWidth={seg.isExtruding ? 5 : 0.5}
          dashed={false} 
          transparent
          opacity={seg.isExtruding ? 1 : 0.1}
        />
      ))}
    </group>
  );
}

export default function Simulation() {
  const location = useLocation();
  const navigate = useNavigate();
  const shape = location.state?.shape || 'Unknown';
  const customPaths = location.state?.customPaths || null;
  const printMode = location.state?.printMode || 'Both';
  const params: PrinterParameters = location.state?.params;
  
  const [gcode, setGcode] = useState('');
  const [commands, setCommands] = useState<GCodeCommand[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [stats, setStats] = useState({ time: 0, weight: 0.0, layers: 0 });
  const [showExtrusion, setShowExtrusion] = useState(true);
  const [showTravel, setShowTravel] = useState(true);

  // Animation state
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(20); // Higher default for immediate action
  const [currentLayer, setCurrentLayer] = useState(0);

  useEffect(() => {
    if (!params) {
      navigate('/select');
      return;
    }

    // Generate GCode asynchronously to prevent blocking the UI
    setTimeout(() => {
      try {
        const result = GCodeGenerator.generateSampleGCode(shape, customPaths, printMode, params);
        setGcode(result.gCode);
        
        const parsed = GCodeParser.parse(result.gCode);
        setCommands(parsed);

        const calculatedStats = GCodeParser.calculateStats(result.gCode, parseFloat(params.nozzleDiameter), parseFloat(params.layerHeight));
        
        setStats({
          time: calculatedStats.timeSeconds,
          weight: calculatedStats.materialWeightGrams,
          layers: result.layerCount
        });
        setProgress(0); // Start from the beginning
      } catch (err) {
        console.error("GCode Generation error:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  }, [shape, customPaths, params, navigate]);

  // Animation Loop logic
  useEffect(() => {
    if (!isPlaying || isGenerating || commands.length === 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + speed, commands.length);
        if (next >= commands.length) {
          setIsPlaying(false);
          return commands.length;
        }
        return next;
      });
    }, 16); 

    return () => clearInterval(interval);
  }, [isPlaying, isGenerating, commands.length, speed]);

  // Track current layer based on progress
  useEffect(() => {
    if (commands.length === 0 || progress === 0) {
      setCurrentLayer(0);
      return;
    }
    const currentCmd = commands[Math.min(progress, commands.length - 1)];
    if (currentCmd && currentCmd.z !== null) {
      const layerH = parseFloat(params.layerHeight) || 0.6;
      setCurrentLayer(Math.floor(currentCmd.z / layerH) + 1);
    }
  }, [progress, commands, params.layerHeight]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const xMax = parseFloat(params?.xMax || "200");
  const yMax = parseFloat(params?.yMax || "200");

  return (
    <div className="h-[100dvh] p-6 pb-24 max-w-7xl mx-auto flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/parameters', { state: { shape, params, customPaths, printMode } })} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Simulation</h1>
          <p className="text-brand-light text-sm">{shape} Preview</p>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-2xl overflow-hidden relative mb-6 min-h-[400px]">
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 backdrop-blur-sm">
            <RefreshCw className="w-8 h-8 text-brand-accent animate-spin mb-4" />
            <p className="text-brand-light font-bold">Generating Toolpath...</p>
          </div>
        ) : (
          <Canvas camera={{ position: [0, -150, 250], fov: 60, up: [0, 0, 1] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[100, 100, 100]} />
            <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2} minDistance={50} maxDistance={500} />
            <PrinterBed width={xMax} depth={yMax} />
            <ToolpathLines 
              commands={commands} 
              progress={progress} 
              showExtrusion={showExtrusion}
              showTravel={showTravel}
            />
          </Canvas>
        )}

        {/* Live Simulation Controls */}
        {!isGenerating && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-64 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-brand-accent tracking-[0.2em] uppercase">Playback</span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-white">
                  <Layers className="w-3 h-3 text-brand-accent" />
                  <span>LAYER {currentLayer} / {stats.layers}</span>
                </div>
              </div>

              {/* Progress Slider */}
              <input 
                type="range"
                min="0"
                max={commands.length}
                value={progress}
                onChange={(e) => {
                  setProgress(parseInt(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-accent mb-4"
              />

              <div className="flex items-center justify-center gap-4 mb-4">
                <button 
                  onClick={() => setProgress(0)}
                  className="p-2 text-brand-light hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-brand-accent text-brand-darker flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                </button>
                <button 
                  onClick={() => setProgress(commands.length)}
                  className="p-2 text-brand-light hover:text-white transition-colors rotate-180"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-brand-light uppercase">
                  <span>Sim Speed</span>
                  <span className="text-brand-accent">{speed}x</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/60 border border-white/10 p-3 rounded-xl backdrop-blur-md flex flex-col gap-2">
          <button 
            onClick={() => setShowExtrusion(!showExtrusion)}
            className={`flex items-center gap-2 transition-all hover:translate-x-1 ${showExtrusion ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="w-4 h-1 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]"></div>
            <span className="text-[10px] text-white font-bold uppercase">Extrusion</span>
          </button>
          <button 
            onClick={() => setShowTravel(!showTravel)}
            className={`flex items-center gap-2 transition-all hover:translate-x-1 ${showTravel ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="w-4 h-1 bg-slate-500 rounded-full"></div>
            <span className="text-[10px] text-brand-light font-bold uppercase">Travel</span>
          </button>
        </div>
      </div>



      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-7xl mx-auto z-50 flex gap-4">
        <button 
          onClick={() => navigate('/gcode-preview', { state: { gcode, shape, params, customPaths, printMode, fromMultiColor: false } })}
          className="flex-1 bg-white/5 text-white hover:bg-white/10 py-4 rounded-2xl font-black tracking-widest flex items-center justify-center gap-3 transition-all border border-white/10 backdrop-blur-xl group"
        >
          <Code2 className="w-5 h-5 text-brand-accent group-hover:scale-110 transition-transform" />
          <span>VIEW G-CODE</span>
        </button>
        <button 
          onClick={() => navigate('/operating', { state: { gcode, shape, params, customPaths, printMode, fromMultiColor: false } })}
          className="flex-1 bg-brand-accent text-brand-darker shadow-[0_4px_30px_rgba(251,191,36,0.2)] hover:shadow-[0_4px_40px_rgba(251,191,36,0.4)] hover:scale-[1.02] active:scale-95 py-4 rounded-2xl font-black tracking-widest flex items-center justify-center gap-3 transition-all"
        >
          <Printer className="w-5 h-5 fill-current" />
          <span>START PRINT</span>
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="glass-panel p-3 text-center rounded-xl">
      <p className="text-[9px] font-black text-brand-light tracking-wider mb-1 uppercase">{label}</p>
      <p className="text-sm font-bold text-white uppercase">{value}</p>
    </div>
  );
}
