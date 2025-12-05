/**
 * Scheduler Hook
 * React hook for interacting with the scheduler system
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ScheduledJob,
  JobStatus,
  CreateJobInput,
  SchedulerStats,
} from '@/lib/scheduler/types';

interface UseSchedulerReturn {
  // State
  jobs: ScheduledJob[];
  stats: SchedulerStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  scheduleJob: (input: CreateJobInput) => Promise<ScheduledJob | null>;
  cancelJob: (jobId: string) => Promise<boolean>;
  retryJob: (jobId: string) => Promise<ScheduledJob | null>;
  rescheduleJob: (jobId: string, newTime: string) => Promise<ScheduledJob | null>;

  // Queries
  refreshJobs: () => Promise<void>;
  refreshStats: () => Promise<void>;
  getJobsByCampaign: (campaignId: string) => Promise<ScheduledJob[]>;
  getJobsByStatus: (status: JobStatus) => Promise<ScheduledJob[]>;

  // Process (for admin/testing)
  processNow: () => Promise<{ processed: number; successful: number; failed: number }>;
}

export function useScheduler(): UseSchedulerReturn {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [stats, setStats] = useState<SchedulerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all jobs
  const refreshJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scheduler');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      setJobs(data.jobs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(message);
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stats
  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/scheduler/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshJobs();
    refreshStats();
  }, [refreshJobs, refreshStats]);

  // Schedule a new job
  const scheduleJob = useCallback(async (input: CreateJobInput): Promise<ScheduledJob | null> => {
    setError(null);

    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule job');
      }

      // Refresh jobs list
      await refreshJobs();

      return data.job;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule job';
      setError(message);
      console.error('Error scheduling job:', err);
      return null;
    }
  }, [refreshJobs]);

  // Cancel a job
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/scheduler/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel job');
      }

      // Refresh jobs list
      await refreshJobs();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel job';
      setError(message);
      console.error('Error cancelling job:', err);
      return false;
    }
  }, [refreshJobs]);

  // Retry a failed job
  const retryJob = useCallback(async (jobId: string): Promise<ScheduledJob | null> => {
    setError(null);

    try {
      const response = await fetch(`/api/scheduler/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry job');
      }

      // Refresh jobs list
      await refreshJobs();

      return data.job;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry job';
      setError(message);
      console.error('Error retrying job:', err);
      return null;
    }
  }, [refreshJobs]);

  // Reschedule a job
  const rescheduleJob = useCallback(async (
    jobId: string,
    newTime: string
  ): Promise<ScheduledJob | null> => {
    setError(null);

    try {
      const response = await fetch(`/api/scheduler/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime: newTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reschedule job');
      }

      // Refresh jobs list
      await refreshJobs();

      return data.job;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reschedule job';
      setError(message);
      console.error('Error rescheduling job:', err);
      return null;
    }
  }, [refreshJobs]);

  // Get jobs by campaign
  const getJobsByCampaign = useCallback(async (campaignId: string): Promise<ScheduledJob[]> => {
    try {
      const response = await fetch(`/api/scheduler?campaignId=${campaignId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      return data.jobs;
    } catch (err) {
      console.error('Error fetching jobs by campaign:', err);
      return [];
    }
  }, []);

  // Get jobs by status
  const getJobsByStatus = useCallback(async (status: JobStatus): Promise<ScheduledJob[]> => {
    try {
      const response = await fetch(`/api/scheduler?status=${status}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      return data.jobs;
    } catch (err) {
      console.error('Error fetching jobs by status:', err);
      return [];
    }
  }, []);

  // Trigger processing (for testing)
  const processNow = useCallback(async () => {
    try {
      const response = await fetch('/api/scheduler/process', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process jobs');
      }

      // Refresh after processing
      await refreshJobs();
      await refreshStats();

      return {
        processed: data.processed,
        successful: data.successful,
        failed: data.failed,
      };
    } catch (err) {
      console.error('Error processing jobs:', err);
      return { processed: 0, successful: 0, failed: 0 };
    }
  }, [refreshJobs, refreshStats]);

  return {
    jobs,
    stats,
    isLoading,
    error,
    scheduleJob,
    cancelJob,
    retryJob,
    rescheduleJob,
    refreshJobs,
    refreshStats,
    getJobsByCampaign,
    getJobsByStatus,
    processNow,
  };
}

export default useScheduler;
