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
    const p = createEmptyProject(); p.occupancy[0].count = 1; p.occupancy[0].consumptionFactor = 35.12345;
    const r = e.calculateAll(p); close(r.domestic.totalDemand, 35.12345); close(r.add.finalADD, 35.12345 * 1.1); close(r.mdd.mdd, r.add.finalADD * 1.5);
  });
  test('Uniform and end-use methods replace the occupancy estimate', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 10; p.domesticWater.useOccupancyRates = false; p.domesticWater.perPersonRate = 20;
    close(e.calculateAll(p).add.baseDemand, 200); p.domesticWater.method = 'B';
    close(e.calculateAll(p).add.baseDemand, p.domesticWater.endUses.reduce((s, x) => s + x.perPersonPerDay * 10, 0));
  });
  test('Hostel and day rates remain distinct on a large campus', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 100000; p.occupancy[4].count = 50000;
    close(e.calculateAll(p).domestic.totalDemand, 100000 * 35 + 50000 * 120);
  });
  test('Disabled future expansion and editable daily factors are respected', () => {
    const p = createEmptyProject(); p.occupancy[0].count = 1; p.demandBasis.lossAllowancePct = 5; p.demandBasis.maxDayFactor = 1.25;
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
  test('No selected reuse means no greywater savings', () => {
    const p = createSampleProject(); p.greywater.reuseForWCFlushing = false; p.greywater.reuseForIrrigation = false; p.greywater.reuseForCleaning = false;
    close(e.calculateAll(p).greywater.potableWaterReduction, 0);
  });
  test('Rainwater monthly harvest reconciles to annual and supply matches demand', () => {
    const p = createSampleProject(); p.rainwater.roofArea = 100000; const r = e.calculateAll(p);
    close(r.rainwater.monthlyHarvested.reduce((a,b) => a+b,0), r.rainwater.annualHarvested);
    close(r.waterBalance.sources.reduce((s,x) => s+x.value,0), r.waterBalance.totalDemand, 0.02);
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
  test('Malformed input, negative population and invalid percentages are rejected', () => {
    assert.throws(() => parseProject({})); const p = createEmptyProject(); p.occupancy[0].count = -1; assert.throws(() => parseProject(p));
    p.occupancy[0].count = 0; p.greywater.treatmentEfficiency = 101; assert.throws(() => parseProject(p));
    p.greywater.treatmentEfficiency = 50; p.rainwater.monthlyRainfall = []; assert.throws(() => parseProject(p));
  });
  console.log(`${count} engineering regression tests passed.`);
} finally { await server.close(); }

