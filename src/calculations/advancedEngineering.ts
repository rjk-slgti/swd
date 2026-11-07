export interface StochasticFixtureProfile { fixtureType: string; usesPerDay: number; flowLps: number; durationSeconds: number }

const makeRandom = (seed: number) => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

/** Open, user-parameterized event simulation. It is an educational estimate, not code-certified. */
export function simulateFixtureDemand(profiles: StochasticFixtureProfile[], days: number, seed: number, intervalSeconds = 60) {
  if (!Number.isInteger(days) || days < 1 || days > 3650 || !Number.isInteger(intervalSeconds) || intervalSeconds < 1 || intervalSeconds > 3600) throw new Error('Simulation days and interval must be within supported limits.');
  if (days * Math.ceil(86400 / intervalSeconds) > 5_000_000 || profiles.reduce((sum, p) => sum + p.usesPerDay * days, 0) > 2_000_000) throw new Error('Reduce the simulation days or event count, or increase the interval.');
  if (profiles.some(p => p.usesPerDay < 0 || p.usesPerDay > 10000 || p.flowLps < 0 || p.durationSeconds < 0 || p.durationSeconds > 86400 || ![p.usesPerDay, p.flowLps, p.durationSeconds].every(Number.isFinite))) throw new Error('Fixture event inputs must be finite and within supported limits.');
  const random = makeRandom(seed);
  const slotCount = Math.ceil(86400 / intervalSeconds);
  const dailyPeaksLps: number[] = [];
  for (let day = 0; day < days; day++) {
    const demand = new Float64Array(slotCount);
    for (const profile of profiles) {
      const events = Math.round(profile.usesPerDay);
      const activeSlots = Math.max(1, Math.ceil(profile.durationSeconds / intervalSeconds));
      for (let i = 0; i < events; i++) {
        const start = Math.floor(random() * slotCount);
        for (let j = 0; j < activeSlots && j < slotCount; j++) demand[(start + j) % slotCount] += profile.flowLps;
      }
    }
    let peak = 0;
    for (const flow of demand) if (flow > peak) peak = flow;
    dailyPeaksLps.push(peak);
  }
  dailyPeaksLps.sort((a, b) => a - b);
  const percentile = (p: number) => dailyPeaksLps[Math.max(0, Math.ceil(p * days) - 1)];
  return { simulatedDays: days, seed, intervalSeconds, percentile50Lps: percentile(0.5), percentile95Lps: percentile(0.95), maximumLps: dailyPeaksLps[dailyPeaksLps.length - 1] ?? 0, disclaimer: 'TRAINING ESTIMATE — not code-certified; do not use as a final design flow.' };
}

/** Darcy–Weisbach with Swamee–Jain turbulent friction factor and explicit minor-loss K. */
export function calculateDarcyWeisbach(flowLps: number, diameterMm: number, lengthM: number, roughnessMm: number, minorLossK = 0) {
  if (![flowLps, diameterMm, lengthM, roughnessMm, minorLossK].every(Number.isFinite) || flowLps < 0 || diameterMm <= 0 || lengthM < 0 || roughnessMm < 0 || minorLossK < 0) throw new Error('Pipe inputs must be finite; flow, length, roughness and K cannot be negative, and diameter must be positive.');
  const q = flowLps / 1000;
  const d = diameterMm / 1000;
  const area = Math.PI * d * d / 4;
  const velocity = q / area;
  const reynolds = velocity * d / 1.004e-6;
  const relativeRoughness = roughnessMm / diameterMm;
  const frictionFactor = reynolds <= 0 ? 0 : reynolds < 2300 ? 64 / reynolds : 0.25 / Math.log10(relativeRoughness / 3.7 + 5.74 / reynolds ** 0.9) ** 2;
  const velocityHead = velocity * velocity / (2 * 9.80665);
  const frictionLossM = frictionFactor * (lengthM / d) * velocityHead;
  return { velocityMps: velocity, reynolds, frictionFactor, frictionLossM, minorLossM: minorLossK * velocityHead, totalLossM: frictionLossM + minorLossK * velocityHead };
}

export interface HydraulicEdge { id: string; from: string; to: string; lossM: number }

