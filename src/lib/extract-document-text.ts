// Client-side document text extraction for PDF, DOCX, and TXT files.
// Used by the AI Teaching Assistant so teachers can upload lesson notes
// instead of pasting them.

export const ACCEPTED_DOC_TYPES = ".pdf,.docx,.txt,.md,text/plain";
export const MAX_DOC_BYTES = 15 * 1024 * 1024; // 15 MB

export async function extractDocumentText(file: File): Promise<string> {
  if (file.size > MAX_DOC_BYTES) {
    throw new Error("File is too large (max 15 MB).");
  }
  const name = file.name.toLowerCase();
  const type = file.type;

  // Plain text / markdown
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return (await file.text()).trim();
  }

  // PDF
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const pdfjs: any = await import("pdfjs-dist");
    // Vite-friendly worker URL
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
      parts.push(pageText);
    }
    return parts.join("\n\n").trim();
  }

  // DOCX
  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth: any = await import(/* @vite-ignore */ "mammoth/mammoth.browser" as any);
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return String(result?.value ?? "").trim();
  }

  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
}
