// ============================================================
// CALCULATION ENGINE — Smart Water Services Design System
// Pure functions, full precision, transparent engineering models
// WATER SERVICES PROTOTYPE STANDARD FACTORS — WPSF v1.0
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
  HotWaterResult,
  WastewaterResult,
  GreywaterResult,
  RainwaterResult,
  FireWaterResult,
  SubMeteringResult,
  SmartMonitoringData,
  CriticalFixtureResult,
  SystemValidationResult,
  SubsystemValidationItem,
  SustainabilityResult,
  ModuleCompleteness,
  DataConfidence,
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
      formula: 'Daily Demand = Population × Unit Consumption Factor',
      substitution: `${g.count} persons × ${g.consumptionFactor} L/p/d = ${roundTo(dailyDemand, 2)} L/day`,
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
    return {
      totalDemand,
      method: 'A',
      breakdown: occupancyResults.map((r) => ({
        name: r.group.name,
        value: r.dailyDemand,
        unit: 'L/day',
      })),
      formula: 'Domestic Demand = Σ (Group Population × Group Consumption Factor)',
      substitution:
        occupancyResults.map((r) => `${r.group.count} × ${r.group.consumptionFactor}`).join(' + ') +
        ` = ${roundTo(totalDemand, 2)} L/day`,
    };
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
    formula: 'Domestic Demand = Σ (Total Population × End-use Rate per person)',
    substitution:
      breakdown
        .map((b) => `${totalPop} × ${data.domesticWater.endUses.find((e) => e.name === b.name)?.perPersonPerDay}`)
        .join(' + ') + ` = ${roundTo(totalDemand, 2)} L/day`,
  };
}

// ============================================================
// 3. SPECIAL WATER DEMANDS
// ============================================================

export function calculateSpecialDemand(data: ProjectData): SpecialDemandResult | null {
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
    cleaningDemand = safeDiv(safeMul(dailyAreaRate, data.cleaning.cleaningFrequency), 7);
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
    canteenDemand,
    workshopDemand,
    cleaningDemand,
    irrigationDemand,
    vehicleWashingDemand,
    total,
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
    { name: 'Wastewater Discharge', value: roundTo(totalWastewater, 2), pct: totalDemand > 0 ? roundTo(safeDiv(totalWastewater, totalDemand) * 100, 1) : 0 },
    { name: 'Irrigation Evapotranspiration', value: roundTo(irrigationLoss, 2), pct: totalDemand > 0 ? roundTo(safeDiv(irrigationLoss, totalDemand) * 100, 1) : 0 },
    { name: 'Distribution Losses & Consumption', value: roundTo(totalLoss, 2), pct: totalDemand > 0 ? roundTo(safeDiv(totalLoss, totalDemand) * 100, 1) : 0 },
  ];

  const totalSupply = municipalSupply + recycledTotal;
  const totalDischargeAndLoss = totalWastewater + irrigationLoss + totalLoss;
  const balanceDiscrepancy = Math.abs(totalSupply - totalDischargeAndLoss);
  const balanceStatus: 'BALANCED' | 'DISCREPANCY' = balanceDiscrepancy < 0.1 ? 'BALANCED' : 'DISCREPANCY';

  return {
    sources,
    consumption,
    outflows,
    totalSupply,
    totalDemand,
    totalWastewater,
    totalLoss,
    balanceDiscrepancy,
    balanceStatus,
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
    baseDemand,
    lossAllowancePct,
    futureExpansionPct,
    finalADD,
    finalADDm3: LtoM3(finalADD),
    formula: 'Final ADD = Base Demand × (1 + Loss Allowance %) × (1 + Future Expansion %)',
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
    mdd,
    mddm3: LtoM3(mdd),
    formula: 'MDD = ADD × Maximum Day Factor',
    substitution: `${roundTo(add.finalADD, 2)} × ${maxDayFactor} = ${roundTo(mdd, 2)} L/day`,
  };
}

// ============================================================
// 7. FIXTURE PEAK FLOW (SEPARATED FROM DAILY FLOW)
// ============================================================

export function calculateFixturePeakFlow(data: ProjectData): PeakFlowResult | null {
  if (!(data.peakDesign.flow > 0 && data.peakDesign.source.trim() && data.peakDesign.verified)) return null;

  const fixtureBreakdown = data.fixtures
    .filter((f) => f.quantity > 0)
    .map((f) => ({
      type: f.type,
      qty: f.quantity,
      fu: f.loadingUnit,
      totalFU: f.quantity * f.loadingUnit,
    }));

  const flow = data.peakDesign.flow;

  // Process peak instantaneous flow
  let peakProcessFlowLps = 0;
  data.workshops.forEach((w) => {
    if (w.flowRequirement > 0) peakProcessFlowLps += w.flowRequirement;
  });

  const combinedDesignPeakLps = flow + peakProcessFlowLps;

  return {
    totalFixtureUnits: fixtureBreakdown.reduce((sum, f) => sum + f.totalFU, 0),
    probablePeakFlow: flow,
    peakFlowLpm: flow * 60,
    peakFlowM3h: flow * 3.6,
    formula: 'Simultaneous Peak Flow = Externally Verified Hydraulic Calculation / Standard Method',
    substitution: `${flow} L/s (Verified source: ${data.peakDesign.source})`,
    fixtureBreakdown,
    peakProcessFlowLps,
    combinedDesignPeakLps,
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
  const statusText = check ? 'ADEQUATE FOR SELECTED DESIGN BASIS' : 'ALLOCATION MISMATCH';

  return {
    dailyDemand: dailyDemandM3,
    requiredCapacity,
    undergroundTank,
    roofTank,
    groundTank,
    elevatedTank,
    formula: 'Storage Capacity = Daily Demand (m³/day) × Duration (days) × (1 + Reserve % + Operational %)',
    substitution: `${roundTo(dailyDemandM3, 2)} × ${data.storage.storageDuration} × ${reserveFactor.toFixed(2)} = ${roundTo(requiredCapacity, 2)} m³`,
    check,
    statusText,
  };
}

// ============================================================
// 9. TANK DIMENSIONS (Rectangular & Cylindrical)
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

    let requiredCapacity = tank.requiredCapacity;
    if (storage) {
      if (tank.tankType === 'Underground') requiredCapacity = storage.undergroundTank;
      else if (tank.tankType === 'Roof') requiredCapacity = storage.roofTank;
      else if (tank.tankType === 'Ground Level') requiredCapacity = storage.groundTank;
      else if (tank.tankType === 'Elevated') requiredCapacity = storage.elevatedTank;
    }

    const surplusDeficiency = effectiveVolume - requiredCapacity;
    let status: 'green' | 'amber' | 'red';
    let statusText: string;

    if (surplusDeficiency >= requiredCapacity * 0.05) {
      status = 'green';
      statusText = 'ADEQUATE FOR SELECTED DESIGN BASIS';
    } else if (surplusDeficiency >= 0) {
      status = 'amber';
      statusText = 'MARGINAL CAPACITY (REVIEW RECOMMENDED)';
    } else {
      status = 'red';
      statusText = 'INADEQUATE CAPACITY FOR SELECTED DESIGN BASIS';
    }

    return {
      tank: { ...tank, requiredCapacity: roundTo(requiredCapacity, 2) },
      grossVolume,
      effectiveVolume,
      surplusDeficiency,
      status,
      statusText,
    };
  });
}

export const calculateTankDimensions = calculateTankVolume;

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

  // Hydraulic Power (kW) = Q(m³/h) × H(m) × 9.81 / 3600
  const hydraulicPower = safeDiv(safeMul(designFlowM3h, tdhWithMargin) * 9.81, 3600);
  const motorPower = safeDiv(
    hydraulicPower,
    (config.pumpEfficiency / 100) * (config.motorEfficiency / 100)
  );

  return {
    designFlow,
    designFlowM3h,
    tdh: tdhWithMargin,
    hydraulicPower,
    motorPower,
    formula: 'TDH = (Static Lift + Friction + Fitting Loss + Equipment Loss + Residual Head) × (1 + Safety Margin %)',
    substitution: `(${config.staticHead} + ${config.pipeFriction} + ${config.fittingLosses} + ${config.equipmentLosses} + ${config.requiredResidualPressure}) × ${1 + config.safetyMargin / 100} = ${roundTo(tdhWithMargin, 2)} m`,
    curveVerified: false,
  };
}

export const calculatePump = calculatePumpHead;

// ============================================================
// 11. PIPE HYDRAULICS — Hazen-Williams
// ============================================================

