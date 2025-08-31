export interface DicomSummary {
  totalFiles: number;
  patients: string[];
  modalities: Record<string, number>;
  studies: string[];
  details: DicomFileDetail[];
}

export interface DicomFileDetail {
  file: string;
  // Información del paciente
  patientName: string;
  patientID: string;
  patientBirthDate: string;
  patientSex: string;

  // Información del estudio
  studyInstanceUID: string;
  studyID: string;
  studyDate: string;
  studyTime: string;
  referringPhysician: string;
  studyDescription: string;

  // Información de la serie
  seriesInstanceUID: string;
  seriesNumber: string;
  modality: string;
  bodyPart: string;
  protocolName: string;
  seriesDescription: string;

  // Información de la imagen
  instanceNumber: string;
  rows: number | string;
  columns: number | string;
  pixelSpacing: string;
  imagePosition: string;
  imageOrientation: string;

  // Información adicional
  manufacturer: string;
  institution: string;
  stationName: string;
  accessionNumber: string;

  // Todos los demás tags
  allTags: Record<string, any>;
}
