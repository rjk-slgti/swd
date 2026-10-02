// ============================================================
// EXPORT MODULES — PDF, Excel, Word, JSON
// ============================================================

import type { ProjectData, AllResults } from '@/types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';

// --- Helpers ---

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

function getFilenames(project: ProjectData) {
  const base = sanitizeFilename(project.projectInfo.projectName || 'Project');
  const rev = sanitizeFilename(project.projectInfo.revision || 'P01');
  return {
    pdf: `Water_Services_Design_${base}_${rev}.pdf`,
    xlsx: `Water_Services_Calculations_${base}_${rev}.xlsx`,
    docx: `Water_Services_Engineering_Report_${base}_${rev}.docx`,
  };
}

// ============================================================
// PDF EXPORT
// ============================================================

export function exportPDF(project: ProjectData, results: AllResults) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addHeader = () => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`${project.projectInfo.projectName} — Water Services Design Report — Rev ${project.projectInfo.revision}`, margin, 8);
    doc.setDrawColor(200);
    doc.line(margin, 10, pageWidth - margin, 10);
    doc.setTextColor(0);
  };

  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Page ${pageNum}`, pageWidth - 30, pageHeight - 8);
    doc.text('Preliminary Engineering Design — Verification Required', margin, pageHeight - 8);
    doc.setTextColor(0);
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      addHeader();
      y = margin + 5;
    }
  };

  const addHeading = (text: string, level: number = 1) => {
    const sizes = { 1: 16, 2: 13, 3: 11 };
    const size = sizes[level as keyof typeof sizes] || 11;
    ensureSpace(size + 5);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(text, margin, y);
    y += size * 0.6 + 3;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
  };

  const addParagraph = (text: string, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      ensureSpace(fontSize * 0.5 + 2);
      doc.text(line, margin, y);
      y += fontSize * 0.5 + 1;
    });
  };

  const addTable = (headers: string[], rows: (string|number)[][]) => {
    autoTable(doc, {
      head: [headers],
      body: rows.map(r => r.map(c => String(c))),
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 245, 250] },
    });
    // @ts-expect-error — jspdf-autotable adds lastAutoTable
    y = doc.lastAutoTable.finalY + 5;
  };

  // --- COVER PAGE ---
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setTextColor(255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Water Services Design Report', margin, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(project.projectInfo.projectName, margin, 45);
  doc.setTextColor(0);

  y = 75;
  addParagraph(`Client: ${project.projectInfo.client}`, 12);
  addParagraph(`Consultant: ${project.projectInfo.consultant}`, 12);
  addParagraph(`Location: ${project.projectInfo.location}, ${project.projectInfo.country}`, 12);
  addParagraph(`Design Stage: ${project.projectInfo.designStage}`, 12);
  addParagraph(`Revision: ${project.projectInfo.revision}`, 12);
  addParagraph(`Date: ${project.projectInfo.date}`, 12);
  addParagraph(`Prepared By: ${project.projectInfo.preparedBy}`, 12);
  addParagraph(`Checked By: ${project.projectInfo.checkedBy}`, 12);

  // --- DOCUMENT CONTROL ---
  doc.addPage();
  addHeader();
  y = margin + 5;
  addHeading('Document Control', 1);
  addTable(
    ['Rev', 'Date', 'Description', 'Prepared By', 'Checked By'],
    [[project.projectInfo.revision, project.projectInfo.date, 'Preliminary design', project.projectInfo.preparedBy, project.projectInfo.checkedBy]]
  );

  // --- TABLE OF CONTENTS ---
  addHeading('Table of Contents', 1);
  const tocItems = [
    '1. Executive Summary', '2. Project Description', '3. Scope', '4. Design Basis',
    '5. Standards and References', '6. Design Assumptions', '7. Occupancy',
    '8. Water Demand Calculation', '9. Average Daily Demand', '10. Maximum Daily Demand',
    '11. Peak Fixture Demand', '12. Water Storage', '13. Tank Sizing',
    '14. Pump Design', '15. Wastewater', '16. Rainwater Harvesting',
    '17. Greywater Reuse', '18. Fire Water', '19. Sustainability',
    '20. Recommendations', '21. Conclusion', 'Appendices',
  ];
  tocItems.forEach((item) => {
    ensureSpace(6);
    doc.setFontSize(10);
    doc.text(item, margin + 5, y);
    y += 5;
  });

  // --- 1. EXECUTIVE SUMMARY ---
  doc.addPage();
  addHeader();
  y = margin + 5;
  addHeading('1. Executive Summary', 1);
  addParagraph(
    `This report presents the preliminary water services design for ${project.projectInfo.projectName}, located at ${project.projectInfo.location}, ${project.projectInfo.country}. ` +
    `The design covers water demand, storage, pumping, wastewater, rainwater harvesting, greywater reuse, and sustainability indicators for a ${project.projectInfo.projectType.toLowerCase()}.`
  );
  if (results.add) {
    addParagraph(`The total design population is ${results.totalPopulation} persons. The calculated Average Daily Demand (ADD) is ${results.add.finalADDm3} m³/day, ` +
      `with a Maximum Daily Demand (MDD) of ${results.mdd?.mddm3 || '—'} m³/day. ` +
      `The estimated peak design flow is ${results.peakFlow?.probablePeakFlow || '—'} L/s.`);
    if (results.storage) addParagraph(`Required domestic storage is ${results.storage.requiredCapacity} m³, split into ${results.storage.undergroundTank} m³ underground and ${results.storage.roofTank} m³ roof tank.`);
    if (results.pump) addParagraph(`The preliminary pump duty is ${results.pump.designFlowM3h} m³/h at ${results.pump.tdh} m TDH, requiring an estimated ${results.pump.motorPower} kW motor.`);
  }

  // --- 2. PROJECT DESCRIPTION ---
  addHeading('2. Project Description', 1);
  addParagraph(`Project: ${project.projectInfo.projectName}`);
  addParagraph(`Type: ${project.projectInfo.projectType} — ${project.projectInfo.buildingType}`);
  addParagraph(`Location: ${project.projectInfo.location}, ${project.projectInfo.district}, ${project.projectInfo.province}, ${project.projectInfo.country}`);
  addParagraph(`Design Stage: ${project.projectInfo.designStage}`);

  // --- 3. SCOPE ---
  addHeading('3. Scope', 1);
  addParagraph('The scope of this preliminary design includes:');
  addParagraph('• Water demand calculation (domestic, special uses, total)\n• Storage sizing and tank dimensioning\n• Pump duty calculation\n• Wastewater generation estimation\n• Rainwater harvesting potential\n• Greywater reuse assessment\n• Fire water requirements (where enabled)\n• Sustainability indicators\n• Engineering recommendations');

  // --- 4. DESIGN BASIS ---
  addHeading('4. Design Basis', 1);
  addParagraph('The design is based on preliminary engineering allowances unless otherwise stated. Consumption rates are NOT claimed to be British Standard requirements unless explicitly verified.');

  // --- 5. STANDARDS ---
  addHeading('5. Standards and References', 1);
  addTable(['ID', 'Standard', 'Application', 'Notes'],
    project.standards.map(s => [s.id, s.reference, s.application, s.notes]));

  // --- 6. ASSUMPTIONS ---
  addHeading('6. Design Assumptions', 1);
  if (results.assumptions.length > 0) {
    addTable(['No.', 'Parameter', 'Value', 'Unit', 'Basis', 'Verification'],
      results.assumptions.map(a => [a.no, a.parameter, a.adoptedValue, a.unit, a.basis, a.verificationRequired ? 'Required' : 'No']));
  }

  // --- 7. OCCUPANCY ---
  addHeading('7. Occupancy', 1);
  addTable(['Group', 'Count', 'Factor (L/p/d)', 'Daily Demand (L/d)', 'Classification'],
    results.occupancy.map(r => [r.group.name, r.group.count, r.group.consumptionFactor, r.dailyDemand.toFixed(2), r.group.classification]));

  // --- 8. WATER DEMAND ---
  addHeading('8. Water Demand Calculation', 1);
  if (results.domestic) {
    addParagraph(`Domestic Water Demand (${results.domestic.method === 'A' ? 'Per-person method' : 'End-use method'}): ${(results.domestic.totalDemand / 1000).toFixed(2)} m³/day`);
  }
  if (results.specialDemand) {
    addTable(['Category', 'Demand (L/day)', 'Demand (m³/day)'],
      results.specialDemand.breakdown.map(b => [b.name, b.value, (b.value / 1000).toFixed(2)]));
  }

  // --- 9. ADD ---
  addHeading('9. Average Daily Demand', 1);
  if (results.add) {
    addParagraph(`Formula: ${results.add.formula}`);
    addParagraph(`Substitution: ${results.add.substitution}`);
    addParagraph(`Final ADD = ${results.add.finalADDm3} m³/day`);
  }

  // --- 10. MDD ---
  addHeading('10. Maximum Daily Demand', 1);
  if (results.mdd) {
    addParagraph(`Formula: ${results.mdd.formula}`);
    addParagraph(`MDD = ${results.mdd.mddm3} m³/day (Factor: ${results.mdd.maxDayFactor})`);
  }

  // --- 11. PEAK FLOW ---
  addHeading('11. Peak Fixture Demand', 1);
  if (results.peakFlow) {
    addParagraph(`Formula: ${results.peakFlow.formula}`);
    addParagraph(`Total Loading Units: ${results.peakFlow.totalFixtureUnits}`);
    addParagraph(`Probable Peak Flow: ${results.peakFlow.probablePeakFlow} L/s (${results.peakFlow.peakFlowM3h} m³/h)`);
    addTable(['Fixture', 'Qty', 'LU', 'Total LU'],
      results.peakFlow.fixtureBreakdown.map(f => [f.type, f.qty, f.fu, f.totalFU]));
  }

  // --- 12. STORAGE ---
  addHeading('12. Water Storage', 1);
  if (results.storage) {
    addParagraph(`Formula: ${results.storage.formula}`);
    addParagraph(`Required Storage: ${results.storage.requiredCapacity} m³`);
    addTable(['Tank', 'Capacity (m³)'],
      [['Underground', results.storage.undergroundTank], ['Roof', results.storage.roofTank],
       ['Ground Level', results.storage.groundTank], ['Elevated', results.storage.elevatedTank]]);
  }

  // --- 13. TANK SIZING ---
  addHeading('13. Tank Sizing', 1);
  addTable(['Tank', 'Shape', 'L×W×D (m)', 'Effective Volume (m³)', 'Required (m³)', 'Status'],
    results.tankDimensions.map(t => [
      t.tank.label, t.tank.shape,
      `${t.tank.length}×${t.tank.width}×${t.tank.effectiveDepth}`,
      t.effectiveVolume, t.tank.requiredCapacity,
      t.status === 'green' ? 'ADEQUATE' : t.status === 'amber' ? 'MARGINAL' : 'INADEQUATE',
    ]));

  // --- 14. PUMP ---
  addHeading('14. Pump Design', 1);
  if (results.pump) {
    addParagraph(`Formula: ${results.pump.formula}`);
    addParagraph(`Design Flow: ${results.pump.designFlow} L/s (${results.pump.designFlowM3h} m³/h)`);
    addParagraph(`TDH: ${results.pump.tdh} m`);
    addParagraph(`Hydraulic Power: ${results.pump.hydraulicPower} kW`);
    addParagraph(`Motor Power: ${results.pump.motorPower} kW`);
  }

  // --- 15. WASTEWATER ---
  addHeading('15. Wastewater', 1);
  if (results.wastewater) {
    addParagraph(`Formula: ${results.wastewater.formula}`);
    addParagraph(`Total Wastewater: ${results.wastewater.wastewaterM3Day} m³/day (${results.wastewater.wastewaterM3Year} m³/year)`);
  }

  // --- 16. RAINWATER ---
  addHeading('16. Rainwater Harvesting', 1);
  if (results.rainwater) {
    addParagraph(`Formula: ${results.rainwater.formula}`);
    addParagraph(`Annual Harvested: ${results.rainwater.annualHarvested} m³/year`);
    addParagraph(`Daily Average: ${(results.rainwater.nonPotableOffset / 1000).toFixed(2)} m³/day`);
  }

  // --- 17. GREYWATER ---
  addHeading('17. Greywater Reuse', 1);
  if (results.greywater) {
    addParagraph(`Generated: ${results.greywater.greywaterGenerated} L/day`);
    addParagraph(`Reusable: ${results.greywater.reusableGreywater} L/day`);
    addParagraph(`Potable Reduction: ${results.greywater.potableReductionPct}%`);
  }

  // --- 18. FIRE WATER ---
  addHeading('18. Fire Water', 1);
  if (results.fireWater) {
    if (!project.fireWater.enabled) {
      addParagraph('Fire water module not enabled. Verify requirements with local fire authority.');
    } else {
      addParagraph(`Fire Flow: ${results.fireWater.fireFlow} L/min`);
      addParagraph(`Duration: ${results.fireWater.fireDuration} hours`);
      addParagraph(`Fire Water Storage: ${results.fireWater.fireWaterStorage} m³`);
    }
  }

  // --- 19. SUSTAINABILITY ---
  addHeading('19. Sustainability', 1);
  if (results.sustainability) {
    addTable(['Indicator', 'Value', 'Unit'],
      [
        ['Potable per Person', results.sustainability.potablePerPerson, 'L/p/d'],
        ['Rainwater Contribution', `${results.sustainability.rainwaterContributionPct}%`, '—'],
        ['Recycled Contribution', `${results.sustainability.recycledContributionPct}%`, '—'],
        ['Total Potable Reduction', `${results.sustainability.potableReductionPct}%`, '—'],
        ['Annual Saving', results.sustainability.annualSaving, 'm³/yr'],
        ['Efficiency Score', results.sustainability.efficiencyScore, '/100'],
      ]);
  }

  // --- 20. RECOMMENDATIONS ---
  addHeading('20. Recommendations', 1);
  results.recommendations.forEach((r) => {
    addParagraph(`[${r.priority}] ${r.text}`);
  });

  // --- 21. CONCLUSION ---
  addHeading('21. Conclusion', 1);
  addParagraph(
    'This preliminary water services design provides a basis for detailed design development. ' +
    'All assumptions must be verified, and the final design must be checked by a suitably qualified professional ' +
    'against the latest applicable regulations, authority requirements, site conditions, and manufacturer data.'
  );

  // --- APPENDICES ---
  doc.addPage();
  addHeader();
  y = margin + 5;
  addHeading('Appendix A — Calculation Register', 1);
  addTable(['ID', 'Section', 'Input', 'Result', 'Source'],
    results.calcRegister.map(c => [c.id, c.section, c.input, c.result, c.source]));

  addHeading('Appendix B — Design Checklist', 1);
  addTable(['Item', 'Status'],
    results.checklist.map(c => [c.text, c.status]));

  // --- FOOTER on all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  doc.save(getFilenames(project).pdf);
}

// ============================================================
// EXCEL EXPORT
// ============================================================

export function exportExcel(project: ProjectData, results: AllResults) {
  const wb = XLSX.utils.book_new();

  const makeSheet = (name: string, data: (string|number)[][]) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
  };

  // 1. Project Information
  makeSheet('Project Information', [
    ['Field', 'Value'],
    ['Project Name', project.projectInfo.projectName],
    ['Client', project.projectInfo.client],
    ['Consultant', project.projectInfo.consultant],
    ['Designer', project.projectInfo.designer],
    ['Location', project.projectInfo.location],
    ['Country', project.projectInfo.country],
    ['Project Type', project.projectInfo.projectType],
    ['Design Stage', project.projectInfo.designStage],
    ['Revision', project.projectInfo.revision],
    ['Date', project.projectInfo.date],
  ]);

  // 2. Design Basis
  makeSheet('Design Basis', [
    ['Parameter', 'Value', 'Unit', 'Source', 'Classification'],
    ...project.occupancy.filter(g => g.count > 0).map(g => [`${g.name} rate`, g.consumptionFactor, g.unit, g.source, g.classification]),
    ['Loss Allowance', '10', '%', 'Engineering assumption', 'Engineering Assumption'],
    ['Future Expansion', project.futureExpansion.percentageGrowth, '%', 'Engineering assumption', 'Engineering Assumption'],
    ['Max Day Factor', '1.5', '—', 'Engineering assumption', 'Engineering Assumption'],
    ['Sewer Return Factor', project.wastewater.sewerReturnFactor, '%', 'Engineering assumption', 'Engineering Assumption'],
  ]);

  // 3. Occupancy
  makeSheet('Occupancy', [
    ['Group', 'Category', 'Count', 'Factor (L/p/d)', 'Daily Demand (L/d)', 'Daily Demand (m³/d)', 'Classification'],
    ...results.occupancy.map(r => [r.group.name, r.group.category, r.group.count, r.group.consumptionFactor, r.dailyDemand, (r.dailyDemand/1000).toFixed(2), r.group.classification]),
    ['', '', '', '', 'TOTAL', (results.occupancy.reduce((s,r) => s + r.dailyDemand, 0) / 1000).toFixed(2), ''],
  ]);

  // 4. Domestic Demand
  if (results.domestic) {
    makeSheet('Domestic Demand', [
      ['Method', results.domestic.method === 'A' ? 'Per-person' : 'End-use breakdown'],
      ['Formula', results.domestic.formula],
      ['Substitution', results.domestic.substitution],
      ['Total Domestic Demand (L/day)', results.domestic.totalDemand],
      ['Total Domestic Demand (m³/day)', (results.domestic.totalDemand/1000).toFixed(2)],
    ]);
  }

  // 5. Special Demand
  if (results.specialDemand) {
    makeSheet('Special Demand', [
      ['Category', 'Demand (L/day)', 'Demand (m³/day)'],
      ...results.specialDemand.breakdown.map(b => [b.name, b.value, (b.value/1000).toFixed(2)]),
      ['TOTAL', results.specialDemand.total, (results.specialDemand.total/1000).toFixed(2)],
    ]);
  }

  // 6. Water Balance
  if (results.waterBalance) {
    makeSheet('Water Balance', [
      ['SOURCES', '', ''],
      ...results.waterBalance.sources.map(s => [s.name, s.value, `${s.pct}%`]),
      ['', '', ''],
      ['CONSUMPTION', '', ''],
      ...results.waterBalance.consumption.map(c => [c.name, c.value, `${c.pct}%`]),
      ['', '', ''],
      ['OUTFLOWS', '', ''],
      ...results.waterBalance.outflows.map(o => [o.name, o.value, `${o.pct}%`]),
    ]);
  }

  // 7. Fixtures
  makeSheet('Fixtures', [
    ['Fixture', 'Quantity', 'Loading Unit', 'Fixture Unit', 'Total LU', 'Design Flow (L/s)', 'Source'],
    ...project.fixtures.filter(f => f.quantity > 0).map(f => [f.type, f.quantity, f.loadingUnit, f.fixtureUnit, f.quantity*f.fixtureUnit, f.designFlow, f.source]),
  ]);

  // 8. Peak Flow
  if (results.peakFlow) {
    makeSheet('Peak Flow', [
      ['Total Loading Units', results.peakFlow.totalFixtureUnits],
      ['Formula', results.peakFlow.formula],
      ['Substitution', results.peakFlow.substitution],
      ['Peak Flow (L/s)', results.peakFlow.probablePeakFlow],
      ['Peak Flow (L/min)', results.peakFlow.peakFlowLpm],
      ['Peak Flow (m³/h)', results.peakFlow.peakFlowM3h],
    ]);
  }

  // 9. Storage
  if (results.storage) {
    makeSheet('Storage', [
      ['Daily Demand (m³/day)', results.storage.dailyDemand],
      ['Storage Duration (days)', project.storage.storageDuration],
      ['Reserve Allowance (%)', project.storage.reserveAllowance],
      ['Formula', results.storage.formula],
      ['Substitution', results.storage.substitution],
      ['Required Capacity (m³)', results.storage.requiredCapacity],
      ['', ''],
      ['Tank', 'Capacity (m³)'],
      ['Underground', results.storage.undergroundTank],
      ['Roof', results.storage.roofTank],
      ['Ground Level', results.storage.groundTank],
      ['Elevated', results.storage.elevatedTank],
    ]);
  }

  // 10. Tanks
  makeSheet('Tanks', [
    ['Tank', 'Type', 'Shape', 'L (m)', 'W (m)', 'D (m)', 'Freeboard (m)', 'Gross Vol (m³)', 'Eff Vol (m³)', 'Required (m³)', 'Surplus/Def (m³)', 'Status'],
    ...results.tankDimensions.map(t => [t.tank.label, t.tank.tankType, t.tank.shape, t.tank.length, t.tank.width, t.tank.effectiveDepth, t.tank.freeboard, t.grossVolume, t.effectiveVolume, t.tank.requiredCapacity, t.surplusDeficiency, t.status === 'green' ? 'ADEQUATE' : t.status === 'amber' ? 'MARGINAL' : 'INADEQUATE']),
  ]);

  // 11. Pumps
  if (results.pump) {
    makeSheet('Pumps', [
      ['Design Flow (L/s)', results.pump.designFlow],
      ['Design Flow (m³/h)', results.pump.designFlowM3h],
      ['TDH (m)', results.pump.tdh],
      ['Hydraulic Power (kW)', results.pump.hydraulicPower],
      ['Motor Power (kW)', results.pump.motorPower],
      ['Arrangement', project.pump.arrangement],
      ['Formula', results.pump.formula],
    ]);
  }

  // 12. Pipework
  makeSheet('Pipework', [
    ['Pipe', 'Material', 'Dia (mm)', 'Length (m)', 'Flow (L/s)', 'Velocity (m/s)', 'Friction Loss (m)', 'Total Loss (m)', 'Residual (m)', 'Warnings'],
    ...results.pipes.map(p => [p.pipe.label, p.pipe.material, p.pipe.internalDiameter, p.pipe.length, p.pipe.flow, p.velocity, p.frictionLoss, p.totalPressureLoss, p.residualPressure, p.warnings.join('; ')]),
  ]);

  // 13. Wastewater
  if (results.wastewater) {
    makeSheet('Wastewater', [
      ['Indoor Demand (L/day)', results.wastewater.indoorDemand],
      ['Sewer Return Factor (%)', project.wastewater.sewerReturnFactor],
      ['Formula', results.wastewater.formula],
      ['Total Wastewater (L/day)', results.wastewater.totalWastewater],
      ['Total Wastewater (m³/day)', results.wastewater.wastewaterM3Day],
      ['Total Wastewater (m³/month)', results.wastewater.wastewaterM3Month],
      ['Total Wastewater (m³/year)', results.wastewater.wastewaterM3Year],
    ]);
  }

  // 14. Rainwater
  if (results.rainwater) {
    makeSheet('Rainwater', [
      ['Roof Area (m²)', project.rainwater.roofArea],
      ['Annual Rainfall (mm)', project.rainwater.annualRainfall],
      ['Runoff Coefficient', project.rainwater.runoffCoefficient],
      ['Filter Efficiency (%)', project.rainwater.filterEfficiency],
      ['Collection Efficiency (%)', project.rainwater.collectionEfficiency],
      ['Formula', results.rainwater.formula],
      ['Annual Harvested (m³/yr)', results.rainwater.annualHarvested],
      ['Daily Average (L/day)', results.rainwater.nonPotableOffset],
      ['', ''],
      ['Month', 'Harvested (m³)'],
      ...['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => [m, results.rainwater!.monthlyHarvested[i] || 0]),
    ]);
  }

  // 15. Greywater
  if (results.greywater) {
    makeSheet('Greywater', [
      ['Generated (L/day)', results.greywater.greywaterGenerated],
      ['Treatment Efficiency (%)', project.greywater.treatmentEfficiency],
      ['Reusable (L/day)', results.greywater.reusableGreywater],
      ['Potable Reduction (L/day)', results.greywater.potableWaterReduction],
      ['Potable Reduction (%)', results.greywater.potableReductionPct],
    ]);
  }

  // 16. Fire Water
  if (results.fireWater) {
    makeSheet('Fire Water', [
      ['Enabled', project.fireWater.enabled ? 'Yes' : 'No'],
      ['Hazard Classification', project.fireWater.hazardClassification],
      ['Fire Flow (L/min)', results.fireWater.fireFlow],
      ['Duration (hours)', results.fireWater.fireDuration],
      ['Fire Water Storage (m³)', results.fireWater.fireWaterStorage],
    ]);
  }

  // 17. Sustainability
  if (results.sustainability) {
    makeSheet('Sustainability', [
      ['Indicator', 'Value', 'Unit'],
      ['Potable per Person', results.sustainability.potablePerPerson, 'L/p/d'],
      ['Rainwater Contribution', results.sustainability.rainwaterContributionPct, '%'],
      ['Recycled Contribution', results.sustainability.recycledContributionPct, '%'],
      ['Potable Reduction', results.sustainability.potableReductionPct, '%'],
      ['Annual Saving', results.sustainability.annualSaving, 'm³/yr'],
      ['Wastewater Reuse', results.sustainability.wastewaterReusePct, '%'],
      ['Annual Utility', results.sustainability.annualUtilityConsumption, 'm³/yr'],
      ['Efficiency Score', results.sustainability.efficiencyScore, '/100'],
    ]);
  }

  // 18. Calculation Register
  makeSheet('Calc Register', [
    ['ID', 'Section', 'Input', 'Value', 'Unit', 'Factor', 'Source', 'Formula', 'Result', 'Status'],
    ...results.calcRegister.map(c => [c.id, c.section, c.input, c.value, c.unit, c.factor, c.source, c.formula, c.result, c.status]),
  ]);

  // 19. Assumption Register
  makeSheet('Assumptions', [
    ['No.', 'Parameter', 'Value', 'Unit', 'Basis', 'Reference', 'Verification', 'Remarks'],
    ...results.assumptions.map(a => [a.no, a.parameter, a.adoptedValue, a.unit, a.basis, a.reference, a.verificationRequired ? 'Required' : 'No', a.remarks]),
  ]);

  // 20. Standards Register
  makeSheet('Standards', [
    ['ID', 'Standard', 'Title', 'Application', 'Section Used', 'Notes'],
    ...project.standards.map(s => [s.id, s.reference, s.title, s.application, s.sectionUsed, s.notes]),
  ]);

  // 21. Design Checklist
  makeSheet('Checklist', [
    ['Item', 'Status'],
    ...results.checklist.map(c => [c.text, c.status]),
  ]);

  XLSX.writeFile(wb, getFilenames(project).xlsx);
}

// ============================================================
// WORD EXPORT
// ============================================================

export async function exportWord(project: ProjectData, results: AllResults) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  const makeTable = (headers: string[], rows: (string|number)[][]) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(h => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })], shading: { fill: '1E40AF' } })],
            borders: cellBorders,
          })),
        }),
        ...rows.map(r => new TableRow({
          children: r.map(c => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 18 })] })],
            borders: cellBorders,
          })),
        })),
      ],
    });
  };

  const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
    new Paragraph({ text, heading: level });

  const para = (text: string) => new Paragraph({ children: [new TextRun({ text, size: 20 })] });

  const sections: (Paragraph | Table)[] = [];

  // COVER
  sections.push(new Paragraph({ children: [], spacing: { before: 2000 } }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Water Services Design Report', bold: true, size: 48, color: '1E40AF' })],
  }));
  sections.push(new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: project.projectInfo.projectName, size: 32 })],
  }));
  sections.push(new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `${project.projectInfo.location}, ${project.projectInfo.country}`, size: 24 })],
  }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Revision ${project.projectInfo.revision} — ${project.projectInfo.date}`, size: 20 })],
  }));
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // Document Control
  sections.push(heading('Document Control', HeadingLevel.HEADING_1));
  sections.push(makeTable(['Rev', 'Date', 'Description', 'Prepared By', 'Checked By'],
    [[project.projectInfo.revision, project.projectInfo.date, 'Preliminary design', project.projectInfo.preparedBy, project.projectInfo.checkedBy]]));

  // Executive Summary
  sections.push(heading('1. Executive Summary', HeadingLevel.HEADING_1));
  sections.push(para(`This report presents the preliminary water services design for ${project.projectInfo.projectName}, located at ${project.projectInfo.location}, ${project.projectInfo.country}.`));
  if (results.add) {
    sections.push(para(`Total design population: ${results.totalPopulation} persons.`));
    sections.push(para(`Average Daily Demand: ${results.add.finalADDm3} m³/day.`));
    if (results.mdd) sections.push(para(`Maximum Daily Demand: ${results.mdd.mddm3} m³/day.`));
    if (results.peakFlow) sections.push(para(`Peak Design Flow: ${results.peakFlow.probablePeakFlow} L/s.`));
    if (results.storage) sections.push(para(`Required Storage: ${results.storage.requiredCapacity} m³.`));
    if (results.pump) sections.push(para(`Pump Duty: ${results.pump.designFlowM3h} m³/h @ ${results.pump.tdh} m TDH.`));
  }

  // Project Description
  sections.push(heading('2. Project Description', HeadingLevel.HEADING_1));
  sections.push(para(`Project: ${project.projectInfo.projectName}`));
  sections.push(para(`Type: ${project.projectInfo.projectType} — ${project.projectInfo.buildingType}`));
  sections.push(para(`Location: ${project.projectInfo.location}, ${project.projectInfo.country}`));

  // Scope
  sections.push(heading('3. Scope', HeadingLevel.HEADING_1));
  sections.push(para('This preliminary design covers water demand, storage, pumping, wastewater, rainwater harvesting, greywater reuse, fire water, and sustainability indicators.'));

  // Standards
  sections.push(heading('4. Standards and References', HeadingLevel.HEADING_1));
  sections.push(makeTable(['ID', 'Standard', 'Application', 'Notes'],
    project.standards.map(s => [s.id, s.reference, s.application, s.notes])));

  // Assumptions
  sections.push(heading('5. Design Assumptions', HeadingLevel.HEADING_1));
  if (results.assumptions.length > 0) {
    sections.push(makeTable(['No.', 'Parameter', 'Value', 'Unit', 'Basis', 'Verification'],
      results.assumptions.map(a => [a.no, a.parameter, a.adoptedValue, a.unit, a.basis, a.verificationRequired ? 'Required' : 'No'])));
  }

  // Occupancy
  sections.push(heading('6. Occupancy', HeadingLevel.HEADING_1));
  sections.push(makeTable(['Group', 'Count', 'Factor', 'Daily Demand (L/d)', 'Classification'],
    results.occupancy.map(r => [r.group.name, r.group.count, r.group.consumptionFactor, r.dailyDemand.toFixed(0), r.group.classification])));

  // Water Demand
  sections.push(heading('7. Water Demand Calculation', HeadingLevel.HEADING_1));
  if (results.specialDemand) {
    sections.push(makeTable(['Category', 'Demand (L/d)', 'Demand (m³/d)'],
      results.specialDemand.breakdown.map(b => [b.name, b.value, (b.value/1000).toFixed(2)])));
  }

  // ADD
  sections.push(heading('8. Average Daily Demand', HeadingLevel.HEADING_1));
  if (results.add) {
    sections.push(para(`Formula: ${results.add.formula}`));
    sections.push(para(`Substitution: ${results.add.substitution}`));
    sections.push(para(`Final ADD = ${results.add.finalADDm3} m³/day`));
  }

  // MDD
  sections.push(heading('9. Maximum Daily Demand', HeadingLevel.HEADING_1));
  if (results.mdd) sections.push(para(`MDD = ${results.mdd.mddm3} m³/day (Factor: ${results.mdd.maxDayFactor})`));

  // Peak Flow
  sections.push(heading('10. Peak Fixture Demand', HeadingLevel.HEADING_1));
  if (results.peakFlow) {
    sections.push(para(`Formula: ${results.peakFlow.formula}`));
    sections.push(para(`Peak Flow: ${results.peakFlow.probablePeakFlow} L/s (${results.peakFlow.peakFlowM3h} m³/h)`));
    sections.push(makeTable(['Fixture', 'Qty', 'LU', 'Total LU'],
      results.peakFlow.fixtureBreakdown.map(f => [f.type, f.qty, f.fu, f.totalFU])));
  }

  // Storage
  sections.push(heading('11. Water Storage', HeadingLevel.HEADING_1));
  if (results.storage) {
    sections.push(para(`Required Storage: ${results.storage.requiredCapacity} m³`));
    sections.push(makeTable(['Tank', 'Capacity (m³)'],
      [['Underground', results.storage.undergroundTank], ['Roof', results.storage.roofTank]]));
  }

  // Tank Sizing
  sections.push(heading('12. Tank Sizing', HeadingLevel.HEADING_1));
  sections.push(makeTable(['Tank', 'Dimensions (m)', 'Effective Vol (m³)', 'Required (m³)', 'Status'],
    results.tankDimensions.map(t => [t.tank.label, `${t.tank.length}×${t.tank.width}×${t.tank.effectiveDepth}`, t.effectiveVolume, t.tank.requiredCapacity, t.status === 'green' ? 'ADEQUATE' : t.status === 'amber' ? 'MARGINAL' : 'INADEQUATE'])));

  // Pump
  sections.push(heading('13. Pump Design', HeadingLevel.HEADING_1));
  if (results.pump) {
    sections.push(para(`Design Flow: ${results.pump.designFlow} L/s (${results.pump.designFlowM3h} m³/h)`));
    sections.push(para(`TDH: ${results.pump.tdh} m`));
    sections.push(para(`Motor Power: ${results.pump.motorPower} kW`));
  }

  // Wastewater
  sections.push(heading('14. Wastewater', HeadingLevel.HEADING_1));
  if (results.wastewater) {
    sections.push(para(`Total Wastewater: ${results.wastewater.wastewaterM3Day} m³/day (${results.wastewater.wastewaterM3Year} m³/year)`));
  }

  // Rainwater
  sections.push(heading('15. Rainwater Harvesting', HeadingLevel.HEADING_1));
  if (results.rainwater) {
    sections.push(para(`Annual Harvested: ${results.rainwater.annualHarvested} m³/year`));
  }

  // Greywater
  sections.push(heading('16. Greywater Reuse', HeadingLevel.HEADING_1));
  if (results.greywater) {
    sections.push(para(`Reusable Greywater: ${results.greywater.reusableGreywater} L/day`));
    sections.push(para(`Potable Reduction: ${results.greywater.potableReductionPct}%`));
  }

  // Fire Water
  sections.push(heading('17. Fire Water', HeadingLevel.HEADING_1));
  if (results.fireWater) {
    sections.push(para(project.fireWater.enabled
      ? `Fire Water Storage: ${results.fireWater.fireWaterStorage} m³`
      : 'Fire water module not enabled. Verify with local fire authority.'));
  }

  // Sustainability
  sections.push(heading('18. Sustainability', HeadingLevel.HEADING_1));
  if (results.sustainability) {
    sections.push(makeTable(['Indicator', 'Value', 'Unit'],
      [
        ['Potable per Person', results.sustainability.potablePerPerson, 'L/p/d'],
        ['Potable Reduction', `${results.sustainability.potableReductionPct}%`, '—'],
        ['Efficiency Score', results.sustainability.efficiencyScore, '/100'],
      ]));
  }

  // Recommendations
  sections.push(heading('19. Recommendations', HeadingLevel.HEADING_1));
  results.recommendations.forEach(r => sections.push(para(`[${r.priority}] ${r.text}`)));

  // Conclusion
  sections.push(heading('20. Conclusion', HeadingLevel.HEADING_1));
  sections.push(para('This preliminary design provides a basis for detailed design. All assumptions must be verified, and the final design must be checked by a suitably qualified professional against the latest applicable regulations and manufacturer data.'));

  // Appendices
  sections.push(new Paragraph({ children: [new PageBreak()] }));
  sections.push(heading('Appendix A — Calculation Register', HeadingLevel.HEADING_1));
  sections.push(makeTable(['ID', 'Section', 'Input', 'Result', 'Source'],
    results.calcRegister.map(c => [c.id, c.section, c.input, c.result, c.source])));

  sections.push(heading('Appendix B — Design Checklist', HeadingLevel.HEADING_1));
  sections.push(makeTable(['Item', 'Status'],
    results.checklist.map(c => [c.text, c.status])));

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, getFilenames(project).docx);
}