/** Finds the lowest-loss path from a supply node to each terminal node in a specified network graph. */
export function findLowestLossPaths(edges: HydraulicEdge[], source: string) {
  if (edges.some(e => !Number.isFinite(e.lossM) || e.lossM < 0)) throw new Error('Network head losses must be finite and non-negative.');
  const nodes = new Set(edges.flatMap(e => [e.from, e.to]));
  const distance = new Map<string, number>([[source, 0]]);
  const previous = new Map<string, HydraulicEdge>();
  const pending = new Set(nodes);
  while (pending.size) {
    let current: string | undefined;
    for (const node of pending) if (current === undefined || (distance.get(node) ?? Infinity) < (distance.get(current) ?? Infinity)) current = node;
    if (current === undefined || !Number.isFinite(distance.get(current) ?? Infinity)) break;
    pending.delete(current);
    for (const edge of edges.filter(e => e.from === current)) {
      const candidate = (distance.get(current) ?? 0) + edge.lossM;
      if (candidate < (distance.get(edge.to) ?? Infinity)) { distance.set(edge.to, candidate); previous.set(edge.to, edge); }
    }
  }
  return [...nodes].filter(node => node !== source && distance.has(node)).map(node => {
    const path: string[] = []; let cursor = node;
    while (cursor !== source) { const edge = previous.get(cursor); if (!edge) break; path.unshift(edge.id); cursor = edge.from; }
    return { node, headLossM: distance.get(node) ?? 0, edgeIds: path };
  });
}

/** Back-calculates terminal demand through a directed tree; rejects loops and merged-flow loops. */
export function solveTreeBranchFlows(edges: { id: string; from: string; to: string }[], terminalDemands: { node: string; flowLps: number }[], source: string) {
  if (edges.some(e => !e.id || !e.from || !e.to || e.from === e.to) || terminalDemands.some(d => !d.node || !Number.isFinite(d.flowLps) || d.flowLps < 0)) throw new Error('Branch network entries are invalid.');
  const incoming = new Map<string, string>();
  for (const edge of edges) {
    if (incoming.has(edge.to)) throw new Error('This branch flow screen supports tree networks only; a node has multiple upstream reaches.');
    incoming.set(edge.to, edge.id);
  }
  const demandByNode = new Map<string, number>();
  for (const demand of terminalDemands) demandByNode.set(demand.node, (demandByNode.get(demand.node) ?? 0) + demand.flowLps);
  const flows = new Map<string, number>();
  const visiting = new Set<string>();
  const accumulate = (node: string): number => {
    if (visiting.has(node)) throw new Error('Network contains a cycle.');
    visiting.add(node);
    let total = demandByNode.get(node) ?? 0;
    for (const edge of edges.filter(e => e.from === node)) total += accumulate(edge.to);
    visiting.delete(node);
    const parentId = incoming.get(node);
    if (parentId) flows.set(parentId, total);
    return total;
  };
  const totalDemandLps = accumulate(source);
  const reachable = new Set<string>([source]);
  const queue = [source];
  while (queue.length) {
    const node = queue.shift()!;
    for (const edge of edges) if (edge.from === node && !reachable.has(edge.to)) { reachable.add(edge.to); queue.push(edge.to); }
  }
  if (edges.some(edge => !reachable.has(edge.from) || !reachable.has(edge.to))) throw new Error('Every reach must connect to the selected source tree.');
  if (terminalDemands.some(d => !reachable.has(d.node))) throw new Error('Every terminal demand must connect to the selected source node.');
  return { totalDemandLps, edgeFlows: edges.map(edge => ({ edgeId: edge.id, flowLps: flows.get(edge.id) ?? 0 })) };
}

export function findPumpDutyPoint(points: { flowLps: number; headM: number }[], staticHeadM: number, frictionAtDesignFlowM: number, designFlowLps: number) {
  if (points.length < 2 || points.some(p => !Number.isFinite(p.flowLps) || !Number.isFinite(p.headM) || p.flowLps < 0 || p.headM < 0) || staticHeadM < 0 || frictionAtDesignFlowM < 0 || designFlowLps <= 0) return null;
  const curve = [...points].sort((a, b) => a.flowLps - b.flowLps);
  const systemHead = (q: number) => staticHeadM + frictionAtDesignFlowM * (q / designFlowLps) ** 2;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i], b = curve[i + 1];
    const deltaA = a.headM - systemHead(a.flowLps), deltaB = b.headM - systemHead(b.flowLps);
    if (deltaA === 0) return { flowLps: a.flowLps, headM: a.headM };
    if ((deltaA > 0) === (deltaB > 0)) continue;
    let lo = a.flowLps, hi = b.flowLps;
    for (let j = 0; j < 40; j++) {
      const mid = (lo + hi) / 2;
      const pumpHead = a.headM + (b.headM - a.headM) * (mid - a.flowLps) / (b.flowLps - a.flowLps);
      const diff = pumpHead - systemHead(mid);
      if ((diff > 0) === (deltaA > 0)) lo = mid; else hi = mid;
    }
    const flowLps = (lo + hi) / 2;
    return { flowLps, headM: systemHead(flowLps) };
  }
  return null;
}

