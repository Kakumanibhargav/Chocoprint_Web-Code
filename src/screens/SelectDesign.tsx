import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Shapes, Upload, Loader2 } from 'lucide-react';
import { useMachineStore } from '../store/machineStore';
import { ImageProcessor } from '../utils/ImageProcessor';
import { SvgParser } from '../utils/SvgParser';

const SHAPE_CATEGORIES = {
  Basic: ["Circle", "Square", "Triangle", "Hexagon"],
  Complex: ["Heart", "Star", "Diamond", "Parallelogram", "Pentagon"],
  Animals: ["Cat", "Bird", "Butterfly", "Fish", "Moon"]
};

export default function SelectDesign() {
  const navigate = useNavigate();
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [uploadedPaths, setUploadedPaths] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setSimulationParams } = useMachineStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const svgText = e.target?.result as string;
          const paths = SvgParser.parseSvgToPaths(svgText);
          setUploadedPaths(paths);
          setSelectedShape('Custom Design');
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          const paths = await ImageProcessor.processImageToPaths(dataUrl);
          setUploadedPaths(paths);
          setSelectedShape('Custom Design');
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Unsupported file type. Please upload an SVG or a standard image (PNG/JPG).");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process image.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/home')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Select Design</h1>
          <p className="text-brand-light text-sm">Choose a shape or upload your own</p>
        </div>
      </div>

      <div className="space-y-8">
        <input 
          type="file" 
          accept="image/*,.svg" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`w-full glass-card p-6 flex flex-col items-center justify-center gap-4 transition-colors group ${
            selectedShape === 'Custom Design' 
              ? 'bg-brand-card border border-brand-accent shadow-[0_0_15px_rgba(251,191,36,0.15)]' 
              : 'hover:bg-white/5 border border-transparent'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            selectedShape === 'Custom Design' ? 'bg-brand-accent/20' : 'bg-brand-accent/10 group-hover:bg-brand-accent/20'
          }`}>
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-brand-accent" />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold">
              {isProcessing ? 'Processing Design...' : (selectedShape === 'Custom Design' ? 'Custom Design Uploaded' : 'Upload Image / SVG')}
            </h3>
            <p className="text-brand-light text-xs mt-1">
              {selectedShape === 'Custom Design' ? 'Ready to generate G-code' : 'Transform any image into a chocolate print'}
            </p>
          </div>
        </button>

        {/* Built-in Shapes */}
        {Object.entries(SHAPE_CATEGORIES).map(([category, shapes]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              <Shapes className="w-4 h-4 text-brand-accent" />
              <h2 className="text-white font-black tracking-widest text-sm uppercase">{category}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {shapes.map(shape => (
                <button
                  key={shape}
                  onClick={() => setSelectedShape(shape)}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    selectedShape === shape 
                      ? 'bg-brand-card border-brand-accent shadow-[0_0_15px_rgba(251,191,36,0.15)] text-white' 
                      : 'bg-white/5 border-white/10 text-brand-light hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="font-bold">{shape}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedShape === shape ? 'border-brand-accent' : 'border-white/20'
                  }`}>
                    {selectedShape === shape && <div className="w-2 h-2 rounded-full bg-brand-accent" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 max-w-4xl mx-auto z-50">
        <button 
          disabled={!selectedShape || isProcessing}
          onClick={() => {
            setSimulationParams({ shape: selectedShape!, customPaths: uploadedPaths });
            navigate('/parameters', { state: { shape: selectedShape, customPaths: uploadedPaths } });
          }}
          className={`w-full py-4 rounded-2xl font-black tracking-widest flex items-center justify-center gap-2 transition-all ${
            selectedShape && !isProcessing
              ? 'bg-brand-accent text-brand-darker shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:scale-[1.02]' 
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          <span>CONTINUE</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
