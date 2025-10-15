import { Position } from '../store/onboardingStore';

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
}

export interface PositionSubcategories {
  positionId: string;
  subcategories: Subcategory[];
}

export const SUBCATEGORIES_CONFIG: PositionSubcategories[] = [
  {
    positionId: 'bowling',
    subcategories: [
      { id: 'fast', name: 'Fast' },
      { id: 'fast-medium-medium', name: 'Fast Medium and Medium' },
      { id: 'medium-slow-spinner', name: 'Medium Slow and Spinner' }
    ]
  },
  {
    positionId: 'batting',
    subcategories: [
      { id: 'top-order', name: 'Top Order' },
      { id: 'middle-order', name: 'Middle Order' },
      { id: 'lower-order', name: 'Lower Order' }
    ]
  },
  {
    positionId: 'track-event',
    subcategories: [
      { id: '100m-sprint', name: '100m Sprint' },
      { id: '200m-sprint', name: '200m Sprint' },
      { id: '400m-sprint', name: '400m Sprint' },
      { id: '800m-sprint', name: '800m Sprint' },
      { id: '1500m-sprint', name: '1500m Sprint' },
      { id: '5000m-sprint', name: '5000m Sprint' },
      { id: '10000m-sprint', name: '10,000m Sprint' }
    ]
  },
  {
    positionId: 'hurdles-games',
    subcategories: [
      { id: '110m-hurdles', name: '110m Hurdles' },
      { id: '4x100m-hurdles', name: '4 × 100m Hurdles' },
      { id: '4x400m-hurdles', name: '4 × 400m Hurdles' },
      { id: '400m-hurdles', name: '400m Hurdles' }
    ]
  },
  {
    positionId: 'field-event',
    subcategories: [
      { id: 'long-jump', name: 'Long Jump' },
      { id: 'triple-jump', name: 'Triple Jump' },
      { id: 'high-jump', name: 'High Jump' },
      { id: 'javelin-throw', name: 'Javelin Throw' },
      { id: 'pole-vault', name: 'Pole Vault' },
      { id: 'shot-put', name: 'Shot Put' },
      { id: 'discus-throw', name: 'Discus Throw' },
      { id: 'hammer-throw', name: 'Hammer Throw' }
    ]
  },
  {
    positionId: 'road-event',
    subcategories: [
      { id: 'marathon', name: 'Marathon' },
      { id: 'race-walk-10km', name: 'Race Walk 10km' },
      { id: 'race-walk-20km', name: 'Race Walk 20km' }
    ]
  }
];

export const getSubcategoriesByPositionId = (positionId: string): Subcategory[] => {
  const positionSubcategories = SUBCATEGORIES_CONFIG.find(ps => ps.positionId === positionId);
  return positionSubcategories ? positionSubcategories.subcategories : [];
};

export const getSubcategoryById = (positionId: string, subcategoryId: string): Subcategory | undefined => {
  const subcategories = getSubcategoriesByPositionId(positionId);
  return subcategories.find(subcategory => subcategory.id === subcategoryId);
};