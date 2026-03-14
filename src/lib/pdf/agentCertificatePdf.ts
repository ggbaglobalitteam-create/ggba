function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfLine(value: string) {
  return `(${escapePdfText(value)})`;
}

function drawFilledRect(x: number, y: number, width: number, height: number, color: [number, number, number]) {
  return `${color[0]} ${color[1]} ${color[2]} rg\n${x} ${y} ${width} ${height} re f`;
}

function drawStrokedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number],
  lineWidth = 1
) {
  return `${lineWidth} w\n${color[0]} ${color[1]} ${color[2]} RG\n${x} ${y} ${width} ${height} re S`;
}

function drawLine(x1: number, y1: number, x2: number, y2: number, color: [number, number, number], lineWidth = 1) {
  return `${lineWidth} w\n${color[0]} ${color[1]} ${color[2]} RG\n${x1} ${y1} m ${x2} ${y2} l S`;
}

function drawText(
  text: string,
  x: number,
  y: number,
  font: string,
  size: number,
  color: [number, number, number]
) {
  return `BT\n/${font} ${size} Tf\n${color[0]} ${color[1]} ${color[2]} rg\n1 0 0 1 ${x} ${y} Tm\n${pdfLine(text)} Tj\nET`;
}

function drawCenteredText(
  text: string,
  centerX: number,
  y: number,
  font: string,
  size: number,
  color: [number, number, number]
) {
  const approximateWidth = text.length * size * 0.27;
  return drawText(text, centerX - approximateWidth, y, font, size, color);
}

function wrapText(text: string, maxChars: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function infoCard(x: number, y: number, width: number, height: number, label: string, value: string) {
  const slate: [number, number, number] = [0.45, 0.5, 0.6];
  const navy: [number, number, number] = [0.1, 0.16, 0.28];
  const gold: [number, number, number] = [0.82, 0.67, 0.33];

  return [
    drawFilledRect(x, y, width, height, [1, 1, 1]),
    drawStrokedRect(x, y, width, height, gold, 1),
    drawText(label.toUpperCase(), x + 14, y + height - 20, "F2", 8, slate),
    drawText(value, x + 14, y + 18, "F2", 12, navy),
  ].join("\n");
}

function buildPdf(content: string) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

export function createAgentCertificatePdf(params: {
  companyName: string;
  representativeName: string;
  registrationNumber: string;
  agentId: string;
  issuedAt: string;
  certificateId: string;
}) {
  const navy: [number, number, number] = [0.1, 0.16, 0.28];
  const gold: [number, number, number] = [0.79, 0.65, 0.33];
  const cream: [number, number, number] = [0.99, 0.98, 0.95];
  const slate: [number, number, number] = [0.36, 0.41, 0.5];
  const body: [number, number, number] = [0.22, 0.25, 0.32];

  const companyName = params.companyName.toUpperCase();
  const noteLines = wrapText(
    "This certificate is digitally verifiable via the QR code on the web version and does not require a physical signature.",
    58
  );

  const stream = [
    drawFilledRect(0, 0, 595, 842, cream),
    drawStrokedRect(18, 18, 559, 806, navy, 8),
    drawStrokedRect(34, 34, 527, 774, gold, 1.5),

    drawFilledRect(266, 718, 62, 62, navy),
    drawCenteredText("GG", 297, 748, "F2", 18, [1, 1, 1]),

    drawCenteredText("GGBA GLOBAL", 297, 682, "F2", 20, navy),
    drawLine(250, 666, 345, 666, gold, 1.2),
    drawCenteredText("Certificate of Agency", 297, 620, "F1", 34, gold),
    drawCenteredText("OFFICIAL PARTNERSHIP RECOGNITION", 297, 585, "F2", 11, slate),

    drawCenteredText("This is to proudly certify that", 297, 534, "F3", 16, slate),
    drawCenteredText(companyName, 297, 480, "F2", 24, navy),
    drawLine(150, 465, 445, 465, [0.75, 0.78, 0.82], 1),

    drawCenteredText(`Represented by ${params.representativeName}, has been officially approved and`, 297, 428, "F1", 15, body),
    drawCenteredText("registered as an", 297, 400, "F1", 15, body),
    drawCenteredText("G & G Biz Alliance Private Limited", 297, 356, "F2", 18, gold),

    infoCard(70, 238, 160, 74, "Registration No.", params.registrationNumber),
    infoCard(242, 238, 120, 74, "Agent ID", params.agentId),
    drawFilledRect(374, 144, 150, 168, [1, 1, 1]),
    drawStrokedRect(374, 144, 150, 168, gold, 1),
    drawCenteredText("SCAN TO VERIFY", 449, 280, "F2", 10, navy),
    drawStrokedRect(400, 170, 98, 84, navy, 3),
    drawCenteredText("Use web", 449, 218, "F2", 12, body),
    drawCenteredText("certificate page", 449, 198, "F2", 12, body),
    drawCenteredText("for QR verification", 449, 178, "F2", 11, slate),

    infoCard(70, 156, 160, 66, "Date of Issue", params.issuedAt),
    infoCard(242, 156, 120, 66, "Certificate ID", params.certificateId),

    drawFilledRect(70, 74, 292, 68, [1, 1, 1]),
    drawStrokedRect(70, 74, 292, 68, gold, 1),
    drawText("VERIFICATION NOTE", 84, 121, "F2", 8, slate),
    ...noteLines.map((line, index) => drawText(line, 84, 98 - index * 16, "F1", 11, body)),

    drawCenteredText(params.certificateId, 297, 38, "F2", 9, slate),
  ].join("\n");

  return buildPdf(stream);
}
