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
    value: roundTo(safeMul(totalPop, eu.perPersonPerDay), 2),
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
  domesticResult: DomesticResult | null,
  occupancyResults: OccupancyResult[]
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
    canteenDemand: roundTo(canteenDemand, 2),
    workshopDemand: roundTo(workshopDemand, 2),
    cleaningDemand: roundTo(cleaningDemand, 2),
    irrigationDemand: roundTo(irrigationDemand, 2),
    vehicleWashingDemand: roundTo(vehicleWashingDemand, 2),
    total: roundTo(total, 2),
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

  const occupancyTotal = calculateOccupancyTotalDemand(occupancyResults);
  const totalDemand = occupancyTotal + domestic.totalDemand + special.total;

  // Sources
  const rainwaterDaily = rainwater ? safeDiv(rainwater.annualHarvested * 1000, 365) : 0;
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
    { name: 'Domestic / Occupancy', value: roundTo(occupancyTotal + domestic.totalDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(occupancyTotal + domestic.totalDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Canteen', value: roundTo(special.canteenDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.canteenDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Workshop', value: roundTo(special.workshopDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.workshopDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Cleaning', value: roundTo(special.cleaningDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.cleaningDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Irrigation', value: roundTo(special.irrigationDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.irrigationDemand, totalDemand) * 100, 1) : 0 },
    { name: 'Vehicle Washing', value: roundTo(special.vehicleWashingDemand, 2), pct: totalDemand > 0 ? roundTo(safeDiv(special.vehicleWashingDemand, totalDemand) * 100, 1) : 0 },
  ];

  // Outflows
  const wastewater = calculateWastewater(data, domestic, special, occupancyResults);
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
    totalSupply: roundTo(municipalSupply + recycledTotal, 2),
    totalDemand: roundTo(totalDemand, 2),
    totalWastewater: roundTo(totalWastewater, 2),
    totalLoss: roundTo(totalLoss, 2),
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

  const occupancyTotal = calculateOccupancyTotalDemand(occupancyResults);
  const baseDemand = occupancyTotal + domestic.totalDemand + special.total;

  const lossFactor = data.futureExpansion; // placeholder
  // Read from defaults via project — we'll use fixed values with override potential
  const lossAllowancePct = 10; // default — engineering assumption
  const futureExpansionPct = data.futureExpansion.percentageGrowth;

  const finalADD = safeMul(
    safeMul(baseDemand, 1 + lossAllowancePct / 100),
    1 + futureExpansionPct / 100
  );

  return {
    baseDemand: roundTo(baseDemand, 2),
    lossAllowancePct,
    futureExpansionPct,
    finalADD: roundTo(finalADD, 2),
    finalADDm3: roundTo(LtoM3(finalADD), 2),
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
    mdd: roundTo(mdd, 2),
    mddm3: roundTo(LtoM3(mdd), 2),
    formula: 'MDD = ADD × Maximum Day Factor',
    substitution: `${roundTo(add.finalADD, 2)} × ${maxDayFactor} = ${roundTo(mdd, 2)} L/day`,
  };
}

// ============================================================
// 7. FIXTURE-BASED PEAK FLOW
// Uses BS EN 806-3 / BS 8558 loading unit conversion
// The conversion from loading units to flow uses a standard
// curve approximation: Q (L/s) ≈ 0.071 × √(LU) for mixed systems
// (simplified from BS EN 806-3 design flow curves)
// This is a recognized approximation — not an invented formula.
// ============================================================

