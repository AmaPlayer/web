import { Position } from '../store/onboardingStore';

export interface SportPositions {
  sportId: string;
  positions: Position[];
}

const ATHLETICS_POSITIONS = [
  {
    id: 'track-event',
    name: 'Track Event',
    description: 'Running events on the track',
    icon: '🏃'
  },
  {
    id: 'hurdles-games',
    name: 'Hurdles Games',
    description: 'Hurdle racing events',
    icon: '🏃‍♂️'
  },
  {
    id: 'field-event',
    name: 'Field Event',
    description: 'Throwing and jumping events',
    icon: '🥇'
  },
  {
    id: 'road-event',
    name: 'Road Event',
    description: 'Marathon and road racing',
    icon: '🏃‍♀️'
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
    name: 'Wicket Keeping',
    description: 'Specialist wicket keeper behind the stumps',
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
    id: 'point-guard',
    name: 'Point Guard',
    description: 'Primary ball handler and playmaker',
    icon: '🏀'
  },
  {
    id: 'shooting-guard',
    name: 'Shooting Guard',
    description: 'Primary scorer from perimeter',
    icon: '🏀'
  },
  {
    id: 'small-forward',
    name: 'Small Forward',
    description: 'Versatile wing player',
    icon: '🏀'
  },
  {
    id: 'power-forward',
    name: 'Power Forward',
    description: 'Strong inside player',
    icon: '🏀'
  },
  {
    id: 'center',
    name: 'Center',
    description: 'Tallest player, plays near the basket',
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