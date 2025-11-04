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
      { id: 'pace', name: 'Pace' },
      { id: 'spin', name: 'Spin' }
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
    positionId: 'guard',
    subcategories: [
      { id: 'point-guard', name: 'Point guard' },
      { id: 'shooting-guard', name: 'Shooting guard' },
      { id: 'combo-guard', name: 'Combo Guard' }
    ]
  },
  {
    positionId: 'centre',
    subcategories: [
      { id: 'traditional-center', name: 'Traditional Center' },
      { id: 'modern-center', name: 'Modern Center' },
      { id: 'defensive-center', name: 'Defensive Center' }
    ]
  },
  {
    positionId: 'forward',
    subcategories: [
      { id: 'small-forward', name: 'Small forward' },
      { id: 'power-forward', name: 'Power forward' },
      { id: 'stretch-forward', name: 'Stretch forward' }
    ]
  },
  {
    positionId: 'setters',
    subcategories: [
      { id: 'playmaker', name: 'Playmaker' }
    ]
  },
  {
    positionId: 'hitters',
    subcategories: [
      { id: 'outside-hitter', name: 'Outside hitter (Leftside)' },
      { id: 'opposite-hitter', name: 'Opposite hitter (Rightside)' },
      { id: 'middle-blocker', name: 'Middle blocker' }
    ]
  },
  {
    positionId: 'defensive-specialist',
        subcategories: [
          { id: 'libero', name: 'Libero' },
          { id: 'defensive-serving-specialist', name: 'Defensive/Serving specialist' }
        ]
      },
      {
        positionId: 'sprint-races',
        subcategories: [
          { id: '100m', name: '100 metres' },
          { id: '200m', name: '200 metres' },
          { id: '400m', name: '400 metres' }
        ]
      },
      {
        positionId: 'middle-distance-races',
        subcategories: [
          { id: '800m', name: '800 metres' },
          { id: '1500m', name: '1500 metres' }
        ]
      },
      {
        positionId: 'long-distance-races',
        subcategories: [
          { id: '3000m', name: '3000 metres' },
          { id: '5000m', name: '5000 metres' },
          { id: '10000m', name: '10000 metres' }
        ]
      },
      {
        positionId: 'hurdle-races',
        subcategories: [
          { id: '100m-hurdles-women', name: '100 metre hurdles(women)' },
          { id: '110m-hurdles-men', name: '110 metres hurdles(men)' },
          { id: '400m-hurdles-men-women', name: '400 metre(man and women)' }
        ]
      },
      {
        positionId: 'steeplechase',
        subcategories: [
          { id: '3000m-steeplechase', name: '3000 metre steeplechase' }
        ]
      },
      {
        positionId: 'relay-races',
        subcategories: [
          { id: '4x100m-relay', name: '4 x 100 meter relay' },
          { id: '4x400m-relay', name: '4x400 metres relay' }
        ]
      },
      {
        positionId: 'mixed-relays',
        subcategories: [
          { id: '4x400m-mixed-relay', name: '4x400 metres mixed relay (2 men + 2 women)' }
        ]
      },
      {
        positionId: 'jumping-event',
        subcategories: [
          { id: 'long-jump', name: 'Long-jump' },
          { id: 'triple-jump', name: 'Triple-jump' },
          { id: 'high-jump', name: 'High-jump' },
          { id: 'pole-vault', name: 'Pole vault' }
        ]
      },
      {
        positionId: 'throwing-event',
        subcategories: [
          { id: 'shot-put', name: 'Shot put' },
          { id: 'discus-throw', name: 'Discus throw' },
          { id: 'javelin-throw', name: 'Javelin throw' },
          { id: 'hammer-throw', name: 'Hammer throw' }
        ]
      },
      {
        positionId: 'combined-events',
        subcategories: [
          { id: 'men-decathlon', name: 'Men Decathlon(10 events)' },
          { id: 'women-heptathlon', name: 'Women Heptathlon(7 events)' }
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