import type { PrinterParameters } from './PrinterModels';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface MachineState {
  isConnected: boolean;
  connectionType: 'NONE' | 'USB' | 'WIFI' | 'BLUETOOTH';
  deviceName: string;
  wPos: Position;
  mPos: Position;
  isPrinting: boolean;
  isPaused: boolean;
  printProgress: number;
  logs: string[];
  elapsedTime: number;
  currentLayer: number;
  hasHydrated: boolean;
}

export interface SimulationState {
  shape: string;
  numColors: number;
  incrementXY: number;
  baseSize: number;
  printMode: 'Border' | 'Infill' | 'Both';
  customPaths: any | null;
  params: PrinterParameters | null;
  isMultiColor: boolean;
}

export interface MachineStore extends MachineState, SimulationState {
  connect: (type: 'USB' | 'WIFI' | 'BLUETOOTH') => Promise<void>;
  disconnect: () => void;
  jog: (axis: 'X' | 'Y' | 'Z', distance: number) => void;
  home: (axis?: 'X' | 'Y' | 'Z') => void;
  setCoordinateSystem: (system: string) => void;
  sendGCode: (cmd: string) => void;
  updatePositions: (wPos: Position, mPos: Position) => void;
  appendLog: (log: string) => void;
  setPrintStats: (progress: number, layer: number, time: number) => void;
  
  // Simulation Cache & Params
  simulationGCode: string;
  simulationCommands: any[];
  setSimulationData: (gcode: string, commands: any[]) => void;
  clearSimulationData: () => void;
  setSimulationParams: (params: Partial<SimulationState>) => void;
  setHasHydrated: (state: boolean) => void;
}
