import { ROIStats, Point } from "../models/DicomTypes";
import dicomParser from "dicom-parser";
import fs from "fs-extra";

export class ROIAnalysisService {
  /**
   * Calcula estadísticas para una región de interés (ROI) en una imagen DICOM
   */
  async analyzeROI(
    dicomFilePath: string, 
    roiPoints: Point[],
    options: {
      windowCenter?: number;
      windowWidth?: number;
    } = {}
  ): Promise<ROIStats> {
    const buffer = await fs.readFile(dicomFilePath);
    const dataSet = dicomParser.parseDicom(buffer);
    
    // Obtener los datos de píxeles y metadatos necesarios
    const pixelData = this.getPixelData(dataSet);
    const rows = dataSet.uint16("x00280010");
    const columns = dataSet.uint16("x00280011");

    if (!rows || !columns) {
      throw new Error("No se pueden obtener las dimensiones de la imagen DICOM");
    }

    const pixelSpacing = this.getPixelSpacing(dataSet);
    
    // Crear máscara de ROI
    const mask = this.createROIMask(roiPoints, rows, columns);
    
    // Aplicar ventana/nivel si se especifica
    const processedPixelData = this.applyWindowLevel(
      pixelData,
      options.windowCenter,
      options.windowWidth
    );

    // Calcular estadísticas
    const stats = this.calculateStats(processedPixelData, mask, pixelSpacing);
    
    return {
      ...stats,
      coordinates: roiPoints
    };
  }

  private getPixelData(dataSet: any): number[] {
    const pixelDataElement = dataSet.elements.x7fe00010;
    if (!pixelDataElement) {
      throw new Error("No se pueden encontrar los datos de píxeles en el archivo DICOM");
    }

    try {
      const pixelData = new Int16Array(
        dataSet.byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length / 2
      );
      return Array.from(pixelData);
    } catch (error) {
      throw new Error(`Error al leer los datos de píxeles: ${error}`);
    }
  }

  private getPixelSpacing(dataSet: any): { x: number; y: number } {
    const spacingString = dataSet.string("x00280030") || "";
    const [x, y] = spacingString.split("\\").map(Number);
    return { x: x || 1, y: y || 1 };
  }

  private createROIMask(points: Point[], rows: number, columns: number): boolean[] {
    const mask = new Array(rows * columns).fill(false);
    
    // Implementar algoritmo de point-in-polygon para crear la máscara
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (this.isPointInPolygon({ x, y }, points)) {
          mask[y * columns + x] = true;
        }
      }
    }
    
    return mask;
  }

  private isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private applyWindowLevel(
    pixelData: number[],
    windowCenter?: number,
    windowWidth?: number
  ): number[] {
    if (typeof windowCenter === "undefined" || typeof windowWidth === "undefined") {
      return pixelData;
    }

    return pixelData.map(value => {
      const normal = ((value - windowCenter) / windowWidth + 0.5) * 255;
      return Math.max(0, Math.min(255, normal));
    });
  }

  private calculateStats(
    pixelData: number[],
    mask: boolean[],
    pixelSpacing: { x: number; y: number }
  ): Omit<ROIStats, "coordinates"> {
    const roiPixels = pixelData.filter((_, i) => mask[i]);
    
    // Calcular estadísticas básicas
    const mean = roiPixels.reduce((sum, val) => sum + val, 0) / roiPixels.length;
    const min = Math.min(...roiPixels);
    const max = Math.max(...roiPixels);
    
    // Calcular desviación estándar
    const squareDiffs = roiPixels.map(value => Math.pow(value - mean, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / roiPixels.length);
    
    // Calcular área y perímetro
    const area = roiPixels.length * pixelSpacing.x * pixelSpacing.y; // mm²
    const perimeter = this.calculatePerimeter(mask, pixelSpacing);
    
    return {
      mean,
      min,
      max,
      stdDev,
      area,
      perimeter
    };
  }

  private calculatePerimeter(
    mask: boolean[], 
    rows: number, 
    columns: number, 
    pixelSpacing: { x: number; y: number }
  ): number {
    let perimeter = 0;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (mask[y * columns + x]) {
          // Verificar bordes
          if (x === 0 || !mask[y * columns + (x-1)]) perimeter += pixelSpacing.y;
          if (x === columns-1 || !mask[y * columns + (x+1)]) perimeter += pixelSpacing.y;
          if (y === 0 || !mask[(y-1) * columns + x]) perimeter += pixelSpacing.x;
          if (y === rows-1 || !mask[(y+1) * columns + x]) perimeter += pixelSpacing.x;
        }
      }
    }
    
    return perimeter;
  }
}
