import type { ProjectData, AllResults } from '@/types';

export const REPORT_CONTENTS = [
  { title: 'Executive Summary', sheet: 'Executive Summary' },
  { title: 'Project Description', sheet: 'Project Information' },
  { title: 'Scope', sheet: 'Project Information' },
  { title: 'Design Basis', sheet: 'Design Basis' },
  { title: 'Standards and References', sheet: 'Standards Register' },
  { title: 'Design Assumptions', sheet: 'Assumptions' },
  { title: 'Occupancy', sheet: 'Occupancy' },
  { title: 'Water Demand Calculation', sheet: 'Domestic Demand' },
  { title: 'Average Daily Demand', sheet: 'Executive Summary' },
  { title: 'Maximum Daily Demand', sheet: 'Executive Summary' },
  { title: 'Peak Fixture Demand', sheet: 'Peak Flow' },
  { title: 'Water Storage', sheet: 'Storage' },
  { title: 'Tank Sizing', sheet: 'Tanks' },
  { title: 'Pump Design', sheet: 'Pumps' },
  { title: 'Pipework Design', sheet: 'Pipework' },
  { title: 'Wastewater', sheet: 'Wastewater' },
  { title: 'Rainwater Harvesting', sheet: 'Rainwater' },
  { title: 'Greywater Reuse', sheet: 'Greywater' },
  { title: 'Fire Water', sheet: 'Fire Water' },
  { title: 'Sustainability', sheet: 'Sustainability' },
  { title: 'Recommendations', sheet: 'Issues and Actions' },
  { title: 'Design Risks and Missing Information', sheet: 'Issues and Actions' },
  { title: 'Conclusion', sheet: 'Issues and Actions' },
  { title: 'Appendices', sheet: 'Calc Register' },
] as const;

export const REPORT_DISCLAIMER = 'Preliminary design support only. Values and references require review by a suitably qualified engineer. Verify current applicable standards, authority requirements, site conditions, and manufacturer data before construction. This report does not certify compliance or approval.';

export interface ReportTable { title: string; headers: string[]; rows: (string | number)[][]; }

