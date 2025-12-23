/**
 * Aircraft feature-based configuration for pricing engine
 * All aircraft are mapped to feature profiles, not hardcoded pricing
 */

export type SizeClass = 'small_piston' | 'hp_piston' | 'turboprop' | 'light_jet';
export type ComplexityBand = 'low' | 'medium' | 'high';
export type HangarFootprintClass = 'piston_single' | 'piston_hp' | 'turboprop' | 'jet_light';

export interface AircraftFeatures {
  id: string;
  label: string;
  typicalModels: string[];
  sizeClass: SizeClass;
  hasTurbo: boolean;
  hasTKS: boolean;
  hasOxygen: boolean;
  hasPressurization: boolean;
  cleaningComplexity: 1 | 2 | 3 | 4 | 5;
  systemsComplexity: 1 | 2 | 3 | 4 | 5;
  consumablesProfile: {
    tksPerHour: number;      // Relative units per hour
    oxygenPerHour: number;   // Relative units per hour
    oilPerHour: number;      // Relative units per hour
  };
  hangarFootprintClass: HangarFootprintClass;
}

// Aircraft feature profiles configuration
export const AIRCRAFT_PROFILES: Record<string, AircraftFeatures> = {
  'cessna-172': {
    id: 'cessna-172',
    label: 'Cessna 172',
    typicalModels: ['172N', '172P', '172S'],
    sizeClass: 'small_piston',
    hasTurbo: false,
    hasTKS: false,
    hasOxygen: false,
    hasPressurization: false,
    cleaningComplexity: 1,
    systemsComplexity: 1,
    consumablesProfile: {
      tksPerHour: 0,
      oxygenPerHour: 0,
      oilPerHour: 0.5,
    },
    hangarFootprintClass: 'piston_single',
  },
  
  'sr20': {
    id: 'sr20',
    label: 'Cirrus SR20',
    typicalModels: ['SR20 G2', 'SR20 G3', 'SR20 G6'],
    sizeClass: 'small_piston',
    hasTurbo: false,
    hasTKS: false,
    hasOxygen: false,
    hasPressurization: false,
    cleaningComplexity: 2,
    systemsComplexity: 2,
    consumablesProfile: {
      tksPerHour: 0,
      oxygenPerHour: 0,
      oilPerHour: 0.6,
    },
    hangarFootprintClass: 'piston_single',
  },

  'sr22-na': {
    id: 'sr22-na',
    label: 'Cirrus SR22 (NA)',
    typicalModels: ['SR22 G3', 'SR22 G5', 'SR22 G6'],
    sizeClass: 'hp_piston',
    hasTurbo: false,
    hasTKS: false,
    hasOxygen: true,
    hasPressurization: false,
    cleaningComplexity: 2,
    systemsComplexity: 3,
    consumablesProfile: {
      tksPerHour: 0,
      oxygenPerHour: 0.5,
      oilPerHour: 0.7,
    },
    hangarFootprintClass: 'piston_hp',
  },

  'sr22t-fiki': {
    id: 'sr22t-fiki',
    label: 'Cirrus SR22T FIKI',
    typicalModels: ['SR22T G5', 'SR22T G6'],
    sizeClass: 'hp_piston',
    hasTurbo: true,
    hasTKS: true,
    hasOxygen: true,
    hasPressurization: false,
    cleaningComplexity: 3,
    systemsComplexity: 4,
    consumablesProfile: {
      tksPerHour: 1.2,
      oxygenPerHour: 0.8,
      oilPerHour: 0.8,
    },
    hangarFootprintClass: 'piston_hp',
  },

  'bonanza-a36': {
    id: 'bonanza-a36',
    label: 'Beechcraft Bonanza A36',
    typicalModels: ['A36', 'A36TC', 'G36'],
    sizeClass: 'hp_piston',
    hasTurbo: false,
    hasTKS: false,
    hasOxygen: false,
    hasPressurization: false,
    cleaningComplexity: 2,
    systemsComplexity: 2,
    consumablesProfile: {
      tksPerHour: 0,
      oxygenPerHour: 0,
      oilPerHour: 0.7,
    },
    hangarFootprintClass: 'piston_hp',
  },

  'baron-58': {
    id: 'baron-58',
    label: 'Beechcraft Baron 58',
    typicalModels: ['58', '58P', '58TC'],
    sizeClass: 'hp_piston',
    hasTurbo: true,
    hasTKS: true,
    hasOxygen: true,
    hasPressurization: true,
    cleaningComplexity: 3,
    systemsComplexity: 4,
    consumablesProfile: {
      tksPerHour: 1.5,
      oxygenPerHour: 1.0,
      oilPerHour: 1.2,
    },
    hangarFootprintClass: 'piston_hp',
  },

  'tbm-960': {
    id: 'tbm-960',
    label: 'TBM 960',
    typicalModels: ['TBM 850', 'TBM 910', 'TBM 960'],
    sizeClass: 'turboprop',
    hasTurbo: true,
    hasTKS: true,
    hasOxygen: true,
    hasPressurization: true,
    cleaningComplexity: 4,
    systemsComplexity: 5,
    consumablesProfile: {
      tksPerHour: 2.0,
      oxygenPerHour: 1.5,
      oilPerHour: 1.0,
    },
    hangarFootprintClass: 'turboprop',
  },

  'pc-12': {
    id: 'pc-12',
    label: 'Pilatus PC-12',
    typicalModels: ['PC-12/45', 'PC-12/47E', 'PC-12 NGX'],
    sizeClass: 'turboprop',
    hasTurbo: true,
    hasTKS: true,
    hasOxygen: true,
    hasPressurization: true,
    cleaningComplexity: 4,
    systemsComplexity: 5,
    consumablesProfile: {
      tksPerHour: 2.2,
      oxygenPerHour: 1.5,
      oilPerHour: 0.8,
    },
    hangarFootprintClass: 'turboprop',
  },

  'king-air-250': {
    id: 'king-air-250',
    label: 'King Air 250',
    typicalModels: ['King Air 200', 'King Air 250', 'King Air 350'],
    sizeClass: 'turboprop',
    hasTurbo: true,
    hasTKS: true,
    hasOxygen: true,
    hasPressurization: true,
    cleaningComplexity: 4,
    systemsComplexity: 5,
    consumablesProfile: {
      tksPerHour: 2.5,
      oxygenPerHour: 2.0,
      oilPerHour: 1.5,
    },
    hangarFootprintClass: 'turboprop',
  },

  'citation-cj3': {
    id: 'citation-cj3',
    label: 'Citation CJ3+',
    typicalModels: ['CJ2+', 'CJ3', 'CJ3+'],
    sizeClass: 'light_jet',
    hasTurbo: true,
    hasTKS: true,
    hasOxygen: true,
    hasPressurization: true,
    cleaningComplexity: 5,
    systemsComplexity: 5,
    consumablesProfile: {
      tksPerHour: 3.0,
      oxygenPerHour: 2.5,
      oilPerHour: 1.2,
    },
    hangarFootprintClass: 'jet_light',
  },

  'phenom-300': {
    id: 'phenom-300',
    label: 'Phenom 300',
    typicalModels: ['Phenom 100', 'Phenom 300', 'Phenom 300E'],
    sizeClass: 'light_jet',
    hasTurbo: true,
    hasTKS: true,
    hasOxygen: true,
    hasPressurization: true,
    cleaningComplexity: 5,
    systemsComplexity: 5,
    consumablesProfile: {
      tksPerHour: 3.2,
      oxygenPerHour: 2.5,
      oilPerHour: 1.0,
    },
    hangarFootprintClass: 'jet_light',
  },

  // Custom profile for user-configured aircraft
  'custom': {
    id: 'custom',
    label: 'Custom Aircraft',
    typicalModels: [],
    sizeClass: 'hp_piston', // Default, will be overridden
    hasTurbo: false,
    hasTKS: false,
    hasOxygen: false,
    hasPressurization: false,
    cleaningComplexity: 3,
    systemsComplexity: 3,
    consumablesProfile: {
      tksPerHour: 0,
      oxygenPerHour: 0,
      oilPerHour: 0.8,
    },
    hangarFootprintClass: 'piston_hp',
  },
};

// Helper function to derive complexity band from cleaning/systems complexity
export function deriveComplexityBand(features: AircraftFeatures): ComplexityBand {
  const avgComplexity = (features.cleaningComplexity + features.systemsComplexity) / 2;
  
  if (avgComplexity <= 2) return 'low';
  if (avgComplexity <= 3.5) return 'medium';
  return 'high';
}

// Export list of aircraft for UI
export const AIRCRAFT_LIST = Object.values(AIRCRAFT_PROFILES)
  .filter(a => a.id !== 'custom')
  .map(a => ({
    id: a.id,
    label: a.label,
    category: a.sizeClass,
  }));
