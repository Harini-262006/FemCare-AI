
/**
 * Image & Document Analysis Service
 * Analyzes medical images (skin photos, reports, X-rays, prescriptions, etc.)
 * and documents (PDFs, TXT, DOC/DOCX) to provide contextual descriptions for AI.
 */

export interface UploadedFileContext {
  name: string;
  type: string;
  size: number;
  isImage: boolean;
  url?: string;
  extractedText?: string;
  description?: string;
}

export interface AnalysisResult {
  success: boolean;
  message: string;
  fileContexts: UploadedFileContext[];
  combinedPrompt: string;
}

const buildImageDescription = (
  fileName: string,
  index: number
): string => {
  const lower = fileName.toLowerCase();
  const hints: string[] = [];

  if (
    lower.includes("xray") ||
    lower.includes("x-ray") ||
    lower.includes("radiograph") ||
    lower.includes("scan")
  ) {
    hints.push(
      "This appears to be a medical scan or X-ray image. Please describe any visible structures, anomalies, densities, or findings. Note: This is educational interpretation only, not a radiologist diagnosis."
    );
  } else if (
    lower.includes("prescription") ||
    lower.includes("rx") ||
    lower.includes("medicine") ||
    lower.includes("med")
  ) {
    hints.push(
      "This appears to be a medical prescription. Please extract all medicine names, dosages, frequencies, instructions, doctor name, date, and any notes. Include a list of each medication clearly."
    );
  } else if (
    lower.includes("report") ||
    lower.includes("blood") ||
    lower.includes("lab") ||
    lower.includes("test") ||
    lower.includes("result")
  ) {
    hints.push(
      "This appears to be a medical/lab report (e.g., blood test, CBC, thyroid, hormone panel, etc.). Please extract ALL values, reference ranges, units, flags (abnormal/high/low), patient info, test date, and lab name. Summarize key findings and anything concerning."
    );
  } else if (
    lower.includes("skin") ||
    lower.includes("rash") ||
    lower.includes("acne") ||
    lower.includes("pregnancy") ||
    lower.includes("belly") ||
    lower.includes("ultrasound")
  ) {
    hints.push(
      "This appears to be a skin, body, or pregnancy-related image. Describe visible skin conditions (color, texture, lesions if any), location, severity, or for pregnancy/ultrasound, any visible details. Include disclaimers that a dermatologist/OBGYN should be consulted for concerns."
    );
  } else if (lower.includes("strip") || lower.includes("pill")) {
    hints.push(
      "This appears to be a medicine strip, packaging, or pills. Please identify the medicine name (if readable), dosage, manufacturer, expiry date (if visible), and any instructions printed. Provide general known information about such medication and remind the user to follow their doctor's prescription."
    );
  } else {
    hints.push(
      "This is an uploaded medical/health-related image. Please carefully describe what you observe — any text, numbers, graphs, tables, structures, conditions, or visual findings. Extract all OCR-readable text verbatim. Summarize key takeaways relevant to the user's health query. Always include a gentle disclaimer that this is not a substitute for professional medical review."
    );
  }

  return `[Image ${index + 1}: ${fileName}] ${hints.join(" ")}`;
};

const buildDocumentDescription = (
  fileName: string,
  mimeType: string,
  extractedText: string | undefined,
  index: number
): string => {
  const parts: string[] = [];
  parts.push(`[Document ${index + 1}: ${fileName} (${mimeType})]`);

  if (extractedText && extractedText.trim().length > 0) {
    const preview =
      extractedText.length > 6000
        ? extractedText.slice(0, 6000) +
          `\n... [truncated, first 6000 chars. Original length: ${extractedText.length} chars]`
        : extractedText;
    parts.push(
      `Below is the extracted text content from this document. Use it to answer the user's question:\n\n--- DOCUMENT CONTENT START ---\n${preview}\n--- DOCUMENT CONTENT END ---`
    );
  } else {
    parts.push(
      "Note: Text extraction for this document type may be limited. Treat this as a health-related document (e.g., medical report, prescription, discharge summary, lab results, health record, doctor's note, pregnancy report, thyroid panel, etc.) and analyze based on the filename and user prompt."
    );
  }

  parts.push(
    "Always summarize the document, highlight key values/findings, and answer the user's specific question if one was asked. Include a disclaimer that this interpretation is informational and to confirm with a licensed doctor for medical decisions."
  );

  return parts.join("\n\n");
};

export const analyzeUploadedFiles = async (
  files: UploadedFileContext[]
): Promise<AnalysisResult> => {
  try {
    console.log("🔍 Analyzing uploaded files:", files.length, "file(s)");

    if (files.length === 0) {
      return {
        success: true,
        message: "No files uploaded",
        fileContexts: [],
        combinedPrompt: "",
      };
    }

    const fileContexts: UploadedFileContext[] = files.map((f, i) => ({
      ...f,
      description: f.isImage
        ? buildImageDescription(f.name, i)
        : buildDocumentDescription(f.name, f.type, f.extractedText, i),
    }));

    const sections: string[] = [];
    sections.push(
      "--- UPLOADED FILES / ATTACHMENTS (IMPORTANT: Use these to inform your response) ---"
    );
    sections.push(
      `The user has uploaded ${files.length} file(s). These are health/medical related attachments. Analyze them carefully in the context of the user's message below.`
    );

    for (const ctx of fileContexts) {
      sections.push(ctx.description || "");
    }

    sections.push("--- END ATTACHMENTS ---");
    sections.push("");
    sections.push(
      "INSTRUCTIONS: Respond conversationally to the user's message below. If they attached files, first acknowledge the uploads, then address their specific question using the attached content. Always include the FemCare AI medical disclaimer once when discussing medical topics. Never claim to replace a doctor — always recommend consulting a healthcare provider for concerns, prescriptions, diagnoses, or treatment plans."
    );
    sections.push("");

    return {
      success: true,
      message: `Processed ${files.length} file(s)`,
      fileContexts,
      combinedPrompt: sections.join("\n\n"),
    };
  } catch (error) {
    console.error("File analysis error:", error);
    return {
      success: false,
      message: "File processing encountered an issue, but we'll still try to answer.",
      fileContexts: files,
      combinedPrompt:
        files.length > 0
          ? `(Note: ${files.length} file(s) were attached but processing had issues. Still, please try to help the user based on their message and file names: ${files
              .map((f) => f.name)
              .join(", ")})\n\n`
          : "",
    };
  }
};
