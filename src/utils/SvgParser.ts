import type { Point } from '../models/PrinterModels';

// Basic SVG Path Data parser mapping to Point arrays
export class SvgParser {
  static parseSvgToPaths(svgString: string): Point[][] {
    const paths: Point[][] = [];
    
    // Quick and dirty parser for demonstration purposes.
    // In a production app, use an established library like 'svg-path-parser' or 'potrace'
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    
    // Try to find <path> elements
    const pathElements = doc.querySelectorAll('path');
    
    if (pathElements.length === 0) {
      // Fallback: If no paths found, just return a square placeholder
      console.warn("No <path> elements found in SVG, falling back to square outline.");
      return [
        [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }, { x: 0.1, y: 0.1 }]
      ];
    }

    pathElements.forEach(pathEl => {
      const d = pathEl.getAttribute('d');
      if (!d) return;

      const path: Point[] = [];
      const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
      
      let cursorX = 0; let cursorY = 0;
      let minX = Number.MAX_VALUE; let maxX = Number.MIN_VALUE;
      let minY = Number.MAX_VALUE; let maxY = Number.MIN_VALUE;

      commands.forEach(cmd => {
        const type = cmd[0];
        const args = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
        
        switch (type) {
          case 'M': // Move to absolute
            if (args.length >= 2) {
              cursorX = args[0]; cursorY = args[1];
              path.push({ x: cursorX, y: cursorY });
            }
            break;
          case 'm': // Move to relative
            if (args.length >= 2) {
              cursorX += args[0]; cursorY += args[1];
              path.push({ x: cursorX, y: cursorY });
            }
            break;
          case 'L': // Line to absolute
            for (let i = 0; i < args.length; i += 2) {
              cursorX = args[i]; cursorY = args[i+1];
              path.push({ x: cursorX, y: cursorY });
            }
            break;
          case 'l': // Line to relative
            for (let i = 0; i < args.length; i += 2) {
              cursorX += args[i]; cursorY += args[i+1];
              path.push({ x: cursorX, y: cursorY });
            }
            break;
          case 'H': // Horizontal absolute
            args.forEach(x => { cursorX = x; path.push({ x: cursorX, y: cursorY }); });
            break;
          case 'h': // Horizontal relative
            args.forEach(dx => { cursorX += dx; path.push({ x: cursorX, y: cursorY }); });
            break;
          case 'V': // Vertical absolute
            args.forEach(y => { cursorY = y; path.push({ x: cursorX, y: cursorY }); });
            break;
          case 'v': // Vertical relative
            args.forEach(dy => { cursorY += dy; path.push({ x: cursorX, y: cursorY }); });
            break;
          case 'Z': case 'z': // Close path
            if (path.length > 0) {
              cursorX = path[0].x; cursorY = path[0].y;
              path.push({ x: cursorX, y: cursorY });
            }
            break;
          // Note: Ignoring Curves (C, c, S, s, Q, q, T, t) and Arcs (A, a) for basic implementation.
          // They would require significant bezier subdivision math to flatten into line segments.
        }

        if (cursorX < minX) minX = cursorX;
        if (cursorX > maxX) maxX = cursorX;
        if (cursorY < minY) minY = cursorY;
        if (cursorY > maxY) maxY = cursorY;
      });

      // Normalize it to roughly 0-1 scale so the existing shape scaling logic handles it cleanly
      const width = maxX - minX;
      const height = maxY - minY;
      const dominantDim = Math.max(width, height, 0.0001);

      if (path.length > 0) {
        const normalizedPath = path.map(p => ({
          x: (p.x - minX) / dominantDim,
          y: (p.y - minY) / dominantDim
        }));
        paths.push(normalizedPath);
      }
    });

    return paths;
  }
}