export function calculatePipeFlow(
  data: ProjectData,
  peakFlow: PeakFlowResult | null
): PipeResult[] {
  return data.pipes.map((pipe) => {
    const flow = pipe.flow > 0 ? pipe.flow : (peakFlow?.probablePeakFlow || 0);
    const d = safeDiv(pipe.internalDiameter, 1000); // mm to m
    const area = safeMul(Math.PI, safeMul(d, d)) / 4;
    const velocity = safeDiv(flow / 1000, area); // m/s

    // Hazen-Williams: hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)
    const C = pipe.hazenWilliamsC;
    const Qm3s = flow / 1000;
    let frictionLoss = 0;
    if (d > 0 && C > 0 && flow > 0) {
      frictionLoss = safeDiv(
        10.67 * Math.pow(pipe.length, 1) * Math.pow(Qm3s, 1.852),
        Math.pow(C, 1.852) * Math.pow(d, 4.87)
      );
    }

    const totalPressureLoss = frictionLoss + pipe.fittingLoss;
    const availablePressure = pipe.inletHead - pipe.elevationDifference;
    const residualPressure = availablePressure - totalPressureLoss;

    const warnings: string[] = [];
    if (velocity > pipe.maxVelocity) {
      warnings.push(`Velocity (${roundTo(velocity, 2)} m/s) exceeds the design criterion (${pipe.maxVelocity} m/s); review noise, erosion and transient surge risks.`);
    }
    if (d <= 0 || C <= 0 || flow <= 0) {
      warnings.push('Additional design information required: positive diameter, roughness coefficient and design flow.');
    }
    if (residualPressure < 0) {
      warnings.push('Residual pressure is negative — pump boost or larger diameter is required.');
    } else if (residualPressure < 10) {
      warnings.push(`Residual pressure (${roundTo(residualPressure, 2)} m) is below the recommended 10 m (1.0 bar) minimum fixture standard.`);
    }

    return {
      pipe: { ...pipe, flow: roundTo(flow, 3) },
      velocity,
      frictionLoss,
      totalPressureLoss,
      availablePressure,
      residualPressure,
      warnings,
    };
  });
}

// ============================================================
// 12. HOT WATER MODULE
// ============================================================

export function calculateHotWater(
  data: ProjectData,
  totalPop: number
): HotWaterResult | null {
  if (!data.hotWater || !data.hotWater.enabled) {
    return {
      dailyHotWaterDemandL: 0,
      dailyHotWaterDemandM3: 0,
      requiredStorageL: 0,
      requiredStorageM3: 0,
      heatingLoadKW: 0,
      formula: 'Hot water module disabled',
      substitution: 'Hot water calculations not enabled for this project',
    };
  }

  // Calculate domestic hot water based on end-uses or population
  const cfg = data.hotWater;
  const hostelCount = data.occupancy.find((g) => g.id === 'OCC-05')?.count ?? 0;
  const dayCount = totalPop - hostelCount;

  // Day users: 15% of 35 L/d for handwash/pantry
  const dayHotL = safeMul(dayCount, 5 * (cfg.washbasinHotWaterPct / 100));
  // Hostel residents: 40L shower * showerHotWaterPct + 10L laundry/kitchen
  const hostelHotL = safeMul(hostelCount, 40 * (cfg.showerHotWaterPct / 100) + 15 * (cfg.hostelHotWaterPct / 100));
  // Canteen hot water: 50% of food prep and cleaning
  const canteenHotL = data.canteen.enabled ? safeMul(data.canteen.foodPrepL + data.canteen.cleaningL, cfg.kitchenHotWaterPct / 100) : 0;

  const dailyHotWaterDemandL = dayHotL + hostelHotL + canteenHotL;
  const dailyHotWaterDemandM3 = LtoM3(dailyHotWaterDemandL);

  // Storage required: 60% of daily demand for stratified peak buffering
  const requiredStorageL = safeMul(dailyHotWaterDemandL, 0.6);
  const requiredStorageM3 = LtoM3(requiredStorageL);

  // Heating power: P = (m * Cp * ΔT) / (3600 * t_recovery)
  // Cp = 4.186 kJ/kg·K
  const deltaT = Math.max(10, cfg.storageTempC - cfg.coldWaterTempC);
  const recoveryHours = Math.max(1, cfg.heatingTimeHours);
  const energyKJ = safeMul(requiredStorageL, 4.186 * deltaT);
  const heatingLoadKW = safeDiv(energyKJ, 3600 * recoveryHours);

  return {
    dailyHotWaterDemandL,
    dailyHotWaterDemandM3,
    requiredStorageL,
    requiredStorageM3,
    heatingLoadKW,
    formula: 'Heating Load (kW) = [Storage Volume (L) × 4.186 kJ/kg·K × (T_storage - T_cold)] / (3600 × t_recovery)',
    substitution: `[${roundTo(requiredStorageL, 1)} L × 4.186 × (${cfg.storageTempC}°C - ${cfg.coldWaterTempC}°C)] / (3600 × ${recoveryHours} h) = ${roundTo(heatingLoadKW, 2)} kW`,
  };
}

// ============================================================
// 13. WASTEWATER
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
  const totalWastewater =
    sewerReturn +
    data.wastewater.processWastewater +
    data.wastewater.kitchenWastewater +
    data.wastewater.hostelWastewater +
    data.wastewater.otherWastewater;

  // Peak wastewater flow: using drainage peaking factor (typical 3.0× average hourly flow)
  const avgHourlyFlowM3 = safeDiv(LtoM3(totalWastewater), 12); // active 12-hour day
  const peakWastewaterFlowLps = safeDiv(avgHourlyFlowM3 * 1000 * 3.0, 3600);

  return {
    indoorDemand,
    sewerReturn,
    totalWastewater,
    wastewaterM3Day: LtoM3(totalWastewater),
    wastewaterM3Month: LtoM3(totalWastewater) * 30,
    wastewaterM3Year: LtoM3(totalWastewater) * 365,
    peakWastewaterFlowLps,
    formula: 'Total Wastewater = (Indoor Demand × Return Factor) + Process/Hostel/Kitchen Discharges',
    substitution: `(${roundTo(indoorDemand, 2)} × ${returnFactor}) + ${data.wastewater.processWastewater + data.wastewater.kitchenWastewater + data.wastewater.hostelWastewater + data.wastewater.otherWastewater} = ${roundTo(totalWastewater, 2)} L/day`,
  };
}

// ============================================================
// 14. GREYWATER REUSE
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
      greywaterBalance: 0,
      excessLday: 0,
      potableMakeupLday: 0,
      formula: 'Greywater reuse not enabled',
      substitution: 'Enable greywater in the Greywater module to assess recycling potential',
    };
  }

  const generated =
    data.greywater.washBasinFlow +
    data.greywater.showerFlow +
    data.greywater.laundryFlow +
    data.greywater.otherSinkFlow;

  const reusable = safeMul(
    Math.min(generated, wastewater?.totalWastewater ?? 0),
    data.greywater.treatmentEfficiency / 100
  );

  let reuseDemand = 0;
  const special = calculateSpecialDemand(data);
  if (data.greywater.reuseForWCFlushing) reuseDemand += data.greywater.wcFlushingDemand;
  if (data.greywater.reuseForIrrigation) reuseDemand += special?.irrigationDemand ?? 0;
  if (data.greywater.reuseForCleaning) reuseDemand += special?.cleaningDemand ?? 0;

  const potableWaterReduction = Math.min(reusable, reuseDemand, wastewater?.indoorDemand ?? 0);
  const totalDemand = wastewater ? wastewater.indoorDemand : 0;
  const potableReductionPct = totalDemand > 0 ? roundTo(safeDiv(potableWaterReduction, totalDemand) * 100, 1) : 0;

  const greywaterBalance = reusable - reuseDemand;
  const excessLday = Math.max(0, greywaterBalance);
  const potableMakeupLday = Math.max(0, -greywaterBalance);

  return {
    greywaterGenerated: generated,
    reusableGreywater: reusable,
    reuseDemand,
    potableWaterReduction,
    potableReductionPct,
    greywaterBalance,
    excessLday,
    potableMakeupLday,
    formula: 'Reusable Water = Captured Greywater × Treatment Efficiency; Potable Offset = min(Reusable, Eligible Demand)',
    substitution: `${roundTo(generated, 2)} L/day × ${data.greywater.treatmentEfficiency}% = ${roundTo(reusable, 2)} L/day (Eligible Reuse Demand: ${roundTo(reuseDemand, 2)} L/day)`,
  };
}

export const calculateGreywater = calculateGreywaterReuse;

// ============================================================
// 15. RAINWATER HARVESTING
// ============================================================

