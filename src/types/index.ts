// ============================================================
// CORE TYPE DEFINITIONS — Smart Water Services Design System
// WATER SERVICES PROTOTYPE STANDARD FACTORS — WPSF v1.0
// ============================================================

export type FactorClassification =
  | 'STATUTORY REQUIREMENT'
  | 'AUTHORITY REQUIREMENT'
  | 'STANDARD REQUIREMENT'
  | 'PROJECT SPECIFICATION'
  | 'MANUFACTURER REQUIREMENT'
  | 'ENGINEERING CALCULATION'
  | 'PUBLISHED GUIDANCE'
  | 'PROTOTYPE STANDARD FACTOR'
  | 'ENGINEERING ASSUMPTION'
  | 'USER DEFINED'
  | 'VERIFICATION REQUIRED'
  | 'USER OVERRIDE';

// Backward compatibility alias
export type DesignStatus =
  | FactorClassification
  | 'Standard Requirement'
  | 'Guidance Value'
  | 'Manufacturer Requirement'
  | 'Client Requirement'
  | 'Engineering Assumption'
  | 'User Defined'
  | 'Verification Required';

export type ProjectType =
  | 'Vocational Training Centre'
  | 'School'
  | 'University'
  | 'Office'
  | 'Hostel'
  | 'Workshop'
  | 'Commercial'
  | 'Industrial'
  | 'Hospital'
  | 'Mixed Development'
  | 'Custom';

export type DesignStage =
  | 'Concept Design'
  | 'Preliminary Design'
  | 'Detailed Design'
  | 'Tender Design'
  | 'As-Built';

export type DesignMode = 'learning' | 'professional';

export type PumpArrangement = 'Duty' | 'Duty/Standby' | 'Duty/Assist/Standby' | 'Variable-Speed Booster' | 'Transfer Pump';

export type TankType = 'Underground' | 'Ground Level' | 'Roof' | 'Elevated';

export type TankShape = 'Rectangular' | 'Cylindrical';

export type StatusColor = 'green' | 'amber' | 'red';

export type DataConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

// ----------------------------------------------------------------
// WPSF v1.0 Categories & Factors
// ----------------------------------------------------------------

export type WPSFCategory =
  | 'Occupancy'
  | 'Domestic Demand'
  | 'Special Use'
  | 'Diversity / Peaking'
  | 'Storage'
  | 'Pumping'
  | 'Pipework'
  | 'Wastewater'
  | 'Rainwater'
  | 'Greywater'
  | 'Sustainability'
  | 'Hot Water'
  | 'Sub-metering';

export interface FactorOverride {
  factorId: string;
  originalValue: number;
  newValue: number;
  reason: string;
  source: string;
  reference: string;
  changedBy: string;
  date: string;
  revision: string;
}

export interface WPSFFactor {
  id: string;
  category: WPSFCategory;
  name: string;
  defaultValue: number;
  value: number;
  unit: string;
  minAdvisory?: number;
  maxAdvisory?: number;
  classification: FactorClassification;
  source: string;
  reference: string;
  designStage: string;
  applicableBuildingType: string;
  editable: boolean;
  verificationRequired: boolean;
  engineeringExplanation: string;
  learningExplanation: string;
  revision: string;
  effectiveDate: string;
  overrideDetails?: FactorOverride;
}

// ----------------------------------------------------------------
// Design Factor (for legacy factor list & UI bindings)
// ----------------------------------------------------------------

export interface DesignFactor {
  id: string;
  name: string;
  value: number;
  unit: string;
  source: string;
  standard?: string;
  clause?: string;
  classification: DesignStatus;
  editable: boolean;
  remarks?: string;
  minAdvisory?: number;
  maxAdvisory?: number;
  category?: WPSFCategory;
}

// ----------------------------------------------------------------
// Project Information
// ----------------------------------------------------------------

