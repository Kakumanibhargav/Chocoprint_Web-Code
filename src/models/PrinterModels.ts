export interface PrinterParameters {
  layerHeight: string;
  printSpeed: string;
  travelSpeed: string;
  flowRate: string;
  infillDensity: number;
  wallThickness: string;
  nozzleDiameter: string;
  firstLayerHeight: string;
  retractionDistance: string;
  xMax: string;
  yMax: string;
  zMax: string;
  acceleration: string;
  jerk: string;
  servoAngle: string;
  shapeWidth: string;
  shapeHeight: string;
  numLayers: string;
}

export const defaultPrinterParameters: PrinterParameters = {
  layerHeight: '0.6',
  printSpeed: '20',
  travelSpeed: '60',
  flowRate: '100',
  infillDensity: 20,
  wallThickness: '1.6',
  nozzleDiameter: '0.8',
  firstLayerHeight: '1',
  retractionDistance: '2',
  xMax: '200',
  yMax: '200',
  zMax: '150',
  acceleration: '500',
  jerk: '10',
  servoAngle: '90',
  shapeWidth: '50',
  shapeHeight: '50',
  numLayers: '5'
};

export interface Point {
  x: number;
  y: number;
}