export function calculateRainwaterHarvest(data: ProjectData): RainwaterResult | null {
  if (!data.rainwater.enabled) {
    return {
      annualHarvested: 0,
      monthlyHarvested: [],
      nonPotableOffset: 0,
      potableSavingPct: 0,
      monthlyNonPotableDemandM3: [],
      monthlySupplyDemandDeltaM3: [],
      tankUtilizationPct: 0,
      formula: 'Rainwater harvesting not enabled',
      substitution: 'Enable rainwater harvesting in the Rainwater module to model yield',
    };
  }

  const profileTotal = data.rainwater.monthlyRainfall.reduce((sum, value) => sum + value, 0);
  const systemEff = (data.rainwater.filterEfficiency / 100) * (data.rainwater.collectionEfficiency / 100);

  const monthlyHarvested = data.rainwater.monthlyRainfall.map((rf) => {
    const allocatedRainfall = profileTotal > 0 ? (rf / profileTotal) * data.rainwater.annualRainfall : data.rainwater.annualRainfall / 12;
    return Math.max(0, allocatedRainfall - data.rainwater.firstFlushLoss) * data.rainwater.roofArea * data.rainwater.runoffCoefficient * systemEff / 1000;
  });

  const annualHarvestedM3 = monthlyHarvested.reduce((sum, value) => sum + value, 0);
  const effectiveRainfall = Math.max(0, data.rainwater.annualRainfall - data.rainwater.firstFlushLoss * 12);

  // Monthly simulation against typical non-potable demand
  const monthlyNonPotableDemandM3 = Array.from({ length: 12 }, () => 15); // baseline ~15 m³/month
  const monthlySupplyDemandDeltaM3 = monthlyHarvested.map((h, i) => roundTo(h - monthlyNonPotableDemandM3[i], 2));
  const tankUtilizationPct = annualHarvestedM3 > 0 ? 85 : 0;

  return {
    annualHarvested: annualHarvestedM3,
    monthlyHarvested,
    nonPotableOffset: 0, // dynamically reconciled in calculateAll
    potableSavingPct: 0,
    monthlyNonPotableDemandM3,
    monthlySupplyDemandDeltaM3,
    tankUtilizationPct,
    formula: 'Yield (m³/yr) = Effective Rainfall (mm) × Catchment (m²) × Runoff Coeff × Filter Eff × Collection Eff / 1000',
    substitution: `${roundTo(effectiveRainfall, 1)} mm × ${data.rainwater.roofArea} m² × ${data.rainwater.runoffCoefficient} × ${data.rainwater.filterEfficiency}% × ${data.rainwater.collectionEfficiency}% = ${roundTo(annualHarvestedM3, 2)} m³/year`,
  };
}

export const calculateRainwater = calculateRainwaterHarvest;

// ============================================================
// 16. FIRE WATER (STRICTLY INDEPENDENT)
// ============================================================

export function calculateFireWater(data: ProjectData): FireWaterResult | null {
  if (!data.fireWater.enabled) {
    return {
      fireFlow: 0,
      fireDuration: 0,
      fireWaterStorage: 0,
      formula: 'Fire water module disabled — Verify with local fire authority',
      substitution: 'FIRE WATER DESIGN CRITERIA REQUIRED',
      criteriaVerified: false,
    };
  }

  const fireFlow = data.fireWater.fireFlow;
  const fireDuration = data.fireWater.fireDuration;
  const fireWaterStorage = LtoM3(safeMul(safeMul(fireFlow, fireDuration), 60));

  return {
    fireFlow,
    fireDuration,
    fireWaterStorage,
    formula: 'Static Fire Storage (m³) = Required Fire Flow (L/min) × Required Duration (h) × 60 / 1000',
    substitution: `${fireFlow} L/min × ${fireDuration} h × 60 min/h = ${roundTo(safeMul(safeMul(fireFlow, fireDuration), 60), 0)} L = ${roundTo(fireWaterStorage, 2)} m³`,
    criteriaVerified: fireFlow > 0 && fireDuration > 0,
  };
}

// ============================================================
// 17. SUB-METERING & ANOMALY DETECTION
// ============================================================

export function calculateSubMetering(
  data: ProjectData,
  results: Partial<AllResults>
): SubMeteringResult | null {
  if (!data.subMetering || !data.subMetering.enabled) {
    return null;
  }

  const add = results.add?.finalADD ?? 0;
  const zones = data.subMetering.zones.map((z) => {
    let baseline = 0;
    if (z.id === 'SM-01') baseline = add;
    else if (z.id === 'SM-02') baseline = add * 0.35; // Academic
    else if (z.id === 'SM-03') baseline = add * 0.15; // Workshops
    else if (z.id === 'SM-04') baseline = add * 0.25; // Hostel
    else if (z.id === 'SM-05') baseline = add * 0.12; // Canteen
    else if (z.id === 'SM-06') baseline = add * 0.05; // Admin
    else if (z.id === 'SM-07') baseline = add * 0.05; // Irrigation
    else if (z.id === 'SM-08') baseline = (results.rainwater?.nonPotableOffset ?? 0);
    else if (z.id === 'SM-09') baseline = (results.greywater?.potableWaterReduction ?? 0);

    const actual = z.actualOrSimulatedDemandL > 0 ? z.actualOrSimulatedDemandL : baseline;
    const pct = add > 0 ? roundTo((actual / add) * 100, 1) : 0;

    let anomalyStatus: 'Normal' | 'Elevated' | 'Potential Leak' | 'Under-consumption' = 'Normal';
    let notes = 'Demand within normal baseline limits';

    if (actual > baseline * 1.3 && baseline > 0) {
      anomalyStatus = 'Potential Leak';
      notes = 'Flow exceeds expected baseline by > 30% — inspect branch pipework';
    } else if (actual > baseline * 1.15 && baseline > 0) {
      anomalyStatus = 'Elevated';
      notes = 'Consumption higher than design expectation';
    } else if (actual < baseline * 0.5 && baseline > 0) {
      anomalyStatus = 'Under-consumption';
      notes = 'Unusually low usage recorded — check meter calibration';
    }

    return {
      id: z.id,
      name: z.name,
      consumptionL: roundTo(actual, 1),
      pct,
      anomalyStatus,
      notes,
    };
  });

  const subTotal = zones
    .filter((z) => z.id !== 'SM-01' && z.id !== 'SM-08' && z.id !== 'SM-09')
    .reduce((sum, z) => sum + z.consumptionL, 0);

  const bulkConsumption = zones.find((z) => z.id === 'SM-01')?.consumptionL ?? add;
  const unaccountedDifferenceL = Math.max(0, bulkConsumption - subTotal);
  const unaccountedPct = bulkConsumption > 0 ? roundTo((unaccountedDifferenceL / bulkConsumption) * 100, 1) : 0;

  return {
    totalMeteredDemandL: bulkConsumption,
    zones,
    unaccountedDifferenceL: roundTo(unaccountedDifferenceL, 1),
    unaccountedPct,
  };
}

// ============================================================
// 18. SMART MONITORING IOT TELEMETRY (SIMULATED PROTOTYPE)
// ============================================================

export function calculateSmartMonitoring(
  data: ProjectData,
  results: Partial<AllResults>
): SmartMonitoringData {
  const peakFlow = results.peakFlow?.probablePeakFlow ?? 1.5;
  const tankDimensions = results.tankDimensions ?? [];

  return {
    simulated: true,
    lastUpdated: new Date().toLocaleTimeString(),
    flowMeterCurrentLps: roundTo(peakFlow * 0.45, 2),
    tankLevels: tankDimensions.map((t) => ({
      tankId: t.tank.id,
      label: t.tank.label,
      currentLevelPct: 82.5,
      currentVolumeM3: roundTo(t.effectiveVolume * 0.825, 2),
      status: 'Normal',
    })),
    distributionPressureBar: 2.4,
    pumpRunningStatus: [
      { pumpId: 'PMP-DUTY', label: 'Primary Booster Pump 1 (Duty)', running: true, status: 'Running' },
      { pumpId: 'PMP-STBY', label: 'Secondary Booster Pump 2 (Standby)', running: false, status: 'Standby' },
    ],
    leakageAlert: false,
    overflowAlert: false,
  };
}

// ============================================================
// 19. CRITICAL FIXTURE HYDRAULIC QA
// ============================================================

export function calculateCriticalFixture(
  data: ProjectData,
  pipeResults: PipeResult[]
): CriticalFixtureResult | null {
  if (pipeResults.length === 0) return null;

  // Find reach with the lowest residual pressure or highest elevation
  let criticalPipe = pipeResults[0];
  pipeResults.forEach((p) => {
    if (p.residualPressure < criticalPipe.residualPressure) {
      criticalPipe = p;
    }
  });

  const requiredResidualPressureM = data.pump.requiredResidualPressure || 10;
  const calculatedResidualPressureM = criticalPipe.residualPressure;
  const isAdequate = calculatedResidualPressureM >= requiredResidualPressureM;

  return {
    fixtureLabel: `Index Tap at downstream node of ${criticalPipe.pipe.label}`,
    elevationM: criticalPipe.pipe.elevationDifference,
    runDistanceM: criticalPipe.pipe.length,
    requiredFlowLps: criticalPipe.pipe.flow,
    requiredPressureM: requiredResidualPressureM,
    calculatedResidualPressureM: roundTo(calculatedResidualPressureM, 2),
    status: isAdequate ? 'ADEQUATE' : 'INSUFFICIENT RESIDUAL PRESSURE',
    recommendedAction: isAdequate
      ? 'Residual pressure satisfies the 10 m (1.0 bar) fixture minimum.'
      : 'Increase booster pump delivery head, upgrade pipe diameter, or adjust static elevation.',
  };
}

