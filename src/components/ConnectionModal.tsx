import React from 'react';
import { Bluetooth, Wifi, Usb, X, Loader2 } from 'lucide-react';
import { useMachineStore } from '../store/machineStore';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'USB' | 'WIFI' | 'BLUETOOTH' | 'NONE';
}

export default function ConnectionModal({ isOpen, onClose, type }: ConnectionModalProps) {
  const { connect } = useMachineStore();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState('');

  if (!isOpen || type === 'NONE') return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      await connect(type);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'USB': return <Usb className="w-8 h-8 text-brand-accent" />;
      case 'WIFI': return <Wifi className="w-8 h-8 text-brand-accent" />;
      case 'BLUETOOTH': return <Bluetooth className="w-8 h-8 text-brand-accent" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center mx-auto mb-4 border border-brand-accent/20">
            {getIcon()}
          </div>
          <h2 className="text-2xl font-black text-white">Connect via {type}</h2>
          <p className="text-brand-light text-sm mt-2">
            {type === 'USB' && "Requires Web Serial API (Chrome/Edge)"}
            {type === 'BLUETOOTH' && "Requires Web Bluetooth API (BLE only)"}
            {type === 'WIFI' && "Connect via local WebSocket"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-brand-error/10 border border-brand-error/20 text-brand-error text-sm text-center">
            {error}
          </div>
        )}

        <button 
          onClick={handleConnect} 
          disabled={isConnecting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>CONNECTING...</span>
            </>
          ) : (
            <span>CONNECT</span>
          )}
        </button>
      </div>
    </div>
  );
}
