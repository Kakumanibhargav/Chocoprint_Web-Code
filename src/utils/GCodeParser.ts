export interface GCodeCommand {
  originalLine: string;
  command: string;
  x: number | null;
  y: number | null;
  z: number | null;
  e: number | null;
  f: number | null;
  p: number | null;
  cumulativeDist: number;
  processNum: number;
  layerNum: number;
  isExtruding: boolean;
}

export interface PrintStats {
  timeSeconds: number;
  materialLengthMm: number;
  materialWeightGrams: number;
  totalPathDist: number;
}

export class GCodeParser {
  
  static parse(gcode: string): GCodeCommand[] {
    const commands: GCodeCommand[] = [];
    let currentX = 0; let currentY = 0; let currentZ = 0;
    let totalDist = 0;
    let currentProcess = 1;
    let currentLayer = 1;
    let extruding = false;

    const lines = gcode.split(/\r?\n/);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith(";")) {
        if (trimmedLine.includes("Process") || trimmedLine.includes("Layer")) {
          let parts = "";
          if (trimmedLine.includes("Process")) {
            parts = trimmedLine.split("Process")[1] || "";
            const num = parseInt(parts.trim().match(/^\d+/)?.[0] || "");
            if (!isNaN(num)) currentProcess = num;
          }
          if (trimmedLine.includes("Layer")) {
            parts = trimmedLine.split("Layer")[1] || "";
            const num = parseInt(parts.trim().match(/^\d+/)?.[0] || "");
            if (!isNaN(num)) currentLayer = num;
          }
        }
        commands.push({
          originalLine: line,
          command: "",
          x: null, y: null, z: null, e: null, f: null, p: null,
          cumulativeDist: totalDist,
          processNum: currentProcess,
          layerNum: currentLayer,
          isExtruding: extruding
        });
        continue;
      }

      const parts = trimmedLine.split(";")[0].trim();
      if (parts) {
        const commandParts = parts.split(/\s+/);
        const command = commandParts[0].toUpperCase();
        let x: number | null = null; let y: number | null = null; let z: number | null = null;
        let e: number | null = null; let f: number | null = null; let p: number | null = null;
        let s: number | null = null;

        commandParts.forEach(part => {
          if (part.length > 1) {
            const v = parseFloat(part.substring(1));
            if (!isNaN(v)) {
              switch (part[0].toUpperCase()) {
                case 'X': x = v; break;
                case 'Y': y = v; break;
                case 'Z': z = v; break;
                case 'E': e = v; break;
                case 'F': f = v; break;
                case 'P': p = v; break;
                case 'S': s = v; break;
              }
            }
          }
        });

        if (command === "M3") {
          extruding = s !== null ? s > 100 : true;
        }
        if (command === "M5") extruding = false;

        if (command === "G0" || command === "G1") {
          const nextX = x !== null ? x : currentX;
          const nextY = y !== null ? y : currentY;
          const nextZ = z !== null ? z : currentZ;

          const d = Math.sqrt(Math.pow(nextX - currentX, 2) + Math.pow(nextY - currentY, 2) + Math.pow(nextZ - currentZ, 2));
          totalDist += d;

          currentX = nextX; currentY = nextY; currentZ = nextZ;

          const isG1 = command === "G1";
          const hasE = e !== null && e > 0.0001;
          const lineExtruding = extruding || (isG1 && hasE) || (isG1 && !hasE && extruding);

          commands.push({
            originalLine: line,
            command, x, y, z, e, f, p,
            cumulativeDist: totalDist,
            processNum: currentProcess,
            layerNum: currentLayer,
            isExtruding: lineExtruding
          });
        } else {
          commands.push({
            originalLine: line,
            command, x, y, z, e, f, p,
            cumulativeDist: totalDist,
            processNum: currentProcess,
            layerNum: currentLayer,
            isExtruding: extruding
          });
        }
      } else {
        commands.push({
          originalLine: line,
          command: "",
          x: null, y: null, z: null, e: null, f: null, p: null,
          cumulativeDist: totalDist,
          processNum: currentProcess,
          layerNum: currentLayer,
          isExtruding: extruding
        });
      }
    }
    return commands;
  }

  static calculateStats(gcode: string, _nozzleDia = 0.8, _layerH = 0.6): PrintStats {
    let totalE = 0;
    let totalTime = 0;
    let currentX = 0; let currentY = 0; let currentZ = 0;
    let currentF = 1200;
    let lastDist = 0;
    let extruding = false;

    const lines = gcode.split(/\r?\n/);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const parts = trimmedLine.split(";")[0].trim();
      if (!parts) continue;

      const commandParts = parts.split(/\s+/);
      const command = commandParts[0].toUpperCase();

      if (command === "M3") {
        let s: number | null = null;
        commandParts.forEach(part => {
          if (part.toUpperCase().startsWith("S")) {
            const v = parseFloat(part.substring(1));
            if (!isNaN(v)) s = v;
          }
        });
        extruding = s !== null ? s > 100 : true;
      }
      if (command === "M5") extruding = false;

      if (command === "G0" || command === "G1") {
        let nx = currentX; let ny = currentY; let nz = currentZ; let ne: number | null = null;
        
        commandParts.forEach(part => {
          if (part.length > 1) {
            const v = parseFloat(part.substring(1));
            if (!isNaN(v)) {
              switch (part[0].toUpperCase()) {
                case 'X': nx = v; break;
                case 'Y': ny = v; break;
                case 'Z': nz = v; break;
                case 'E': ne = v; break;
                case 'F': currentF = v; break;
              }
            }
          }
        });

        const dist = Math.sqrt(Math.pow(nx - currentX, 2) + Math.pow(ny - currentY, 2) + Math.pow(nz - currentZ, 2));
        
        if (currentF > 0) {
          totalTime += dist / (currentF / 60);
        }

        if (extruding || ne !== null) {
          totalE += ne !== null ? ne : (extruding ? dist * 0.1 : 0);
        }

        currentX = nx; currentY = ny; currentZ = nz;
        lastDist += dist;
      } else if (command === "G4") {
        commandParts.forEach(part => {
          if (part.toUpperCase().startsWith("P")) {
            const v = parseFloat(part.substring(1));
            if (!isNaN(v)) {
              totalTime += v / 1000;
            }
          }
        });
      }
    }

    const materialWeight = totalE * 0.12;

    return {
      timeSeconds: Math.round(totalTime),
      materialLengthMm: totalE,
      materialWeightGrams: materialWeight,
      totalPathDist: lastDist
    };
  }

  static getProgressAt(commands: GCodeCommand[], _pos: { x: number, y: number, z: number }, lastSentIndex: number): number {
    if (commands.length === 0) return 0;
    const totalCount = commands.length;
    return Math.max(0, Math.min(1, lastSentIndex / totalCount));
  }
}