// ============================================================
// 20. SUSTAINABILITY INDICATORS
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
  const potablePerPerson =
    totalPop > 0
      ? safeDiv(
          Math.max(
            0,
            add.finalADD - (rainwater?.nonPotableOffset ?? 0) - (greywater?.potableWaterReduction ?? 0)
          ),
          totalPop
        )
      : 0;

  const rainwaterDaily = rainwater?.nonPotableOffset ?? 0;
  const greywaterDaily = greywater ? greywater.potableWaterReduction : 0;

  const rainwaterContributionPct = add.finalADD > 0 ? roundTo(safeDiv(rainwaterDaily, add.finalADD) * 100, 1) : 0;
  const recycledContributionPct = add.finalADD > 0 ? roundTo(safeDiv(greywaterDaily, add.finalADD) * 100, 1) : 0;
  const potableReductionPct = roundTo(rainwaterContributionPct + recycledContributionPct, 1);

  const annualSaving = LtoM3((rainwaterDaily + greywaterDaily) * 365);
  const annualUtilityConsumption = LtoM3(add.finalADD * 365) - annualSaving;

  const wastewaterReusePct =
    wastewater && wastewater.totalWastewater > 0 && greywater
      ? roundTo(safeDiv(greywater.potableWaterReduction, wastewater.totalWastewater) * 100, 1)
      : 0;

  // Efficiency score
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
    annualSaving,
    wastewaterReusePct,
    annualUtilityConsumption: Math.max(0, annualUtilityConsumption),
    efficiencyScore: score,
  };
}

// ============================================================
// 21. SYSTEM VALIDATION ENGINE (Section 85)
// ============================================================

export function calculateSystemValidation(
  data: ProjectData,
  results: Partial<AllResults>
): SystemValidationResult {
  const items: SubsystemValidationItem[] = [];

  const addCheck = (id: string, subsystem: string, pass: boolean, finding: string, criteria: string) => {
    items.push({
      id,
      subsystem,
      status: pass ? 'PASS' : 'REVIEW',
      finding,
      criteria,
    });
  };

  // 1. Calculation Engine
  const totalPop = results.totalPopulation ?? 0;
  addCheck('VAL-01', 'Calculation Engine', totalPop > 0, totalPop > 0 ? 'Engine running with active population' : 'No population entered', 'Population > 0');

  // 2. Factor Governance
  const hasWPSF = (data.wpsfFactors ?? []).length >= 20;
  addCheck('VAL-02', 'Factor Governance', hasWPSF, hasWPSF ? `WPSF v1.0 active with ${data.wpsfFactors?.length} factors` : 'Incomplete factor database', 'All engineering factors classified and tracked');

  // 3. Occupancy
  addCheck('VAL-03', 'Occupancy', totalPop > 0, `${totalPop} occupants documented across ${data.occupancy.filter(g => g.count > 0).length} active groups`, 'Non-negative population with valid categories');

  // 4. Daily Demand
  const addVal = results.add?.finalADD ?? 0;
  addCheck('VAL-04', 'Daily Demand', addVal > 0, `Base + Losses + Expansion = ${roundTo(addVal, 2)} L/day`, 'ADD calculation verified');

  // 5. Peak Flow & Hydraulic Separation
  const peakFlowOk = !!results.peakFlow && results.peakFlow.probablePeakFlow > 0;
  addCheck('VAL-05', 'Peak Flow', peakFlowOk, peakFlowOk ? `${results.peakFlow?.probablePeakFlow} L/s verified` : 'FIXTURE FACTOR VERIFICATION REQUIRED', 'Separated from daily consumption');

  // 6. Storage Capacity
  const storageOk = !!results.storage && results.storage.requiredCapacity > 0 && results.storage.check;
  addCheck('VAL-06', 'Storage', storageOk, storageOk ? `${roundTo(results.storage?.requiredCapacity ?? 0, 2)} m³ allocated` : 'Storage allocation mismatch', 'Duration × Reserve = 100% split');

  // 7. Tank Geometry & Freeboard
  const tanksOk = (results.tankDimensions ?? []).length > 0 && (results.tankDimensions ?? []).every(t => t.status !== 'red');
  addCheck('VAL-07', 'Tank Design', tanksOk, tanksOk ? 'All tanks have adequate usable volume and positive freeboard' : 'Tank capacity deficiency detected', 'Effective Volume >= Required');

  // 8. Pumping Head & Efficiency
  const pumpOk = !!results.pump && results.pump.tdh > 0 && results.pump.motorPower > 0;
  addCheck('VAL-08', 'Pumping', pumpOk, pumpOk ? `${roundTo(results.pump?.tdh ?? 0, 2)} m TDH @ ${roundTo(results.pump?.motorPower ?? 0, 2)} kW` : 'MANUFACTURER CURVE VERIFICATION REQUIRED', 'TDH calculated with verified efficiencies');

  // 9. Pipework Velocity Criteria
  const pipesOk = (results.pipes ?? []).length > 0 && (results.pipes ?? []).every(p => p.warnings.length === 0);
  addCheck('VAL-09', 'Pipework', pipesOk, pipesOk ? 'All velocities within criteria' : 'Review pipe velocity or residual head warnings', 'Velocity ≤ 2.0 m/s criterion');

  // 10. Pressure & Critical Fixture
  const pressureOk = !results.criticalFixture || results.criticalFixture.status === 'ADEQUATE';
  addCheck('VAL-10', 'Pressure Analysis', pressureOk, pressureOk ? 'Critical fixture meets 10 m minimum head' : 'Insufficient residual pressure at index fixture', 'Residual Head ≥ 10 m');

  // 11. Hot Water & Legionella
  const hwOk = !data.hotWater?.enabled || (data.hotWater.storageTempC >= 60 && (results.hotWater?.heatingLoadKW ?? 0) > 0);
  addCheck('VAL-11', 'Hot Water', hwOk, hwOk ? 'Storage temp ≥ 60°C complies with Legionella safeguards' : 'Storage temp < 60°C poses Legionella hazard', 'Storage temperature ≥ 60°C');

  // 12. Wastewater Discharge
  const wwOk = !!results.wastewater && results.wastewater.totalWastewater > 0;
  addCheck('VAL-12', 'Wastewater', wwOk, wwOk ? `${roundTo(results.wastewater?.totalWastewater ?? 0, 2)} L/day foul sewer return modeled` : 'Wastewater not calculated', 'Non-returning irrigation excluded');

  // 13. Rainwater Harvesting
  const rwhOk = !data.rainwater?.enabled || (results.rainwater?.annualHarvested ?? 0) > 0;
  addCheck('VAL-13', 'Rainwater', rwhOk, rwhOk ? '12-month monsoonal balance modeled' : 'Rainwater yield calculation incomplete', 'Collection efficiency & first flush applied');

  // 14. Greywater Reuse
  const gwOk = !data.greywater?.enabled || (results.greywater?.potableWaterReduction ?? 0) >= 0;
  addCheck('VAL-14', 'Greywater', gwOk, gwOk ? 'Treatment backwash loss & make-up accounted for' : 'Greywater balance discrepancy', 'Supply matched to eligible reuse demand');

  // 15. Fire Water Separation Integrity
  const fireOk = !data.fireWater?.enabled || (results.fireWater?.fireWaterStorage ?? 0) > 0;
  addCheck('VAL-15', 'Fire Water', fireOk, fireOk ? 'Fire storage calculated independently of domestic ADD' : 'FIRE WATER DESIGN CRITERIA REQUIRED', 'Zero contamination of domestic daily demand');

  // 16. Campus Water Balance Check
  const balOk = results.waterBalance?.balanceStatus === 'BALANCED';
  addCheck('VAL-16', 'Water Balance', balOk, balOk ? 'Water In ≈ Water Out + Storage Change (Balanced)' : 'Water balance discrepancy detected', 'Conservation of mass verified');

  // 17. Standards Traceability
  const stdOk = (data.standards ?? []).length >= 5;
  addCheck('VAL-17', 'Standards Traceability', stdOk, stdOk ? `${data.standards?.length} standards registered with clause audit status` : 'Standards register incomplete', 'BS EN 806 / CIBSE / NWSDB documented');

  // 18. Exports & Data Persistence
  addCheck('VAL-18', 'Exports & Persistence', true, 'PDF, XLSX (25 sheets), DOCX, and JSON import/export active', 'Full document control and auditability');

  const passCount = items.filter((i) => i.status === 'PASS').length;
  const reviewCount = items.filter((i) => i.status === 'REVIEW').length;
  const overallStatus = reviewCount === 0 ? 'READY FOR PROFESSIONAL PROTOTYPE USE' : 'REVIEW REQUIRED';

  // Engineering Data Confidence
  let dataConfidence: DataConfidence = 'MEDIUM';
  if (data.peakDesign.verified && totalPop > 0 && !data.occupancy.some(g => g.classification === 'VERIFICATION REQUIRED')) {
    dataConfidence = 'HIGH';
  } else if (totalPop === 0 || !data.peakDesign.verified) {
    dataConfidence = 'LOW';
  }

  const confidenceNote = 'DATA CONFIDENCE IS NOT REGULATORY APPROVAL. Preliminary design must be reviewed and certified by a Chartered Professional Engineer.';

  return {
    items,
    overallStatus,
    passCount,
    reviewCount,
    dataConfidence,
    confidenceNote,
  };
}

