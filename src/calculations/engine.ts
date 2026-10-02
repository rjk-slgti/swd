// ============================================================
// CALCULATION ENGINE
// All engineering calculations are independent of UI.
// Each function is pure: inputs -> typed results.
// ============================================================

import type {
  ProjectData,
  OccupancyResult,
  DomesticResult,
  SpecialDemandResult,
  WaterBalanceResult,
  ADDResult,
  MDDResult,
  PeakFlowResult,
  StorageResult,
  TankDimensionResult,
  PumpResult,
  PipeResult,
  WastewaterResult,
  GreywaterResult,
  RainwaterResult,
  FireWaterResult,
  SustainabilityResult,
  AllResults,
  EngineeringWarning,
  Recommendation,
  Assumption,
  CalcRegisterEntry,
  ChecklistItem,
} from '@/types';

// --- Utility helpers ---

export function safeDiv(a: number, b: number): number {
  if (b === 0 || !isFinite(b)) return 0;
  return a / b;
}

export function safeMul(a: number, b: number): number {
  const r = a * b;
  if (!isFinite(r)) return 0;
  return r;
}

export function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function LtoM3(l: number): number {
  return safeDiv(l, 1000);
}

export function M3toL(m3: number): number {
  return m3 * 1000;
}

// ============================================================
// 1. OCCUPANCY DEMAND
// ============================================================

export function calculateOccupancyDemand(data: ProjectData): OccupancyResult[] {
  return data.occupancy.map((g) => {
    const dailyDemand = safeMul(g.count, g.consumptionFactor);
    return {
      group: g,
      dailyDemand,
      formula: 'Daily Demand = Population × Unit Consumption',
      substitution: `${g.count} × ${g.consumptionFactor} = ${roundTo(dailyDemand, 2)} L/day`,
    };
  });
}

export function calculateTotalPopulation(data: ProjectData): number {
  return data.occupancy.reduce((sum, g) => sum + (g.count || 0), 0);
}

export function calculateOccupancyTotalDemand(results: OccupancyResult[]): number {
  return results.reduce((sum, r) => sum + r.dailyDemand, 0);
}

// ============================================================
// 2. DOMESTIC WATER DEMAND
// ============================================================

export function calculateDomesticDemand(
  data: ProjectData,
  occupancyResults: OccupancyResult[]
): DomesticResult | null {
  const totalPop = calculateTotalPopulation(data);

  if (data.domesticWater.method === 'A' && data.domesticWater.useOccupancyRates) {
    const totalDemand = calculateOccupancyTotalDemand(occupancyResults);
    return { totalDemand, method: 'A', breakdown: occupancyResults.map(r => ({ name: r.group.name, value: r.dailyDemand, unit: 'L/day' })),
      formula: 'Domestic Demand = Σ (Group population × Group daily allowance)',
      substitution: occupancyResults.map(r => `${r.group.count} × ${r.group.consumptionFactor}`).join(' + ') + ` = ${roundTo(totalDemand, 2)} L/day` };
  }
  if (data.domesticWater.method === 'A') {
    const totalDemand = safeMul(totalPop, data.domesticWater.perPersonRate);
    return {
      totalDemand,
      method: 'A',
      breakdown: [
        { name: 'Total Population', value: totalPop, unit: 'persons' },
        { name: 'Per-person Rate', value: data.domesticWater.perPersonRate, unit: 'L/person/day' },
        { name: 'Domestic Demand', value: roundTo(totalDemand, 2), unit: 'L/day' },
      ],
      formula: 'Domestic Demand = Total Population × Per-person Rate',
      substitution: `${totalPop} × ${data.domesticWater.perPersonRate} = ${roundTo(totalDemand, 2)} L/day`,
    };
  }

  // Method B — end-use breakdown
  const breakdown = data.domesticWater.endUses.map((eu) => ({
    name: eu.name,
    value: safeMul(totalPop, eu.perPersonPerDay),
    unit: 'L/day',
  }));
  const totalDemand = breakdown.reduce((sum, b) => sum + b.value, 0);

  return {
    totalDemand,
    method: 'B',
    breakdown,
    formula: 'Domestic Demand = Σ (Population × End-use Rate per person)',
    substitution: breakdown
      .map((b) => `${totalPop} × ${data.domesticWater.endUses.find((e) => e.name === b.name)?.perPersonPerDay}`)
      .join(' + ') + ` = ${roundTo(totalDemand, 2)} L/day`,
  };
}

// ============================================================
// 3. SPECIAL WATER DEMANDS
// ============================================================

