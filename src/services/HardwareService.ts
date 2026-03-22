import type { GCodeCommand } from '../utils/GCodeParser';

export class HardwareService {
  private static port: any = null;
  private static reader: any = null;
  private static writer: any = null;
  private static decoder = new TextDecoderStream();
  
  // Printing Queue State
  private static printQueue: GCodeCommand[] = [];
  private static currentCommandIndex = 0;
  private static isPrinting = false;
  private static isPaused = false;
  private static printLoopRunning = false;
  
  // Callbacks
  static onLog?: (msg: string) => void;
  static onProgress?: (percent: number, layer: number, timeSec: number) => void;
  static onPrintStateChange?: (isPrinting: boolean, isPaused: boolean) => void;

  // New Transports
  private static btDevice: any = null;
  private static btCharacteristic: any = null;
  private static ws: WebSocket | null = null;
  
  // Stats
  private static startTime = 0;

  static async connectUSB(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        this.log('[ERROR] Web Serial API not supported by this browser.');
        return false;
      }
      
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 115200 });

      this.port.readable.pipeTo(this.decoder.writable);
      this.reader = this.decoder.readable.getReader();

      const encoder = new TextEncoderStream();
      encoder.readable.pipeTo(this.port.writable);
      this.writer = encoder.writable.getWriter();

      this.log('[SUCCESS] USB Connected');
      this.listenForSerialData();
      return true;
    } catch (err) {
      console.error(err);
      this.log(`[ERROR] USB Connection failed: ${err}`);
      return false;
    }
  }

  static async connectBluetooth(): Promise<any | null> {
    try {
      if (!('bluetooth' in navigator)) {
         this.log('[ERROR] Web Bluetooth API not supported.');
         return null;
      }
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'] // Generic BLE UART
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      this.btCharacteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
      
      this.btCharacteristic.startNotifications();
      this.btCharacteristic.addEventListener('characteristicvaluechanged', (e: any) => {
         const value = new TextDecoder().decode(e.target.value);
         this.handleReceivedData(value);
      });

      this.btDevice = device;
      this.log(`[SUCCESS] Bluetooth Connected: ${device.name}`);
      return device;
    } catch (err) {
      console.error(err);
      this.log(`[ERROR] Bluetooth Connection failed: ${err}`);
      return null;
    }
  }

  static async connectWIFI(): Promise<boolean> {
     try {
       const ip = prompt("Enter Printer IP and Port (e.g. 192.168.1.100:81)");
       if (!ip) return false;

       return new Promise((resolve) => {
         this.ws = new WebSocket(`ws://${ip}`);
         
         this.ws.onopen = () => {
           this.log('[SUCCESS] WiFi Connected');
           resolve(true);
         };
         
         this.ws.onmessage = (e) => {
           this.handleReceivedData(e.data);
         };

         this.ws.onerror = () => {
           this.log(`[ERROR] WiFi Connection Error`);
           resolve(false);
         };
       });
     } catch (err) {
       this.log(`[ERROR] WiFi Connection failed: ${err}`);
       return false;
     }
  }

  static async disconnect() {
    this.isPrinting = false;
    this.printLoopRunning = false;
    
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    if (this.btDevice && this.btDevice.gatt.connected) {
      this.btDevice.gatt.disconnect();
      this.btDevice = null;
      this.btCharacteristic = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.log('[INFO] Disconnected');
  }

  static async sendCommand(cmd: string) {
    const safeCmd = cmd.trim() + '\n';
    
    if (this.writer) {
      await this.writer.write(safeCmd);
      this.log(`[TX] ${safeCmd.trim()}`);
    } else if (this.btCharacteristic) {
      await this.btCharacteristic.writeValue(new TextEncoder().encode(safeCmd));
      this.log(`[TX] ${safeCmd.trim()}`);
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(safeCmd);
      this.log(`[TX] ${safeCmd.trim()}`);
    } else {
      this.log('[WARNING] Cannot send, not connected');
    }
  }

  // ---- Print Queue Logic (ACK based) ----

  static startPrint(commands: GCodeCommand[]) {
    this.printQueue = commands;
    this.currentCommandIndex = 0;
    this.isPrinting = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.updatePrintState();
    this.log(`[INFO] Starting print job: ${commands.length} commands`);
    
    if (!this.printLoopRunning) {
      this.runPrintLoop();
    }
  }

  static pausePrint() {
    this.isPaused = true;
    this.updatePrintState();
    this.log('[INFO] Print Paused');
  }

  static resumePrint() {
    this.isPaused = false;
    this.updatePrintState();
    this.log('[INFO] Print Resumed');
    if (!this.printLoopRunning) {
      this.runPrintLoop();
    }
  }

  static cancelPrint() {
    this.isPrinting = false;
    this.isPaused = false;
    this.printLoopRunning = false;
    this.printQueue = [];
    this.updatePrintState();
    this.sendCommand('M112'); // Emergency Stop (or use a safer cancel sequence)
    this.log('[INFO] Print Cancelled');
  }

  private static updatePrintState() {
     if (this.onPrintStateChange) this.onPrintStateChange(this.isPrinting, this.isPaused);
  }

  // The actual print loop. It waits for 'ok' from the machine.
  private static async runPrintLoop() {
    this.printLoopRunning = true;

    while (this.isPrinting && this.currentCommandIndex < this.printQueue.length) {
      if (this.isPaused) {
        await this.delay(500);
        continue;
      }

      const cmdObj = this.printQueue[this.currentCommandIndex];
      const cmdStr = cmdObj.originalLine.trim();

      // Skip empty lines or pure comments to save time
      if (!cmdStr || cmdStr.startsWith(';')) {
        this.currentCommandIndex++;
        continue;
      }

      // Send the actual command
      await this.sendCommand(cmdStr);
      
      // Wait for ACK
      const ackReceived = await this.waitForAck(10000); // 10 second timeout per command

      if (!ackReceived) {
        this.log(`[WARNING] Timeout waiting for ACK on: ${cmdStr}`);
        // Depending on firmware, we might retry or fail. Modern firmwares usually don't drop ok.
      }

      this.currentCommandIndex++;

      // Update progress
      if (this.onProgress) {
        const percent = (this.currentCommandIndex / Math.max(1, this.printQueue.length)) * 100;
        const elapsedSecs = Math.floor((Date.now() - this.startTime) / 1000);
        this.onProgress(percent, cmdObj.layerNum, elapsedSecs);
      }
    }

    if (this.currentCommandIndex >= this.printQueue.length) {
      this.log('[SUCCESS] Print Finished');
      this.isPrinting = false;
      this.updatePrintState();
    }

    this.printLoopRunning = false;
  }

  // Waits for "ok" to appear in the received buffer
  private static receivedBuffer = "";
  private static async waitForAck(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      let timeout: any;
      
      const checkInterval = setInterval(() => {
        if (this.receivedBuffer.includes('ok')) {
          this.receivedBuffer = this.receivedBuffer.replace(/ok.*?\n/g, ''); // Clear the ok
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 10); // Check frequently

      timeout = setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, timeoutMs);
    });
  }

  // Background reader loop for Serial
  private static async listenForSerialData() {
    while (this.port?.readable && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) {
          break; // reader has been canceled
        }
        if (value) {
          this.handleReceivedData(value);
        }
      } catch (error) {
        this.log(`[ERROR] Read error: ${error}`);
        break;
      }
    }
  }

  private static handleReceivedData(dataRange: string) {
      this.receivedBuffer += dataRange;
      const lines = this.receivedBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
           if (!line.includes('ok')) this.log(`[RX] ${line}`); // Avoid flooding log with ok
           this.parsePositionData(line);
        }
      }
      this.receivedBuffer = lines[lines.length - 1];
  }


  private static parsePositionData(line: string) {
    if (line.includes('MPos:') || line.includes('WPos:')) {
      // Basic GRBL style status report parse
      // Example: <Idle|WPos:0.000,0.000,0.000|FS:0,0|WCO:0.000,0.000,0.000>
      // ... parse and update store ...
    }
  }

  private static log(msg: string) {
    if (this.onLog) this.onLog(msg);
  }

  private static delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
