import { z } from "zod";
import { DicomService } from "../services/DicomService";

export const analyzeDicomFolderTool = {
  name: "analyze_dicom_folder",
  config: {
    title: "Analyze DICOM Folder",
    description: "Analiza todos los archivos DICOM en una carpeta y devuelve información resumida.",
    inputSchema: {
      dicomFolderPath: z.string().describe("Ruta de la carpeta que contiene archivos DICOM."),
    },
  },
  handler: async (args: { dicomFolderPath: string }, _extra: any) => {
    try {
      const dicomService = new DicomService();
      const summary = await dicomService.analyzeDicomFolder(args.dicomFolderPath);
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `❌ Error al analizar la carpeta: ${error.message}` 
        }],
      };
    }
  },
};
