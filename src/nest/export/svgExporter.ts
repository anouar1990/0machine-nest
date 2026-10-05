import { Part, Sheet } from '../core/types';
import { getAbsolutePartContours } from '../nesting/collision';

/**
 * Generates production-ready SVG string for a nested sheet layout.
 */
export function exportSheetToSvg(parts: Part[], sheet: Sheet): string {
  const w = sheet.width;
  const h = sheet.height;
  const margin = sheet.margin;

  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">\n`;
  svg += `  <!-- 0MACHINE NEST - GENERATED NESTED SHEET LAYOUT -->\n`;
  svg += `  <!-- Sheet Dimensions: ${w}mm x ${h}mm | Margin: ${margin}mm | Spacing: ${sheet.spacing}mm -->\n\n`;

  // Sheet boundary frame (Outer sheet line in gray, printable margin in dashed cyan)
  svg += `  <g id="sheet-boundary">\n`;
  svg += `    <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#444444" stroke-width="0.5" />\n`;
  svg += `    <rect x="${margin}" y="${margin}" width="${w - 2 * margin}" height="${
    h - 2 * margin
  }" fill="none" stroke="#00f0ff" stroke-width="0.25" stroke-dasharray="2,2" />\n`;
  svg += `  </g>\n\n`;

  // Placed parts paths
  svg += `  <g id="nested-parts">\n`;

  parts.forEach((part, idx) => {
    const { contours, holes } = getAbsolutePartContours(part);
    const color = part.color || '#00f0ff';

    svg += `    <!-- Part #${idx + 1}: ${part.name || part.sourceFileName} -->\n`;
    svg += `    <g id="part-${part.id}">\n`;

    // Outer contours (red cut line by default or part color)
    contours.forEach((c) => {
      if (c.length < 2) return;
      let d = `M ${c[0].x.toFixed(3)} ${c[0].y.toFixed(3)}`;
      for (let i = 1; i < c.length; i++) {
        d += ` L ${c[i].x.toFixed(3)} ${c[i].y.toFixed(3)}`;
      }
      d += ` Z`;
      svg += `      <path d="${d}" fill="none" stroke="${color}" stroke-width="0.3" />\n`;
    });

    // Inner holes (yellow inner cut line by default)
    holes.forEach((h) => {
      if (h.length < 2) return;
      let d = `M ${h[0].x.toFixed(3)} ${h[0].y.toFixed(3)}`;
      for (let i = 1; i < h.length; i++) {
        d += ` L ${h[i].x.toFixed(3)} ${h[i].y.toFixed(3)}`;
      }
      d += ` Z`;
      svg += `      <path d="${d}" fill="none" stroke="#ffd700" stroke-width="0.3" />\n`;
    });

    svg += `    </g>\n`;
  });

  svg += `  </g>\n`;
  svg += `</svg>`;

  return svg;
}

/**
 * Export all sheets in a multi-sheet job into a combined or multi-layer SVG package.
 */
export function exportAllSheetsToSvg(parts: Part[], sheets: Sheet[]): string {
  if (sheets.length <= 1) {
    return exportSheetToSvg(parts, sheets[0] || { width: 600, height: 300, margin: 5, spacing: 3, id: '1', name: 'Sheet #1' });
  }

  const primarySheet = sheets[0];
  const w = primarySheet.width;
  const h = primarySheet.height;

  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h * sheets.length + (sheets.length - 1) * 20}mm" viewBox="0 0 ${w} ${h * sheets.length + (sheets.length - 1) * 20}">\n`;
  svg += `  <!-- 0MACHINE NEST - MULTI-SHEET EXPORT (${sheets.length} SHEETS) -->\n\n`;

  sheets.forEach((sh, sheetIdx) => {
    const sheetOffsetY = sheetIdx * (h + 20);
    const sheetParts = parts.filter((p) => (p.sheetIndex || 0) === sheetIdx);

    svg += `  <!-- SHEET #${sheetIdx + 1}: ${sh.name} -->\n`;
    svg += `  <g id="sheet-${sheetIdx + 1}" transform="translate(0, ${sheetOffsetY})">\n`;
    svg += `    <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#444444" stroke-width="0.5" />\n`;
    svg += `    <text x="5" y="-5" fill="#888888" font-size="8" font-family="sans-serif">SHEET #${sheetIdx + 1} (${sh.width}x${sh.height}mm)</text>\n`;

    sheetParts.forEach((part) => {
      const { contours, holes } = getAbsolutePartContours(part);
      const color = part.color || '#00f0ff';

      svg += `    <g id="part-${part.id}">\n`;
      contours.forEach((c) => {
        if (c.length < 2) return;
        let d = `M ${c[0].x.toFixed(3)} ${c[0].y.toFixed(3)}`;
        for (let i = 1; i < c.length; i++) {
          d += ` L ${c[i].x.toFixed(3)} ${c[i].y.toFixed(3)}`;
        }
        d += ` Z`;
        svg += `      <path d="${d}" fill="none" stroke="${color}" stroke-width="0.3" />\n`;
      });

      holes.forEach((hole) => {
        if (hole.length < 2) return;
        let d = `M ${hole[0].x.toFixed(3)} ${hole[0].y.toFixed(3)}`;
        for (let i = 1; i < hole.length; i++) {
          d += ` L ${hole[i].x.toFixed(3)} ${hole[i].y.toFixed(3)}`;
        }
        d += ` Z`;
        svg += `      <path d="${d}" fill="none" stroke="#ffd700" stroke-width="0.3" />\n`;
      });
      svg += `    </g>\n`;
    });

    svg += `  </g>\n\n`;
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Triggers a browser file download of the exported SVG.
 */
export function downloadSvgFile(filename: string, content: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