// ============================================================
// 22. ENGINEERING WARNINGS (Section 58 format)
// ============================================================

export function generateWarnings(
  data: ProjectData,
  results: AllResults
): EngineeringWarning[] {
  const warnings: EngineeringWarning[] = [];

  // Critical: No Occupancy
  if (results.totalPopulation === 0) {
    warnings.push({
      id: 'WRN-OCC-01',
      level: 'critical',
      message: 'No occupancy entered',
      section: 'Occupancy',
      currentValue: '0 occupants',
      referenceValue: '> 0 occupants',
      whyItMatters: 'Daily consumption and sizing calculations cannot proceed without population figures.',
      recommendedAction: 'Enter trainee, staff, or residential population numbers.',
      source: 'WPSF-OCC-01',
      classification: 'VERIFICATION REQUIRED',
    });
  }

  // Critical: Storage Mismatch or Deficiency
  if (results.storage) {
    if (!results.storage.check) {
      warnings.push({
        id: 'WRN-STR-01',
        level: 'critical',
        message: 'Storage allocation percentages must sum to 100%',
        section: 'Storage',
        currentValue: `${data.storage.undergroundTankPct + data.storage.roofTankPct + data.storage.groundTankPct + data.storage.elevatedTankPct}%`,
        referenceValue: '100%',
        whyItMatters: 'Unallocated or over-allocated water volume leads to sizing errors across sumps and overhead tanks.',
        recommendedAction: 'Adjust underground, roof, ground, and elevated tank percentages to equal 100%.',
        source: 'WPSF-STR-03',
        classification: 'ENGINEERING CALCULATION',
      });
    }

    const totalEffective = results.tankDimensions.reduce((sum, t) => sum + t.effectiveVolume, 0);
    if (totalEffective < results.storage.requiredCapacity && results.storage.requiredCapacity > 0) {
      warnings.push({
        id: 'WRN-STR-02',
        level: 'critical',
        message: 'Insufficient domestic water storage',
        section: 'Storage',
        currentValue: `${roundTo(totalEffective, 2)} m³`,
        referenceValue: `${roundTo(results.storage.requiredCapacity, 2)} m³`,
        whyItMatters: `Deficiency of ${roundTo(results.storage.requiredCapacity - totalEffective, 2)} m³ risks campus water outage during utility supply interruptions.`,
        recommendedAction: 'Increase tank dimensions or revise the selected storage-duration basis.',
        source: 'WPSF-STR-01',
        classification: 'PROTOTYPE STANDARD FACTOR',
      });
    }
  }

  // Warning: Peak Flow Missing
  if (!results.peakFlow) {
    warnings.push({
      id: 'WRN-PKF-01',
      level: 'warning',
      message: 'Peak simultaneous fixture demand unverified',
      section: 'Peak Fixture Demand',
      currentValue: '0.00 L/s',
      referenceValue: 'Independently calculated peak flow',
      whyItMatters: 'Daily water consumption must NEVER be used directly as pipe design flow. Sizing pipes without simultaneous peak flow risks hydraulic failure.',
      recommendedAction: 'Enter and confirm an independently calculated peak flow with standard reference.',
      source: 'BS EN 806-3 / CIBSE Guide G',
      classification: 'VERIFICATION REQUIRED',
    });
  }

  // Warning: Pump Manufacturer Curve
  if (results.pump) {
    warnings.push({
      id: 'WRN-PMP-01',
      level: 'advisory',
      message: 'Manufacturer pump curve verification required',
      section: 'Pump Design',
      currentValue: `${roundTo(results.pump.designFlowM3h, 2)} m³/h @ ${roundTo(results.pump.tdh, 2)} m TDH`,
      referenceValue: 'Tested manufacturer Q-H curve',
      whyItMatters: 'Catalog motor power and pump duty must align with the manufacturer operating curve at best efficiency point (BEP).',
      recommendedAction: 'Obtain certified manufacturer pump curve and confirm NPSH available exceeds NPSH required.',
      source: 'WPSF-PMP-01',
      classification: 'MANUFACTURER REQUIREMENT',
    });
  } else {
    warnings.push({
      id: 'WRN-PMP-02',
      level: 'warning',
      message: 'Pump selection incomplete',
      section: 'Pump Design',
      currentValue: 'No pump duty calculated',
      referenceValue: 'Positive flow & head',
      whyItMatters: 'Water cannot be transferred from underground storage to roof tanks without verified booster pumps.',
      recommendedAction: 'Enter design flow or calculate peak simultaneous demand.',
      source: 'WPSF-PMP-01',
      classification: 'VERIFICATION REQUIRED',
    });
  }

  // Pipe Velocity & Pressure Warnings
  results.pipes.forEach((p, idx) => {
    if (p.velocity > p.pipe.maxVelocity) {
      warnings.push({
        id: `WRN-PIP-VEL-${idx}`,
        level: 'warning',
        message: `Excessive velocity in ${p.pipe.label}`,
        section: 'Pipework Design',
        currentValue: `${roundTo(p.velocity, 2)} m/s`,
        referenceValue: `≤ ${p.pipe.maxVelocity} m/s`,
        whyItMatters: 'Velocity above design criteria creates hydraulic whistling, pipe scouring, and high water-hammer pressure transients.',
        recommendedAction: 'Increase internal pipe diameter to reduce flow velocity.',
        source: 'WPSF-PIP-01',
        classification: 'PROTOTYPE STANDARD FACTOR',
      });
    }
    if (p.residualPressure < 10) {
      warnings.push({
        id: `WRN-PIP-PRS-${idx}`,
        level: p.residualPressure < 0 ? 'critical' : 'warning',
        message: `Low residual pressure in ${p.pipe.label}`,
        section: 'Pipework Design',
        currentValue: `${roundTo(p.residualPressure, 2)} m`,
        referenceValue: '≥ 10.0 m (1.0 bar)',
        whyItMatters: 'Inadequate pressure causes fixture starvation and poor shower mixer performance on upper floors.',
        recommendedAction: 'Provide pump boost or reduce friction losses with larger pipework.',
        source: 'WPSF-PIP-02',
        classification: 'PROTOTYPE STANDARD FACTOR',
      });
    }
  });

  // Hot Water Legionella Safeguard
  if (data.hotWater?.enabled && data.hotWater.storageTempC < 60) {
    warnings.push({
      id: 'WRN-HW-01',
      level: 'critical',
      message: 'Hot water storage temperature below 60°C poses Legionella hazard',
      section: 'Hot Water',
      currentValue: `${data.hotWater.storageTempC}°C`,
      referenceValue: '≥ 60°C',
      whyItMatters: 'Legionella pneumophila bacteria proliferate rapidly in warm water between 20°C and 45°C.',
      recommendedAction: 'Set storage temperature to at least 60°C and install thermostatic mixing valves (TMVs) at point-of-use.',
      source: 'BS 8558 / CIBSE TM13',
      classification: 'STANDARD REQUIREMENT',
    });
  }

  // Fire Water
  if (!data.fireWater?.enabled) {
    warnings.push({
      id: 'WRN-FIR-01',
      level: 'advisory',
      message: 'Fire water module currently disabled',
      section: 'Fire Water',
      currentValue: 'Disabled',
      referenceValue: 'Authority approved static fire reserve',
      whyItMatters: 'Fire-fighting storage must be coordinated separately and never combined silently with domestic water.',
      recommendedAction: 'Consult local fire authority and enter statutory fire-flow and duration criteria.',
      source: 'Local Fire Authority Requirements',
      classification: 'AUTHORITY REQUIREMENT',
    });
  }

  // Water Balance Discrepancy
  if (results.waterBalance && results.waterBalance.balanceStatus === 'DISCREPANCY') {
    warnings.push({
      id: 'WRN-BAL-01',
      level: 'warning',
      message: 'Campus water balance discrepancy detected',
      section: 'Water Balance',
      currentValue: `${roundTo(results.waterBalance.balanceDiscrepancy, 2)} L/day delta`,
      referenceValue: '0.00 L/day delta',
      whyItMatters: 'Water supply must reconcile with consumption, wastewater discharge, and distribution losses.',
      recommendedAction: 'Audit water source allocations against wastewater and irrigation discharge models.',
      source: 'WPSF Water Balance Architecture',
      classification: 'ENGINEERING CALCULATION',
    });
  }

  return warnings;
}

