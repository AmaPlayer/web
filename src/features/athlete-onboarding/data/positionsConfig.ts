import { Position } from '../store/onboardingStore';

export interface SportPositions {
  sportId: string;
  positions: Position[];
}

const ATHLETICS_POSITIONS = [
  {
    id: 'sprint-races',
    name: 'Sprint Races(short distance)',
    description: 'Short distance running events',
    icon: '🏃'
  },
  {
    id: 'middle-distance-races',
    name: 'Middle-Distance Races',
    description: 'Races over middle distances',
    icon: '🏃'
  },
  {
    id: 'long-distance-races',
    name: 'Long-Distance Races',
    description: 'Races over long distances',
    icon: '🏃‍♀️'
  },
  {
    id: 'hurdle-races',
    name: 'Hurdle Races',
    description: 'Races with hurdles',
    icon: '🏃‍♂️'
  },
  {
    id: 'steeplechase',
    name: 'Steeplechase',
    description: 'Distance race with obstacles',
    icon: '🚧'
  },
  {
    id: 'relay-races',
    name: 'Relay Races',
    description: '4 Runner Team',
    icon: '👨‍👨‍👧‍👦'
  },
  {
    id: 'mixed-relays',
    name: 'Mixed Relays(newer format)',
    description: 'Relay races with mixed-gender teams',
    icon: '👨‍👩‍👧‍👦'
  }
];

const CRICKET_POSITIONS = [
  {
    id: 'bowling',
    name: 'Bowling',
    description: 'Specialist in bowling deliveries',
    icon: '🏏'
  },
  {
    id: 'batting',
    name: 'Batting',
    description: 'Specialist in batting and scoring runs',
    icon: '🏏'
  },
  {
    id: 'wicket-keeping',
    name: 'All rounder/Wicket keeping',
    description: 'All-rounder player or wicket keeper behind the stumps',
    icon: '🧤'
  }
];

const FOOTBALL_POSITIONS = [
  {
    id: 'goalkeeper',
    name: 'Goalkeeper',
    description: 'Defends the goal',
    icon: '🥅'
  },
  {
    id: 'defender',
    name: 'Defender',
    description: 'Defensive player',
    icon: '🛡️'
  },
  {
    id: 'midfielder',
    name: 'Midfielder',
    description: 'Plays in the middle of the field',
    icon: '⚽'
  },
  {
    id: 'forward',
    name: 'Forward',
    description: 'Attacking player',
    icon: '⚽'
  }
];

const BASKETBALL_POSITIONS = [
  {
    id: 'guard',
    name: 'Guard',
    description: 'Ball handler and perimeter player',
    icon: '🏀'
  },
  {
    id: 'centre',
    name: 'Center',
    description: 'Plays near the basket, tallest player',
    icon: '🏀'
  },
  {
    id: 'forward',
    name: 'Forward',
    description: 'Versatile wing and frontcourt player',
    icon: '🏀'
  }
];

const HOCKEY_POSITIONS = [
  {
    id: 'goalkeeper',
    name: 'Goalkeeper',
    description: 'Defends the goal',
    icon: '🥅'
  },
  {
    id: 'defender',
    name: 'Defender',
    description: 'Defensive player',
    icon: '🏑'
  },
  {
    id: 'midfielder',
    name: 'Midfielder',
    description: 'Plays in the middle of the field',
    icon: '🏑'
  },
  {
    id: 'forward',
    name: 'Forward',
    description: 'Attacking player',
    icon: '🏑'
  }
];

const SWIMMING_POSITIONS = [
  {
    id: 'freestyle',
    name: 'Freestyle',
    description: 'Freestyle swimming specialist',
    icon: '🏊'
  },
  {
    id: 'backstroke',
    name: 'Backstroke',
    description: 'Backstroke swimming specialist',
    icon: '🏊‍♂️'
  },
  {
    id: 'breaststroke',
    name: 'Breaststroke',
    description: 'Breaststroke swimming specialist',
    icon: '🏊‍♀️'
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    description: 'Butterfly stroke specialist',
    icon: '🏊'
  },
  {
    id: 'individual-medley',
    name: 'Individual Medley',
    description: 'All-stroke specialist',
    icon: '🏊‍♂️'
  }
];

const VOLLEYBALL_POSITIONS = [
  {
    id: 'setters',
    name: 'Setters',
    description: 'Sets the ball for attackers',
    icon: '🏐'
  },
  {
    id: 'hitters',
    name: 'Hitters',
    description: 'Offensive attackers who spike the ball',
    icon: '🏐'
  },
  {
    id: 'defensive-specialist',
    name: 'Defensive specialist',
    description: 'Specialist in defense and receiving',
    icon: '🏐'
  }
];

const FIELD_EVENTS_POSITIONS = [
  {
    id: 'jumping-event',
    name: 'Jumping event',
    description: 'Jumping events in athletics',
    icon: '🤸'
  },
  {
    id: 'throwing-event',
    name: 'Throwing event',
    description: 'Throwing events in athletics',
    icon: ' discus'
  },
  {
    id: 'combined-events',
    name: 'Combined events',
    description: 'Events combining multiple disciplines',
    icon: '🏅'
  }
];

const KABADDI_POSITIONS = [
  {
    id: 'raider',
    name: 'Raider',
    description: 'Specialist in raiding and scoring points',
    icon: '🏃'
  },
  {
    id: 'defender',
    name: 'Defender',
    description: 'Specialist in defending and tackling raiders',
    icon: '🛡️'
  },
  {
    id: 'all-rounder',
    name: 'All rounder',
    description: 'Skilled in both raiding and defending',
    icon: '⚡'
  }
];

export const POSITIONS_CONFIG: SportPositions[] = [
  {
    sportId: 'athletics',
    positions: ATHLETICS_POSITIONS
  },
  {
    sportId: 'cricket',
    positions: CRICKET_POSITIONS
  },
  {
    sportId: 'football',
    positions: FOOTBALL_POSITIONS
  },
  {
    sportId: 'basketball',
    positions: BASKETBALL_POSITIONS
  },
  {
    sportId: 'hockey',
    positions: HOCKEY_POSITIONS
  },
  {
    sportId: 'swimming',
    positions: SWIMMING_POSITIONS
  },
  {
    sportId: 'volleyball',
    positions: VOLLEYBALL_POSITIONS
  },
  {
    sportId: 'field-events',
    positions: FIELD_EVENTS_POSITIONS
  },
  {
    sportId: 'kabaddi',
    positions: KABADDI_POSITIONS
  }
];

export const getPositionsBySportId = (sportId: string): Position[] => {
  const sportPositions = POSITIONS_CONFIG.find(sp => sp.sportId === sportId);
  return sportPositions ? sportPositions.positions : [];
};

export const getPositionById = (sportId: string, positionId: string): Position | undefined => {
  const positions = getPositionsBySportId(sportId);
  return positions.find(position => position.id === positionId);
};