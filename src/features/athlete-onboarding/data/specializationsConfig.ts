import { Specialization } from '../store/onboardingStore';

export interface SpecializationCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  options?: Specialization[];
  type?: 'select' | 'input';
  placeholder?: string;
  unit?: string;
}

export interface SportPositionSpecializations {
  sportId: string;
  positionId: string;
  subcategoryId?: string;
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
    subcategoryId: 'spin',
    categories: [
      {
        id: 'bowling-style',
        name: 'Bowling Style',
        description: 'What type of bowling do you specialize in?',
        required: true,
        options: [
          {
            id: 'finger-spin',
            name: 'Finger spin',
            description: 'Off-spin and orthodox bowling using fingers',
            category: 'bowling-style'
          },
          {
            id: 'wrist-spin',
            name: 'Wrist spin',
            description: 'Leg-spin and googly bowling using wrist',
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
  {
    sportId: 'cricket',
    positionId: 'bowling',
    subcategoryId: 'pace',
    categories: [
      {
        id: 'bowling-pace',
        name: 'Bowling Pace',
        description: 'What type of pace bowling do you specialize in?',
        required: true,
        options: [
          {
            id: 'fast-pace',
            name: 'Fast Pace',
            description: 'High speed pace bowling',
            category: 'bowling-pace'
          },
          {
            id: 'medium-pace',
            name: 'Medium Pace',
            description: 'Medium speed pace bowling',
            category: 'bowling-pace'
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
      },
      {
        id: 'bowling-speed',
        name: 'Bowling Speed',
        description: 'What is your approximate bowling speed?',
        required: false,
        type: 'input',
        placeholder: 'e.g., 140',
        unit: 'km/hr'
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
  },
  // Kabaddi specializations
  {
    sportId: 'kabaddi',
    positionId: 'raider',
    categories: [
      {
        id: 'playing-side',
        name: 'Playing Side',
        description: 'Which is your strong playing side?',
        required: true,
        options: [
          {
            id: 'left',
            name: 'Left',
            description: 'Stronger on left side',
            category: 'playing-side'
          },
          {
            id: 'right',
            name: 'Right',
            description: 'Stronger on right side',
            category: 'playing-side'
          }
        ]
      },
      {
        id: 'match-fitness',
        name: 'Match Fitness',
        description: 'Rate your match fitness level (0-10)',
        required: false,
        type: 'input',
        placeholder: 'e.g., 8',
        unit: '/10'
      },
      {
        id: 'years-experience',
        name: 'Years of Experience',
        description: 'How many years have you been playing Kabaddi?',
        required: false,
        type: 'input',
        placeholder: 'e.g., 5',
        unit: 'years'
      },
      {
        id: 'kabaddi-format',
        name: 'Preferred Kabaddi Format',
        description: 'Which format do you prefer?',
        required: false,
        options: [
          {
            id: 'circle',
            name: 'Circle',
            description: 'Traditional circle style Kabaddi',
            category: 'kabaddi-format'
          },
          {
            id: 'standard',
            name: 'Standard',
            description: 'Standard mat Kabaddi',
            category: 'kabaddi-format'
          }
        ]
      },
      {
        id: 'level-played',
        name: 'Level Played',
        description: 'What level have you competed at?',
        required: false,
        options: [
          {
            id: 'local',
            name: 'Local level',
            description: 'Local tournaments and competitions',
            category: 'level-played'
          },
          {
            id: 'district',
            name: 'District level',
            description: 'District level competitions',
            category: 'level-played'
          },
          {
            id: 'state',
            name: 'State level',
            description: 'State level championships',
            category: 'level-played'
          },
          {
            id: 'national',
            name: 'National',
            description: 'National level competitions',
            category: 'level-played'
          },
          {
            id: 'international',
            name: 'International',
            description: 'International level competitions',
            category: 'level-played'
          }
        ]
      }
    ]
  },
  {
    sportId: 'kabaddi',
    positionId: 'defender',
    categories: [
      {
        id: 'playing-side',
        name: 'Playing Side',
        description: 'Which is your strong playing side?',
        required: true,
        options: [
          {
            id: 'left',
            name: 'Left',
            description: 'Stronger on left side',
            category: 'playing-side'
          },
          {
            id: 'right',
            name: 'Right',
            description: 'Stronger on right side',
            category: 'playing-side'
          }
        ]
      },
      {
        id: 'match-fitness',
        name: 'Match Fitness',
        description: 'Rate your match fitness level (0-10)',
        required: false,
        type: 'input',
        placeholder: 'e.g., 8',
        unit: '/10'
      },
      {
        id: 'years-experience',
        name: 'Years of Experience',
        description: 'How many years have you been playing Kabaddi?',
        required: false,
        type: 'input',
        placeholder: 'e.g., 5',
        unit: 'years'
      },
      {
        id: 'kabaddi-format',
        name: 'Preferred Kabaddi Format',
        description: 'Which format do you prefer?',
        required: false,
        options: [
          {
            id: 'circle',
            name: 'Circle',
            description: 'Traditional circle style Kabaddi',
            category: 'kabaddi-format'
          },
          {
            id: 'standard',
            name: 'Standard',
            description: 'Standard mat Kabaddi',
            category: 'kabaddi-format'
          }
        ]
      },
      {
        id: 'level-played',
        name: 'Level Played',
        description: 'What level have you competed at?',
        required: false,
        options: [
          {
            id: 'local',
            name: 'Local level',
            description: 'Local tournaments and competitions',
            category: 'level-played'
          },
          {
            id: 'district',
            name: 'District level',
            description: 'District level competitions',
            category: 'level-played'
          },
          {
            id: 'state',
            name: 'State level',
            description: 'State level championships',
            category: 'level-played'
          },
          {
            id: 'national',
            name: 'National',
            description: 'National level competitions',
            category: 'level-played'
          },
          {
            id: 'international',
            name: 'International',
            description: 'International level competitions',
            category: 'level-played'
          }
        ]
      }
    ]
  },
  {
    sportId: 'kabaddi',
    positionId: 'all-rounder',
    categories: [
      {
        id: 'playing-side',
        name: 'Playing Side',
        description: 'Which is your strong playing side?',
        required: true,
        options: [
          {
            id: 'left',
            name: 'Left',
            description: 'Stronger on left side',
            category: 'playing-side'
          },
          {
            id: 'right',
            name: 'Right',
            description: 'Stronger on right side',
            category: 'playing-side'
          }
        ]
      },
      {
        id: 'match-fitness',
        name: 'Match Fitness',
        description: 'Rate your match fitness level (0-10)',
        required: false,
        type: 'input',
        placeholder: 'e.g., 8',
        unit: '/10'
      },
      {
        id: 'years-experience',
        name: 'Years of Experience',
        description: 'How many years have you been playing Kabaddi?',
        required: false,
        type: 'input',
        placeholder: 'e.g., 5',
        unit: 'years'
      },
      {
        id: 'kabaddi-format',
        name: 'Preferred Kabaddi Format',
        description: 'Which format do you prefer?',
        required: false,
        options: [
          {
            id: 'circle',
            name: 'Circle',
            description: 'Traditional circle style Kabaddi',
            category: 'kabaddi-format'
          },
          {
            id: 'standard',
            name: 'Standard',
            description: 'Standard mat Kabaddi',
            category: 'kabaddi-format'
          }
        ]
      },
      {
        id: 'level-played',
        name: 'Level Played',
        description: 'What level have you competed at?',
        required: false,
        options: [
          {
            id: 'local',
            name: 'Local level',
            description: 'Local tournaments and competitions',
            category: 'level-played'
          },
          {
            id: 'district',
            name: 'District level',
            description: 'District level competitions',
            category: 'level-played'
          },
          {
            id: 'state',
            name: 'State level',
            description: 'State level championships',
            category: 'level-played'
          },
          {
            id: 'national',
            name: 'National',
            description: 'National level competitions',
            category: 'level-played'
          },
          {
            id: 'international',
            name: 'International',
            description: 'International level competitions',
            category: 'level-played'
          }
        ]
      }
    ]
  }
];

export const getSpecializationsBySportAndPosition = (
  sportId: string,
  positionId: string,
  subcategoryId?: string | null
): SpecializationCategory[] => {
  // First, try to find a config that matches sport, position, and subcategory
  let config = SPECIALIZATIONS_CONFIG.find(
    (sp) =>
      sp.sportId === sportId &&
      sp.positionId === positionId &&
      sp.subcategoryId === subcategoryId
  );

  // If no specific subcategory config is found, fall back to a config that only matches sport and position
  if (!config) {
    config = SPECIALIZATIONS_CONFIG.find(
      (sp) =>
        sp.sportId === sportId &&
        sp.positionId === positionId &&
        !sp.subcategoryId
    );
  }

  return config ? config.categories : [];
};

export const hasSpecializations = (sportId: string, positionId: string, subcategoryId?: string | null): boolean => {
  const specializations = getSpecializationsBySportAndPosition(sportId, positionId, subcategoryId);
  return specializations.length > 0;
};

export const getRequiredSpecializations = (
  sportId: string, 
  positionId: string,
  subcategoryId?: string | null
): SpecializationCategory[] => {
  const specializations = getSpecializationsBySportAndPosition(sportId, positionId, subcategoryId);
  return specializations.filter(category => category.required);
};

export const getOptionalSpecializations = (
  sportId: string, 
  positionId: string,
  subcategoryId?: string | null
): SpecializationCategory[] => {
  const specializations = getSpecializationsBySportAndPosition(sportId, positionId, subcategoryId);
  return specializations.filter(category => !category.required);
};