export function calculateSpecialDemand(
  data: ProjectData,
): SpecialDemandResult | null {
  const breakdown: { name: string; value: number; unit: string }[] = [];

  // Canteen
  let canteenDemand = 0;
  if (data.canteen.enabled) {
    canteenDemand = safeMul(data.canteen.mealsPerDay, data.canteen.waterPerMeal);
    canteenDemand += data.canteen.drinkingWaterL + data.canteen.foodPrepL + data.canteen.cleaningL;
    breakdown.push({ name: 'Canteen / Kitchen', value: roundTo(canteenDemand, 2), unit: 'L/day' });
  }

  // Workshops
  let workshopDemand = 0;
  data.workshops.forEach((w) => {
    const wd = safeMul(w.waterPerEvent, w.eventsPerDay);
    workshopDemand += wd;
  });
  if (workshopDemand > 0) {
    breakdown.push({ name: 'Workshop / Process', value: roundTo(workshopDemand, 2), unit: 'L/day' });
  }

  // Cleaning
  let cleaningDemand = 0;
  if (data.cleaning.enabled) {
    const totalArea =
      data.cleaning.academicFloorArea +
      data.cleaning.workshopFloorArea +
      data.cleaning.toiletFloorArea +
      data.cleaning.hostelFloorArea +
      data.cleaning.externalPavedArea;
    const dailyAreaRate = safeMul(totalArea, data.cleaning.cleaningRate);
    cleaningDemand = safeDiv(safeMul(dailyAreaRate, data.cleaning.cleaningFrequency), 7); // avg per day
    breakdown.push({ name: 'Cleaning', value: roundTo(cleaningDemand, 2), unit: 'L/day' });
  }

  // Irrigation
  let irrigationDemand = 0;
  if (data.irrigation.enabled) {
    const grossDemand = safeMul(data.irrigation.landscapeArea, data.irrigation.irrigationRate);
    const seasonal = safeMul(grossDemand, 1 + data.irrigation.seasonalAdjustment / 100);
    const netDemand = seasonal - data.irrigation.rainfallContribution - data.irrigation.recycledWaterContribution;
    irrigationDemand = safeDiv(safeMul(netDemand, data.irrigation.irrigationDays), 7);
    if (irrigationDemand < 0) irrigationDemand = 0;
    breakdown.push({ name: 'Landscape Irrigation', value: roundTo(irrigationDemand, 2), unit: 'L/day' });
  }

  // Vehicle Washing
  let vehicleWashingDemand = 0;
  if (data.vehicleWashing.enabled) {
    const grossWash =
      safeMul(data.vehicleWashing.motorcycles, data.vehicleWashing.waterPerMotorcycle) +
      safeMul(data.vehicleWashing.cars, data.vehicleWashing.waterPerCar) +
      safeMul(data.vehicleWashing.vans, data.vehicleWashing.waterPerVan) +
      safeMul(data.vehicleWashing.buses, data.vehicleWashing.waterPerBus) +
      safeMul(data.vehicleWashing.heavyVehicles, data.vehicleWashing.waterPerHeavy);
    vehicleWashingDemand = safeMul(grossWash, 1 - data.vehicleWashing.recyclingPct / 100);
    breakdown.push({ name: 'Vehicle Washing', value: roundTo(vehicleWashingDemand, 2), unit: 'L/day' });
  }

  const total = canteenDemand + workshopDemand + cleaningDemand + irrigationDemand + vehicleWashingDemand;

  return {
    canteenDemand: canteenDemand,
    workshopDemand: workshopDemand,
    cleaningDemand: cleaningDemand,
    irrigationDemand: irrigationDemand,
    vehicleWashingDemand: vehicleWashingDemand,
    total: total,
    breakdown,
  };
}

// ============================================================
// 4. WATER BALANCE
// ============================================================

