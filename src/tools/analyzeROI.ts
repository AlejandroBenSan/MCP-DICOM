import { z } from "zod";
import { ROIAnalysisService } from "../services/ROIAnalysisService";
import { Point } from "../models/DicomTypes";

export const analyzeROITool = {
  name: "analyze_dicom_roi",
  config: {
    title: "Analyze DICOM ROI",
    description: "Analiza una región de interés en una imagen DICOM y calcula estadísticas importantes.",
    inputSchema: {
      dicomFilePath: z.string().describe("Ruta al archivo DICOM a analizar."),
      roiPoints: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
        })
      ).describe("Array de puntos que definen el polígono de la ROI."),
      windowCenter: z.number().optional().describe("Centro de la ventana para ajuste de contraste."),
      windowWidth: z.number().optional().describe("Ancho de la ventana para ajuste de contraste."),
    },
  },
  handler: async (args: {
    dicomFilePath: string;
    roiPoints: Point[];
    windowCenter?: number;
    windowWidth?: number;
  }) => {
    try {
      const roiService = new ROIAnalysisService();
      const stats = await roiService.analyzeROI(args.dicomFilePath, args.roiPoints, {
        windowCenter: args.windowCenter,
        windowWidth: args.windowWidth,
      });

      // Formatear los resultados para una mejor presentación
      const formattedStats = {
        "Estadísticas de intensidad": {
          "Media": stats.mean.toFixed(2),
          "Mínimo": stats.min.toFixed(2),
          "Máximo": stats.max.toFixed(2),
          "Desviación estándar": stats.stdDev.toFixed(2),
        },
        "Medidas geométricas": {
          "Área": `${stats.area.toFixed(2)} mm²`,
          "Perímetro": `${stats.perimeter.toFixed(2)} mm`,
        },
        "Puntos del ROI": stats.coordinates.map(p => `(${p.x}, ${p.y})`),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(formattedStats, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Error al analizar ROI: ${error.message}`,
          },
        ],
      };
    }
  },
};
