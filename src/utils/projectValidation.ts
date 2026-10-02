import { createSampleProject } from '@/data/defaults';
import type { ProjectData } from '@/types';

/** Reconstruct known fields only. Reject malformed values before calculation. */
export function parseProject(value: unknown): ProjectData {
  if (!value || typeof value !== 'object' || !('projectInfo' in value) || !('occupancy' in value)) throw new Error('This is not a water services project file.');
  const defaults = createSampleProject();
  const optional = new Set(['demandBasis', 'peakDesign', 'useOccupancyRates', 'wcFlushingDemand', 'inletHead', 'hazenWilliamsC', 'maxVelocity']);
  function walk(input: unknown, template: unknown, path: string): unknown {
    const key = path.split('.').pop() ?? '';
    if (input === undefined && optional.has(key)) return structuredClone(template);
    if (typeof template === 'number') {
      if (typeof input !== 'number' || !Number.isFinite(input) || Math.abs(input) > 1e9) throw new Error(`${path}: enter a finite number within the supported range.`);
      if (input < 0 && !['elevationDifference', 'seasonalAdjustment', 'suctionHead'].includes(key)) throw new Error(`${path}: negative values are not allowed.`);
      if ((/Pct$|Efficiency$/.test(key) || ['sewerReturnFactor','reserveAllowance','operationalReserve','safetyMargin'].includes(key)) && input > 100) throw new Error(`${path}: percentage cannot exceed 100.`);
      if (key === 'runoffCoefficient' && input > 1) throw new Error(`${path}: coefficient must be 0–1.`);
      return input;
    }
    if (typeof template === 'string' || typeof template === 'boolean') {
      if (typeof input !== typeof template) throw new Error(`${path}: invalid field type.`);
      return input;
    }
    if (Array.isArray(template)) {
      if (!Array.isArray(input) || input.length > 10000) throw new Error(`${path}: invalid list.`);
      if (key === 'monthlyRainfall' && input.length !== 12) throw new Error('Rainfall must contain 12 months.');
      return input.map((item, index) => walk(item, template[0], `${path}.${index}`));
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`${path}: missing project section.`);
    return Object.fromEntries(Object.entries(template as object).map(([field, example]) => [field, walk((input as Record<string, unknown>)[field], example, path ? `${path}.${field}` : field)]));
  }
  const result = walk(value, defaults, '') as ProjectData;
  if (!['A','B'].includes(result.domesticWater.method) || !['learning','professional'].includes(result.designMode)) throw new Error('Invalid calculation or display mode.');
  return result;
}
