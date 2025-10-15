import { Specialization } from '../store/onboardingStore';

export interface SpecializationCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  options: Specialization[];
}

export interface SportPositionSpecializations {
  sportId: string;
  positionId: string;
  categories: SpecializationCategory[];
}

export const SPECIALIZATIONS_CONFIG: SportPositionSpecializations[] = [
  // Cricket specializations
  {
    sportId: 'cricket',
    positionId: 'batting',
    categories: [
      {
        id: 'batting-hand',
        name: 'Batting Hand',
        description: 'Which hand do you prefer for batting?',
        required: true,
        options: [
          {
            id: 'right-handed',
            name: 'Right-handed',
            description: 'Bat with right hand leading',
            category: 'batting-hand'
          },
          {
            id: 'left-handed',
            name: 'Left-handed',
            description: 'Bat with left hand leading',
            category: 'batting-hand'
          }
        ]
      }
    ]
  },
  {
    sportId: 'cricket',
    positionId: 'bowling',
    categories: [
      {
        id: 'bowling-style',
        name: 'Bowling Style',
        description: 'What type of bowling do you specialize in?',
        required: true,
        options: [
          {
            id: 'fast-bowling',
            name: 'Fast Bowling',
            description: 'High-speed bowling with pace',
            category: 'bowling-style'
          },
          {
            id: 'spin-bowling',
            name: 'Spin Bowling',
            description: 'Bowling with spin and variation',
            category: 'bowling-style'
          },
          {
            id: 'medium-pace',
            name: 'Medium Pace',
            description: 'Moderate pace with swing',
            category: 'bowling-style'
          }
        ]
      },
      {
        id: 'bowling-arm',
        name: 'Bowling Arm',
        description: 'Which arm do you bowl with?',
        required: true,
        options: [
          {
            id: 'right-arm',
            name: 'Right Arm',
            description: 'Bowl with right arm',
            category: 'bowling-arm'
          },
          {
            id: 'left-arm',
            name: 'Left Arm',
            description: 'Bowl with left arm',
            category: 'bowling-arm'
          }
        ]
      }
    ]
  },
  // Football specializations
  {
    sportId: 'football',
    positionId: 'goalkeeper',
    categories: [
      {
        id: 'goalkeeper-style',
        name: 'Goalkeeper Style',
        description: 'What type of goalkeeper are you?',
        required: true,
        options: [
          {
            id: 'shot-stopping',
            name: 'Shot-stopping Specialist',
            description: 'Focus on making saves and blocking shots',
            category: 'goalkeeper-style'
          },
          {
            id: 'sweeper-keeper',
            name: 'Sweeper Keeper',
            description: 'Active outside the box, good with feet',
            category: 'goalkeeper-style'
          },
          {
            id: 'distribution-specialist',
            name: 'Distribution Specialist',
            description: 'Excellent at starting attacks with passes',
            category: 'goalkeeper-style'
          }
        ]
      }
    ]
  },
  {
    sportId: 'football',
    positionId: 'defender',
    categories: [
      {
        id: 'preferred-foot',
        name: 'Preferred Foot',
        description: 'Which foot do you prefer to use?',
        required: true,
        options: [
          {
            id: 'right-foot',
            name: 'Right Foot',
            description: 'Stronger with right foot',
            category: 'preferred-foot'
          },
          {
            id: 'left-foot',
            name: 'Left Foot',
            description: 'Stronger with left foot',
            category: 'preferred-foot'
          },
          {
            id: 'both-feet',
            name: 'Both Feet',
            description: 'Equally comfortable with both feet',
            category: 'preferred-foot'
          }
        ]
      }
    ]
  },
  {
    sportId: 'football',
    positionId: 'midfielder',
    categories: [
      {
        id: 'preferred-foot',
        name: 'Preferred Foot',
        description: 'Which foot do you prefer to use?',
        required: true,
        options: [
          {
            id: 'right-foot',
            name: 'Right Foot',
            description: 'Stronger with right foot',
            category: 'preferred-foot'
          },
          {
            id: 'left-foot',
            name: 'Left Foot',
            description: 'Stronger with left foot',
            category: 'preferred-foot'
          },
          {
            id: 'both-feet',
            name: 'Both Feet',
            description: 'Equally comfortable with both feet',
            category: 'preferred-foot'
          }
        ]
      }
    ]
  },
  {
    sportId: 'football',
    positionId: 'forward',
    categories: [
      {
        id: 'preferred-foot',
        name: 'Preferred Foot',
        description: 'Which foot do you prefer to use?',
        required: true,
        options: [
          {
            id: 'right-foot',
            name: 'Right Foot',
            description: 'Stronger with right foot',
            category: 'preferred-foot'
          },
          {
            id: 'left-foot',
            name: 'Left Foot',
            description: 'Stronger with left foot',
            category: 'preferred-foot'
          },
          {
            id: 'both-feet',
            name: 'Both Feet',
            description: 'Equally comfortable with both feet',
            category: 'preferred-foot'
          }
        ]
      }
    ]
  },
  // Basketball specializations
  {
    sportId: 'basketball',
    positionId: 'point-guard',
    categories: [
      {
        id: 'playing-style',
        name: 'Playing Style',
        description: 'What type of point guard are you?',
        required: false,
        options: [
          {
            id: 'floor-general',
            name: 'Floor General',
            description: 'Focus on assists and team coordination',
            category: 'playing-style'
          },
          {
            id: 'scoring-guard',
            name: 'Scoring Guard',
            description: 'Aggressive scorer who can also distribute',
            category: 'playing-style'
          }
        ]
      }
    ]
  },
  {
    sportId: 'basketball',
    positionId: 'shooting-guard',
    categories: [
      {
        id: 'shooting-preference',
        name: 'Shooting Preference',
        description: 'What type of shots do you prefer?',
        required: false,
        options: [
          {
            id: 'three-point-specialist',
            name: 'Three-Point Specialist',
            description: 'Excel at long-range shooting',
            category: 'shooting-preference'
          },
          {
            id: 'mid-range-scorer',
            name: 'Mid-Range Scorer',
            description: 'Strong from mid-range distances',
            category: 'shooting-preference'
          },
          {
            id: 'slasher',
            name: 'Slasher',
            description: 'Drive to the basket aggressively',
            category: 'shooting-preference'
          }
        ]
      }
    ]
  },
  // Tennis specializations
  {
    sportId: 'tennis',
    positionId: 'singles-specialist',
    categories: [
      {
        id: 'playing-hand',
        name: 'Playing Hand',
        description: 'Which hand do you play with?',
        required: true,
        options: [
          {
            id: 'right-handed',
            name: 'Right-handed',
            description: 'Play with right hand',
            category: 'playing-hand'
          },
          {
            id: 'left-handed',
            name: 'Left-handed',
            description: 'Play with left hand',
            category: 'playing-hand'
          }
        ]
      },
      {
        id: 'court-surface',
        name: 'Preferred Court Surface',
        description: 'Which surface do you prefer?',
        required: false,
        options: [
          {
            id: 'hard-court',
            name: 'Hard Court',
            description: 'Fast, consistent surface',
            category: 'court-surface'
          },
          {
            id: 'clay-court',
            name: 'Clay Court',
            description: 'Slower surface with high bounce',
            category: 'court-surface'
          },
          {
            id: 'grass-court',
            name: 'Grass Court',
            description: 'Fast, low-bouncing surface',
            category: 'court-surface'
          }
        ]
      }
    ]
  },
  {
    sportId: 'tennis',
    positionId: 'doubles-specialist',
    categories: [
      {
        id: 'playing-hand',
        name: 'Playing Hand',
        description: 'Which hand do you play with?',
        required: true,
        options: [
          {
            id: 'right-handed',
            name: 'Right-handed',
            description: 'Play with right hand',
            category: 'playing-hand'
          },
          {
            id: 'left-handed',
            name: 'Left-handed',
            description: 'Play with left hand',
            category: 'playing-hand'
          }
        ]
      }
    ]
  }
];

export const getSpecializationsBySportAndPosition = (
  sportId: string, 
  positionId: string
): SpecializationCategory[] => {
  const config = SPECIALIZATIONS_CONFIG.find(
    sp => sp.sportId === sportId && sp.positionId === positionId
  );
  return config ? config.categories : [];
};

export const hasSpecializations = (sportId: string, positionId: string): boolean => {
  const specializations = getSpecializationsBySportAndPosition(sportId, positionId);
  return specializations.length > 0;
};

export const getRequiredSpecializations = (
  sportId: string, 
  positionId: string
): SpecializationCategory[] => {
  const specializations = getSpecializationsBySportAndPosition(sportId, positionId);
  return specializations.filter(category => category.required);
};

export const getOptionalSpecializations = (
  sportId: string, 
  positionId: string
): SpecializationCategory[] => {
  const specializations = getSpecializationsBySportAndPosition(sportId, positionId);
  return specializations.filter(category => !category.required);
};