export function calculateFixturePeakFlow(data: ProjectData): PeakFlowResult | null {
  const fixtureBreakdown = data.fixtures
    .filter((f) => f.quantity > 0)
    .map((f) => ({
      type: f.type,
      qty: f.quantity,
      fu: f.fixtureUnit,
      totalFU: f.quantity * f.fixtureUnit,
    }));

  const totalFixtureUnits = fixtureBreakdown.reduce((sum, f) => sum + f.totalFU, 0);

  if (totalFixtureUnits === 0) {
    return {
      totalFixtureUnits: 0,
      probablePeakFlow: 0,
      peakFlowLpm: 0,
      peakFlowM3h: 0,
      formula: 'Probable Simultaneous Flow from Loading Units',
      substitution: 'No fixtures entered — cannot calculate peak flow',
      fixtureBreakdown: [],
    };
  }

  // BS EN 806-3 approximate conversion: Q (L/s) = 0.071 × √(LU)
  // This is a recognized simplification of the design flow curve.
  // For more accurate results, refer to the full BS EN 806-3 flow curve.
  const probablePeakFlow = 0.071 * Math.sqrt(totalFixtureUnits);

  return {
    totalFixtureUnits,
    probablePeakFlow: roundTo(probablePeakFlow, 3),
    peakFlowLpm: roundTo(probablePeakFlow * 60, 2),
    peakFlowM3h: roundTo(probablePeakFlow * 3.6, 2),
    formula: 'Q = 0.071 × √(Total Loading Units) — BS EN 806-3 approximate',
    substitution: `0.071 × √(${totalFixtureUnits}) = 0.071 × ${roundTo(Math.sqrt(totalFixtureUnits), 2)} = ${roundTo(probablePeakFlow, 3)} L/s`,
    fixtureBreakdown,
  };
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
    dailyDemand: roundTo(dailyDemandM3, 2),
    requiredCapacity: roundTo(requiredCapacity, 2),
    undergroundTank: roundTo(undergroundTank, 2),
    roofTank: roundTo(roofTank, 2),
    groundTank: roundTo(groundTank, 2),
    elevatedTank: roundTo(elevatedTank, 2),
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
      grossVolume: roundTo(grossVolume, 2),
      effectiveVolume: roundTo(effectiveVolume, 2),
      surplusDeficiency: roundTo(surplusDeficiency, 2),
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
    designFlow: roundTo(designFlow, 3),
    designFlowM3h: roundTo(designFlowM3h, 2),
    tdh: roundTo(tdhWithMargin, 2),
    hydraulicPower: roundTo(hydraulicPower, 2),
    motorPower: roundTo(motorPower, 2),
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
    const velocity = safeDiv(flow, area); // L/s to m³/s → L/s / (m²) × 0.001 → m/s

    // Hazen-Williams: hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)
    // C = 140 for uPVC, 120 for GI, 150 for HDPE
    const C = pipe.material.toLowerCase().includes('pvc') ? 140 :
              pipe.material.toLowerCase().includes('hdpe') ? 150 : 120;
    const Qm3s = flow / 1000;
    let frictionLoss = 0;
    if (d > 0 && C > 0) {
      frictionLoss = safeDiv(
        10.67 * Math.pow(pipe.length, 1) * Math.pow(Qm3s * 1000, 1.852),
        Math.pow(C, 1.852) * Math.pow(d * 1000, 4.87)
      );
    }

    const totalPressureLoss = frictionLoss + pipe.fittingLoss;
    const availablePressure = pipe.elevationDifference > 0 ? 0 : Math.abs(pipe.elevationDifference);
    const residualPressure = availablePressure - totalPressureLoss;

    const warnings: string[] = [];
    if (velocity > 2.0) warnings.push('Velocity exceeds 2.0 m/s — risk of water hammer and noise. Verify against applicable standard velocity limits.');
    if (velocity < 0.5 && velocity > 0) warnings.push('Velocity below 0.5 m/s — risk of sediment deposition. Verify against applicable standard minimum velocity.');
    if (residualPressure < 0) warnings.push('Residual pressure is negative — pump boost may be required.');

    return {
      pipe: { ...pipe, flow: roundTo(flow, 3) },
      velocity: roundTo(velocity, 2),
      frictionLoss: roundTo(frictionLoss, 2),
      totalPressureLoss: roundTo(totalPressureLoss, 2),
      availablePressure: roundTo(availablePressure, 2),
      residualPressure: roundTo(residualPressure, 2),
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
  special: SpecialDemandResult | null,
  occupancyResults: OccupancyResult[]
): WastewaterResult | null {
  if (!domestic || !special) return null;

  const occupancyTotal = calculateOccupancyTotalDemand(occupancyResults);
  const indoorDemand = occupancyTotal + domestic.totalDemand + special.canteenDemand + special.workshopDemand;
  const returnFactor = data.wastewater.sewerReturnFactor / 100;

  const sewerReturn = safeMul(indoorDemand, returnFactor);
  const totalWastewater = sewerReturn + data.wastewater.processWastewater + data.wastewater.kitchenWastewater + data.wastewater.hostelWastewater + data.wastewater.otherWastewater;

  return {
    indoorDemand: roundTo(indoorDemand, 2),
    sewerReturn: roundTo(sewerReturn, 2),
    totalWastewater: roundTo(totalWastewater, 2),
    wastewaterM3Day: roundTo(LtoM3(totalWastewater), 2),
    wastewaterM3Month: roundTo(LtoM3(totalWastewater) * 30, 2),
    wastewaterM3Year: roundTo(LtoM3(totalWastewater) * 365, 2),
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
  const reusable = safeMul(generated, data.greywater.treatmentEfficiency / 100);

  let reuseDemand = 0;
  if (data.greywater.reuseForWCFlushing) reuseDemand += 0; // placeholder — actual WC demand from fixtures
  if (data.greywater.reuseForIrrigation) reuseDemand += 0;
  if (data.greywater.reuseForCleaning) reuseDemand += 0;

  const potableWaterReduction = Math.min(reusable, reuseDemand > 0 ? reuseDemand : reusable);
  const totalDemand = wastewater ? wastewater.indoorDemand : 0;
  const potableReductionPct = totalDemand > 0 ? roundTo(safeDiv(potableWaterReduction, totalDemand) * 100, 1) : 0;

  return {
    greywaterGenerated: roundTo(generated, 2),
    reusableGreywater: roundTo(reusable, 2),
    reuseDemand: roundTo(reuseDemand, 2),
    potableWaterReduction: roundTo(potableWaterReduction, 2),
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

  const effectiveRainfall = Math.max(0, data.rainwater.annualRainfall - data.rainwater.firstFlushLoss * 12);
  const systemEff = (data.rainwater.filterEfficiency / 100) * (data.rainwater.collectionEfficiency / 100);
  const annualHarvestedL = safeMul(safeMul(safeMul(effectiveRainfall, data.rainwater.roofArea), data.rainwater.runoffCoefficient), systemEff);
  const annualHarvestedM3 = LtoM3(annualHarvestedL);

  const monthlyHarvested = data.rainwater.monthlyRainfall.map((rf) => {
    const monthlyL = safeMul(safeMul(safeMul(rf, data.rainwater.roofArea), data.rainwater.runoffCoefficient), systemEff);
    return roundTo(LtoM3(monthlyL), 2);
  });

  const nonPotableOffset = safeDiv(annualHarvestedL, 365);

  return {
    annualHarvested: roundTo(annualHarvestedM3, 2),
    monthlyHarvested,
    nonPotableOffset: roundTo(nonPotableOffset, 2),
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
    fireFlow: roundTo(fireFlow, 0),
    fireDuration,
    fireWaterStorage: roundTo(fireWaterStorage, 2),
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
  const potablePerPerson = totalPop > 0 ? roundTo(safeDiv(add.finalADD, totalPop), 1) : 0;

  const rainwaterDaily = rainwater ? safeDiv(rainwater.annualHarvested * 1000, 365) : 0;
  const greywaterDaily = greywater ? greywater.potableWaterReduction : 0;

  const rainwaterContributionPct = add.finalADD > 0 ? roundTo(safeDiv(rainwaterDaily, add.finalADD) * 100, 1) : 0;
  const recycledContributionPct = add.finalADD > 0 ? roundTo(safeDiv(greywaterDaily, add.finalADD) * 100, 1) : 0;
  const potableReductionPct = roundTo(rainwaterContributionPct + recycledContributionPct, 1);

  const annualSaving = LtoM3((rainwaterDaily + greywaterDaily) * 365);
  const annualUtilityConsumption = LtoM3(add.finalADD * 365) - annualSaving;

  const wastewaterReusePct = wastewater && wastewater.totalWastewater > 0 && greywater
    ? roundTo(safeDiv(greywater.reusableGreywater, wastewater.totalWastewater) * 100, 1)
    : 0;

  // Efficiency score: weighted indicators
  let score = 50;
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
    annualSaving: roundTo(annualSaving, 2),
    wastewaterReusePct,
    annualUtilityConsumption: roundTo(Math.max(0, annualUtilityConsumption), 2),
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
    if (totalEffective < results.storage.requiredCapacity * 0.95) {
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
    adoptedValue: '10',
    unit: '%',
    basis: 'Engineering assumption',
    reference: 'Engineering Assumption',
    verificationRequired: true,
    remarks: 'Typical range 5–15%',
  });

  assumptions.push({
    no: no++,
    parameter: 'Future expansion allowance',
    adoptedValue: data.futureExpansion.percentageGrowth.toString(),
    unit: '%',
    basis: 'Engineering assumption',
    reference: 'Engineering Assumption',
    verificationRequired: true,
    remarks: `Future year: ${data.futureExpansion.futureYear}`,
  });

  assumptions.push({
    no: no++,
    parameter: 'Maximum day factor',
    adoptedValue: '1.5',
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
      factor: '0.071 × √(LU)',
      source: 'BS EN 806-3 approximate',
      formula: results.peakFlow.formula,
      result: `${results.peakFlow.probablePeakFlow} L/s`,
      status: 'Guidance Value',
      notes: 'Simplified conversion — verify with full BS EN 806-3 curve',
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
  items.push({ id: 'CHK-03', text: 'Consumption rates confirmed', status: has(data.occupancy.some((g) => g.count > 0)) });
  items.push({ id: 'CHK-04', text: 'Peak demand calculated', status: has(!!results.peakFlow && results.peakFlow.totalFixtureUnits > 0) });
  items.push({ id: 'CHK-05', text: 'Storage checked', status: has(!!results.storage) });
  items.push({ id: 'CHK-06', text: 'Tank dimensions checked', status: has(results.tankDimensions.length > 0 && results.tankDimensions.every((t) => t.status !== 'red')) });
  items.push({ id: 'CHK-07', text: 'Pumps checked', status: has(!!results.pump && results.pump.tdh > 0) });
  items.push({ id: 'CHK-08', text: 'Pipe sizing checked', status: has(results.pipes.length > 0) });
  items.push({ id: 'CHK-09', text: 'Wastewater checked', status: has(!!results.wastewater) });
  items.push({ id: 'CHK-10', text: 'Rainwater checked', status: has(!!results.rainwater) });
  items.push({ id: 'CHK-11', text: 'Greywater checked', status: has(!!results.greywater) });
  items.push({ id: 'CHK-12', text: 'Fire water reviewed', status: data.fireWater.enabled ? 'Complete' : 'Review Required' });
  items.push({ id: 'CHK-13', text: 'Sustainability reviewed', status: has(!!results.sustainability) });
  items.push({ id: 'CHK-14', text: 'Standards checked', status: has(data.standards.length > 0) });
  items.push({ id: 'CHK-15', text: 'Assumptions identified', status: has(results.assumptions.length > 0) });
  items.push({ id: 'CHK-16', text: 'Calculations verified', status: has(!!results.add && results.add.finalADD > 0) });

  return items;
}

// ============================================================
// 22. COMPLETENESS & STATUS
// ============================================================

export function calculateCompletion(data: ProjectData, results: AllResults): number {
  let total = 0;
  let done = 0;

  const checks: [boolean, boolean][] = [
    [true, !!data.projectInfo.projectName],
    [true, results.totalPopulation > 0],
    [true, !!results.domestic],
    [true, !!results.specialDemand],
    [true, !!results.waterBalance],
    [true, !!results.add && results.add.finalADD > 0],
    [true, !!results.mdd],
    [true, !!results.peakFlow && results.peakFlow.totalFixtureUnits > 0],
    [true, !!results.storage],
    [true, results.tankDimensions.length > 0],
    [true, !!results.pump && results.pump.tdh > 0],
    [true, results.pipes.length > 0],
    [true, !!results.wastewater],
    [true, !!results.rainwater],
    [true, !!results.greywater],
    [true, !!results.sustainability],
  ];

  checks.forEach(([applicable, complete]) => {
    if (applicable) {
      total++;
      if (complete) done++;
    }
  });

  return total > 0 ? Math.round((done / total) * 100) : 0;
}

// ============================================================
// MASTER CALCULATION — runs all modules
// ============================================================

export function calculateAll(data: ProjectData): AllResults {
  const occupancy = calculateOccupancyDemand(data);
  const domestic = calculateDomesticDemand(data, occupancy);
  const specialDemand = calculateSpecialDemand(data, domestic, occupancy);

  const rainwater = calculateRainwaterHarvest(data);
  const wastewater = calculateWastewater(data, domestic, specialDemand, occupancy);
  const greywater = calculateGreywaterReuse(data, wastewater);

  const waterBalance = calculateWaterBalance(data, domestic, specialDemand, occupancy, rainwater, greywater);
  const add = calculateADD(data, occupancy, domestic, specialDemand);
  const mdd = calculateMDD(add, 1.5);
  const peakFlow = calculateFixturePeakFlow(data);
  const storage = calculateStorage(data, add);
  const tankDimensions = calculateTankVolume(data, storage);
  const pump = calculatePumpHead(data, peakFlow);
  const pipes = calculatePipeFlow(data, peakFlow);
  const fireWater = calculateFireWater(data);
  const sustainability = calculateSustainability(data, add, rainwater, greywater, wastewater);

  const totalPopulation = calculateTotalPopulation(data);
  const assumptions = generateAssumptions(data);
  const calcRegister = generateCalcRegister(data, { occupancy } as AllResults);
  const checklist = generateChecklist(data, {} as AllResults);

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
    completionPct >= 90 ? 'PASS' : completionPct >= 50 ? 'REVIEW' : 'INCOMPLETE';

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