export function makeReportPackage(project: ProjectData, results: AllResults) {
  const info = project.projectInfo;
  const references: ReportTable = {
    title: 'Standards and Design References',
    headers: ['ID', 'Reference as entered', 'Title as entered', 'Stated application', 'Section', 'Notes supplied', 'Verification status'],
    rows: project.standards.length
      ? project.standards.map((item) => [item.id, item.reference, item.title, item.application, item.sectionUsed, item.notes, 'Project-listed; verify edition, applicability, and clauses'])
      : [['—', 'No references entered', '—', '—', '—', '—', 'No standard claim made']],
  };

  const summaryRows: (string | number)[][] = [
    ['Population', 'Total design population', results.totalPopulation, 'persons', 'Calculated from project occupancy inputs', 'Preliminary result'],
    ['Water demand', 'Average daily demand (ADD)', results.add?.finalADDm3 ?? 'Not available', 'm³/day', results.add ? 'Application calculation result' : 'Demand result unavailable', 'Preliminary result'],
    ['Water demand', 'Maximum daily demand (MDD)', results.mdd?.mddm3 ?? 'Not available', 'm³/day', results.mdd ? 'Application calculation result' : 'Demand result unavailable', 'Preliminary result'],
    ['Peak flow', 'Peak simultaneous flow', results.peakFlow?.probablePeakFlow ?? 'Not available', 'L/s', project.peakDesign.source || 'No verified source recorded', project.peakDesign.verified ? 'User-confirmed; professional review required' : 'Unverified - review required'],
    ['Water supply', 'Registered source capacity', Number(((results.waterBalance?.configuredSourceCapacity ?? 0) / 1000).toFixed(2)), 'm³/day', 'Sum of registered project source inputs', 'Verify source yield'],
    ['Water supply', 'Source capacity shortfall', Number(((results.waterBalance?.sourceCapacityShortfall ?? 0) / 1000).toFixed(2)), 'm³/day', 'Application water-balance result', 'Preliminary result'],
    ['Storage', 'Required domestic storage', results.storage?.requiredCapacity ?? 'Not available', 'm³', results.storage ? 'Application storage result' : 'Storage result unavailable', 'Preliminary result'],
    ['Storage', 'Recorded usable tank inventory', results.storage?.totalUsableCapacity ?? 'Not available', 'm³', results.storage ? 'Existing and proposed project tank records' : 'Storage inventory unavailable', 'Confirm tank volume and location'],
    ['Pumping', 'Pump duty', results.pump ? `${results.pump.designFlowM3h} m³/h at ${results.pump.tdh} m` : 'Not available', 'm³/h; m', results.pump ? 'Application pump result' : 'Pump result unavailable', 'Verify against manufacturer data'],
  ];
  const summary: ReportTable = {
    title: 'Executive Summary',
    headers: ['Topic', 'Measure', 'Result', 'Source and review status'],
    rows: summaryRows.map(([topic, measure, value, unit, source, status]) => [topic, measure, `${value} ${unit}`, `${source}; ${status}`]),
  };

  const actions: ReportTable = {
    title: 'Issues, Decisions and Actions',
    headers: ['Severity', 'Application section', 'Issue', 'Current value', 'Reference value', 'Why it matters', 'Recommended action'],
    rows: results.warnings.length
      ? results.warnings.map((warning) => [
          warning.level === 'critical' ? 'Blocking' : warning.level === 'warning' ? 'Warning' : warning.level === 'info' ? 'Information' : 'Advisory',
          warning.section, warning.message, warning.currentValue ?? '—', warning.referenceValue ?? '—', warning.whyItMatters ?? '—',
          warning.recommendedAction ?? 'Review the related project inputs and confirm the design basis with the responsible engineer.',
        ])
      : [['Information', 'Review', 'No application issues are currently listed', '—', '—', '—', 'Review all project inputs before issue']],
  };

  const assumptions: ReportTable = {
    title: 'Design Assumptions and Input Provenance',
    headers: ['No.', 'Parameter', 'Adopted value', 'Unit', 'Basis supplied', 'Reference supplied', 'Verification', 'Remarks'],
    rows: results.assumptions.length
      ? results.assumptions.map((item) => [item.no, item.parameter, item.adoptedValue, item.unit, item.basis, item.reference || '—', item.verificationRequired ? 'Required' : 'Not flagged by application', item.remarks || '—'])
      : [['—', 'No calculated assumptions listed', '—', '—', '—', '—', 'Review design inputs', '—']],
  };

  const documentControl: ReportTable = {
    title: 'Document Control',
    headers: ['Document field', 'Value', 'Source / status'],
    rows: [
      ['Project', info.projectName || 'Not entered', 'Project record'],
      ['Project number', info.projectNumber || 'Not entered', 'Project record'],
      ['Report number', info.reportNumber || 'Not entered', 'Project record'],
      ['Revision', info.revision || 'P01', 'Project record'],
      ['Date', info.date || 'Not entered', 'Project record'],
      ['Status', 'Preliminary design - verification required', 'Report status'],
      ['Prepared by', info.preparedBy || 'Not entered', 'Project record'],
      ['Checked by', info.checkedBy || 'Not entered', 'Project record'],
      ['Approved by', info.approvedBy || 'Not entered', 'Project record'],
    ],
  };

  const context: ReportTable = {
    title: 'Project Description and Design Basis',
    headers: ['Field', 'Project data', 'Source / status'],
    rows: [
      ['Client', info.client || 'Not entered', 'Project record'],
      ['Consultant', info.consultant || 'Not entered', 'Project record'],
      ['Designer', info.designer || 'Not entered', 'Project record'],
      ['Location', [info.location, info.district, info.province, info.country].filter(Boolean).join(', ') || 'Not entered', 'Project record'],
      ['Building', `${info.buildingType} (${info.projectType})`, 'Project record'],
      ['Design stage', info.designStage, 'Project record'],
      ['Demand basis', project.demandBasis.source || 'Not entered', 'Project record; verify before design use'],
    ],
  };

  const occupancyChart = results.occupancy
    .filter((row) => row.dailyDemand > 0)
    .map((row) => ({ name: row.group.name, dailyDemandL: row.dailyDemand }));

  return { documentControl, context, summary, summaryRows, references, actions, assumptions, occupancyChart, disclaimer: REPORT_DISCLAIMER };
}

export function bookmarkFor(title: string) {
  return `section_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}