export function calculateNpshAvailable(siteElevationM: number, waterTemperatureC: number, suctionLiftM: number, suctionFrictionM = 0) {
  if (![siteElevationM, waterTemperatureC, suctionLiftM, suctionFrictionM].every(Number.isFinite) || siteElevationM < 0 || waterTemperatureC < 0 || suctionLiftM < 0 || suctionFrictionM < 0) throw new Error('NPSH inputs must be finite and non-negative.');
  const atmosphericHeadM = 10.33 * (1 - siteElevationM / 44300) ** 5.256;
  const vaporPressureKPa = 0.61121 * Math.exp((18.678 - waterTemperatureC / 234.5) * (waterTemperatureC / (257.14 + waterTemperatureC)));
  const vaporPressureHeadM = vaporPressureKPa * 1000 / (997 * 9.80665);
  return Math.max(0, atmosphericHeadM - vaporPressureHeadM - suctionLiftM - suctionFrictionM);
}

/** Average cycle screening estimate; it omits inflow controls and demand timing. */
export function estimatePumpStartsPerHour(dailyDemandM3: number, startStopBandM3: number) {
  if (![dailyDemandM3, startStopBandM3].every(Number.isFinite) || dailyDemandM3 < 0 || startStopBandM3 < 0) throw new Error('Cycling inputs must be finite and non-negative.');
  return startStopBandM3 > 0 ? dailyDemandM3 / 24 / startStopBandM3 : null;
}

export interface DailyRainwaterInput { rainfallMm: number[]; roofAreaM2: number; runoffCoefficient: number; efficiencyPct: number; firstFlushMm: number; demandM3Day: number; tankSizesM3: number[] }

/** Daily yield-after-spillage and demand-first comparison; inputs remain explicit and editable. */
export function simulateDailyRainwater(input: DailyRainwaterInput) {
  const { rainfallMm, roofAreaM2, runoffCoefficient, efficiencyPct, firstFlushMm, demandM3Day, tankSizesM3 } = input;
  if (!rainfallMm.length || rainfallMm.some(v => !Number.isFinite(v) || v < 0) || ![roofAreaM2, runoffCoefficient, efficiencyPct, firstFlushMm, demandM3Day].every(Number.isFinite) || roofAreaM2 < 0 || runoffCoefficient < 0 || runoffCoefficient > 1 || efficiencyPct < 0 || efficiencyPct > 100 || firstFlushMm < 0 || demandM3Day < 0) throw new Error('Daily rainfall inputs are invalid.');
  const run = (tankCapacityM3: number, yieldAfterSpillage: boolean) => {
    let stored = 0, overflowM3 = 0, suppliedM3 = 0, fullDemandDays = 0;
    for (const rainfall of rainfallMm) {
      const inflow = Math.max(0, rainfall - firstFlushMm) * roofAreaM2 * runoffCoefficient * (efficiencyPct / 100) / 1000;
      let supply = 0;
      if (yieldAfterSpillage) {
        const captured = Math.min(Math.max(0, tankCapacityM3 - stored), inflow);
        overflowM3 += inflow - captured; stored += captured;
        supply = Math.min(stored, demandM3Day); stored -= supply;
      } else {
        const available = stored + inflow;
        supply = Math.min(available, demandM3Day);
        const remainder = available - supply;
        overflowM3 += Math.max(0, remainder - tankCapacityM3);
        stored = Math.min(tankCapacityM3, remainder);
      }
      suppliedM3 += supply;
      if (supply + 1e-9 >= demandM3Day) fullDemandDays++;
    }
    return { tankCapacityM3, overflowM3, suppliedM3, reliabilityPct: rainfallMm.length ? 100 * fullDemandDays / rainfallMm.length : 0, potableSavingPct: rainfallMm.length * demandM3Day ? 100 * suppliedM3 / (rainfallMm.length * demandM3Day) : 0 };
  };
  if (tankSizesM3.length > 100) throw new Error('Compare no more than 100 tank sizes at a time.');
  const sizes = tankSizesM3.filter(size => Number.isFinite(size) && size > 0);
  return { yieldAfterSpillage: sizes.map(size => run(size, true)), yieldBeforeSpillage: sizes.map(size => run(size, false)) };
}

