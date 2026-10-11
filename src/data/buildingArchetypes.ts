// ============================================================
// BUILDING SERVICES ARCHETYPES & PARAMETRIC INFERENCE DATA
// Standards: BS EN 806, CIBSE Guide G, CIPHE Design Guide,
//            National Water Supply & Drainage Board (NWSDB)
// ============================================================

import type { ProjectType } from '@/types';

export interface BuildingArchetypeConfig {
  id: string;
  name: string;
  projectType: ProjectType;
  iconName: 'Building2' | 'Home' | 'Hotel' | 'GraduationCap' | 'Hospital' | 'Utensils' | 'Briefcase';
  shortDescription: string;
  unitLabel: string; // e.g. "Occupants", "Apartments", "Guest Rooms", "Students", "Hospital Beds", "Dining Seats"
  defaultQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  typicalFloors: number;
  grossFloorAreaPerUnitM2: number; // m² per unit for cleaning/roof area estimation
  perCapitaWaterDemandLpd: number; // L/person/day base
  occupantsPerUnit: number; // multiplier from unit to people
  maxDayFactor: number; // K_day peak ratio
  storageDurationDays: number; // e.g. 1.0 (24h) or 2.0 (48h)
  hotWaterLpdPerPerson: number;
  breakTankPct: number; // % underground
  roofTankPct: number; // % rooftop gravity
  hasCanteen: boolean;
  mealsRatioPerPerson: number; // meals per person/day
  fixtureRatios: {
    wcRatio: number; // 1 WC per X persons/units
    basinRatio: number; // 1 Basin per X persons/units
    showerRatio: number; // 1 Shower per X persons/units
    sinkRatio: number; // 1 Sink per X persons/units
    urinalRatio: number; // 1 Urinal per X persons
  };
  fireHazardCategory: 'Light' | 'Ordinary' | 'High';
  fireReserveM3: number;
  fireFlowLps: number;
  irrigationLpdPerUnit: number;
}