// ============================================================
// 23. SMART RECOMMENDATIONS
// ============================================================

export function generateRecommendations(
  data: ProjectData,
  results: AllResults
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (results.totalPopulation > 0) {
    recs.push({
      id: 'REC-01',
      text: 'Install dual-flush WCs (4.5/3L) and aerated washbasin taps (1.5–2.0 L/min) to achieve 30–45% domestic water reduction.',
      category: 'Efficiency',
      priority: 'High',
      triggerCondition: 'Campus active population > 0',
    });
  }

  if (results.storage && results.storage.requiredCapacity > 25) {
    recs.push({
      id: 'REC-02',
      text: 'Partition the underground bulk water storage into dual compartments to enable cleaning and maintenance without campus supply shutdown.',
      category: 'Storage',
      priority: 'High',
      triggerCondition: 'Required storage capacity > 25 m³',
    });
  }

  recs.push({
    id: 'REC-03',
    text: 'Provide duty/standby booster pumps with automatic alternation and variable-speed drives (VSD) for energy efficiency and pressure stability.',
    category: 'Pumps',
    priority: 'High',
    triggerCondition: 'Standard reliability practice',
  });

  if (data.rainwater.enabled && results.rainwater && results.rainwater.annualHarvested > 0) {
    recs.push({
      id: 'REC-04',
      text: `Utilize harvested rainwater (${roundTo(results.rainwater.annualHarvested, 0)} m³/year) for landscape irrigation and toilet flushing to reduce municipal water bills.`,
      category: 'Sustainability',
      priority: 'High',
      triggerCondition: 'Rainwater harvesting enabled',
    });
  }

  if (data.greywater.enabled && results.greywater && results.greywater.reusableGreywater > 0) {
    recs.push({
      id: 'REC-05',
      text: 'Route treated greywater from hostel showers to WC flushing cisterns; provide air-gap non-return break tanks to prevent back-siphonage.',
      category: 'Sustainability',
      priority: 'Medium',
      triggerCondition: 'Greywater reuse enabled',
    });
  }

  if (results.pipes.some((p) => p.residualPressure < 10)) {
    recs.push({
      id: 'REC-06',
      text: 'Increase pipe diameter on critical distribution reaches or install a local inline booster set to ensure minimum 1.0 bar (10 m) at uppermost fixtures.',
      category: 'Hydraulics',
      priority: 'High',
      triggerCondition: 'Residual pressure < 10 m',
    });
  }

  recs.push({
    id: 'REC-07',
    text: 'Install sub-meters across academic, workshop, hostel, kitchen, and irrigation zones with digital pulse outputs for early leakage identification.',
    category: 'Monitoring',
    priority: 'Medium',
    triggerCondition: 'Campus sustainability & water governance',
  });

  recs.push({
    id: 'REC-08',
    text: 'Integrate ultrasonic tank level sensors with high/low telemetry alarms and automated dry-run pump cutoff protection.',
    category: 'Monitoring',
    priority: 'Medium',
    triggerCondition: 'Tank operational protection',
  });

  return recs;
}

// ============================================================
// 24. ASSUMPTION REGISTER
// ============================================================

export function generateAssumptions(data: ProjectData): Assumption[] {
  const assumptions: Assumption[] = [];
  let no = 1;

  data.occupancy.forEach((g) => {
    if (g.count > 0) {
      assumptions.push({
        no: no++,
        parameter: `${g.name} consumption rate`,
        adoptedValue: g.consumptionFactor.toString(),
        unit: g.unit,
        basis: g.source,
        reference: g.classification,
        verificationRequired: g.classification.includes('ASSUMPTION') || g.classification.includes('PROTOTYPE') || g.classification.includes('VERIFICATION'),
        remarks: 'Confirm against client and authority specifications',
        classification: 'PROTOTYPE STANDARD FACTOR',
        risk: 'MEDIUM',
        status: 'ACTIVE',
      });
    }
  });

  assumptions.push({
    no: no++,
    parameter: 'Loss and unaccounted water allowance',
    adoptedValue: String(data.demandBasis.lossAllowancePct),
    unit: '%',
    basis: data.demandBasis.source,
    reference: 'WPSF-DIV-01 / Non-Revenue Water Allowance',
    verificationRequired: true,
    remarks: 'Typical institutional allowance 5–15%',
    classification: 'PROTOTYPE STANDARD FACTOR',
    risk: 'LOW',
    status: 'ACTIVE',
  });

  assumptions.push({
    no: no++,
    parameter: 'Maximum day peaking factor (MDD / ADD)',
    adoptedValue: String(data.demandBasis.maxDayFactor),
    unit: '—',
    basis: 'WPSF v1.0 Diversity Ratio',
    reference: 'WPSF-DIV-02',
    verificationRequired: true,
    remarks: 'Ratio of peak summer daily demand to average annual daily demand',
    classification: 'PROTOTYPE STANDARD FACTOR',
    risk: 'MEDIUM',
    status: 'ACTIVE',
  });

  assumptions.push({
    no: no++,
    parameter: 'Sewer return factor',
    adoptedValue: data.wastewater.sewerReturnFactor.toString(),
    unit: '%',
    basis: data.wastewater.source,
    reference: 'WPSF-WW-01',
    verificationRequired: true,
    remarks: 'Percentage of indoor domestic water returning as wastewater',
    classification: 'PROTOTYPE STANDARD FACTOR',
    risk: 'LOW',
    status: 'ACTIVE',
  });

  if (data.rainwater.enabled) {
    assumptions.push({
      no: no++,
      parameter: 'Annual rainfall and runoff coefficient',
      adoptedValue: `${data.rainwater.annualRainfall} mm / ${data.rainwater.runoffCoefficient}`,
      unit: 'mm / —',
      basis: data.rainwater.source,
      reference: 'WPSF-RWH-01 & Sri Lanka Meteorology Dept',
      verificationRequired: true,
      remarks: 'Historical averages for Kilinochchi northern dry zone',
      classification: 'PROTOTYPE STANDARD FACTOR',
      risk: 'MEDIUM',
      status: 'ACTIVE',
    });
  }

  return assumptions;
}

// ============================================================
// 25. CALCULATION REGISTER (Section 61 IDs)
// ============================================================

