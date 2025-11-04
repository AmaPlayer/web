import { Sport } from '../store/onboardingStore';

export const SPORTS_CONFIG: Sport[] = [
  {
    id: 'athletics',
    name: 'Athletics',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'football',
    name: 'Football',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'hockey',
    name: 'Hockey',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'swimming',
    name: 'Swimming',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'field-events',
    name: 'Field events',
    icon: '',
    image: '',
    description: ''
  },
  {
    id: 'kabaddi',
    name: 'Kabaddi',
    icon: '',
    image: '',
    description: ''
  }
];

export const getSportById = (id: string): Sport | undefined => {
  return SPORTS_CONFIG.find(sport => sport.id === id);
};

export const getSportsByIds = (ids: string[]): Sport[] => {
  return SPORTS_CONFIG.filter(sport => ids.includes(sport.id));
};