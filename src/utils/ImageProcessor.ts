import type { Point } from '../models/PrinterModels';

export class ImageProcessor {
  /**
   * Converts a raster image (PNG/JPG) to a set of paths (Point[][]) suitable for G-code.
   * Uses a brightness threshold to find "printable" areas.
   */
  static async processImageToPaths(dataUrl: string): Promise<Point[][]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const paths = this.traceImage(img);
        resolve(paths);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private static traceImage(img: HTMLImageElement): Point[][] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    // Max dimension for processing to keep it fast while maintaining detail for text
    const maxDim = 250;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxDim) {
        height = (height * maxDim) / width;
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = (width * maxDim) / height;
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const paths: Point[][] = [];

    // Simple thresholding: anything darker than 128 is "ink"
    const threshold = 127;
    const isInk = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const alpha = data[idx + 3];
      return alpha > 10 && brightness < threshold;
    };

    // 1. Outline Tracing (for sharp text/shapes)
    const visited = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < height - 1; x++) {
        if (isInk(x, y) && !visited[y * width + x]) {
          // If it's an edge pixel, trace the contour
          if (!isInk(x-1, y) || !isInk(x+1, y) || !isInk(x, y-1) || !isInk(x, y+1)) {
            const contour = this.traceContour(x, y, width, isInk, visited);
            if (contour.length > 2) {
              paths.push(contour.map(p => ({ x: p.x / width, y: p.y / height })));
            }
          }
        }
      }
    }

    // 2. Scanline strategy for G-code (horizontal lines for filled areas)
    // We scan every 2nd or 3rd pixel row to avoid overly dense G-code for filling
    const stepY = 2; 
    for (let y = 0; y < height; y += stepY) {
      let inSegment = false;
      let segmentStart = 0;

      for (let x = 0; x < width; x++) {
        const ink = isInk(x, y);

        if (ink && !inSegment) {
          inSegment = true;
          segmentStart = x;
        } else if (!ink && inSegment) {
          inSegment = false;
          // Only add fill if it's substantial (filters noise)
          if ((x - segmentStart) > 1) {
            paths.push([
              { x: segmentStart / width, y: y / height },
              { x: (x - 1) / width, y: y / height }
            ]);
          }
        }
      }

      if (inSegment) {
        paths.push([
          { x: segmentStart / width, y: y / height },
          { x: (width - 1) / width, y: y / height }
        ]);
      }
    }

    // No need for a global border if we have the content outlines
    return paths;
  }

  // Basic Moore-Neighbor tracing or similar for contours
  private static traceContour(startX: number, startY: number, width: number, isInk: (x: number, y: number) => boolean, visited: Uint8Array): Point[] {
    const contour: Point[] = [];
    let currX = startX;
    let currY = startY;
    
    // Direction vectors: N, NE, E, SE, S, SW, W, NW
    const dx = [0, 1, 1, 1, 0, -1, -1, -1];
    const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
    
    let dir = 0; // Start looking North
    const maxIterations = 2000; // Prevent infinite loops
    let iter = 0;

    while (iter < maxIterations) {
      iter++;
      visited[currY * width + currX] = 1;
      contour.push({ x: currX, y: currY });

      let foundNext = false;
      // Search neighbors clockwise
      for (let i = 0; i < 8; i++) {
        const checkDir = (dir + i) % 8;
        const nx = currX + dx[checkDir];
        const ny = currY + dy[checkDir];

        if (isInk(nx, ny)) {
          currX = nx;
          currY = ny;
          dir = (checkDir + 5) % 8; // Backtrack slightly for next search
          foundNext = true;
          break;
        }
      }

      if (!foundNext || (currX === startX && currY === startY)) break;
    }

    return contour;
  }
}
