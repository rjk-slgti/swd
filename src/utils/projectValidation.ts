import { createSampleProject } from '@/data/defaults';
import type { ProjectData } from '@/types';

/** Reconstruct known fields only. Reject malformed values before calculation. */
export function parseProject(value: unknown): ProjectData {
  if (!value || typeof value !== 'object' || !('projectInfo' in value) || !('occupancy' in value)) throw new Error('This is not a water services project file.');
  const defaults = createSampleProject();
  const optional = new Set([
    'demandBasis', 'peakDesign', 'useOccupancyRates', 'wcFlushingDemand',
    'inletHead', 'hazenWilliamsC', 'maxVelocity', 'projectNumber', 'departmentDemand', 'waterSources', 'storageAssets',
    'hotWater', 'subMetering', 'wpsfFactors', 'factorOverrides', 'wpsfVersion', 'advancedDesign',
    'lossMethod', 'roughnessMm', 'minorLossK', 'fromNode', 'toNode', 'minimumVelocity',
  ]);
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
      if (template.length === 0) return input;
      return input.map((item, index) => walk(item, template[0], `${path}.${index}`));
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`${path}: missing project section.`);
    const obj = Object.fromEntries(
      Object.entries(template as object).map(([field, example]) => [
        field,
        walk((input as Record<string, unknown>)[field], example, path ? `${path}.${field}` : field),
      ])
    );
    if ((input as Record<string, unknown>).overrideDetails && typeof (input as Record<string, unknown>).overrideDetails === 'object') {
      obj.overrideDetails = structuredClone((input as Record<string, unknown>).overrideDetails);
    }
    return obj;
  }
  const result = walk(value, defaults, '') as ProjectData;
  const advanced = result.advancedDesign;
  if (advanced) {
    const sd = advanced.stochasticDemand, pc = advanced.pumpCurve, rw = advanced.rainwaterDaily, hw = advanced.hotWaterRecirculation;
    if (!Number.isInteger(sd.days) || sd.days < 1 || sd.days > 3650 || !Number.isInteger(sd.seed) || sd.seed < 1 || !Number.isInteger(sd.intervalSeconds) || sd.intervalSeconds < 1 || sd.intervalSeconds > 3600 || sd.days * Math.ceil(86400 / sd.intervalSeconds) > 5_000_000 || sd.profiles.length > 1000 || sd.profiles.some(p => !p || typeof p.fixtureType !== 'string' || !p.fixtureType.trim() || ![p.usesPerDay,p.flowLps,p.durationSeconds].every(Number.isFinite) || p.usesPerDay < 0 || p.usesPerDay > 10000 || p.flowLps < 0 || p.durationSeconds < 0 || p.durationSeconds > 86400) || sd.profiles.reduce((sum, p) => sum + p.usesPerDay * sd.days, 0) > 2_000_000) throw new Error('Invalid fixture simulation settings.');
    if (pc.points.length > 200 || pc.points.some(p => !p || ![p.flowLps,p.headM].every(Number.isFinite) || p.flowLps < 0 || p.headM < 0) || pc.siteElevationM > 9000 || pc.waterTemperatureC > 100) throw new Error('Invalid pump curve or suction check settings.');
    if (rw.dailyRainfallMm.length > 3660 || rw.dailyRainfallMm.some(v => !Number.isFinite(v) || v < 0) || rw.tankSizesM3.some(v => !Number.isFinite(v) || v < 0)) throw new Error('Invalid daily rainfall series or tank-size sweep.');
    if (hw.recoveryHours > 24 || advanced.networkTerminalDemands.length > 1000 || advanced.networkTerminalDemands.some(d => !d || typeof d.node !== 'string' || !d.node.trim() || !Number.isFinite(d.flowLps) || d.flowLps < 0) || !advanced.networkSourceNode.trim() || advanced.regionalDefaults.length > 1000) throw new Error('Invalid advanced network, hot-water or regional register settings.');
  }
  if (!['A','B'].includes(result.domesticWater.method) || !['learning','professional'].includes(result.designMode)) throw new Error('Invalid calculation or display mode.');
  if (result.occupancy.some(g => g.daysPerWeek > 7) || result.departmentDemand.departments.some(d => d.operatingDaysPerWeek > 7)) throw new Error('Operating days per week cannot exceed 7.');
  if (result.waterSources.some(s => !['NWSDB','Tube Well','Rainwater Harvesting','Other'].includes(s.type) || !['Existing','Proposed'].includes(s.status))) throw new Error('Invalid water source type or status.');
  if (result.storageAssets.some(a => !['Existing','Proposed'].includes(a.status) || !['Underground','Ground Level','Roof','Elevated'].includes(a.tankType))) throw new Error('Invalid tank type or status.');
  if (result.pipes.some(pipe => pipe.lossMethod !== 'Hazen-Williams' && pipe.lossMethod !== 'Darcy-Weisbach')) throw new Error('Invalid pipe friction method.');
  return result;
}
