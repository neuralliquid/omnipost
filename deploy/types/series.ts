export interface Series {
  id: string;
  title: string;
  description: string;
  topics?: string[];
  targetAudience?: string;
  estimatedArticles?: number;
  publishFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  status?: 'planning' | 'in-progress' | 'completed' | 'paused';
  campaignIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