export const BUILDING_ARCHETYPES: BuildingArchetypeConfig[] = [
  {
    id: 'commercial_office',
    name: 'Commercial Office Building',
    projectType: 'Office',
    iconName: 'Briefcase',
    shortDescription: 'Corporate offices, banking halls, IT parks, and administrative complexes',
    unitLabel: 'Total Staff / Employees',
    defaultQuantity: 150,
    minQuantity: 10,
    maxQuantity: 2500,
    typicalFloors: 5,
    grossFloorAreaPerUnitM2: 12, // 12 m² per desk
    perCapitaWaterDemandLpd: 45, // CIBSE Guide G: 40-50 L/person/day
    occupantsPerUnit: 1.0,
    maxDayFactor: 1.35,
    storageDurationDays: 1.0, // 24 hours reserve
    hotWaterLpdPerPerson: 5, // Handwashing basins
    breakTankPct: 60,
    roofTankPct: 40,
    hasCanteen: true,
    mealsRatioPerPerson: 0.8, // 80% staff take tea/lunch
    fixtureRatios: {
      wcRatio: 20, // 1 WC per 20 staff (CIBSE Table 2.1)
      basinRatio: 20, // 1 Basin per 20 staff
      showerRatio: 100, // 1 Executive shower per 100 staff
      sinkRatio: 50, // 1 Pantry sink per 50 staff
      urinalRatio: 25, // 1 Urinal per 25 male staff
    },
    fireHazardCategory: 'Ordinary',
    fireReserveM3: 25, // 25 m³ low/med-rise office
    fireFlowLps: 15,
    irrigationLpdPerUnit: 2, // Minimal landscaping
  },
  {
    id: 'residential_apartment',
    name: 'Multi-Family Residential Apartments',
    projectType: 'Commercial',
    iconName: 'Building2',
    shortDescription: 'Apartment towers, condominium flats, and modern housing blocks',
    unitLabel: 'Number of Apartments',
    defaultQuantity: 24,
    minQuantity: 4,
    maxQuantity: 300,
    typicalFloors: 6,
    grossFloorAreaPerUnitM2: 95, // 95 m² average flat
    perCapitaWaterDemandLpd: 135, // BS EN 806 / CIBSE: 120-150 L/p/d
    occupantsPerUnit: 4.0, // 4 persons per household
    maxDayFactor: 1.4,
    storageDurationDays: 1.5, // 36 hours reserve for residential security
    hotWaterLpdPerPerson: 40, // Showers and kitchen
    breakTankPct: 60,
    roofTankPct: 40,
    hasCanteen: false,
    mealsRatioPerPerson: 0,
    fixtureRatios: {
      wcRatio: 0.5, // 2 WCs per apartment (1 / 0.5 = 2)
      basinRatio: 0.5, // 2 Washbasins per apartment
      showerRatio: 0.5, // 2 Showers per apartment
      sinkRatio: 1.0, // 1 Kitchen sink per flat
      urinalRatio: 0,
    },
    fireHazardCategory: 'Ordinary',
    fireReserveM3: 30,
    fireFlowLps: 15,
    irrigationLpdPerUnit: 15,
  },
  {
    id: 'hotel_hospitality',
    name: 'Hotel & Hospitality Resort',
    projectType: 'Commercial',
    iconName: 'Hotel',
    shortDescription: 'Hotels, boutique resorts, guest lodges, and tourist accommodation',
    unitLabel: 'Number of Guest Rooms',
    defaultQuantity: 60,
    minQuantity: 10,
    maxQuantity: 500,
    typicalFloors: 4,
    grossFloorAreaPerUnitM2: 55, // 55 m² per key inc. corridors
    perCapitaWaterDemandLpd: 180, // CIBSE Guide G: 160-220 L/guest/day
    occupantsPerUnit: 1.8, // 1.8 guests per occupied room
    maxDayFactor: 1.5, // High weekend peak
    storageDurationDays: 2.0, // 48h critical hotel reserve
    hotWaterLpdPerPerson: 65, // Luxury guest showering
    breakTankPct: 70,
    roofTankPct: 30,
    hasCanteen: true,
    mealsRatioPerPerson: 1.5, // Breakfast + dinner + banquet
    fixtureRatios: {
      wcRatio: 0.8, // 1.25 WCs per room (en-suite + public)
      basinRatio: 0.7,
      showerRatio: 1.0, // 1 shower/bath per key
      sinkRatio: 10, // Commercial kitchen & housekeeping sinks
      urinalRatio: 25,
    },
    fireHazardCategory: 'Ordinary',
    fireReserveM3: 45,
    fireFlowLps: 20,
    irrigationLpdPerUnit: 30, // Landscaped garden & pool deck
  },
  {
    id: 'educational_campus',
    name: 'School / University Campus',
    projectType: 'School',
    iconName: 'GraduationCap',
    shortDescription: 'Schools, technical training institutes, colleges, and university faculties',
    unitLabel: 'Total Number of Students',
    defaultQuantity: 400,
    minQuantity: 50,
    maxQuantity: 3000,
    typicalFloors: 3,
    grossFloorAreaPerUnitM2: 8,
    perCapitaWaterDemandLpd: 40, // Day students: 35-45 L/day
    occupantsPerUnit: 1.1, // Adds 10% for teachers & staff
    maxDayFactor: 1.3,
    storageDurationDays: 1.0,
    hotWaterLpdPerPerson: 3,
    breakTankPct: 60,
    roofTankPct: 40,
    hasCanteen: true,
    mealsRatioPerPerson: 0.9,
    fixtureRatios: {
      wcRatio: 30, // 1 WC per 30 students (school code)
      basinRatio: 25,
      showerRatio: 150, // Sports gym showers
      sinkRatio: 80, // Science lab & canteen sinks
      urinalRatio: 30,
    },
    fireHazardCategory: 'Ordinary',
    fireReserveM3: 35,
    fireFlowLps: 15,
    irrigationLpdPerUnit: 5,
  },
  {
    id: 'healthcare_clinic',
    name: 'Hospital / Healthcare Clinic',
    projectType: 'Hospital',
    iconName: 'Hospital',
    shortDescription: 'Hospitals, medical centres, dental clinics, and nursing facilities',
    unitLabel: 'Number of Patient Beds',
    defaultQuantity: 40,
    minQuantity: 5,
    maxQuantity: 400,
    typicalFloors: 4,
    grossFloorAreaPerUnitM2: 80,
    perCapitaWaterDemandLpd: 350, // 300-450 L/bed/day for acute healthcare
    occupantsPerUnit: 2.5, // Patients + clinical staff + visitors
    maxDayFactor: 1.3,
    storageDurationDays: 2.5, // 60h high security health reserve
    hotWaterLpdPerPerson: 70, // Clinical hygiene & sterilization
    breakTankPct: 70,
    roofTankPct: 30,
    hasCanteen: true,
    mealsRatioPerPerson: 2.0, // Inpatient nutrition
    fixtureRatios: {
      wcRatio: 1.5,
      basinRatio: 1.0, // High clinical scrub sink density
      showerRatio: 3.0,
      sinkRatio: 5.0,
      urinalRatio: 15,
    },
    fireHazardCategory: 'High',
    fireReserveM3: 50,
    fireFlowLps: 25,
    irrigationLpdPerUnit: 10,
  },
  {
    id: 'restaurant_dining',
    name: 'Restaurant / Commercial Dining',
    projectType: 'Commercial',
    iconName: 'Utensils',
    shortDescription: 'Restaurants, food courts, cafeterias, and banquet dining halls',
    unitLabel: 'Dining Seating Capacity (Seats)',
    defaultQuantity: 120,
    minQuantity: 20,
    maxQuantity: 600,
    typicalFloors: 1,
    grossFloorAreaPerUnitM2: 2.5,
    perCapitaWaterDemandLpd: 25, // 20-30 L per meal seat
    occupantsPerUnit: 1.2, // Inc. kitchen staff
    maxDayFactor: 1.6, // Heavy weekend rush
    storageDurationDays: 1.5,
    hotWaterLpdPerPerson: 15, // High commercial dishwashing
    breakTankPct: 80,
    roofTankPct: 20,
    hasCanteen: true,
    mealsRatioPerPerson: 2.5, // Table turnover rate
    fixtureRatios: {
      wcRatio: 25,
      basinRatio: 20,
      showerRatio: 120,
      sinkRatio: 15, // Multi-compartment potwash & scullery
      urinalRatio: 25,
    },
    fireHazardCategory: 'Ordinary',
    fireReserveM3: 20,
    fireFlowLps: 15,
    irrigationLpdPerUnit: 1,
  },
  {
    id: 'residential_villa',
    name: 'Private Luxury Villa / Bungalow',
    projectType: 'Commercial',
    iconName: 'Home',
    shortDescription: 'Single-family residences, luxury duplex villas, and executive bungalows',
    unitLabel: 'Number of Residents / Family Members',
    defaultQuantity: 6,
    minQuantity: 2,
    maxQuantity: 20,
    typicalFloors: 2,
    grossFloorAreaPerUnitM2: 60,
    perCapitaWaterDemandLpd: 160,
    occupantsPerUnit: 1.0,
    maxDayFactor: 1.35,
    storageDurationDays: 2.0,
    hotWaterLpdPerPerson: 50,
    breakTankPct: 60,
    roofTankPct: 40,
    hasCanteen: false,
    mealsRatioPerPerson: 0,
    fixtureRatios: {
      wcRatio: 1.2,
      basinRatio: 1.2,
      showerRatio: 1.5,
      sinkRatio: 3.0,
      urinalRatio: 0,
    },
    fireHazardCategory: 'Light',
    fireReserveM3: 10,
    fireFlowLps: 10,
    irrigationLpdPerUnit: 50, // Landscaped garden & lawn
  },
];