export function calculateWaterBalance(
  data: ProjectData,
  domestic: DomesticResult | null,
  special: SpecialDemandResult | null,
  occupancyResults: OccupancyResult[],
  rainwater: RainwaterResult | null,
  greywater: GreywaterResult | null
): WaterBalanceResult | null {
  if (!domestic || !special) return null;

  const totalDemand = domestic.totalDemand + special.total;

  // Sources
  const rainwaterDaily = rainwater?.nonPotableOffset ?? 0;
  const greywaterDaily = greywater ? greywater.potableWaterReduction : 0;
  const recycledTotal = rainwaterDaily + greywaterDaily;
  const municipalSupply = Math.max(0, totalDemand - recycledTotal);

  const sources = [
    { name: 'Municipal / Borewell', value: roundTo(municipalSupply, 2), pct: totalDemand > 0 ? roundTo(safeDiv(municipalSupply, totalDemand) * 100, 1) : 0 },
    { name: 'Rainwater', value: roundTo(rainwaterDaily, 2), pct: totalDemand > 0 ? roundTo(safeDiv(rainwaterDaily, totalDemand) * 100, 1) : 0 },
    { name: 'Recycled Greywater', value: roundTo(greywaterDaily, 2), pct: totalDemand > 0 ? roundTo(safeDiv(greywaterDaily, totalDemand) * 100, 1) : 0 },
  ];

  // Consumption categories
  const consumption = [
    { name: 'Domestic / Occupancy', value: roundTo(domestic.totalDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(domestic.totalDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Canteen', value: roundTo(special.canteenDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.canteenDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Workshop', value: roundTo(special.workshopDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.workshopDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Cleaning', value: roundTo(special.cleaningDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.cleaningDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Irrigation', value: roundTo(special.irrigationDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.irrigationDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Vehicle Washing', value: roundTo(special.vehicleWashingDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.vehicleWashingDemand, totalDemand) * 100, 1) : 0 },
  ];

  // Outflows
  const wastewater = calculateWastewater(data, domestic, special);
  const totalWastewater = wastewater ? wastewater.totalWastewater : 0;
  const irrigationLoss = special.irrigationDemand;
  const totalLoss = Math.max(0, totalDemand - totalWastewater - irrigationLoss);

  const outflows = [
    { name: 'Wastewater', value: roundTo(totalWastewater, 2), pct: totalDemand > 0 ? roundTo(safeDiv(totalWastewater, totalDemand) * 100, 1) : 0 },
    { name: 'Irrigation / Landscape', value: roundTo(irrigationLoss, 2), pct: totalDemand > 0 ? roundTo(safeDiv(irrigationLoss, totalDemand) * 100, 1) : 0 },
    { name: 'Losses / Consumption', value: roundTo(totalLoss, 2), pct: totalDemand > 0 ? roundTo(safeDiv(totalLoss, totalDemand) * 100, 1) : 0 },
  ];

  return {
    sources,
    consumption,
    outflows,
    totalSupply: municipalSupply + recycledTotal,
    totalDemand: totalDemand,
    totalWastewater: totalWastewater,
    totalLoss: totalLoss,
  };
}

// ============================================================
// 5. AVERAGE DAILY DEMAND (ADD)
// ============================================================

export function calculateADD(
  data: ProjectData,
  occupancyResults: OccupancyResult[],
  domestic: DomesticResult | null,
  special: SpecialDemandResult | null
): ADDResult | null {
  if (!domestic || !special) return null;

  const baseDemand = domestic.totalDemand + special.total;

  const lossAllowancePct = data.demandBasis.lossAllowancePct;
  const futureExpansionPct = data.futureExpansion.enabled ? data.futureExpansion.percentageGrowth : 0;

  const finalADD = safeMul(
    safeMul(baseDemand, 1 + lossAllowancePct / 100),
    1 + futureExpansionPct / 100
  );

  return {
    baseDemand: baseDemand,
    lossAllowancePct,
    futureExpansionPct,
    finalADD: finalADD,
    finalADDm3: LtoM3(finalADD),
    formula: 'Final ADD = Base Demand × (1 + Loss %) × (1 + Future Expansion %)',
    substitution: `${roundTo(baseDemand, 2)} × ${1 + lossAllowancePct / 100} × ${1 + futureExpansionPct / 100} = ${roundTo(finalADD, 2)} L/day`,
  };
}

// ============================================================
// 6. MAXIMUM DAILY DEMAND (MDD)
// ============================================================

export function calculateMDD(add: ADDResult | null, maxDayFactor: number): MDDResult | null {
  if (!add) return null;
  const mdd = safeMul(add.finalADD, maxDayFactor);
  return {
    add: add.finalADD,
    maxDayFactor,
    mdd: mdd,
    mddm3: LtoM3(mdd),
    formula: 'MDD = ADD × Maximum Day Factor',
    substitution: `${roundTo(add.finalADD, 2)} × ${maxDayFactor} = ${roundTo(mdd, 2)} L/day`,
  };
}

// ============================================================
// 7. FIXTURE SCHEDULE AND EXTERNALLY VERIFIED PEAK FLOW
// No unverified conversion of loading units into probable flow.
// ============================================================
export function calculateFixturePeakFlow(data: ProjectData): PeakFlowResult | null {
  if (!(data.peakDesign.flow > 0 && data.peakDesign.source.trim() && data.peakDesign.verified)) return null;
  const fixtureBreakdown = data.fixtures.filter(f => f.quantity > 0).map(f => ({ type: f.type, qty: f.quantity, fu: f.loadingUnit, totalFU: f.quantity * f.loadingUnit }));
  const flow = data.peakDesign.flow;
  return { totalFixtureUnits: fixtureBreakdown.reduce((sum, f) => sum + f.totalFU, 0),
    probablePeakFlow: flow, peakFlowLpm: flow * 60, peakFlowM3h: flow * 3.6,
    formula: 'Externally calculated simultaneous flow; user-confirmed design basis',
    substitution: `${flow} L/s; source: ${data.peakDesign.source}`, fixtureBreakdown };
}

// ============================================================
// 8. STORAGE DESIGN
// ============================================================

export function calculateStorage(
  data: ProjectData,
  add: ADDResult | null
): StorageResult | null {
  if (!add) return null;

  const dailyDemandM3 = add.finalADDm3;
  const reserveFactor = 1 + data.storage.reserveAllowance / 100 + data.storage.operationalReserve / 100;
  const requiredCapacity = safeMul(dailyDemandM3, data.storage.storageDuration * reserveFactor);

  const undergroundTank = safeMul(requiredCapacity, data.storage.undergroundTankPct / 100);
  const roofTank = safeMul(requiredCapacity, data.storage.roofTankPct / 100);
  const groundTank = safeMul(requiredCapacity, data.storage.groundTankPct / 100);
  const elevatedTank = safeMul(requiredCapacity, data.storage.elevatedTankPct / 100);

  const totalAllocated = undergroundTank + roofTank + groundTank + elevatedTank;
  const check = Math.abs(totalAllocated - requiredCapacity) < 0.01;

  return {
    dailyDemand: dailyDemandM3,
    requiredCapacity: requiredCapacity,
    undergroundTank: undergroundTank,
    roofTank: roofTank,
    groundTank: groundTank,
    elevatedTank: elevatedTank,
    formula: 'Storage = Daily Demand × Duration × (1 + Reserve % + Operational %)',
    substitution: `${roundTo(dailyDemandM3, 2)} × ${data.storage.storageDuration} × ${reserveFactor.toFixed(2)} = ${roundTo(requiredCapacity, 2)} m³`,
    check,
  };
}

// ============================================================
// 9. TANK DIMENSION CALCULATOR
// ============================================================

export function calculateTankVolume(
  data: ProjectData,
  storage: StorageResult | null
): TankDimensionResult[] {
  return data.tankDimensions.map((tank) => {
    let grossVolume: number;
    let effectiveVolume: number;

    if (tank.shape === 'Cylindrical') {
      const radius = safeDiv(tank.length, 2); // length = diameter
      grossVolume = Math.PI * safeMul(radius, radius) * (tank.effectiveDepth + tank.freeboard);
      effectiveVolume = Math.PI * safeMul(radius, radius) * tank.effectiveDepth;
    } else {
      grossVolume = safeMul(safeMul(tank.length, tank.width), tank.effectiveDepth + tank.freeboard);
      effectiveVolume = safeMul(safeMul(tank.length, tank.width), tank.effectiveDepth);
    }

    // Determine required capacity from storage result
    let requiredCapacity = tank.requiredCapacity;
    if (storage) {
      if (tank.tankType === 'Underground') requiredCapacity = storage.undergroundTank;
      else if (tank.tankType === 'Roof') requiredCapacity = storage.roofTank;
      else if (tank.tankType === 'Ground Level') requiredCapacity = storage.groundTank;
      else if (tank.tankType === 'Elevated') requiredCapacity = storage.elevatedTank;
    }

    const surplusDeficiency = effectiveVolume - requiredCapacity;
    let status: 'green' | 'amber' | 'red';
    if (surplusDeficiency >= requiredCapacity * 0.05) status = 'green';
    else if (surplusDeficiency >= 0) status = 'amber';
    else status = 'red';

    return {
      tank: { ...tank, requiredCapacity: roundTo(requiredCapacity, 2) },
      grossVolume: grossVolume,
      effectiveVolume: effectiveVolume,
      surplusDeficiency: surplusDeficiency,
      status,
    };
  });
}

// ============================================================
// 10. PUMP DESIGN
// ============================================================

export function calculatePumpHead(
  data: ProjectData,
  peakFlow: PeakFlowResult | null
): PumpResult | null {
  const config = data.pump;
  const designFlow = config.requiredFlow > 0 ? config.requiredFlow : (peakFlow?.probablePeakFlow || 0);
  if (designFlow <= 0 || config.pumpEfficiency <= 0 || config.motorEfficiency <= 0) return null;
  const designFlowM3h = designFlow * 3.6;

  const tdh =
    config.staticHead +
    config.pipeFriction +
    config.fittingLosses +
    config.equipmentLosses +
    config.requiredResidualPressure;

  const tdhWithMargin = safeMul(tdh, 1 + config.safetyMargin / 100);

  // Hydraulic Power: P = (Q × H × ρ × g) / (3600 × 1000) for Q in m³/h
  // P_hydraulic (kW) = Q(m³/h) × H(m) × 9.81 / 3600
  const hydraulicPower = safeDiv(safeMul(designFlowM3h, tdhWithMargin) * 9.81, 3600);
  const motorPower = safeDiv(hydraulicPower, (config.pumpEfficiency / 100) * (config.motorEfficiency / 100));

  return {
    designFlow: designFlow,
    designFlowM3h: designFlowM3h,
    tdh: tdhWithMargin,
    hydraulicPower: hydraulicPower,
    motorPower: motorPower,
    formula: 'TDH = Static Head + Friction + Fitting Loss + Equipment Loss + Residual Head, then × (1 + Safety Margin %)',
    substitution: `(${config.staticHead} + ${config.pipeFriction} + ${config.fittingLosses} + ${config.equipmentLosses} + ${config.requiredResidualPressure}) × ${1 + config.safetyMargin / 100} = ${roundTo(tdhWithMargin, 2)} m`,
  };
}

// ============================================================
// 11. PIPE DESIGN — simplified Hazen-Williams
// ============================================================

export function calculatePipeFlow(data: ProjectData, peakFlow: PeakFlowResult | null): PipeResult[] {
  return data.pipes.map((pipe) => {
    const flow = pipe.flow > 0 ? pipe.flow : (peakFlow?.probablePeakFlow || 0);
    const d = safeDiv(pipe.internalDiameter, 1000); // mm to m
    const area = safeMul(Math.PI, safeMul(d, d)) / 4;
    const velocity = safeDiv(flow / 1000, area); // L/s to m³/s → L/s / (m²) × 0.001 → m/s

    // Hazen-Williams: hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)
    // C = 140 for uPVC, 120 for GI, 150 for HDPE
    const C = pipe.hazenWilliamsC;
    const Qm3s = flow / 1000;
    let frictionLoss = 0;
    if (d > 0 && C > 0) {
      frictionLoss = safeDiv(
        10.67 * Math.pow(pipe.length, 1) * Math.pow(Qm3s, 1.852),
        Math.pow(C, 1.852) * Math.pow(d, 4.87)
      );
    }

    const totalPressureLoss = frictionLoss + pipe.fittingLoss;
    const availablePressure = pipe.inletHead - pipe.elevationDifference;
    const residualPressure = availablePressure - totalPressureLoss;

    const warnings: string[] = [];
    if (velocity > pipe.maxVelocity) warnings.push(`Velocity exceeds the user-defined ${pipe.maxVelocity} m/s design criterion; review noise and transient risk.`);
    if (d <= 0 || C <= 0 || flow <= 0) warnings.push('Additional design information required: positive diameter, roughness coefficient and design flow.');
    if (residualPressure < 0) warnings.push('Residual pressure is negative — pump boost may be required.');

    return {
      pipe: { ...pipe, flow: roundTo(flow, 3) },
      velocity: velocity,
      frictionLoss: frictionLoss,
      totalPressureLoss: totalPressureLoss,
      availablePressure: availablePressure,
      residualPressure: residualPressure,
      warnings,
    };
  });
}

// ============================================================
// 12. WASTEWATER
// ============================================================

export function calculateWastewater(
  data: ProjectData,
  domestic: DomesticResult | null,
  special: SpecialDemandResult | null
): WastewaterResult | null {
  if (!domestic || !special) return null;

  const indoorDemand = domestic.totalDemand + special.canteenDemand + special.workshopDemand;
  const returnFactor = data.wastewater.sewerReturnFactor / 100;

  const sewerReturn = safeMul(indoorDemand, returnFactor);
  const totalWastewater = sewerReturn + data.wastewater.processWastewater + data.wastewater.kitchenWastewater + data.wastewater.hostelWastewater + data.wastewater.otherWastewater;

  return {
    indoorDemand: indoorDemand,
    sewerReturn: sewerReturn,
    totalWastewater: totalWastewater,
    wastewaterM3Day: LtoM3(totalWastewater),
    wastewaterM3Month: LtoM3(totalWastewater) * 30,
    wastewaterM3Year: LtoM3(totalWastewater) * 365,
    formula: 'Wastewater = Indoor Demand × Return Factor + Process/Kitchen/Hostel/Other Wastewater',
    substitution: `${roundTo(indoorDemand, 2)} × ${returnFactor} + ${data.wastewater.processWastewater + data.wastewater.kitchenWastewater + data.wastewater.hostelWastewater + data.wastewater.otherWastewater} = ${roundTo(totalWastewater, 2)} L/day`,
  };
}

// ============================================================
// 13. GREYWATER REUSE
// ============================================================

export function calculateGreywaterReuse(
  data: ProjectData,
  wastewater: WastewaterResult | null
): GreywaterResult | null {
  if (!data.greywater.enabled) {
    return {
      greywaterGenerated: 0,
      reusableGreywater: 0,
      reuseDemand: 0,
      potableWaterReduction: 0,
      potableReductionPct: 0,
      formula: 'Greywater not enabled',
      substitution: 'Enable greywater in the Greywater module to calculate reuse potential',
    };
  }

  const generated = data.greywater.washBasinFlow + data.greywater.showerFlow + data.greywater.laundryFlow + data.greywater.otherSinkFlow;
  const reusable = safeMul(Math.min(generated, wastewater?.totalWastewater ?? 0), data.greywater.treatmentEfficiency / 100);

  let reuseDemand = 0;
  const special = calculateSpecialDemand(data);
  if (data.greywater.reuseForWCFlushing) reuseDemand += data.greywater.wcFlushingDemand;
  if (data.greywater.reuseForIrrigation) reuseDemand += special?.irrigationDemand ?? 0;
  if (data.greywater.reuseForCleaning) reuseDemand += special?.cleaningDemand ?? 0;

  const potableWaterReduction = Math.min(reusable, reuseDemand, wastewater?.indoorDemand ?? 0);
  const totalDemand = wastewater ? wastewater.indoorDemand : 0;
  const potableReductionPct = totalDemand > 0 ? roundTo(safeDiv(potableWaterReduction, totalDemand) * 100, 1) : 0;

  return {
    greywaterGenerated: generated,
    reusableGreywater: reusable,
    reuseDemand: reuseDemand,
    potableWaterReduction: potableWaterReduction,
    potableReductionPct,
    formula: 'Reusable Greywater = Generated × Treatment Efficiency',
    substitution: `${roundTo(generated, 2)} × ${data.greywater.treatmentEfficiency}% = ${roundTo(reusable, 2)} L/day`,
  };
}

// ============================================================
// 14. RAINWATER HARVESTING
// ============================================================

export function calculateRainwaterHarvest(data: ProjectData): RainwaterResult | null {
  if (!data.rainwater.enabled) {
    return {
      annualHarvested: 0,
      monthlyHarvested: [],
      nonPotableOffset: 0,
      potableSavingPct: 0,
      formula: 'Rainwater harvesting not enabled',
      substitution: 'Enable rainwater in the Rainwater module to calculate potential',
    };
  }

  const profileTotal = data.rainwater.monthlyRainfall.reduce((sum, value) => sum + value, 0);
  const systemEff = data.rainwater.filterEfficiency / 100 * data.rainwater.collectionEfficiency / 100;
  const monthlyHarvested = data.rainwater.monthlyRainfall.map(rf => {
    const allocatedRainfall = profileTotal > 0 ? rf / profileTotal * data.rainwater.annualRainfall : data.rainwater.annualRainfall / 12;
    return Math.max(0, allocatedRainfall - data.rainwater.firstFlushLoss) * data.rainwater.roofArea * data.rainwater.runoffCoefficient * systemEff / 1000;
  });
  const annualHarvestedM3 = monthlyHarvested.reduce((sum, value) => sum + value, 0);
  const effectiveRainfall = Math.max(0, data.rainwater.annualRainfall - data.rainwater.firstFlushLoss * 12);
  const nonPotableOffset = 0; // Allocated against eligible demand in calculateAll.

  return {
    annualHarvested: annualHarvestedM3,
    monthlyHarvested,
    nonPotableOffset: nonPotableOffset,
    potableSavingPct: 0, // calculated in sustainability
    formula: 'Harvested = Rainfall × Catchment Area × Runoff Coefficient × Filter Efficiency × Collection Efficiency',
    substitution: `${effectiveRainfall} × ${data.rainwater.roofArea} × ${data.rainwater.runoffCoefficient} × ${data.rainwater.filterEfficiency}% × ${data.rainwater.collectionEfficiency}% = ${roundTo(annualHarvestedM3, 2)} m³/year`,
  };
}

// ============================================================
// 15. FIRE WATER
// ============================================================

export function calculateFireWater(data: ProjectData): FireWaterResult | null {
  if (!data.fireWater.enabled) {
    return {
      fireFlow: 0,
      fireDuration: 0,
      fireWaterStorage: 0,
      formula: 'Fire water module not enabled',
      substitution: 'Enable fire water and enter applicable fire authority requirements',
    };
  }

  const fireFlow = data.fireWater.fireFlow;
  const fireDuration = data.fireWater.fireDuration;
  const fireWaterStorage = LtoM3(safeMul(safeMul(fireFlow, fireDuration), 60)); // L/min × hours × 60 = L → m³

  return {
    fireFlow: fireFlow,
    fireDuration,
    fireWaterStorage: fireWaterStorage,
    formula: 'Fire Water Storage = Fire Flow × Duration × 60 / 1000',
    substitution: `${fireFlow} L/min × ${fireDuration} h × 60 = ${roundTo(safeMul(safeMul(fireFlow, fireDuration), 60), 0)} L = ${roundTo(fireWaterStorage, 2)} m³`,
  };
}

// ============================================================
// 16. SUSTAINABILITY INDICATORS
// ============================================================

export function calculateSustainability(
  data: ProjectData,
  add: ADDResult | null,
  rainwater: RainwaterResult | null,
  greywater: GreywaterResult | null,
  wastewater: WastewaterResult | null
): SustainabilityResult | null {
  if (!add) return null;

  const totalPop = calculateTotalPopulation(data);
  const potablePerPerson = totalPop > 0 ? safeDiv(Math.max(0, add.finalADD - (rainwater?.nonPotableOffset ?? 0) - (greywater?.potableWaterReduction ?? 0)), totalPop) : 0;

  const rainwaterDaily = rainwater?.nonPotableOffset ?? 0;
  const greywaterDaily = greywater ? greywater.potableWaterReduction : 0;

  const rainwaterContributionPct = add.finalADD > 0 ? roundTo(safeDiv(rainwaterDaily, add.finalADD) * 100, 1) : 0;
  const recycledContributionPct = add.finalADD > 0 ? roundTo(safeDiv(greywaterDaily, add.finalADD) * 100, 1) : 0;
  const potableReductionPct = roundTo(rainwaterContributionPct + recycledContributionPct, 1);

  const annualSaving = LtoM3((rainwaterDaily + greywaterDaily) * 365);
  const annualUtilityConsumption = LtoM3(add.finalADD * 365) - annualSaving;

  const wastewaterReusePct = wastewater && wastewater.totalWastewater > 0 && greywater
    ? roundTo(safeDiv(greywater.potableWaterReduction, wastewater.totalWastewater) * 100, 1)
    : 0;

  // Efficiency score: weighted indicators
  let score = add.finalADD > 0 ? 50 : 0;
  if (potableReductionPct > 10) score += 10;
  if (potableReductionPct > 25) score += 10;
  if (wastewaterReusePct > 10) score += 10;
  if (wastewaterReusePct > 25) score += 5;
  if (potablePerPerson > 0 && potablePerPerson < 50) score += 10;
  if (potablePerPerson > 0 && potablePerPerson < 80) score += 5;
  score = Math.min(100, score);

  return {
    potablePerPerson,
    rainwaterContributionPct,
    recycledContributionPct,
    potableReductionPct,
    annualSaving: annualSaving,
    wastewaterReusePct,
    annualUtilityConsumption: Math.max(0, annualUtilityConsumption),
    efficiencyScore: score,
  };
}

// ============================================================
// 17. ENGINEERING WARNINGS
// ============================================================

export function generateWarnings(
  data: ProjectData,
  results: AllResults
): EngineeringWarning[] {
  const warnings: EngineeringWarning[] = [];
  if (!results.peakFlow) warnings.push({ id: 'PEAK-MISSING', level: 'warning', section: 'Peak Fixture Demand', message: 'Additional design information required: enter and confirm an independently calculated peak flow with its standard/table reference. No automatic fixture-unit conversion is applied.' });
  if (results.storage && !results.storage.check) warnings.push({ id: 'STORAGE-SPLIT', level: 'critical', section: 'Storage', message: 'Tank allocation percentages must sum to 100%.' });
  if (data.greywater.enabled && results.greywater && results.greywater.greywaterGenerated > (results.wastewater?.totalWastewater ?? 0)) warnings.push({ id: 'GREY-SOURCE', level: 'warning', section: 'Greywater', message: 'Entered greywater exceeds modeled wastewater. Reusable supply is capped; review source volumes.' });

  if (!results.pump) warnings.push({ id: 'PUMP-MISSING', level: 'warning', section: 'Pumps', message: 'Additional design information required: positive flow and valid pump/motor efficiencies. Final duty requires manufacturer curve verification.' });

  // High water demand per person
  if (results.totalPopulation > 0 && results.add) {
    const perPerson = safeDiv(results.add.finalADD, results.totalPopulation);
    if (perPerson > 150) {
      warnings.push({
        id: 'WRN-01',
        level: 'warning',
        message: `Water consumption per user appears high (${roundTo(perPerson, 0)} L/person/day). Review fixture efficiency, leaks, cleaning and irrigation assumptions.`,
        section: 'Domestic Water',
      });
    }
  }

  // Storage warnings
  if (results.storage) {
    const tankResults = results.tankDimensions;
    const totalEffective = tankResults.reduce((sum, t) => sum + t.effectiveVolume, 0);
    if (totalEffective < results.storage.requiredCapacity) {
      warnings.push({
        id: 'WRN-02',
        level: 'critical',
        message: 'Provided storage is below the calculated design requirement. Increase tank dimensions or add additional storage.',
        section: 'Storage',
      });
    }
    if (totalEffective > results.storage.requiredCapacity * 2) {
      warnings.push({
        id: 'WRN-03',
        level: 'info',
        message: 'Storage significantly exceeds normal operational requirement. Review water age, capital cost and maintenance implications.',
        section: 'Storage',
      });
    }
  }

  // Pump capacity
  if (results.pump && results.peakFlow) {
    if (results.pump.designFlow < results.peakFlow.probablePeakFlow * 0.9) {
      warnings.push({
        id: 'WRN-04',
        level: 'warning',
        message: 'Selected pump flow is below calculated peak demand. Verify pump selection against system requirements.',
        section: 'Pump Design',
      });
    }
  }

  // Pipe pressure
  results.pipes.forEach((p, i) => {
    if (p.residualPressure < 0) {
      warnings.push({
        id: `WRN-05-${i}`,
        level: 'warning',
        message: `Estimated residual pressure may be inadequate for ${p.pipe.label}. Pump boost may be required.`,
        section: 'Pipe Design',
      });
    }
  });

  // Data quality
  const assumptionCount = results.assumptions.length;
  if (assumptionCount > 5) {
    warnings.push({
      id: 'WRN-06',
      level: 'info',
      message: 'Several demand factors are engineering assumptions. Confirm against project requirements before detailed design.',
      section: 'Design Basis',
    });
  }

  // Fire water
  if (!data.fireWater.enabled) {
    warnings.push({
      id: 'WRN-07',
      level: 'warning',
      message: 'Fire-water requirements have not been reviewed. Verify against applicable fire authority requirements.',
      section: 'Fire Water',
    });
  }

  // No occupancy
  if (results.totalPopulation === 0) {
    warnings.push({
      id: 'WRN-08',
      level: 'critical',
      message: 'No occupancy entered. Enter population data to begin calculations.',
      section: 'Occupancy',
    });
  }

  return warnings;
}

// ============================================================
// 18. RECOMMENDATIONS
// ============================================================

export function generateRecommendations(
  data: ProjectData,
  results: AllResults
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (results.totalPopulation > 0) {
    recs.push({ id: 'REC-01', text: 'Install dual-flush WCs to reduce WC flushing water consumption by 30–50%.', category: 'Efficiency', priority: 'High' });
    recs.push({ id: 'REC-02', text: 'Install low-flow fixtures (aerated taps, showerheads) to reduce domestic water demand.', category: 'Efficiency', priority: 'High' });
  }

  if (data.rainwater.enabled && results.rainwater && results.rainwater.annualHarvested > 0) {
    recs.push({ id: 'REC-03', text: 'Use harvested rainwater for irrigation and WC flushing to reduce potable water consumption.', category: 'Sustainability', priority: 'High' });
  }

  if (data.greywater.enabled && results.greywater && results.greywater.reusableGreywater > 0) {
    recs.push({ id: 'REC-04', text: 'Consider treated greywater for WC flushing and landscape irrigation.', category: 'Sustainability', priority: 'Medium' });
  }

  if (results.storage && results.storage.requiredCapacity > 20) {
    recs.push({ id: 'REC-05', text: 'Divide storage into compartments to allow maintenance without losing supply.', category: 'Storage', priority: 'Medium' });
  }

  recs.push({ id: 'REC-06', text: 'Provide duty/standby pumps with automatic alternation for reliability.', category: 'Pumps', priority: 'High' });
  recs.push({ id: 'REC-07', text: 'Install water meters for major buildings and sub-meter workshops and hostel.', category: 'Monitoring', priority: 'Medium' });
  recs.push({ id: 'REC-08', text: 'Provide leak detection and install tank level sensors with overflow and low-level alarms.', category: 'Monitoring', priority: 'Medium' });

  if (data.rainwater.enabled || data.greywater.enabled) {
    recs.push({ id: 'REC-09', text: 'Monitor borewell/municipal consumption separately from rainwater and recycled water.', category: 'Monitoring', priority: 'Medium' });
  }

  if (results.sustainability && results.sustainability.efficiencyScore < 70) {
    recs.push({ id: 'REC-10', text: 'Consider introducing IoT water monitoring for real-time consumption tracking and anomaly detection.', category: 'Monitoring', priority: 'Low' });
  }

  return recs;
}

// ============================================================
// 19. ASSUMPTION REGISTER
// ============================================================

export function generateAssumptions(data: ProjectData): Assumption[] {
  const assumptions: Assumption[] = [];
  let no = 1;

  data.occupancy.forEach((g) => {
    if (g.classification === 'Engineering Assumption' && g.count > 0) {
      assumptions.push({
        no: no++,
        parameter: `${g.name} consumption rate`,
        adoptedValue: g.consumptionFactor.toString(),
        unit: g.unit,
        basis: g.source,
        reference: g.classification,
        verificationRequired: true,
        remarks: 'Confirm against project-specific requirements',
      });
    }
  });

  if (data.canteen.enabled && data.canteen.mealsPerDay > 0) {
    assumptions.push({
      no: no++,
      parameter: 'Canteen water per meal',
      adoptedValue: data.canteen.waterPerMeal.toString(),
      unit: 'L/meal',
      basis: data.canteen.source,
      reference: data.canteen.classification,
      verificationRequired: true,
      remarks: 'Varies with dishwashing method',
    });
  }

  assumptions.push({
    no: no++,
    parameter: 'Loss / Wastage allowance',
    adoptedValue: String(data.demandBasis.lossAllowancePct),
    unit: '%',
    basis: 'Engineering assumption',
    reference: 'Engineering Assumption',
    verificationRequired: true,
    remarks: 'Typical range 5–15%',
  });

  assumptions.push({
    no: no++,
    parameter: 'Future expansion allowance',
    adoptedValue: String(data.futureExpansion.enabled ? data.futureExpansion.percentageGrowth : 0),
    unit: '%',
    basis: 'Engineering assumption',
    reference: 'Engineering Assumption',
    verificationRequired: true,
    remarks: `Future year: ${data.futureExpansion.futureYear}`,
  });

  assumptions.push({
    no: no++,
    parameter: 'Maximum day factor',
    adoptedValue: String(data.demandBasis.maxDayFactor),
    unit: '—',
    basis: 'Engineering assumption',
    reference: 'Engineering Assumption',
    verificationRequired: true,
    remarks: 'Typical range 1.2–2.0',
  });

  assumptions.push({
    no: no++,
    parameter: 'Sewer return factor',
    adoptedValue: data.wastewater.sewerReturnFactor.toString(),
    unit: '%',
    basis: data.wastewater.source,
    reference: data.wastewater.classification,
    verificationRequired: true,
    remarks: 'Typical range 80–90%',
  });

  if (data.rainwater.enabled) {
    assumptions.push({
      no: no++,
      parameter: 'Annual rainfall',
      adoptedValue: data.rainwater.annualRainfall.toString(),
      unit: 'mm',
      basis: data.rainwater.source,
      reference: data.rainwater.classification,
      verificationRequired: true,
      remarks: 'Verify with local meteorological data',
    });
  }

  return assumptions;
}

// ============================================================
// 20. CALCULATION REGISTER
// ============================================================

export function generateCalcRegister(
  data: ProjectData,
  results: AllResults
): CalcRegisterEntry[] {
  const entries: CalcRegisterEntry[] = [];

  results.occupancy.forEach((r) => {
    entries.push({
      id: `OCC-${r.group.id}`,
      section: 'Occupancy',
      input: r.group.name,
      value: r.group.count.toString(),
      unit: 'persons',
      factor: r.group.consumptionFactor.toString(),
      source: r.group.source,
      formula: r.formula,
      result: roundTo(r.dailyDemand, 2).toString(),
      status: r.group.classification,
      notes: '',
    });
  });

  if (results.add) {
    entries.push({
      id: 'ADD-001',
      section: 'Average Daily Demand',
      input: 'Base Demand',
      value: results.add.baseDemand.toString(),
      unit: 'L/day',
      factor: `(1+${results.add.lossAllowancePct}%) × (1+${results.add.futureExpansionPct}%)`,
      source: 'Engineering assumption',
      formula: results.add.formula,
      result: results.add.finalADD.toString(),
      status: 'Engineering Assumption',
      notes: '',
    });
  }

  if (results.mdd) {
    entries.push({
      id: 'MDD-001',
      section: 'Maximum Daily Demand',
      input: 'ADD',
      value: results.mdd.add.toString(),
      unit: 'L/day',
      factor: results.mdd.maxDayFactor.toString(),
      source: 'Engineering assumption',
      formula: results.mdd.formula,
      result: results.mdd.mdd.toString(),
      status: 'Engineering Assumption',
      notes: '',
    });
  }

  if (results.peakFlow && results.peakFlow.totalFixtureUnits > 0) {
    entries.push({
      id: 'PF-001',
      section: 'Peak Fixture Demand',
      input: 'Total Loading Units',
      value: results.peakFlow.totalFixtureUnits.toString(),
      unit: 'LU',
      factor: 'Externally verified simultaneous flow',
      source: data.peakDesign.source,
      formula: results.peakFlow.formula,
      result: `${results.peakFlow.probablePeakFlow} L/s`,
      status: 'Guidance Value',
      notes: 'User-confirmed external calculation; independent engineering review required',
    });
  }

  if (results.storage) {
    entries.push({
      id: 'ST-001',
      section: 'Storage Design',
      input: 'Daily Demand',
      value: results.storage.dailyDemand.toString(),
      unit: 'm³/day',
      factor: `${data.storage.storageDuration} day(s) × reserve`,
      source: data.storage.source,
      formula: results.storage.formula,
      result: `${results.storage.requiredCapacity} m³`,
      status: data.storage.classification,
      notes: '',
    });
  }

  if (results.pump) {
    entries.push({
      id: 'PMP-001',
      section: 'Pump Design',
      input: 'Design Flow / TDH',
      value: `${results.pump.designFlow} L/s`,
      unit: 'L/s / m',
      factor: `(1+${data.pump.safetyMargin}%)`,
      source: data.pump.source,
      formula: results.pump.formula,
      result: `${results.pump.designFlowM3h} m³/h @ ${results.pump.tdh} m TDH`,
      status: data.pump.classification,
      notes: 'Verify with manufacturer pump curves',
    });
  }

  if (results.wastewater) {
    entries.push({
      id: 'WW-001',
      section: 'Wastewater',
      input: 'Indoor Demand',
      value: results.wastewater.indoorDemand.toString(),
      unit: 'L/day',
      factor: `${data.wastewater.sewerReturnFactor}%`,
      source: data.wastewater.source,
      formula: results.wastewater.formula,
      result: `${results.wastewater.totalWastewater} L/day`,
      status: data.wastewater.classification,
      notes: '',
    });
  }

  if (results.rainwater && results.rainwater.annualHarvested > 0) {
    entries.push({
      id: 'RWH-001',
      section: 'Rainwater Harvesting',
      input: 'Roof Area / Rainfall',
      value: `${data.rainwater.roofArea} / ${data.rainwater.annualRainfall}`,
      unit: 'm² / mm',
      factor: `RC=${data.rainwater.runoffCoefficient}, Eff=${data.rainwater.filterEfficiency}%×${data.rainwater.collectionEfficiency}%`,
      source: data.rainwater.source,
      formula: results.rainwater.formula,
      result: `${results.rainwater.annualHarvested} m³/year`,
      status: data.rainwater.classification,
      notes: '',
    });
  }

  return entries;
}

// ============================================================
// 21. DESIGN CHECKLIST
// ============================================================

export function generateChecklist(data: ProjectData, results: AllResults): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  const has = (cond: boolean) => cond ? 'Complete' : 'Review Required' as const;

  items.push({ id: 'CHK-01', text: 'Project data complete', status: has(!!data.projectInfo.projectName && !!data.projectInfo.client) });
  items.push({ id: 'CHK-02', text: 'Occupancy confirmed', status: has(results.totalPopulation > 0) });
  items.push({ id: 'CHK-03', text: 'Consumption rates confirmed', status: has(data.occupancy.some(g => g.count > 0) && data.occupancy.filter(g => g.count > 0).every(g => g.classification !== 'Engineering Assumption' && g.classification !== 'Verification Required')) });
  items.push({ id: 'CHK-04', text: 'Peak demand calculated', status: has(!!results.peakFlow && results.peakFlow.totalFixtureUnits > 0) });
  items.push({ id: 'CHK-05', text: 'Storage checked', status: has(!!results.storage && results.storage.requiredCapacity > 0 && results.storage.check) });
  items.push({ id: 'CHK-06', text: 'Tank dimensions checked', status: has(results.tankDimensions.length > 0 && results.tankDimensions.every((t) => t.status !== 'red')) });
  items.push({ id: 'CHK-07', text: 'Pumps checked against manufacturer data', status: 'Review Required' });
  items.push({ id: 'CHK-08', text: 'Pipe sizing checked', status: has(results.pipes.length > 0 && results.pipes.every(p => p.warnings.length === 0)) });
  items.push({ id: 'CHK-09', text: 'Wastewater calculated', status: has(!!results.wastewater && results.wastewater.indoorDemand > 0) });
  items.push({ id: 'CHK-10', text: 'Rainwater assessed', status: data.rainwater.enabled ? has((results.rainwater?.annualHarvested ?? 0) > 0) : 'Not Applicable' });
  items.push({ id: 'CHK-11', text: 'Greywater assessed', status: data.greywater.enabled ? has((results.greywater?.potableWaterReduction ?? 0) > 0) : 'Not Applicable' });
  items.push({ id: 'CHK-12', text: 'Fire water reviewed', status: 'Review Required' });
  items.push({ id: 'CHK-13', text: 'Sustainability calculated', status: has((results.add?.finalADD ?? 0) > 0) });
  items.push({ id: 'CHK-14', text: 'Standards checked', status: 'Review Required' });
  items.push({ id: 'CHK-15', text: 'Assumptions identified', status: has(results.assumptions.length > 0) });
  items.push({ id: 'CHK-16', text: 'Calculations independently verified', status: 'Review Required' });

  return items;
}

// ============================================================
// 22. COMPLETENESS & STATUS
// ============================================================

export function calculateCompletion(data: ProjectData, results: AllResults): number {
  const checklist = generateChecklist(data, results);
  const applicable = checklist.filter(item => item.status !== 'Not Applicable');
  return applicable.length ? Math.round(applicable.filter(item => item.status === 'Complete').length / applicable.length * 100) : 0;
}

// ============================================================
// MASTER CALCULATION — runs all modules
// ============================================================

export function calculateAll(data: ProjectData): AllResults {
  const occupancy = calculateOccupancyDemand(data);
  const domestic = calculateDomesticDemand(data, occupancy);
  const specialDemand = calculateSpecialDemand(data);

  const rainwater = calculateRainwaterHarvest(data);
  const wastewater = calculateWastewater(data, domestic, specialDemand);
  const greywater = calculateGreywaterReuse(data, wastewater);

  if (rainwater) {
    const eligible = Math.min(domestic?.totalDemand ?? 0, data.greywater.wcFlushingDemand) + (specialDemand?.irrigationDemand ?? 0) + (specialDemand?.cleaningDemand ?? 0);
    const remaining = Math.max(0, eligible - (greywater?.potableWaterReduction ?? 0));
    rainwater.nonPotableOffset = Math.min(rainwater.annualHarvested * 1000 / 365, remaining);
  }
  const waterBalance = calculateWaterBalance(data, domestic, specialDemand, occupancy, rainwater, greywater);
  const add = calculateADD(data, occupancy, domestic, specialDemand);
  const mdd = calculateMDD(add, data.demandBasis.maxDayFactor);
  const peakFlow = calculateFixturePeakFlow(data);
  const storage = calculateStorage(data, add);
  const tankDimensions = calculateTankVolume(data, storage);
  const pump = calculatePumpHead(data, peakFlow);
  const pipes = calculatePipeFlow(data, peakFlow);
  const fireWater = calculateFireWater(data);
  const sustainability = calculateSustainability(data, add, rainwater, greywater, wastewater);

  const totalPopulation = calculateTotalPopulation(data);
  const assumptions = generateAssumptions(data);
  const calcRegister: CalcRegisterEntry[] = [];
  const checklist: ChecklistItem[] = [];

  // Build partial results for warning generation
  const partialResults: AllResults = {
    occupancy,
    domestic,
    specialDemand,
    waterBalance,
    add,
    mdd,
    peakFlow,
    storage,
    tankDimensions,
    pump,
    pipes,
    wastewater,
    greywater,
    rainwater,
    fireWater,
    sustainability,
    totalPopulation,
    warnings: [],
    recommendations: [],
    assumptions,
    calcRegister,
    checklist,
    completionPct: 0,
    overallStatus: 'INCOMPLETE',
  };

  const warnings = generateWarnings(data, partialResults);
  const recommendations = generateRecommendations(data, partialResults);
  const completionPct = calculateCompletion(data, partialResults);

  const fullCalcRegister = generateCalcRegister(data, partialResults);
  const fullChecklist = generateChecklist(data, partialResults);

  const overallStatus: 'PASS' | 'REVIEW' | 'INCOMPLETE' =
    completionPct < 50 ? 'INCOMPLETE' : warnings.length === 0 && fullChecklist.every(item => item.status !== 'Review Required') ? 'PASS' : 'REVIEW';

  return {
    ...partialResults,
    warnings,
    recommendations,
    calcRegister: fullCalcRegister,
    checklist: fullChecklist,
    completionPct,
    overallStatus,
  };
}
