import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LogOut, Settings2, Upload, Palette, Bluetooth, Wifi, Usb, ArrowUp, ArrowDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMachineStore } from '../store/machineStore';
import ConnectionModal from '../components/ConnectionModal';

export default function Home() {
  const navigate = useNavigate();
  const { isConnected, connectionType, deviceName, wPos, mPos, jog, home, disconnect } = useMachineStore();
  const [modalType, setModalType] = useState<'NONE'|'USB'|'WIFI'|'BLUETOOTH'>('NONE');
  const [jogStep, setJogStep] = useState<number>(1.0);

  return (
    <div className="min-h-screen p-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4 items-center flex-1">
          {/* 3D Animated Logo Cube */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(251,191,36,0.15)] bg-black/40 border border-brand-accent/20">
             <Canvas camera={{ position: [2, 2, 2], fov: 40 }}>
               <ambientLight intensity={1.5} />
               <directionalLight position={[10, 10, 5]} intensity={2} color="#fcd34d" />
               <RotatingCube />
               <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
             </Canvas>
          </div>
          <div>
            <p className="text-brand-light text-sm font-medium">Welcome, User</p>
            <h1 className="text-2xl font-bold text-white tracking-wide">ChocoPrint 3D</h1>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className={`font-bold text-sm ${isConnected ? 'text-brand-success' : 'text-brand-error'}`}>
              {isConnected ? deviceName : 'Not Connected'}
            </p>
            <p className="text-brand-light text-xs">
              {isConnected ? `Active ${connectionType}` : 'Offline'}
            </p>
          </div>
          <button 
            onClick={() => {
              disconnect();
              navigate('/signin');
            }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-error hover:bg-brand-error/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Machine Control */}
      <div className="glass-card p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex items-center gap-2 mb-6">
          <Settings2 className="w-5 h-5 text-brand-accent" />
          <h2 className="text-white font-extrabold tracking-widest text-sm">MACHINE CONTROL</h2>
        </div>

        <div className="space-y-6">
          {/* Work Position */}
          <div>
            <p className="text-brand-light font-bold text-[10px] mb-2">WORK POSITION (WPOS)</p>
            <div className="grid grid-cols-3 gap-3">
              <PositionBox label="X" value={wPos.x.toFixed(2)} />
              <PositionBox label="Y" value={wPos.y.toFixed(2)} />
              <PositionBox label="Z" value={wPos.z.toFixed(2)} />
            </div>
          </div>

          {/* Machine Position */}
          <div>
            <p className="text-brand-light/50 font-bold text-[9px] mb-1">MACHINE POSITION (MPOS)</p>
            <div className="grid grid-cols-3 gap-3">
              <PositionBox label="X" value={mPos.x.toFixed(2)} isMachine />
              <PositionBox label="Y" value={mPos.y.toFixed(2)} isMachine />
              <PositionBox label="Z" value={mPos.z.toFixed(2)} isMachine />
            </div>
          </div>

          {/* Jog Controls & Homing */}
          <div className="border-t border-white/5 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-brand-light font-bold text-[10px]">JOG DISTANCE</p>
              <div className="flex gap-2">
                 {[0.1, 1.0, 10.0].map(step => (
                   <button 
                     key={step} 
                     onClick={() => setJogStep(step)}
                     className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${jogStep === step ? 'bg-brand-accent text-black' : 'bg-white/5 text-brand-light hover:bg-white/10'}`}
                   >
                     {step} mm
                   </button>
                 ))}
              </div>
            </div>

            <div className="flex justify-between items-center gap-4">
              {/* XY D-Pad */}
              <div className="grid grid-cols-3 grid-rows-3 gap-1">
                <div />
                <JogButton icon={<ChevronUp className="w-5 h-5"/>} onClick={() => jog('Y', jogStep)} disabled={!isConnected} />
                <div />
                <JogButton icon={<ChevronLeft className="w-5 h-5"/>} onClick={() => jog('X', -jogStep)} disabled={!isConnected} />
                <div className="flex items-center justify-center text-[10px] font-black text-brand-light/50">X/Y</div>
                <JogButton icon={<ChevronRight className="w-5 h-5"/>} onClick={() => jog('X', jogStep)} disabled={!isConnected} />
                <div />
                <JogButton icon={<ChevronDown className="w-5 h-5"/>} onClick={() => jog('Y', -jogStep)} disabled={!isConnected} />
                <div />
              </div>

              {/* Z Axis */}
              <div className="flex flex-col gap-1 items-center">
                <JogButton icon={<ArrowUp className="w-4 h-4"/>} onClick={() => jog('Z', jogStep)} disabled={!isConnected} />
                <div className="h-10 flex items-center justify-center text-[10px] font-black text-brand-light/50">Z</div>
                <JogButton icon={<ArrowDown className="w-4 h-4"/>} onClick={() => jog('Z', -jogStep)} disabled={!isConnected} />
              </div>

              {/* Homing */}
              <div className="flex flex-col gap-2">
                 <button onClick={() => home()} disabled={!isConnected} className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs ${isConnected ? 'bg-brand-accent text-black hover:scale-105 transition-transform' : 'bg-brand-accent/30 text-black/50 cursor-not-allowed'}`}>
                   <HomeIcon className="w-4 h-4" /> ALL
                 </button>
                 <div className="flex gap-2">
                   <HomeBtn axis="X" onClick={() => home('X')} disabled={!isConnected} />
                   <HomeBtn axis="Y" onClick={() => home('Y')} disabled={!isConnected} />
                   <HomeBtn axis="Z" onClick={() => home('Z')} disabled={!isConnected} />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-4 mb-8">
        <button 
          onClick={() => navigate('/select')}
          className="w-full glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
            <Upload className="w-6 h-6 text-brand-accent" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold">New Creation</h3>
            <p className="text-brand-light text-xs">Upload and print custom designs</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/multi-color')}
          className="w-full glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
            <Palette className="w-6 h-6 text-brand-accent" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold">Multi-Color Art</h3>
            <p className="text-brand-light text-xs">Design layered chocolate masterpieces</p>
          </div>
        </button>
      </div>

      {/* Connections */}
      <div className="grid grid-cols-3 gap-3">
        <ConnectionBtn icon={<Bluetooth className="w-5 h-5" />} label="Bluetooth" active={connectionType === 'BLUETOOTH'} onClick={() => setModalType('BLUETOOTH')} />
        <ConnectionBtn icon={<Wifi className="w-5 h-5" />} label="WiFi" active={connectionType === 'WIFI'} onClick={() => setModalType('WIFI')} />
        <ConnectionBtn icon={<Usb className="w-5 h-5" />} label="USB" active={connectionType === 'USB'} onClick={() => setModalType('USB')} />
      </div>

      <ConnectionModal isOpen={modalType !== 'NONE'} onClose={() => setModalType('NONE')} type={modalType} />
    </div>
  );
}

function PositionBox({ label, value, isMachine = false }: { label: string, value: string, isMachine?: boolean }) {
  return (
    <div className={`rounded-xl border py-2 flex flex-col items-center justify-center ${isMachine ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/10'}`}>
      <span className={`text-[10px] font-black ${isMachine ? 'text-gray-500' : 'text-brand-accent'}`}>{label}</span>
      <span className={`font-semibold tracking-wider ${isMachine ? 'text-white/40 text-sm' : 'text-white text-base'}`}>{value}</span>
    </div>
  );
}

function ConnectionBtn({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${active ? 'bg-brand-card border-brand-accent text-white shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'bg-brand-darker border-brand-border text-brand-light hover:bg-brand-card/50 hover:border-brand-border/80'}`}
    >
      <div className={active ? 'text-brand-accent animate-pulse' : 'text-brand-light'}>{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function JogButton({ icon, onClick, disabled }: { icon: React.ReactNode, onClick: () => void, disabled: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${!disabled ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white active:scale-95' : 'bg-transparent border-transparent opacity-50 text-brand-light cursor-not-allowed'}`}
    >
      {icon}
    </button>
  );
}

function HomeBtn({ axis, onClick, disabled }: { axis: string, onClick: () => void, disabled: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${!disabled ? 'bg-white/10 hover:bg-white/20 text-white active:scale-95' : 'bg-white/5 opacity-50 text-brand-light cursor-not-allowed'}`}
    >
      H{axis}
    </button>
  );
}

function RotatingCube() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
         color="#5C3A21" 
         roughness={0.2} 
         metalness={0.8}
         envMapIntensity={2}
      />
      
      {/* Edge highlights */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="#fcd34d" linewidth={2} />
      </lineSegments>
    </mesh>
  );
}