export interface ProjectInfo {
  projectName: string;
  projectNumber?: string;
  client: string;
  consultant: string;
  designer: string;
  checkedBy: string;
  approvedBy: string;
  location: string;
  district: string;
  province: string;
  country: string;
  projectType: ProjectType;
  buildingType: string;
  designStage: DesignStage;
  reportNumber: string;
  revision: string;
  date: string;
  preparedBy: string;
}

// ----------------------------------------------------------------
// Occupancy
// ----------------------------------------------------------------

export interface OccupancyGroup {
  id: string;
  name: string;
  category: 'Day Users' | 'Residential Users' | 'Other Users';
  count: number;
  occupancyPeriod: number; // hours/day
  daysPerWeek: number;
  consumptionFactor: number; // L/person/day
  unit: string;
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Domestic Water — Method A (per person) vs Method B (end-use)
// ----------------------------------------------------------------

export interface DomesticEndUse {
  id: string;
  name: string;
  perPersonPerDay: number; // L/person/day
  unit: string;
  source: string;
  classification: DesignStatus;
}

export interface DomesticWaterConfig {
  method: 'A' | 'B';
  useOccupancyRates: boolean;
  perPersonRate: number; // for Method A
  perPersonSource: string;
  perPersonClassification: DesignStatus;
  endUses: DomesticEndUse[]; // for Method B
}

// ----------------------------------------------------------------
// Canteen / Kitchen
// ----------------------------------------------------------------

export interface CanteenConfig {
  enabled: boolean;
  mealsPerDay: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  teaSnacks: number;
  kitchenStaff: number;
  waterPerMeal: number; // L/meal
  dishwashingMethod: string;
  drinkingWaterL: number;
  foodPrepL: number;
  cleaningL: number;
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Workshop / Process Water
// ----------------------------------------------------------------

export interface WorkshopProcess {
  id: string;
  category: string;
  equipment: string;
  process: string;
  waterPerEvent: number; // L
  eventsPerDay: number;
  operatingDays: number;
  flowRequirement: number; // L/s
  duration: number; // hours
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Cleaning
// ----------------------------------------------------------------

export interface CleaningConfig {
  enabled: boolean;
  academicFloorArea: number; // m²
  workshopFloorArea: number;
  toiletFloorArea: number;
  hostelFloorArea: number;
  externalPavedArea: number;
  cleaningRate: number; // L/m²
  cleaningFrequency: number; // times/week
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Landscape Irrigation
// ----------------------------------------------------------------

export interface IrrigationConfig {
  enabled: boolean;
  landscapeArea: number; // m²
  plantCategory: string;
  irrigationSystem: string;
  irrigationRate: number; // L/m²/day
  irrigationDays: number; // days/week
  seasonalAdjustment: number; // %
  rainfallContribution: number; // L/day
  recycledWaterContribution: number; // L/day
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Vehicle Washing
// ----------------------------------------------------------------

export interface VehicleWashingConfig {
  enabled: boolean;
  motorcycles: number;
  cars: number;
  vans: number;
  buses: number;
  heavyVehicles: number;
  waterPerMotorcycle: number;
  waterPerCar: number;
  waterPerVan: number;
  waterPerBus: number;
  waterPerHeavy: number;
  recyclingPct: number;
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------

export interface Fixture {
  id: string;
  type: string;
  quantity: number;
  loadingUnit: number;
  fixtureUnit: number;
  designFlow: number; // L/s
  source: string;
}

// ----------------------------------------------------------------
// Storage
// ----------------------------------------------------------------

export interface StorageConfig {
  storageDuration: number; // days
  reserveAllowance: number; // %
  operationalReserve: number; // %
  undergroundTankPct: number; // % of total
  roofTankPct: number;
  groundTankPct: number;
  elevatedTankPct: number;
  source: string;
  classification: DesignStatus;
}

export interface TankDimension {
  id: string;
  label: string;
  tankType: TankType;
  shape: TankShape;
  length: number; // m (or diameter for cylindrical)
  width: number; // m
  effectiveDepth: number; // m
  freeboard: number; // m
  requiredCapacity: number; // m³
}

// ----------------------------------------------------------------
// Pump
// ----------------------------------------------------------------

export interface PumpConfig {
  requiredFlow: number; // L/s
  staticHead: number; // m
  suctionHead: number; // m
  deliveryHead: number; // m
  pipeFriction: number; // m
  fittingLosses: number; // m
  equipmentLosses: number; // m
  requiredResidualPressure: number; // m
  safetyMargin: number; // %
  arrangement: PumpArrangement;
  pumpEfficiency: number; // %
  motorEfficiency: number; // %
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Pipe Design
// ----------------------------------------------------------------

export interface PipeDesign {
  id: string;
  label: string;
  material: string;
  inletHead: number; // m at upstream node
  hazenWilliamsC: number; // project design assumption
  maxVelocity: number; // m/s project criterion
  internalDiameter: number; // mm
  length: number; // m
  flow: number; // L/s
  elevationDifference: number; // m
  fittingLoss: number; // m
  source: string;
}

// ----------------------------------------------------------------
// Hot Water Module
// ----------------------------------------------------------------

export interface HotWaterConfig {
  enabled: boolean;
  showerHotWaterPct: number; // % of shower demand
  washbasinHotWaterPct: number;
  kitchenHotWaterPct: number;
  hostelHotWaterPct: number;
  coldWaterTempC: number; // ambient °C
  storageTempC: number; // 60°C for legionella safety
  deliveryTempC: number; // 40-45°C
  heatingTimeHours: number; // recovery hours
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Wastewater
// ----------------------------------------------------------------

export interface WastewaterConfig {
  sewerReturnFactor: number; // %
  processWastewater: number; // L/day
  kitchenWastewater: number; // L/day
  hostelWastewater: number; // L/day
  otherWastewater: number; // L/day
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Greywater
// ----------------------------------------------------------------

export interface GreywaterConfig {
  enabled: boolean;
  washBasinFlow: number; // L/day
  showerFlow: number; // L/day
  laundryFlow: number; // L/day
  otherSinkFlow: number; // L/day
  treatmentEfficiency: number; // %
  wcFlushingDemand: number; // eligible daily demand
  reuseForWCFlushing: boolean;
  reuseForIrrigation: boolean;
  reuseForCleaning: boolean;
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Rainwater Harvesting
// ----------------------------------------------------------------

export interface RainwaterConfig {
  enabled: boolean;
  roofArea: number; // m²
  annualRainfall: number; // mm
  runoffCoefficient: number;
  firstFlushLoss: number; // mm
  filterEfficiency: number; // %
  collectionEfficiency: number; // %
  monthlyRainfall: number[]; // 12 months in mm
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Fire Water
// ----------------------------------------------------------------

export interface FireWaterConfig {
  enabled: boolean;
  hazardClassification: string;
  buildingArea: number; // m²
  buildingHeight: number; // m
  hydrantRequired: boolean;
  hoseReelRequired: boolean;
  sprinklerRequired: boolean;
  fireFlow: number; // L/min
  fireDuration: number; // hours
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Sub-metering & Monitoring
// ----------------------------------------------------------------

export interface SubMeterZone {
  id: string;
  name: string;
  description: string;
  meterType: 'Electromagnetic' | 'Ultrasonic' | 'Multi-jet' | 'Turbine';
  installed: boolean;
  baselineDemandL: number; // L/day
  actualOrSimulatedDemandL: number; // L/day
}

export interface SubMeteringConfig {
  enabled: boolean;
  zones: SubMeterZone[];
  source: string;
  classification: DesignStatus;
}

// ----------------------------------------------------------------
// Future Expansion
// ----------------------------------------------------------------

export interface FutureExpansion {
  enabled: boolean;
  additionalStudents: number;
  additionalStaff: number;
  additionalHostelResidents: number;
  additionalBuildings: number;
  percentageGrowth: number; // %
  futureYear: number;
}

// ----------------------------------------------------------------
// Standards & References
// ----------------------------------------------------------------

export interface StandardReference {
  id: string;
  reference: string;
  title: string;
  application: string;
  sectionUsed: string;
  notes: string;
}

// ----------------------------------------------------------------
// Assumption
// ----------------------------------------------------------------

export interface Assumption {
  no: number;
  parameter: string;
  adoptedValue: string;
  unit: string;
  basis: string;
  reference: string;
  verificationRequired: boolean;
  remarks: string;
  classification?: FactorClassification;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'ACTIVE' | 'VERIFIED' | 'OVERRIDDEN';
}

// ----------------------------------------------------------------
// Calculation Register Entry
// ----------------------------------------------------------------

export interface CalcRegisterEntry {
  id: string;
  section: string;
  input: string;
  value: string;
  unit: string;
  factor: string;
  source: string;
  formula: string;
  result: string;
  status: DesignStatus;
  notes: string;
  engineeringInterpretation?: string;
  verificationStatus?: string;
}

// ----------------------------------------------------------------
// Recommendation
// ----------------------------------------------------------------

export interface Recommendation {
  id: string;
  text: string;
  category: 'Efficiency' | 'Storage' | 'Pumps' | 'Monitoring' | 'Sustainability' | 'Safety' | 'Hydraulics';
  priority: 'High' | 'Medium' | 'Low';
  triggerCondition?: string;
}

// ----------------------------------------------------------------
// Warning
// ----------------------------------------------------------------

export interface EngineeringWarning {
  id: string;
  level: 'critical' | 'warning' | 'advisory' | 'info';
  message: string; // Issue title
  section: string;
  currentValue?: string;
  referenceValue?: string;
  whyItMatters?: string;
  recommendedAction?: string;
  source?: string;
  classification?: FactorClassification;
}

// ----------------------------------------------------------------
// Design Checklist Item
// ----------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  text: string;
  status: 'Complete' | 'Review Required' | 'Not Applicable';
}

// ----------------------------------------------------------------
// Complete Project Data Model
// ----------------------------------------------------------------

export interface ProjectData {
  demandBasis: { lossAllowancePct: number; maxDayFactor: number; source: string };
  peakDesign: { flow: number; source: string; verified: boolean };