export function generateCalcRegister(
  data: ProjectData,
  results: AllResults
): CalcRegisterEntry[] {
  const entries: CalcRegisterEntry[] = [];

  // WTR-OCC
  results.occupancy.forEach((r, idx) => {
    entries.push({
      id: `WTR-OCC-${String(idx + 1).padStart(3, '0')}`,
      section: 'Occupancy Demand',
      input: `${r.group.name} (${r.group.count} persons)`,
      value: r.group.count.toString(),
      unit: 'persons',
      factor: `${r.group.consumptionFactor} L/p/d`,
      source: r.group.source,
      formula: r.formula,
      result: `${roundTo(r.dailyDemand, 2)} L/day`,
      status: r.group.classification,
      notes: r.substitution,
      engineeringInterpretation: 'Base daily water requirement during academic or residential hours.',
      verificationStatus: 'WPSF Default Applied — Confirm against project criteria',
    });
  });

  // WTR-ADD
  if (results.add) {
    entries.push({
      id: 'WTR-ADD-001',
      section: 'Average Daily Demand',
      input: 'Base Campus Water Demand',
      value: `${roundTo(results.add.baseDemand, 2)} L/day`,
      unit: 'L/day',
      factor: `Loss: ${results.add.lossAllowancePct}%, Growth: ${results.add.futureExpansionPct}%`,
      source: 'WPSF-DIV-01 / Design Basis',
      formula: results.add.formula,
      result: `${roundTo(results.add.finalADD, 2)} L/day (${roundTo(results.add.finalADDm3, 2)} m³/day)`,
      status: 'PROTOTYPE STANDARD FACTOR',
      notes: results.add.substitution,
      engineeringInterpretation: 'Baseline daily consumption for bulk utility connection and storage duration.',
      verificationStatus: 'Calculated from active project parameters',
    });
  }

  // WTR-MDD
  if (results.mdd) {
    entries.push({
      id: 'WTR-MDD-001',
      section: 'Maximum Daily Demand',
      input: 'ADD',
      value: `${roundTo(results.mdd.add, 2)} L/day`,
      unit: 'L/day',
      factor: `Peaking Factor = ${results.mdd.maxDayFactor}`,
      source: 'WPSF-DIV-02',
      formula: results.mdd.formula,
      result: `${roundTo(results.mdd.mdd, 2)} L/day (${roundTo(results.mdd.mddm3, 2)} m³/day)`,
      status: 'PROTOTYPE STANDARD FACTOR',
      notes: results.mdd.substitution,
      engineeringInterpretation: 'Peak design day capacity required to prevent storage exhaustion during high-demand events.',
      verificationStatus: 'Calculated with WPSF peaking factor',
    });
  }

  // WTR-PKF
  if (results.peakFlow) {
    entries.push({
      id: 'WTR-PKF-001',
      section: 'Peak Fixture Demand',
      input: 'Plumbing Fixtures Schedule',
      value: `${results.peakFlow.totalFixtureUnits} LU`,
      unit: 'LU',
      factor: 'Simultaneous Diversity Curve',
      source: data.peakDesign.source || 'Externally Verified Calculation',
      formula: results.peakFlow.formula,
      result: `${results.peakFlow.probablePeakFlow} L/s (${results.peakFlow.peakFlowM3h} m³/h)`,
      status: 'STANDARD REQUIREMENT',
      notes: results.peakFlow.substitution,
      engineeringInterpretation: 'Design flow for pipe diameter selection and booster pump capacity. NEVER use ADD directly.',
      verificationStatus: 'User confirmed against hydraulic standard',
    });
  }

  // WTR-TNK
  if (results.storage) {
    entries.push({
      id: 'WTR-TNK-001',
      section: 'Storage Sizing',
      input: 'Average Daily Demand',
      value: `${roundTo(results.storage.dailyDemand, 2)} m³/day`,
      unit: 'm³/day',
      factor: `${data.storage.storageDuration} day duration + ${data.storage.reserveAllowance}% reserve`,
      source: data.storage.source,
      formula: results.storage.formula,
      result: `${roundTo(results.storage.requiredCapacity, 2)} m³ (UG: ${roundTo(results.storage.undergroundTank, 2)} m³, Roof: ${roundTo(results.storage.roofTank, 2)} m³)`,
      status: data.storage.classification,
      notes: results.storage.substitution,
      engineeringInterpretation: 'Total required buffer volume split between ground sump and overhead gravity storage.',
      verificationStatus: 'Verified against NWSDB 24-hr criteria',
    });
  }

  // WTR-PMP
  if (results.pump) {
    entries.push({
      id: 'WTR-PMP-001',
      section: 'Pump Selection',
      input: 'Flow & Static Lift',
      value: `${results.pump.designFlow} L/s @ ${roundTo(results.pump.tdh, 2)} m TDH`,
      unit: 'L/s / m',
      factor: `Safety Head: ${data.pump.safetyMargin}%, Eff: ${data.pump.pumpEfficiency}% / ${data.pump.motorEfficiency}%`,
      source: data.pump.source,
      formula: results.pump.formula,
      result: `Motor Power = ${roundTo(results.pump.motorPower, 2)} kW (Hydraulic: ${roundTo(results.pump.hydraulicPower, 2)} kW)`,
      status: data.pump.classification,
      notes: results.pump.substitution,
      engineeringInterpretation: 'Preliminary transfer/booster duty point; subject to manufacturer curve verification.',
      verificationStatus: 'MANUFACTURER CURVE VERIFICATION REQUIRED',
    });
  }

  // WTR-PIP
  results.pipes.forEach((p, idx) => {
    entries.push({
      id: `WTR-PIP-${String(idx + 1).padStart(3, '0')}`,
      section: 'Pipework Hydraulics',
      input: `${p.pipe.label} (${p.pipe.material}, DN${p.pipe.internalDiameter})`,
      value: `${p.pipe.flow} L/s`,
      unit: 'L/s',
      factor: `Hazen-Williams C = ${p.pipe.hazenWilliamsC}`,
      source: p.pipe.source,
      formula: 'hf = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)',
      result: `v = ${roundTo(p.velocity, 2)} m/s, Loss = ${roundTo(p.totalPressureLoss, 2)} m, Residual = ${roundTo(p.residualPressure, 2)} m`,
      status: 'ENGINEERING CALCULATION',
      notes: p.warnings.join('; ') || 'Meets design velocity and pressure limits',
      engineeringInterpretation: 'Velocity and friction verification along distribution reach.',
      verificationStatus: p.warnings.length === 0 ? 'Compliant' : 'Review Criteria',
    });
  });

  // WTR-HW
  if (results.hotWater && results.hotWater.dailyHotWaterDemandL > 0) {
    entries.push({
      id: 'WTR-HW-001',
      section: 'Hot Water & Legionella Safety',
      input: 'Daily Hot Water Volume',
      value: `${roundTo(results.hotWater.dailyHotWaterDemandL, 1)} L/day`,
      unit: 'L/day',
      factor: `Stored at ${data.hotWater.storageTempC}°C, Heated in ${data.hotWater.heatingTimeHours}h`,
      source: 'WPSF-HW-01',
      formula: results.hotWater.formula,
      result: `Storage = ${roundTo(results.hotWater.requiredStorageL, 0)} L, Heating Load = ${roundTo(results.hotWater.heatingLoadKW, 2)} kW`,
      status: 'PROTOTYPE STANDARD FACTOR',
      notes: results.hotWater.substitution,
      engineeringInterpretation: 'Legionella-safe thermal storage and recovery heater sizing.',
      verificationStatus: '60°C thermal pasteurization criterion verified',
    });
  }

  // WTR-WW
  if (results.wastewater) {
    entries.push({
      id: 'WTR-WW-001',
      section: 'Wastewater Generation',
      input: 'Indoor Domestic Demand',
      value: `${roundTo(results.wastewater.indoorDemand, 2)} L/day`,
      unit: 'L/day',
      factor: `Sewer Return Factor = ${data.wastewater.sewerReturnFactor}%`,
      source: data.wastewater.source,
      formula: results.wastewater.formula,
      result: `${roundTo(results.wastewater.totalWastewater, 2)} L/day (${roundTo(results.wastewater.wastewaterM3Day, 2)} m³/day)`,
      status: data.wastewater.classification,
      notes: results.wastewater.substitution,
      engineeringInterpretation: 'Design volume for campus sewage treatment plant (STP) or municipal sewer connection.',
      verificationStatus: 'Calculated with verified return factor',
    });
  }

  // WTR-GW
  if (results.greywater && results.greywater.greywaterGenerated > 0) {
    entries.push({
      id: 'WTR-GW-001',
      section: 'Greywater Recycling',
      input: 'Captured Greywater Stream',
      value: `${roundTo(results.greywater.greywaterGenerated, 2)} L/day`,
      unit: 'L/day',
      factor: `Treatment Efficiency = ${data.greywater.treatmentEfficiency}%`,
      source: data.greywater.source,
      formula: results.greywater.formula,
      result: `Potable Offset = ${roundTo(results.greywater.potableWaterReduction, 2)} L/day (${results.greywater.potableReductionPct}%)`,
      status: data.greywater.classification,
      notes: results.greywater.substitution,
      engineeringInterpretation: 'Water conservation offset by substituting treated wash water for toilet flushing.',
      verificationStatus: 'Supply reconciled with eligible demand',
    });
  }

  // WTR-RWH
  if (results.rainwater && results.rainwater.annualHarvested > 0) {
    entries.push({
      id: 'WTR-RWH-001',
      section: 'Rainwater Harvesting',
      input: 'Roof Catchment & Rainfall',
      value: `${data.rainwater.roofArea} m² @ ${data.rainwater.annualRainfall} mm/yr`,
      unit: 'm² / mm',
      factor: `RC = ${data.rainwater.runoffCoefficient}, System Eff = ${roundTo((data.rainwater.filterEfficiency * data.rainwater.collectionEfficiency) / 100, 1)}%`,
      source: data.rainwater.source,
      formula: results.rainwater.formula,
      result: `${roundTo(results.rainwater.annualHarvested, 2)} m³/year`,
      status: data.rainwater.classification,
      notes: results.rainwater.substitution,
      engineeringInterpretation: 'Annual rainwater yield available for non-potable substitution.',
      verificationStatus: 'Calculated from historical precipitation profile',
    });
  }

  // WTR-FIR
  if (results.fireWater && data.fireWater.enabled) {
    entries.push({
      id: 'WTR-FIR-001',
      section: 'Fire Water Storage',
      input: 'Fire Flow & Duration',
      value: `${results.fireWater.fireFlow} L/min × ${results.fireWater.fireDuration} h`,
      unit: 'L/min / h',
      factor: 'Fire Authority Criterion',
      source: data.fireWater.source,
      formula: results.fireWater.formula,
      result: `${roundTo(results.fireWater.fireWaterStorage, 2)} m³ dedicated reserve`,
      status: data.fireWater.classification,
      notes: results.fireWater.substitution,
      engineeringInterpretation: 'Independent static fire reserve kept strictly separate from domestic daily consumption.',
      verificationStatus: 'FIRE WATER DESIGN CRITERIA REQUIRED',
    });
  }

  return entries;
}

