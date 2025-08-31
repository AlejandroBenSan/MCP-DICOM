import fs from "fs-extra";
import path from "path";
import dicomParser from "dicom-parser";
import { DicomSummary, DicomFileDetail } from "../models/DicomTypes";

export class DicomService {
  private async getDicomFilesRecursively(folderPath: string): Promise<string[]> {
    const files = await fs.readdir(folderPath);
    let dicomFiles: string[] = [];

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        // Si es una carpeta, recorrer recursivamente
        const subFiles = await this.getDicomFilesRecursively(fullPath);
        dicomFiles = dicomFiles.concat(subFiles);
      } else if (file.endsWith(".dcm") || !path.extname(file)) {
        // Archivo DICOM (muchos no tienen extensión)
        dicomFiles.push(fullPath);
      }
    }

    return dicomFiles;
  }

  async analyzeDicomFolder(dicomFolderPath: string): Promise<DicomSummary> {
    const dicomFiles = await this.getDicomFilesRecursively(dicomFolderPath);

    if (dicomFiles.length === 0) {
      throw new Error("No se encontraron archivos DICOM en la carpeta.");
    }

    const summary: DicomSummary = {
      totalFiles: dicomFiles.length,
      modalities: {},
      patients: [],
      studies: [],
      details: [],
    };

    const patientsSet = new Set<string>();
    const studiesSet = new Set<string>();

    for (const filePath of dicomFiles) {
      const fileDetail = await this.processDicomFile(filePath);
      if (fileDetail) {
        summary.details.push(fileDetail);
        patientsSet.add(fileDetail.patientName);
        studiesSet.add(fileDetail.studyInstanceUID);
        summary.modalities[fileDetail.modality] = (summary.modalities[fileDetail.modality] || 0) + 1;
      }
    }

    summary.patients = Array.from(patientsSet);
    summary.studies = Array.from(studiesSet);

    return summary;
  }

  private async processDicomFile(filePath: string): Promise<DicomFileDetail | null> {
    try {
      const buffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const dataSet = dicomParser.parseDicom(buffer);

      const allTags: Record<string, any> = {};
      for (const tag in dataSet.elements) {
        try {
          const value = dataSet.string(tag);
          if (value) {
            allTags[tag] = value;
          }
        } catch {
          // Ignorar tags que no son strings
        }
      }

      return {
        file: fileName,
        patientName: dataSet.string("x00100010") || "Desconocido",
        patientID: dataSet.string("x00100020") || "N/A",
        patientBirthDate: dataSet.string("x00100030") || "N/A",
        patientSex: dataSet.string("x00100040") || "N/A",
        studyInstanceUID: dataSet.string("x0020000d") || fileName,
        studyID: dataSet.string("x00200010") || "N/A",
        studyDate: dataSet.string("x00080020") || "N/A",
        studyTime: dataSet.string("x00080030") || "N/A",
        referringPhysician: dataSet.string("x00080090") || "N/A",
        studyDescription: dataSet.string("x00080130") || "N/A",
        seriesInstanceUID: dataSet.string("x0020000e") || "N/A",
        seriesNumber: dataSet.string("x00200011") || "N/A",
        modality: dataSet.string("x00080060") || "N/A",
        bodyPart: dataSet.string("x00180015") || "N/A",
        protocolName: dataSet.string("x00181030") || "N/A",
        seriesDescription: dataSet.string("x0008103e") || "N/A",
        instanceNumber: dataSet.string("x00200013") || "N/A",
        rows: dataSet.uint16("x00280010") || "N/A",
        columns: dataSet.uint16("x00280011") || "N/A",
        pixelSpacing: dataSet.string("x00280030") || "N/A",
        imagePosition: dataSet.string("x00200032") || "N/A",
        imageOrientation: dataSet.string("x00200037") || "N/A",
        manufacturer: dataSet.string("x00080070") || "N/A",
        institution: dataSet.string("x00080080") || "N/A",
        stationName: dataSet.string("x00081010") || "N/A",
        accessionNumber: dataSet.string("x00080050") || "N/A",
        allTags
      };
    } catch (err) {
      console.warn(`No se pudo parsear ${path.basename(filePath)}:`, err.message);
      return null;
    }
  }
}
