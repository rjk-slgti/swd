import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
 const {createSampleProject} = await server.ssrLoadModule('/src/data/defaults.ts');
 const {calculateAll} = await server.ssrLoadModule('/src/calculations/engine.ts');
 const x = await server.ssrLoadModule('/src/exports/exportModules.ts');
 const p = createSampleProject(), r = calculateAll(p);
 await mkdir('../work/export-checks', {recursive:true});
 const pdf = x.exportPDF(p,r,false); const pdfBytes = Buffer.from(pdf.output('arraybuffer'));
 assert.equal(pdfBytes.subarray(0,4).toString(), '%PDF');
 await writeFile('../work/export-checks/sample.pdf', pdfBytes);
 const wb = x.exportExcel(p,r,false); assert.equal(wb.SheetNames.length,26); assert.equal(wb.Sheets.Occupancy.E2.v,5); assert.equal(wb.Sheets.Occupancy.F2.f,'C2*D2*E2/7'); assert.equal(wb.Sheets.Occupancy.F2.v,r.occupancy[0].dailyDemand); assert.equal(wb.Sheets['Water Sources'].A1.v,'Source');
 XLSX.writeFile(wb,'../work/export-checks/sample.xlsx');
 assert.equal(XLSX.readFile('../work/export-checks/sample.xlsx').SheetNames.length,26);
 const docx = await x.exportWord(p,r,false); const bytes = Buffer.from(await docx.arrayBuffer());
 assert.equal(bytes.subarray(0,2).toString(),'PK'); await writeFile('../work/export-checks/sample.docx',bytes);
 console.log(`PASS PDF (${pdf.getNumberOfPages()} pages), XLSX (26 sheets, verified daily-average values), DOCX (${bytes.length} bytes)`);
} finally { await server.close(); }

