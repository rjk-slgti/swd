import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let count = 0;
function test(name, fn) { fn(); count++; console.log(`PASS ${name}`); }
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
try {
  const { createEmptyProject, createSampleProject } = await server.ssrLoadModule('/src/data/defaults.ts');
  const e = await server.ssrLoadModule('/src/calculations/engine.ts');
  const { parseProject } = await server.ssrLoadModule('/src/utils/projectValidation.ts');
  const { getIssueFieldId, getIssueStepId } = await server.ssrLoadModule('/src/utils/designIssueRouting.ts');
  const advanced = await server.ssrLoadModule('/src/calculations/advancedEngineering.ts');
  test('Review issues route to the related workflow step', () => {
    assert.equal(getIssueStepId('Water Sources'), 'step5');
    assert.equal(getIssueStepId('Pipework Design'), 'pipes');
    assert.equal(getIssueStepId('Fire Water'), 'step12');
  });
  test('Known review issues link to their editable field', () => {
    assert.equal(getIssueFieldId('PEAK-MISSING'), 'peak-design-flow');
    assert.equal(getIssueFieldId('SOURCE-MISSING'), 'water-source-capacity');
    assert.equal(getIssueFieldId('WRN-PIP-VEL-0'), 'pipe-0-diameter');
    assert.equal(getIssueFieldId('WRN-PIP-LOW-1'), 'pipe-1-diameter');
    assert.equal(getIssueFieldId('WRN-PIP-PRS-2'), 'pipe-2-diameter');
    assert.equal(getIssueFieldId('UNMAPPED-ISSUE'), undefined);
  });
  test('Advanced fixture simulation is seeded and remains a separate estimate', () => {
    const profiles = [{ fixtureType:'tap', usesPerDay:10, flowLps:0.1, durationSeconds:20 }];
    const a = advanced.simulateFixtureDemand(profiles, 30, 42, 60);
    assert.deepEqual(advanced.simulateFixtureDemand(profiles, 30, 42, 60), a);
    assert.equal(a.simulatedDays, 30); assert.match(a.disclaimer, /not code-certified/i);
  });
  test('Darcy-Weisbach reports friction and local K losses separately', () => {
    const plain = advanced.calculateDarcyWeisbach(1, 25, 30, 0.01, 0);
    const withK = advanced.calculateDarcyWeisbach(1, 25, 30, 0.01, 4);
    assert.ok(plain.frictionLossM > 0); close(withK.frictionLossM, plain.frictionLossM);
    close(withK.totalLossM - plain.totalLossM, 4 * (1 / 1000 / (Math.PI * (0.025 ** 2) / 4)) ** 2 / (2 * 9.80665));
  });
  test('Network index path selects the lower accumulated head-loss route', () => {
    const paths = advanced.findLowestLossPaths([{ id:'A', from:'S', to:'X', lossM:3 }, { id:'B', from:'X', to:'T', lossM:4 }, { id:'C', from:'S', to:'T', lossM:10 }], 'S');
    assert.equal(paths.find(path => path.node === 'T').headLossM, 7);
    assert.deepEqual(paths.find(path => path.node === 'T').edgeIds, ['A','B']);
  });
  test('Simple tree network sums downstream fixture demands through branches', () => {
    const r = advanced.solveTreeBranchFlows([{ id:'A', from:'S', to:'X' }, { id:'B', from:'X', to:'T' }, { id:'C', from:'S', to:'Y' }], [{ node:'T', flowLps:0.3 }, { node:'Y', flowLps:0.2 }], 'S');
    close(r.totalDemandLps, 0.5); close(r.edgeFlows.find(e => e.edgeId === 'A').flowLps, 0.3); close(r.edgeFlows.find(e => e.edgeId === 'C').flowLps, 0.2);
    assert.throws(() => advanced.solveTreeBranchFlows([{ id:'A', from:'S', to:'X' }, { id:'B', from:'X', to:'S' }], [], 'S'), /tree|cycle/i);
  });
  test('Opt-in terminal demands feed the connected pipe reach calculations', () => {
    const p = createEmptyProject(); p.advancedDesign.networkSourceNode = 'S'; p.advancedDesign.networkTerminalDemands = [{ node:'T', flowLps:0.3 }];
    p.pipes = [{ id:'A', label:'Main', fromNode:'S', toNode:'T', flow:0, internalDiameter:32, length:20, inletHead:20, elevationDifference:0, fittingLoss:0, hazenWilliamsC:140, maxVelocity:2, source:'user' }];
    const r = e.calculateAll(p); close(r.pipes[0].pipe.flow, 0.3); assert.ok(r.pipes[0].velocity > 0);
  });
  test('User-entered low-velocity criterion raises an editable pipe review issue', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 1; p.occupancy[0].daysPerWeek = 7;
    p.pipes = [{ id:'P', label:'P1', fromNode:'S', toNode:'T', flow:0.1, internalDiameter:50, length:10, inletHead:20, elevationDifference:0, fittingLoss:0, hazenWilliamsC:140, maxVelocity:5, minimumVelocity:1.5, source:'user criterion' }];
    const issue = e.calculateAll(p).warnings.find(w => w.id === 'WRN-PIP-LOW-0');
    assert.ok(issue); assert.equal(getIssueFieldId(issue.id), 'pipe-0-diameter');
  });
  test('Opt-in Darcy method changes only explicitly selected pipe results', () => {
    const p = createEmptyProject();
    p.pipes = [{ id:'D', label:'Darcy', material:'steel', internalDiameter:25, length:30, flow:1, inletHead:20, elevationDifference:0, fittingLoss:0, hazenWilliamsC:140, maxVelocity:2, source:'user entered', lossMethod:'Darcy-Weisbach', roughnessMm:0.01, minorLossK:4 }];
    const result = e.calculatePipeFlow(p, null)[0];
    const expected = advanced.calculateDarcyWeisbach(1, 25, 30, 0.01, 4);
    close(result.frictionLoss, expected.frictionLossM); close(result.totalPressureLoss, expected.totalLossM);
    p.pipes[0].lossMethod = 'Hazen-Williams';
    const legacy = e.calculatePipeFlow(p, null)[0];
    assert.notEqual(legacy.frictionLoss, result.frictionLoss);
  });
  test('Pump curve interpolation finds the system intersection and NPSH screen stays positive', () => {
    const duty = advanced.findPumpDutyPoint([{ flowLps:0, headM:40 }, { flowLps:4, headM:20 }], 10, 10, 2);
    assert.ok(duty && duty.flowLps > 2 && duty.flowLps < 3); close(duty.headM, 10 + 10 * (duty.flowLps / 2) ** 2, 1e-8);
    assert.ok(advanced.calculateNpshAvailable(10, 20, 2) > 0);
  });
  test('Daily rainwater tank sweep compares spillage order and hot-water recovery losses', () => {
    const sweep = advanced.simulateDailyRainwater({ rainfallMm:[10,10], roofAreaM2:100, runoffCoefficient:1, efficiencyPct:100, firstFlushMm:0, demandM3Day:0.5, tankSizesM3:[1] });
    close(sweep.yieldAfterSpillage[0].suppliedM3, 1); close(sweep.yieldAfterSpillage[0].overflowM3, 0.5);
    close(sweep.yieldBeforeSpillage[0].overflowM3, 0);
    const hw = advanced.calculateHotWaterRecirculation(100, 10, 1, 2); close(hw.heatLossKWhDay, 24); close(hw.recoveryMarginKWhDay, -22);
    close(advanced.estimatePumpStartsPerHour(24, 1), 1);
  });
  test('EPANET export preserves entered links and labels boundary data as provisional', () => {
    const inp = advanced.exportEpanetInp([{ id:'1', label:'main', fromNode:'Tank A', toNode:'Block 1', length:20, internalDiameter:32, hazenWilliamsC:140, inletHead:15, elevationDifference:2, flow:0.5 }], [{ node:'Block 1', flowLps:0.25 }]);
    assert.match(inp, /Tank_A 0/); assert.match(inp, /Block_1 0 0\.2500/); assert.match(inp, /P1 Tank_A Block_1 20\.000/); assert.match(inp, /boundary head intentionally set to 0 pending user input/);
    const darcy = advanced.exportEpanetInp([{ id:'D', label:'Darcy', fromNode:'S', toNode:'T', length:20, internalDiameter:32, hazenWilliamsC:140, inletHead:15, elevationDifference:2, flow:0.5, lossMethod:'Darcy-Weisbach', roughnessMm:0.02, minorLossK:1 }]);
    assert.match(darcy, /HEADLOSS D-W/); assert.match(darcy, /20\.000 32\.000 0\.020 1 OPEN/);
  });
  test('Empty project starts without sample consumption or a startup crash', () => {
    const r = e.calculateAll(createEmptyProject()); close(r.add.finalADD, 0); assert.equal(r.peakFlow, null); assert.notEqual(r.overallStatus, 'PASS');
  });
  test('One user is counted once with full precision', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 1; p.occupancy[0].daysPerWeek = 7; p.occupancy[0].consumptionFactor = 35.12345;
    const r = e.calculateAll(p); close(r.domestic.totalDemand, 35.12345); close(r.add.finalADD, 35.12345 * 1.1); close(r.mdd.mdd, r.add.finalADD * 1.5);
  });
  test('Uniform and end-use methods replace the occupancy estimate', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 10; p.occupancy[0].daysPerWeek = 7; p.domesticWater.useOccupancyRates = false; p.domesticWater.perPersonRate = 20;
    close(e.calculateAll(p).add.baseDemand, 200); p.domesticWater.method = 'B';
    close(e.calculateAll(p).add.baseDemand, p.domesticWater.endUses.reduce((s, x) => s + x.perPersonPerDay * 10, 0));
  });
  test('Hostel and day rates remain distinct on a large campus', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 100000; p.occupancy[4].count = 50000;
    close(e.calculateAll(p).domestic.totalDemand, 100000 * 35 * 5 / 7 + 50000 * 120);
  });
  test('Disabled future expansion and editable daily factors are respected', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 1; p.occupancy[0].daysPerWeek = 7; p.demandBasis.lossAllowancePct = 5; p.demandBasis.maxDayFactor = 1.25;
    close(e.calculateAll(p).mdd.mdd, 35 * 1.05 * 1.25);
  });
  test('No invented fixture conversion and documented flow requires confirmation', () => {
    const p = createSampleProject(); assert.equal(e.calculateFixturePeakFlow(p), null);
    p.peakDesign = { flow: 2.5, source: 'Reviewed project calculation ABC', verified: true };
    close(e.calculateFixturePeakFlow(p).peakFlowM3h, 9);
  });
  test('Hazen-Williams and velocity use SI units, with signed elevation', () => {
    const p = createEmptyProject(); p.pipes = [{ id:'test', label:'test', material:'PVC', internalDiameter:50, length:100, flow:2, inletHead:30, elevationDifference:5, fittingLoss:2, hazenWilliamsC:140, maxVelocity:2, source:'test' }];
    const r = e.calculatePipeFlow(p, null)[0];
    close(r.velocity, 1.0185916357881302); close(r.frictionLoss, 2.46070146718553, 0.00001); close(r.residualPressure, 23 - r.frictionLoss);
  });
  test('Pump duty distinguishes hydraulic, shaft and electrical power', () => {
    const p = createEmptyProject(); p.pump.requiredFlow = 1;
    const r = e.calculateAll(p).pump; const expectedHydraulic = 3.6 * r.tdh * 9.81 / 3600;
    close(r.hydraulicPower, expectedHydraulic); close(r.shaftPower, expectedHydraulic / 0.7); close(r.electricalInputPower, expectedHydraulic / (0.7 * 0.9));
  });
  test('No selected reuse means no greywater savings', () => {
    const p = createSampleProject(); p.greywater.reuseForWCFlushing = false; p.greywater.reuseForIrrigation = false; p.greywater.reuseForCleaning = false;
    close(e.calculateAll(p).greywater.potableWaterReduction, 0);
  });
  test('Process wastewater cannot inflate sanitary greywater reuse availability', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 1; p.occupancy[0].daysPerWeek = 7; p.greywater.enabled = true;
    p.wastewater.processWastewater = 1000; p.greywater.washBasinFlow = 1000; p.greywater.treatmentEfficiency = 100; p.greywater.wcFlushingDemand = 1000;
    const r = e.calculateAll(p); close(r.wastewater.indoorDemand, 35); close(r.greywater.reusableGreywater, 35 * 0.85); close(r.greywater.potableWaterReduction, 35 * 0.85);
  });
  test('Rainwater monthly harvest reconciles to annual and supply matches demand', () => {
    const p = createSampleProject(); p.rainwater.roofArea = 100000; const r = e.calculateAll(p);
    close(r.rainwater.monthlyHarvested.reduce((a,b) => a+b,0), r.rainwater.annualHarvested);
    assert.ok(r.waterBalance.sourceCapacityShortfall > 0, 'unregistered collection capacity must not be represented as a confirmed source');
    p.waterSources.push({ id:'RWH1', name:'Roof collection', type:'Rainwater Harvesting', location:'Main block', status:'Proposed', capacityM3Day:1000, verified:false }, { id:'NWS1', name:'Water board', type:'NWSDB', location:'Boundary', status:'Existing', capacityM3Day:100, verified:true });
    assert.equal(e.calculateAll(p).waterBalance.sourceCapacityShortfall, 0);
    assert.ok(r.sustainability.potableReductionPct <= 100); assert.ok(r.sustainability.annualUtilityConsumption >= 0);
  });
  test('Fire storage stays separate from domestic demand', () => {
    const p = createSampleProject(); const baseline = e.calculateAll(p).add.finalADD;
    p.fireWater.enabled = true; p.fireWater.fireFlow = 1000; p.fireWater.fireDuration = 2;
    const r = e.calculateAll(p); close(r.fireWater.fireWaterStorage, 120); close(r.add.finalADD, baseline);
  });
  test('JSON round-trip and legacy migration', () => {
    const p = createSampleProject(); assert.deepEqual(parseProject(JSON.parse(JSON.stringify(p))), p);
    delete p.demandBasis; delete p.peakDesign; assert.equal(parseProject(p).demandBasis.maxDayFactor, 1.5);
    delete p.advancedDesign; assert.ok(parseProject(p).advancedDesign?.rainwaterDaily);
    for (const key of ['lossMethod','roughnessMm','minorLossK','fromNode','toNode','minimumVelocity']) delete p.pipes[0][key];
    assert.equal(parseProject(p).pipes[0].lossMethod, 'Hazen-Williams');
    const invalid = createSampleProject(); invalid.advancedDesign.rainwaterDaily.dailyRainfallMm = [0, -1]; assert.throws(() => parseProject(invalid));
    const invalidProfile = createSampleProject(); invalidProfile.advancedDesign.stochasticDemand.profiles = [null]; assert.throws(() => parseProject(invalidProfile));
  });
  test('Department schedules replace occupancy and average demand across operating days', () => {
    const p = createEmptyProject(); p.departmentDemand.enabled = true;
    p.departmentDemand.departments[0].population = 70; p.departmentDemand.departments[0].rateLPerPersonDay = 35; p.departmentDemand.departments[0].operatingDaysPerWeek = 5;
    p.occupancy[0].count = 1000;
    const r = e.calculateAll(p); close(r.totalPopulation, 70); close(r.domestic.totalDemand, 70 * 35 * 5 / 7);
  });
  test('Water-source types are reported separately and capacity shortfall uses m³/day inputs', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 70; p.occupancy[0].daysPerWeek = 7;
    p.waterSources = [{ id:'A', name:'Main connection', type:'NWSDB', location:'Gate', status:'Existing', capacityM3Day:1, verified:true }, { id:'B', name:'Bore 1', type:'Tube Well', location:'East', status:'Proposed', capacityM3Day:2, verified:false }];
    const r = e.calculateAll(p); close(r.waterBalance.configuredSourceCapacity, 3000); close(r.waterBalance.sourceCapacityShortfall, 0);
    assert.ok(r.waterBalance.sources.some(s => s.name.startsWith('NWSDB'))); assert.ok(r.waterBalance.sources.some(s => s.name.startsWith('Tube Well')));
  });
  test('Multiple rainwater assets share one site-yield limit', () => {
    const p = createEmptyProject(); p.rainwater.enabled = true; p.rainwater.roofArea = 100; p.rainwater.annualRainfall = 1000; p.rainwater.monthlyRainfall = Array(12).fill(1); p.rainwater.firstFlushLoss = 0; p.rainwater.filterEfficiency = 100; p.rainwater.collectionEfficiency = 100; p.rainwater.runoffCoefficient = 1; p.greywater.wcFlushingDemand = 500;
    p.waterSources = [{ id:'R1', name:'Roof A', type:'Rainwater Harvesting', location:'A', status:'Existing', capacityM3Day:100, verified:true }, { id:'R2', name:'Roof B', type:'Rainwater Harvesting', location:'B', status:'Existing', capacityM3Day:100, verified:true }];
    const r = e.calculateAll(p); close(r.waterBalance.sources.find(s => s.name.startsWith('Rainwater Harvesting')).value, r.rainwater.nonPotableOffset, 0.01);
  });
  test('Tank inventory counts usable volume and multiple tanks share one type allocation', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 10; p.occupancy[0].daysPerWeek = 7;
    p.storageAssets = [{ id:'T1', name:'Old tank', location:'A', tankType:'Underground', status:'Existing', grossVolumeM3:10, usableFractionPct:80 }, { id:'T2', name:'New tank', location:'B', tankType:'Underground', status:'Proposed', grossVolumeM3:10, usableFractionPct:90 }];
    p.tankDimensions = [{ id:'D1', label:'Tank 1', tankType:'Underground', shape:'Rectangular', length:2, width:2, effectiveDepth:2, freeboard:0.2, requiredCapacity:0 }, { id:'D2', label:'Tank 2', tankType:'Underground', shape:'Rectangular', length:2, width:2, effectiveDepth:2, freeboard:0.2, requiredCapacity:0 }];
    const r = e.calculateAll(p); close(r.storage.existingUsableCapacity, 8); close(r.storage.proposedUsableCapacity, 9);
    close(r.tankDimensions.reduce((sum, t) => sum + t.tank.requiredCapacity, 0), r.storage.undergroundTank);
  });
  test('Malformed input, negative population and invalid percentages are rejected', () => {
    assert.throws(() => parseProject({})); const p = createEmptyProject(); p.occupancy[0].count = -1; assert.throws(() => parseProject(p));
    p.occupancy[0].count = 0; p.greywater.treatmentEfficiency = 101; assert.throws(() => parseProject(p));
    p.greywater.treatmentEfficiency = 50; p.rainwater.monthlyRainfall = []; assert.throws(() => parseProject(p));
    p.rainwater.monthlyRainfall = Array(12).fill(0); p.departmentDemand.departments[0].operatingDaysPerWeek = 8; assert.throws(() => parseProject(p));
  });
  console.log(`${count} engineering regression tests passed.`);
} finally { await server.close(); }