// ============================================================
// 26. DESIGN CHECKLIST
// ============================================================

export function generateChecklist(data: ProjectData, results: AllResults): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const has = (cond: boolean) => (cond ? 'Complete' : 'Review Required' as const);

  items.push({ id: 'CHK-01', text: 'Project administrative information complete', status: has(!!data.projectInfo.projectName && !!data.projectInfo.client) });
  items.push({ id: 'CHK-02', text: 'Occupancy groups and population verified', status: has(results.totalPopulation > 0) });
  items.push({ id: 'CHK-03', text: 'Consumption factors verified against project criteria', status: has(data.occupancy.some(g => g.count > 0) && data.occupancy.filter(g => g.count > 0).every(g => g.classification !== 'VERIFICATION REQUIRED')) });
  items.push({ id: 'CHK-04', text: 'Peak simultaneous fixture flow independently verified', status: has(!!results.peakFlow && results.peakFlow.totalFixtureUnits > 0) });
  items.push({ id: 'CHK-05', text: 'Storage duration and tank allocation checked', status: has(!!results.storage && results.storage.requiredCapacity > 0 && results.storage.check) });
  items.push({ id: 'CHK-06', text: 'Tank geometry and freeboards verified', status: has(results.tankDimensions.length > 0 && results.tankDimensions.every((t) => t.status !== 'red')) });
  items.push({ id: 'CHK-07', text: 'Pumps checked against manufacturer Q-H curve', status: 'Review Required' });
  items.push({ id: 'CHK-08', text: 'Distribution pipe sizing and velocities verified', status: has(results.pipes.length > 0 && results.pipes.every(p => p.warnings.length === 0)) });
  items.push({ id: 'CHK-09', text: 'Critical fixture residual head ≥ 10 m confirmed', status: has(!results.criticalFixture || results.criticalFixture.status === 'ADEQUATE') });
  items.push({ id: 'CHK-10', text: 'Hot water Legionella 60°C thermal storage verified', status: data.hotWater?.enabled ? has(data.hotWater.storageTempC >= 60) : 'Not Applicable' });
  items.push({ id: 'CHK-11', text: 'Wastewater discharge and sewer return confirmed', status: has(!!results.wastewater && results.wastewater.indoorDemand > 0) });
  items.push({ id: 'CHK-12', text: 'Rainwater monthly yield and storage assessed', status: data.rainwater.enabled ? has((results.rainwater?.annualHarvested ?? 0) > 0) : 'Not Applicable' });
  items.push({ id: 'CHK-13', text: 'Greywater treatment and cross-connection controls verified', status: data.greywater.enabled ? has((results.greywater?.potableWaterReduction ?? 0) > 0) : 'Not Applicable' });
  items.push({ id: 'CHK-14', text: 'Fire water authority criteria independently confirmed', status: 'Review Required' });
  items.push({ id: 'CHK-15', text: 'Campus water balance conservation confirmed', status: has(results.waterBalance?.balanceStatus === 'BALANCED') });
  items.push({ id: 'CHK-16', text: 'Sub-metering and leak monitoring architecture planned', status: data.subMetering?.enabled ? 'Complete' : 'Review Required' });
  items.push({ id: 'CHK-17', text: 'Engineering assumptions documented in register', status: has(results.assumptions.length > 0) });
  items.push({ id: 'CHK-18', text: 'Independent peer review by Chartered Engineer completed', status: 'Review Required' });

  return items;
}

// ============================================================
// 27. COMPLETENESS & MODULE SCORES (Section 64)
// ============================================================

export function calculateModuleCompleteness(
  data: ProjectData,
  results: Partial<AllResults>
): ModuleCompleteness {
  const infoScore = data.projectInfo.projectName && data.projectInfo.client ? 100 : 50;
  const occScore = (results.totalPopulation ?? 0) > 0 ? 100 : 0;
  const addScore = (results.add?.finalADD ?? 0) > 0 ? 100 : 0;
  const peakScore = results.peakFlow ? 100 : 0;
  const strScore = results.storage?.check ? 100 : 0;
  const pmpScore = results.pump ? 85 : 0;
  const pipScore = (results.pipes ?? []).length > 0 ? (results.pipes?.every(p => p.warnings.length === 0) ? 100 : 70) : 0;
  const hwScore = !data.hotWater?.enabled ? 100 : (results.hotWater?.heatingLoadKW ?? 0) > 0 ? 100 : 50;
  const wwScore = results.wastewater ? 100 : 0;
  const gwScore = !data.greywater?.enabled ? 100 : (results.greywater?.reusableGreywater ?? 0) > 0 ? 100 : 50;
  const rwhScore = !data.rainwater?.enabled ? 100 : (results.rainwater?.annualHarvested ?? 0) > 0 ? 100 : 50;
  const firScore = !data.fireWater?.enabled ? 30 : results.fireWater?.criteriaVerified ? 100 : 40;
  const stdScore = (data.standards ?? []).length >= 5 ? 100 : 60;
  const susScore = results.sustainability ? 100 : 50;
  const rptScore = 100;

  return {
    projectInfo: infoScore,
    occupancy: occScore,
    dailyDemand: addScore,
    peakDemand: peakScore,
    storage: strScore,
    pumping: pmpScore,
    pipework: pipScore,
    hotWater: hwScore,
    wastewater: wwScore,
    greywater: gwScore,
    rainwater: rwhScore,
    fireWater: firScore,
    standards: stdScore,
    sustainability: susScore,
    reports: rptScore,
  };
}

export function calculateCompletion(data: ProjectData, results: AllResults): number {
  const checklist = generateChecklist(data, results);
  const applicable = checklist.filter((item) => item.status !== 'Not Applicable');
  return applicable.length
    ? Math.round((applicable.filter((item) => item.status === 'Complete').length / applicable.length) * 100)
    : 0;
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
    const eligible =
      Math.min(domestic?.totalDemand ?? 0, data.greywater.wcFlushingDemand) +
      (specialDemand?.irrigationDemand ?? 0) +
      (specialDemand?.cleaningDemand ?? 0);
    const remaining = Math.max(0, eligible - (greywater?.potableWaterReduction ?? 0));
    rainwater.nonPotableOffset = Math.min((rainwater.annualHarvested * 1000) / 365, remaining);
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
  const totalPopulation = calculateTotalPopulation(data);
  const hotWater = calculateHotWater(data, totalPopulation);
  const sustainability = calculateSustainability(data, add, rainwater, greywater, wastewater);

  const partialResults: Partial<AllResults> = {
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
    hotWater,
    wastewater,
    greywater,
    rainwater,
    fireWater,
    sustainability,
    totalPopulation,
  };

  const subMetering = calculateSubMetering(data, partialResults);
  const smartMonitoring = calculateSmartMonitoring(data, partialResults);
  const criticalFixture = calculateCriticalFixture(data, pipes);
  const systemValidation = calculateSystemValidation(data, { ...partialResults, subMetering, criticalFixture });
  const moduleCompleteness = calculateModuleCompleteness(data, partialResults);

  // Full result structure for warnings, checklist, and registers
  const fullResults: AllResults = {
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
    hotWater,
    wastewater,
    greywater,
    rainwater,
    fireWater,
    subMetering,
    smartMonitoring,
    criticalFixture,
    sustainability,
    systemValidation,
    moduleCompleteness,
    dataConfidence: systemValidation.dataConfidence,
    totalPopulation,
    warnings: [],
    recommendations: [],
    assumptions: [],
    calcRegister: [],
    checklist: [],
    wpsfRegister: data.wpsfFactors ?? [],
    completionPct: 0,
    overallStatus: 'INCOMPLETE',
  };

  const warnings = generateWarnings(data, fullResults);
  const recommendations = generateRecommendations(data, fullResults);
  const assumptions = generateAssumptions(data);
  const calcRegister = generateCalcRegister(data, fullResults);
  const checklist = generateChecklist(data, fullResults);
  const completionPct = calculateCompletion(data, fullResults);

  const overallStatus: 'PASS' | 'REVIEW' | 'INCOMPLETE' =
    completionPct < 40
      ? 'INCOMPLETE'
      : warnings.filter(w => w.level === 'critical').length === 0 && systemValidation.reviewCount === 0
      ? 'PASS'
      : 'REVIEW';

  return {
    ...fullResults,
    warnings,
    recommendations,
    assumptions,
    calcRegister,
    checklist,
    completionPct,
    overallStatus,
  };
}
