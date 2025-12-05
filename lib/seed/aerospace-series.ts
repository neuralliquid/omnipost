/**
 * Aerospace & Counter-Drone Technology Series
 * Seed data for technical content series
 */

import { Series } from '@/types/series';

export const AEROSPACE_SERIES_ID = 'series_aerospace_counter_drone_001';

export const aerospaceSeriesSeed: Series = {
  id: AEROSPACE_SERIES_ID,
  title: 'Aerospace & Counter-Drone Technology',
  description:
    'Comprehensive exploration of counter-UAS (Unmanned Aircraft Systems) technology, detection methods, mitigation strategies, and airspace security. A 30-day deep dive into protecting critical infrastructure from unauthorized drone threats.',
  topics: [
    'Counter-UAS Technology',
    'Drone Detection Systems',
    'RF Detection & Jamming',
    'Radar Technology',
    'Directed Energy Weapons',
    'Critical Infrastructure Protection',
    'Airport Security',
    'Military Defense',
    'Regulatory Compliance',
    'AI & Machine Learning',
    'Swarm Defense',
    'Cybersecurity',
  ],
  targetAudience:
    'Security professionals, defense contractors, airport operators, critical infrastructure managers, and technology enthusiasts',
  estimatedArticles: 90,
  publishFrequency: 'weekly',
  status: 'in-progress',
  campaignIds: ['campaign_aerospace_month1_001'],
  createdAt: '2025-12-01T00:00:00Z',
  updatedAt: '2025-12-05T00:00:00Z',
};

export default aerospaceSeriesSeed;
