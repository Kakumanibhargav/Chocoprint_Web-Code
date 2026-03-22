import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/signin');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Box args={[2, 2, 2]}>
            <meshStandardMaterial color="#A1887F" wireframe />
          </Box>
          <OrbitControls autoRotate autoRotateSpeed={4} enableZoom={false} />
        </Canvas>
      </div>
      <div className="z-10 text-center glass-panel p-8 mt-48 animate-pulse">
        <h1 className="text-4xl font-black tracking-widest text-brand-accent mb-2">CHOCOPRINT</h1>
        <p className="text-brand-light font-medium tracking-wide">3D Chocolate Constructor</p>
      </div>
    </div>
  );
}
