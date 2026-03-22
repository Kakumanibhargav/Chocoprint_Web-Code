import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MachineStore, Position, SimulationState } from '../models/MachineModels';

export const useMachineStore = create<MachineStore>()(
  persist(
    (set, get) => ({
      isConnected: false,
      connectionType: 'NONE',
      deviceName: 'None',
      wPos: { x: 0, y: 0, z: 0 },
      mPos: { x: 0, y: 0, z: 0 },
      isPrinting: false,
      isPaused: false,
      printProgress: 0,
      logs: [],
      elapsedTime: 0,
      currentLayer: 1,
      hasHydrated: false,
      setHasHydrated: (h: boolean) => set({ hasHydrated: h }),

      // Simulation State
      shape: 'Heart',
      numColors: 3,
      incrementXY: 10,
      baseSize: 30,
      printMode: 'Both',
      customPaths: null,
      params: null,
      isMultiColor: false,

      connect: async (type: 'USB' | 'WIFI' | 'BLUETOOTH') => {
        const { HardwareService } = await import('../services/HardwareService');
        HardwareService.onLog = (msg) => get().appendLog(msg);
        HardwareService.onProgress = (percent, layer, time) => get().setPrintStats(percent, layer, time);
        HardwareService.onPrintStateChange = (isPrinting: boolean, isPaused: boolean) => set({ isPrinting, isPaused });

        let success = false;
        let name = 'Unknown Device';
        if (type === 'USB') {
          success = await HardwareService.connectUSB();
          name = 'USB Serial Printer';
        } else if (type === 'BLUETOOTH') {
          const device = await HardwareService.connectBluetooth();
          if (device) {
            success = true;
            name = device.name || 'Bluetooth Printer';
          }
        } else if (type === 'WIFI') {
          success = await HardwareService.connectWIFI();
          name = 'WiFi Printer';
        }

        if (success) {
          set({ isConnected: true, connectionType: type, deviceName: name });
        } else {
          throw new Error(`Failed to connect via ${type}`);
        }
      },

      disconnect: () => {
        import('../services/HardwareService').then(({ HardwareService }) => HardwareService.disconnect());
        set({ isConnected: false, connectionType: 'NONE', deviceName: 'None' });
      },

      jog: (axis: 'X' | 'Y' | 'Z', distance: number) => {
        const { sendGCode } = get();
        sendGCode(`G91\nG0 ${axis}${distance}\nG90`);
        set((state) => ({
          wPos: { ...state.wPos, [axis.toLowerCase()]: state.wPos[axis.toLowerCase() as keyof Position] + distance }
        }));
      },

      home: (axis?: 'X' | 'Y' | 'Z') => {
        const { sendGCode } = get();
        if (axis) sendGCode(`G28 ${axis}`);
        else sendGCode('G28');
      },

      setCoordinateSystem: (system: string) => { get().sendGCode(system); },
      sendGCode: (cmd: string) => {
        import('../services/HardwareService').then(({ HardwareService }) => HardwareService.sendCommand(cmd));
      },
      updatePositions: (wPos: Position, mPos: Position) => { set({ wPos, mPos }); },
      appendLog: (log: string) => {
        set((state) => ({ logs: [log, ...state.logs].slice(0, 100) }));
      },
      setPrintStats: (progress: number, layer: number, time: number) => {
        set({ printProgress: progress, currentLayer: layer, elapsedTime: time });
      },

      // Simulation Cache
      simulationGCode: '',
      simulationCommands: [],
      setSimulationData: (gcode: string, commands: any[]) => {
        set({ simulationGCode: gcode, simulationCommands: commands });
      },
      clearSimulationData: () => {
        set({ simulationGCode: '', simulationCommands: [] });
      },
      setSimulationParams: (p: Partial<SimulationState>) => {
        set((state) => ({ ...state, ...p }));
      }
    }),
    {
      name: 'chocoprint-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Only persist connection and parameters, exclude large binary/generated data if possible
      // But we need params and shape to survive refresh.
      // We exclude simulationGCode and simulationCommands because they are huge.
      partialize: (state) => {
        const { simulationGCode, simulationCommands, ...rest } = state;
        return rest;
      }
    }
  )
);
