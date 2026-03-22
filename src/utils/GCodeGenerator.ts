import type { PrinterParameters, Point } from '../models/PrinterModels';

export interface GCodeGenerationResult {
  gCode: string;
  layerCount: number;
}

export class GCodeGenerator {
  
  private static fastFmt2(value: number): string {
    if (isNaN(value) || !isFinite(value)) return "0.00";
    return value.toFixed(2);
  }

  private static fastFmt0(value: number): string {
    return Math.round(value).toString();
  }

  static generate(
    designName: string,
    customPaths: Point[][] | null,
    printMode: string,
    parameters: PrinterParameters
  ): GCodeGenerationResult {
    return this.generateSampleGCode(designName, customPaths, printMode, parameters);
  }

  static generateGCode(
    paths: Point[][],
    _mode: string,
    params: PrinterParameters,
    _bedWidth = 200,
    _bedHeight = 200
  ): GCodeGenerationResult {
    const layerH = Math.max(parseFloat(params.layerHeight) || 0.6, 0.1);
    const printSpeed = parseFloat(params.printSpeed) || 20;
    const zMax = parseFloat(params.zMax) || 150;
    const xMax = parseFloat(params.xMax) || 200;
    const yMax = parseFloat(params.yMax) || 200;

    let numLayersParsed = parseInt(params.numLayers);
    let layers = isNaN(numLayersParsed) ? Math.min(Math.max(Math.floor(zMax / layerH), 1), 500) : numLayersParsed;

    let minX = Number.MAX_VALUE; let maxX = Number.MIN_VALUE;
    let minY = Number.MAX_VALUE; let maxY = Number.MIN_VALUE;
    let hasPoints = false;
    
    for (const path of paths) {
      for (const p of path) {
        hasPoints = true;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    
    if (!hasPoints) return { gCode: "", layerCount: 0 };

    const width = maxX - minX;
    const height = maxY - minY;
    const targetW = parseFloat(params.shapeWidth) || (xMax - 40);
    const targetH = parseFloat(params.shapeHeight) || (yMax - 40);
    const scale = Math.min(width > 0 ? targetW / width : 1, height > 0 ? targetH / height : 1);
    const printF = printSpeed * 60;
    const sourceCenterX = (minX + maxX) / 2;
    const sourceCenterY = (minY + maxY) / 2;

    let sb = "G21 ; millimeters\n";
    sb += "G90 ; absolute positioning\n";
    sb += "G92 X0 Y0 Z0 A0 ; set current position as zero\n\n";

    let cumulativeA = 0;

    for (let layer = 1; layer <= layers; layer++) {
      const z = (layer - 1) * layerH;
      sb += `; ---------- Layer ${layer} ----------\n`;

      paths.forEach(path => {
        if (path.length === 0) return;

        const startP = path[0];
        const sx = (startP.x - sourceCenterX) * scale;
        const sy = (startP.y - sourceCenterY) * scale;
        
        sb += `G0 X${this.fastFmt2(sx)} Y${this.fastFmt2(sy)} Z${this.fastFmt2(z)}\n`;

        for (let i = 1; i < path.length; i++) {
          const p = path[i];
          const prevP = path[i - 1];
          const x = (p.x - sourceCenterX) * scale;
          const y = (p.y - sourceCenterY) * scale;
          const px = (prevP.x - sourceCenterX) * scale;
          const py = (prevP.y - sourceCenterY) * scale;

          const dist = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
          if (dist < 0.01) continue;

          cumulativeA += dist * 1.0;

          sb += `G1 X${this.fastFmt2(x)} Y${this.fastFmt2(y)} Z${this.fastFmt2(z)} A${this.fastFmt2(cumulativeA)} F${this.fastFmt0(printF)}\n`;
        }
      });
      sb += "\n";
    }

    sb += "M30\n";
    return { gCode: sb, layerCount: layers };
  }

  static generateMultiColorGCode(
    shapeName: string,
    numColors: number,
    baseX: number,
    baseY: number,
    baseZ: number,
    incrementXY: number,
    customPaths: Point[][] | null,
    mode: string,
    params: PrinterParameters
  ): GCodeGenerationResult {
    let sb = "";
    const printF = (parseFloat(params.printSpeed) || 20) * 60;

    sb += "; ===== Multi-Color G-code =====\n";
    sb += "G21 ; Set units to mm\n";
    sb += "G90 ; Absolute positioning\n";
    sb += "G28 ; Home all axes\n";
    sb += "M3 S10 ; Pen Up\n\n";

    let totalLayers = 0;
    
    for (let i = 0; i < numColors; i++) {
      const processNum = i + 1;
      const currentTargetW = baseX + (i * incrementXY);
      const currentTargetH = baseY + (i * incrementXY);

      const rawPaths = this.generateSamplePaths(shapeName, customPaths, mode !== "Border Only" ? "Both" : "Border Only", params);
      
      let filteredPaths = rawPaths;
      if (mode === "Border Only") filteredPaths = rawPaths.slice(0, 1);
      else if (mode === "Infill Only") filteredPaths = rawPaths.slice(1);

      const z = i * baseZ;
      totalLayers++;

      sb += `; Process ${processNum}\n`;
      sb += `; Layer 1\n`;
      sb += `G0 Z${this.fastFmt2(z)}\n`;

      let minX = Number.MAX_VALUE; let maxX = Number.MIN_VALUE;
      let minY = Number.MAX_VALUE; let maxY = Number.MIN_VALUE;
      
      for (const path of filteredPaths) {
        for (const p of path) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      }
      
      const width = maxX - minX; 
      const height = maxY - minY;
      const scale = Math.min(width > 0 ? currentTargetW / width : 1, height > 0 ? currentTargetH / height : 1);
      const sourceCenterX = (minX + maxX) / 2;
      const sourceCenterY = (minY + maxY) / 2;

      filteredPaths.forEach(path => {
        if (path.length === 0) return;
        
        const startP = path[0];
        const sx = (startP.x - sourceCenterX) * scale;
        const sy = (startP.y - sourceCenterY) * scale;
        
        sb += `G0 X${this.fastFmt2(sx)} Y${this.fastFmt2(sy)}\n`;
        sb += "M3 S540; Pen Down\n";

        for (let j = 1; j < path.length; j++) {
          const p = path[j];
          const x = (p.x - sourceCenterX) * scale;
          const y = (p.y - sourceCenterY) * scale;
          
          sb += `G1 X${this.fastFmt2(x)} Y${this.fastFmt2(y)} F${this.fastFmt0(printF)}\n`;
        }
        sb += "M3 S10; Pen Up\n";
      });
      sb += "\n";
    }

    sb += "G28 X0 Y0\nG0 Z0\nM3 S10; Pen Up\n; ===== End =====\n";
    return { gCode: sb, layerCount: totalLayers };
  }

  static generateSamplePaths(name: string, customPaths: Point[][] | null, mode: string, params: PrinterParameters): Point[][] {
    const showBorder = mode !== 'Infill Only';
    const showInfill = mode !== 'Border Only';

    if ((name === 'Custom Design' || name === 'Custom Upload') && customPaths) {
      if (mode === 'Border Only') return customPaths.slice(0, 1);
      if (mode === 'Infill Only') return customPaths.slice(1);
      return customPaths;
    }

    const paths: Point[][] = [];
    const borderPath: Point[] = [];

    switch (name) {
      case "Heart":
        for (let i = 0; i <= 360; i += 2) {
          const t = i * Math.PI / 180;
          const x = 0.5 + 0.4 * (16 * Math.pow(Math.sin(t), 3)) / 17;
          const y = 0.5 - 0.4 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
          borderPath.push({ x, y });
        }
        break;
      case "Star":
        const points = 5; const outerRadius = 0.45; const innerRadius = 0.22;
        for (let i = 0; i < points * 2; i++) {
          const isOuter = i % 2 === 0;
          const radius = isOuter ? outerRadius : innerRadius;
          const angle = (Math.PI * 2 / (points * 2)) * i - (Math.PI / 2);
          borderPath.push({ 
            x: 0.5 + radius * Math.cos(angle), 
            y: 0.5 + radius * Math.sin(angle) 
          });
        }
        borderPath.push({ ...borderPath[0] });
        break;
      case "Circle":
        for (let i = 0; i <= 360; i += 5) {
          const angle = i * Math.PI / 180;
          borderPath.push({ x: 0.5 + 0.4 * Math.cos(angle), y: 0.5 + 0.4 * Math.sin(angle) });
        }
        break;
      case "Parallelogram":
        borderPath.push({ x: 0.2, y: 0.8 });
        borderPath.push({ x: 0.4, y: 0.2 });
        borderPath.push({ x: 0.8, y: 0.2 });
        borderPath.push({ x: 0.6, y: 0.8 });
        borderPath.push({ x: 0.2, y: 0.8 });
        break;
      case "Triangle":
        borderPath.push({ x: 0.5, y: 0.2 });
        borderPath.push({ x: 0.8, y: 0.8 });
        borderPath.push({ x: 0.2, y: 0.8 });
        borderPath.push({ x: 0.5, y: 0.2 });
        break;
      case "Hexagon":
        for (let i = 0; i < 6; i++) {
          const angle = (60.0 * i) * Math.PI / 180;
          borderPath.push({ x: 0.5 + 0.4 * Math.cos(angle), y: 0.5 + 0.4 * Math.sin(angle) });
        }
        borderPath.push({ ...borderPath[0] });
        break;
      case "Pentagon":
        for (let i = 0; i < 5; i++) {
          const angle = (72.0 * i - 90.0) * Math.PI / 180;
          borderPath.push({ x: 0.5 + 0.4 * Math.cos(angle), y: 0.5 + 0.4 * Math.sin(angle) });
        }
        borderPath.push({ ...borderPath[0] });
        break;
      case "Diamond":
        borderPath.push({ x: 0.5, y: 0.1 });
        borderPath.push({ x: 0.9, y: 0.5 });
        borderPath.push({ x: 0.5, y: 0.9 });
        borderPath.push({ x: 0.1, y: 0.5 });
        borderPath.push({ x: 0.5, y: 0.1 });
        break;
      case "Moon":
        for (let i = -90; i <= 90; i += 10) {
          const angle = i * Math.PI / 180;
          borderPath.push({ x: 0.5 + 0.4 * Math.cos(angle), y: 0.5 + 0.4 * Math.sin(angle) });
        }
        for (let i = 90; i >= -90; i -= 10) {
          const angle = i * Math.PI / 180;
          borderPath.push({ x: 0.65 + 0.3 * Math.cos(angle), y: 0.5 + 0.4 * Math.sin(angle) });
        }
        borderPath.push({ ...borderPath[0] });
        break;
      case "Cat":
        borderPath.push({ x: 0.35, y: 0.85 }, { x: 0.65, y: 0.85 });
        borderPath.push({ x: 0.75, y: 0.70 }, { x: 0.70, y: 0.45 });
        borderPath.push({ x: 0.80, y: 0.25 }, { x: 0.65, y: 0.35 });
        borderPath.push({ x: 0.50, y: 0.40 }, { x: 0.35, y: 0.35 });
        borderPath.push({ x: 0.20, y: 0.25 }, { x: 0.30, y: 0.45 });
        borderPath.push({ x: 0.25, y: 0.70 }, { x: 0.35, y: 0.85 });
        break;
      case "Bird":
        borderPath.push({ x: 0.10, y: 0.40 }, { x: 0.30, y: 0.35 });
        borderPath.push({ x: 0.45, y: 0.45 }, { x: 0.55, y: 0.40 });
        borderPath.push({ x: 0.60, y: 0.35 }, { x: 0.55, y: 0.45 });
        borderPath.push({ x: 0.70, y: 0.35 }, { x: 0.90, y: 0.40 });
        borderPath.push({ x: 0.70, y: 0.55 }, { x: 0.50, y: 0.65 });
        borderPath.push({ x: 0.30, y: 0.55 }, { x: 0.10, y: 0.40 });
        break;
      case "Butterfly":
        borderPath.push({ x: 0.50, y: 0.40 }, { x: 0.50, y: 0.70 });
        borderPath.push({ x: 0.65, y: 0.85 }, { x: 0.85, y: 0.65 });
        borderPath.push({ x: 0.75, y: 0.55 }, { x: 0.90, y: 0.35 });
        borderPath.push({ x: 0.70, y: 0.15 }, { x: 0.50, y: 0.40 });
        borderPath.push({ x: 0.30, y: 0.15 }, { x: 0.10, y: 0.35 });
        borderPath.push({ x: 0.25, y: 0.55 }, { x: 0.15, y: 0.65 });
        borderPath.push({ x: 0.35, y: 0.85 }, { x: 0.50, y: 0.70 });
        break;
      case "Fish":
        borderPath.push({ x: 0.10, y: 0.35 }, { x: 0.10, y: 0.65 });
        borderPath.push({ x: 0.30, y: 0.50 }, { x: 0.50, y: 0.30 });
        borderPath.push({ x: 0.80, y: 0.35 }, { x: 0.95, y: 0.50 });
        borderPath.push({ x: 0.80, y: 0.65 }, { x: 0.50, y: 0.70 });
        borderPath.push({ x: 0.30, y: 0.50 }, { x: 0.10, y: 0.35 });
        break;
      default:
        borderPath.push({ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 });
        borderPath.push({ x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 });
        borderPath.push({ x: 0.1, y: 0.1 });
        break;
    }
    
    // Ensure the border is closed for the infill algorithm
    if (borderPath.length > 2) {
      const first = borderPath[0];
      const last = borderPath[borderPath.length - 1];
      if (first.x !== last.x || first.y !== last.y) {
        borderPath.push({ ...first });
      }
    }
    
    if (showBorder) {
      paths.push(borderPath);
    }

    if (showInfill && borderPath.length > 2) {
      let minX = Number.MAX_VALUE; let maxX = Number.MIN_VALUE;
      let minY = Number.MAX_VALUE; let maxY = Number.MIN_VALUE;
      borderPath.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });

      const nozzleDia = Math.max(parseFloat(params.nozzleDiameter) || 0.8, 0.1);
      const infillDensity = Math.max(Math.min(params.infillDensity / 100, 1.0), 0.01);
      
      // Align with Kotlin: density = (nozzleDia / 100) / infillDensity
      // This assumes the normalized unit space (0..1) represents a 100mm area.
      const density = (nozzleDia / 100) / infillDensity;

      let y = minY + (density / 2); 
      let lineCount = 0;
      const MAX_INFILL_LINES = 2000; 

      while (y < maxY && lineCount < MAX_INFILL_LINES) {
        const intersections: number[] = [];
        for (let i = 0; i < borderPath.length - 1; i++) {
          const p1 = borderPath[i]; const p2 = borderPath[i + 1];
          if (y > Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y)) {
            if (p2.y !== p1.y) {
              intersections.push(p1.x + (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y));
            }
          }
        }
        
        intersections.sort((a, b) => a - b);
        
        for (let i = 0; i < intersections.length; i += 2) {
          if (i + 1 < intersections.length) {
            paths.push([{ x: intersections[i], y }, { x: intersections[i + 1], y }]);
          }
        }
        y += density;
        lineCount++;
      }
    }
    return paths;
  }

  static generateSampleGCode(shapeName: string, customPaths: Point[][] | null, mode: string, params: PrinterParameters): GCodeGenerationResult {
    const paths = this.generateSamplePaths(shapeName, customPaths, mode, params);
    return this.generateGCode(paths, mode, params);
  }
}
