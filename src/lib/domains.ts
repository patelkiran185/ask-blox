export const DOMAINS = {
  finance: {
    name: 'Finance',
    skills: [
      'Financial Analysis',
      'Risk Management',
      'Investment Strategies',
      'Market Knowledge',
      'Regulatory Compliance',
      'Financial Planning',
      'Budgeting',
      'Financial Reporting',
      'Portfolio Management',
      'Banking Operations'
    ]
  },
  tech: {
    name: 'Technology',
    skills: [
      'Programming Languages',
      'System Design',
      'Best Practices',
      'Problem Solving',
      'Code Quality',
      'Security Practices',
      'Performance Optimization',
      'Database Management',
      'Cloud Technologies'
    ]
  },
  hr: {
    name: 'Human Resources',
    skills: [
      'Recruitment',
      'Employee Relations',
      'Performance Management',
      'Training & Development',
      'Compensation & Benefits',
      'HR Policies',
      'Workplace Culture',
      'Conflict Resolution',
      'Legal Compliance',
      'Talent Development'
    ]
  }
} as const;

export type Domain = keyof typeof DOMAINS;
export type DomainSkill = typeof DOMAINS[Domain]['skills'][number]; 