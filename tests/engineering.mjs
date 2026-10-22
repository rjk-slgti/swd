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

