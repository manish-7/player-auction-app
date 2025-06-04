export interface TeamTemplate {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export const teamTemplates: TeamTemplate[] = [
  {
    name: 'Mumbai Indians',
    logo: '🔵',
    primaryColor: '#004BA0',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Chennai Super Kings',
    logo: '🦁',
    primaryColor: '#FFFF00',
    secondaryColor: '#1E3A8A',
  },
  {
    name: 'Royal Challengers Bangalore',
    logo: '👑',
    primaryColor: '#EC4899',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Kolkata Knight Riders',
    logo: '⚔️',
    primaryColor: '#4C1D95',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Delhi Capitals',
    logo: '🏛️',
    primaryColor: '#1E40AF',
    secondaryColor: '#DC2626',
  },
  {
    name: 'Punjab Kings',
    logo: '👑',
    primaryColor: '#DC2626',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Rajasthan Royals',
    logo: '🏰',
    primaryColor: '#EC4899',
    secondaryColor: '#1E40AF',
  },
  {
    name: 'Sunrisers Hyderabad',
    logo: '🌅',
    primaryColor: '#F97316',
    secondaryColor: '#000000',
  },
  {
    name: 'Gujarat Titans',
    logo: '⚡',
    primaryColor: '#1E40AF',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Lucknow Super Giants',
    logo: '🦅',
    primaryColor: '#06B6D4',
    secondaryColor: '#F97316',
  },
  {
    name: 'Team Alpha',
    logo: '🔥',
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
  },
  {
    name: 'Team Beta',
    logo: '⚡',
    primaryColor: '#059669',
    secondaryColor: '#FFFFFF',
  },
  {
    name: 'Team Gamma',
    logo: '🌟',
    primaryColor: '#7C3AED',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Team Delta',
    logo: '🚀',
    primaryColor: '#0891B2',
    secondaryColor: '#FFFFFF',
  },
  {
    name: 'Team Epsilon',
    logo: '💎',
    primaryColor: '#BE185D',
    secondaryColor: '#FFD700',
  },
  {
    name: 'Team Zeta',
    logo: '🎯',
    primaryColor: '#EA580C',
    secondaryColor: '#FFFFFF',
  },
];

export const getTeamTemplate = (index: number): TeamTemplate => {
  return teamTemplates[index] || {
    name: `Team ${index + 1}`,
    logo: '🏏',
    primaryColor: '#6B7280',
    secondaryColor: '#FFFFFF',
  };
};