export function calculateHotWaterRecirculation(pipeLengthM: number, heatLossWPerM: number, recoveryPowerKW: number, recoveryHours: number) {
  if (![pipeLengthM, heatLossWPerM, recoveryPowerKW, recoveryHours].every(Number.isFinite) || [pipeLengthM, heatLossWPerM, recoveryPowerKW, recoveryHours].some(v => v < 0)) throw new Error('Hot-water recirculation inputs must be finite and non-negative.');
  const heatLossKWhDay = pipeLengthM * heatLossWPerM * 24 / 1000;
  const availableRecoveryKWhDay = recoveryPowerKW * recoveryHours;
  return { heatLossKWhDay, availableRecoveryKWhDay, recoveryMarginKWhDay: availableRecoveryKWhDay - heatLossKWhDay, adequateForEnteredLoss: availableRecoveryKWhDay >= heatLossKWhDay };
}

/** Export the entered reaches as an EPANET INP skeleton for independent review. */
export function exportEpanetInp(pipes: { id: string; label: string; length: number; internalDiameter: number; hazenWilliamsC: number; inletHead: number; elevationDifference: number; flow: number; fromNode?: string; toNode?: string; lossMethod?: 'Hazen-Williams' | 'Darcy-Weisbach'; roughnessMm?: number; minorLossK?: number }[], terminalDemands: { node: string; flowLps: number }[] = []) {
  const methods = pipes.map(pipe => pipe.lossMethod ?? 'Hazen-Williams');
  const allDarcy = methods.length > 0 && methods.every(method => method === 'Darcy-Weisbach');
  const mixedMethods = methods.some(method => method !== methods[0]);
  const lines = ['[TITLE]', `Preliminary network skeleton — boundary conditions pending.${mixedMethods ? ' Mixed loss methods mapped to Hazen-Williams in this export; review before use.' : ''} Verify elevations, units, demands and connections before independent analysis.`, '', '[JUNCTIONS]', ';ID Elevation(m) Demand(L/s)'];
  const safeId = (value: string, fallback: string) => value.trim().replace(/[^A-Za-z0-9_]/g, '_').slice(0, 30) || fallback;
  const hasTopology = pipes.some(pipe => pipe.fromNode?.trim() || pipe.toNode?.trim());
  const links = pipes.map((pipe, index) => ({ pipe, id: `P${index + 1}`, from: hasTopology ? safeId(pipe.fromNode ?? '', 'UNCONNECTED') : index === 0 ? 'R0' : `J${index}`, to: hasTopology ? safeId(pipe.toNode ?? '', `J${index + 1}`) : `J${index + 1}` }));
  const source = links[0]?.from ?? 'R0';
  const nodes = [...new Set(links.flatMap(link => [link.from, link.to]))].filter(node => node !== source);
  const demandByNode = new Map(terminalDemands.map(demand => [safeId(demand.node, ''), demand.flowLps]));
  for (const node of nodes) lines.push(`${node} 0 ${(demandByNode.get(node) ?? 0).toFixed(4)}`);
  lines.push('', '[RESERVOIRS]', ';ID Head(m) - boundary head intentionally set to 0 pending user input', `${source} 0`, '', '[PIPES]', ';ID Node1 Node2 Length(m) Diameter(mm) Roughness MinorLoss Status');
  for (const { pipe, id, from, to } of links) lines.push(`${id} ${from} ${to} ${pipe.length.toFixed(3)} ${pipe.internalDiameter.toFixed(3)} ${(allDarcy ? pipe.roughnessMm ?? 0.15 : pipe.hazenWilliamsC).toFixed(3)} ${pipe.minorLossK ?? 0} OPEN`);
  lines.push('', '[OPTIONS]', 'UNITS LPS', `HEADLOSS ${allDarcy ? 'D-W' : 'H-W'}`, '', '[END]', '');
  return lines.join('\n');
}
