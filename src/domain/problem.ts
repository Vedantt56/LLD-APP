export interface ProblemRequirement {
  id: string;
  description: string;
  expectedInterfaces?: string[];
  expectedClasses?: string[];
}

export interface Problem {
  id: string;
  title: string;
  slug: 'parking-lot' | 'elevator-system';
  description: string;
  requirements: ProblemRequirement[];
  createdAt: Date;
  updatedAt: Date;
}