  projectInfo: ProjectInfo;
  occupancy: OccupancyGroup[];
  domesticWater: DomesticWaterConfig;
  canteen: CanteenConfig;
  workshops: WorkshopProcess[];
  cleaning: CleaningConfig;
  irrigation: IrrigationConfig;
  vehicleWashing: VehicleWashingConfig;
  fixtures: Fixture[];
  storage: StorageConfig;
  tankDimensions: TankDimension[];
  pump: PumpConfig;
  pipes: PipeDesign[];
  hotWater: HotWaterConfig;
  wastewater: WastewaterConfig;
  greywater: GreywaterConfig;
  rainwater: RainwaterConfig;
  fireWater: FireWaterConfig;
  subMetering: SubMeteringConfig;
  futureExpansion: FutureExpansion;
  standards: StandardReference[];
  designMode: DesignMode;

  // Controlled Prototype Factor System
  wpsfFactors: WPSFFactor[];
  factorOverrides: FactorOverride[];
  wpsfVersion: string;
}

// ----------------------------------------------------------------
// Calculation Results — comprehensive output models
// ----------------------------------------------------------------

export interface OccupancyResult {
  group: OccupancyGroup;
  dailyDemand: number; // L/day
  formula: string;
  substitution: string;
}

export interface DomesticResult {
  totalDemand: number; // L/day
  method: 'A' | 'B';
  breakdown: { name: string; value: number; unit: string }[];
  formula: string;
  substitution: string;
}

export interface SpecialDemandResult {
  canteenDemand: number;
  workshopDemand: number;
  cleaningDemand: number;
  irrigationDemand: number;
  vehicleWashingDemand: number;
  total: number;
  breakdown: { name: string; value: number; unit: string }[];
}

export interface WaterBalanceResult {
  sources: { name: string; value: number; pct: number }[];
  consumption: { name: string; value: number; pct: number }[];
  outflows: { name: string; value: number; pct: number }[];
  totalSupply: number;
  totalDemand: number;
  totalWastewater: number;
  totalLoss: number;
  balanceDiscrepancy: number; // Water In - (Water Out + Storage Change)
  balanceStatus: 'BALANCED' | 'DISCREPANCY';
}

export interface ADDResult {
  baseDemand: number;
  lossAllowancePct: number;
  futureExpansionPct: number;
  finalADD: number; // L/day
  finalADDm3: number; // m³/day
  formula: string;
  substitution: string;
}

export interface MDDResult {
  add: number;
  maxDayFactor: number;
  mdd: number; // L/day
  mddm3: number;
  formula: string;
  substitution: string;
}

export interface PeakFlowResult {
  totalFixtureUnits: number;
  probablePeakFlow: number; // L/s
  peakFlowLpm: number; // L/min
  peakFlowM3h: number; // m³/h
  formula: string;
  substitution: string;
  fixtureBreakdown: { type: string; qty: number; fu: number; totalFU: number }[];
  peakProcessFlowLps: number;
  combinedDesignPeakLps: number;
}

export interface StorageResult {
  dailyDemand: number; // m³/day
  requiredCapacity: number; // m³
  undergroundTank: number;
  roofTank: number;
  groundTank: number;
  elevatedTank: number;
  formula: string;
  substitution: string;
  check: boolean;
  statusText: string;
}

export interface TankDimensionResult {
  tank: TankDimension;
  grossVolume: number;
  effectiveVolume: number;
  surplusDeficiency: number;
  status: StatusColor;
  statusText: string;
}

export interface PumpResult {
  designFlow: number; // L/s
  designFlowM3h: number;
  tdh: number; // m
  hydraulicPower: number; // kW
  motorPower: number; // kW
  formula: string;
  substitution: string;
  curveVerified: boolean;
}

export interface PipeResult {
  pipe: PipeDesign;
  velocity: number; // m/s
  frictionLoss: number; // m
  totalPressureLoss: number; // m
  availablePressure: number; // m
  residualPressure: number; // m
  warnings: string[];
}

export interface HotWaterResult {
  dailyHotWaterDemandL: number;
  dailyHotWaterDemandM3: number;
  requiredStorageL: number;
  requiredStorageM3: number;
  heatingLoadKW: number;
  formula: string;
  substitution: string;
}

export interface WastewaterResult {
  indoorDemand: number;
  sewerReturn: number; // L/day
  totalWastewater: number; // L/day
  wastewaterM3Day: number;
  wastewaterM3Month: number;
  wastewaterM3Year: number;
  peakWastewaterFlowLps: number;
  formula: string;
  substitution: string;
}

export interface GreywaterResult {
  greywaterGenerated: number; // L/day
  reusableGreywater: number;
  reuseDemand: number;
  potableWaterReduction: number; // L/day
  potableReductionPct: number;
  greywaterBalance: number; // Supply - Demand (>0 excess, <0 make-up needed)
  excessLday: number;
  potableMakeupLday: number;
  formula: string;
  substitution: string;
}

export interface RainwaterResult {
  annualHarvested: number; // m³/year
  monthlyHarvested: number[]; // m³/month
  nonPotableOffset: number; // L/day
  potableSavingPct: number;
  monthlyNonPotableDemandM3: number[];
  monthlySupplyDemandDeltaM3: number[];
  tankUtilizationPct: number;
  formula: string;
  substitution: string;
}

export interface FireWaterResult {
  fireFlow: number; // L/min
  fireDuration: number;
  fireWaterStorage: number; // m³
  formula: string;
  substitution: string;
  criteriaVerified: boolean;
}

export interface SubMeteringResult {
  totalMeteredDemandL: number;
  zones: {
    id: string;
    name: string;
    consumptionL: number;
    pct: number;
    anomalyStatus: 'Normal' | 'Elevated' | 'Potential Leak' | 'Under-consumption';
    notes: string;
  }[];
  unaccountedDifferenceL: number;
  unaccountedPct: number;
}

export interface SmartMonitoringData {
  simulated: boolean;
  lastUpdated: string;
  flowMeterCurrentLps: number;
  tankLevels: {
    tankId: string;
    label: string;
    currentLevelPct: number;
    currentVolumeM3: number;
    status: 'Normal' | 'Low Alarm' | 'Overflow Alarm';
  }[];
  distributionPressureBar: number;
  pumpRunningStatus: {
    pumpId: string;
    label: string;
    running: boolean;
    status: 'Running' | 'Standby' | 'Fault';
  }[];
  leakageAlert: boolean;
  overflowAlert: boolean;
}

export interface CriticalFixtureResult {
  fixtureLabel: string;
  elevationM: number;
  runDistanceM: number;
  requiredFlowLps: number;
  requiredPressureM: number;
  calculatedResidualPressureM: number;
  status: 'ADEQUATE' | 'INSUFFICIENT RESIDUAL PRESSURE';
  recommendedAction: string;
}

export interface SubsystemValidationItem {
  id: string;
  subsystem: string;
  status: 'PASS' | 'REVIEW';
  finding: string;
  criteria: string;
}

export interface SystemValidationResult {
  items: SubsystemValidationItem[];
  overallStatus: 'READY FOR PROFESSIONAL PROTOTYPE USE' | 'REVIEW REQUIRED';
  passCount: number;
  reviewCount: number;
  dataConfidence: DataConfidence;
  confidenceNote: string;
}

export interface SustainabilityResult {
  potablePerPerson: number; // L/person/day
  rainwaterContributionPct: number;
  recycledContributionPct: number;
  potableReductionPct: number;
  annualSaving: number; // m³/year
  wastewaterReusePct: number;
  annualUtilityConsumption: number; // m³/year
  efficiencyScore: number; // 0-100
}

export interface ModuleCompleteness {
  projectInfo: number;
  occupancy: number;
  dailyDemand: number;
  peakDemand: number;
  storage: number;
  pumping: number;
  pipework: number;
  hotWater: number;
  wastewater: number;
  greywater: number;
  rainwater: number;
  fireWater: number;
  standards: number;
  sustainability: number;
  reports: number;
}

export interface AllResults {
  occupancy: OccupancyResult[];
  domestic: DomesticResult | null;
  specialDemand: SpecialDemandResult | null;
  waterBalance: WaterBalanceResult | null;
  add: ADDResult | null;
  mdd: MDDResult | null;
  peakFlow: PeakFlowResult | null;
  storage: StorageResult | null;
  tankDimensions: TankDimensionResult[];
  pump: PumpResult | null;
  pipes: PipeResult[];
  hotWater: HotWaterResult | null;
  wastewater: WastewaterResult | null;
  greywater: GreywaterResult | null;
  rainwater: RainwaterResult | null;
  fireWater: FireWaterResult | null;
  subMetering: SubMeteringResult | null;
  smartMonitoring: SmartMonitoringData;
  criticalFixture: CriticalFixtureResult | null;
  sustainability: SustainabilityResult | null;
  systemValidation: SystemValidationResult;
  moduleCompleteness: ModuleCompleteness;
  dataConfidence: DataConfidence;
  totalPopulation: number;
  warnings: EngineeringWarning[];
  recommendations: Recommendation[];
  assumptions: Assumption[];
  calcRegister: CalcRegisterEntry[];
  checklist: ChecklistItem[];
  wpsfRegister: WPSFFactor[];
  completionPct: number;
  overallStatus: 'PASS' | 'REVIEW' | 'INCOMPLETE';
}
