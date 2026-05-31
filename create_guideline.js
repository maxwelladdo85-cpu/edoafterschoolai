const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel } = require('docx');
const fs = require('fs');

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const headerShading = { fill: "00843D", type: ShadingType.CLEAR };
const altRowShading = { fill: "F5F5F5", type: ShadingType.CLEAR };

function createHeaderCell(text) {
  return new TableCell({
    borders: cellBorders,
    width: { size: 3000, type: WidthType.DXA },
    shading: headerShading,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22, font: "Arial" })]
    })]
  });
}

function createBodyCell(text, fill) {
  return new TableCell({
    borders: cellBorders,
    width: { size: 3000, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, size: 22, font: "Arial" })]
    })]
  });
}

function createRow(cells, fill) {
  return new TableRow({
    children: cells.map(t => createBodyCell(t, fill))
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "00843D" },
        paragraph: { spacing: { before: 240, after: 120 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "00843D" },
        paragraph: { spacing: { before: 200, after: 80 } } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "EDO STATE UNIVERSAL BASIC EDUCATION BOARD", bold: true, size: 28, font: "Arial", color: "00843D" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: "(Edo SUBEB)", size: 24, font: "Arial", color: "00843D" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "COURSE MATERIAL UPLOAD GUIDELINES FOR TEACHERS", bold: true, size: 32, font: "Arial", color: "C62828" })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("1. Upload Limits")]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "Each file you upload must not exceed ", size: 22, font: "Arial" }),
                   new TextRun({ text: "100 MB", bold: true, size: 22, font: "Arial", color: "C62828" }),
                   new TextRun({ text: ". Please review the table below for accepted formats.", size: 22, font: "Arial" })]
      }),

      new Table({
        width: { size: 9000, type: WidthType.DXA },
        columnWidths: [3000, 3000, 3000],
        rows: [
          new TableRow({ children: [
            createHeaderCell("Material Type"),
            createHeaderCell("Accepted Formats"),
            createHeaderCell("Max Size")
          ]}),
          createRow(["Video", "MP4, WebM, MOV, M4V", "100 MB"]),
          createRow(["Audio", "MP3, WAV, M4A, OGG", "100 MB"], "F5F5F5"),
          createRow(["Document (PDF)", "PDF", "100 MB"]),
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("2. File Naming Tips")] }),
      new Paragraph({ children: [new TextRun({ text: "Use clear, descriptive names so students can easily find materials. Examples:", size: 22, font: "Arial" })] }),
      new Paragraph({ children: [new TextRun({ text: "   Week3_Maths_Fractions.mp4", size: 22, font: "Arial", color: "2D5A3D" })] }),
      new Paragraph({ children: [new TextRun({ text: "   Term2_English_Vocabulary.pdf", size: 22, font: "Arial", color: "2D5A3D" })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("3. Before You Upload")] }),
      new Paragraph({ children: [new TextRun({ text: "Checklist:", size: 22, font: "Arial", bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: "   - File format is supported.", size: 22, font: "Arial" })] }),
      new Paragraph({ children: [new TextRun({ text: "   - File size is under 100 MB.", size: 22, font: "Arial" })] }),
      new Paragraph({ children: [new TextRun({ text: "   - Content is appropriate and curriculum-aligned.", size: 22, font: "Arial" })] }),
      new Paragraph({ children: [new TextRun({ text: "   - No copyrighted material without permission.", size: 22, font: "Arial" })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("4. Need Help?")] }),
      new Paragraph({ children: [new TextRun({ text: "Contact the Edo SUBEB ICT Support team if you experience any issues with uploads.", size: 22, font: "Arial" })] }),

      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Thank you for supporting quality education in Edo State!", italic: true, size: 22, font: "Arial", color: "00843D" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/documents/Edo_SUBEB_Upload_Guidelines.docx", buffer);
  console.log("Document created successfully at /mnt/documents/Edo_SUBEB_Upload_Guidelines.docx");
});
