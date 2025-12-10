/**
 * Sequence Automation Engine
 * Handles execution of drip campaigns and outreach sequences
 */

import { sequencesClient } from '../data/sequences';
import { leadsClient } from '../data/leads';
import type {
  Sequence,
  SequenceStep,
  SequenceEnrollment,
  SequenceMetrics,
} from '../../types/sequence';
import type { Lead } from '../../types/lead';

/**
 * Step execution result
 */
export interface StepExecutionResult {
  success: boolean;
  stepId: string;
  enrollmentId: string;
  action: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Email sending interface (to be implemented by email provider)
 */
export interface EmailSender {
  send(params: {
    to: string;
    from: string;
    fromName?: string;
    subject: string;
    body: string;
    replyTo?: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
  }): Promise<{ messageId: string; success: boolean }>;
}

/**
 * LinkedIn action interface (to be implemented by LinkedIn integration)
 */
export interface LinkedInActions {
  viewProfile(profileUrl: string): Promise<{ success: boolean }>;
  sendConnectionRequest(profileUrl: string, message?: string): Promise<{ success: boolean }>;
  sendMessage(profileUrl: string, message: string): Promise<{ success: boolean }>;
  endorseSkills(profileUrl: string, skills: string[]): Promise<{ success: boolean }>;
}

/**
 * Task creation interface
 */
export interface TaskCreator {
  create(params: {
    title: string;
    description?: string;
    assignTo?: string;
    dueDate?: string;
    leadId: string;
    sequenceId: string;
  }): Promise<{ taskId: string; success: boolean }>;
}

/**
 * Sequence Engine class
 */
export class SequenceEngine {
  private emailSender?: EmailSender;
  private linkedInActions?: LinkedInActions;
  private taskCreator?: TaskCreator;
  private isRunning: boolean = false;
  private processingInterval?: ReturnType<typeof setInterval>;

  constructor(options?: {
    emailSender?: EmailSender;
    linkedInActions?: LinkedInActions;
    taskCreator?: TaskCreator;
  }) {
    this.emailSender = options?.emailSender;
    this.linkedInActions = options?.linkedInActions;
    this.taskCreator = options?.taskCreator;
  }

  /**
   * Set email sender
   */
  public setEmailSender(sender: EmailSender): void {
    this.emailSender = sender;
  }

  /**
   * Set LinkedIn actions handler
   */
  public setLinkedInActions(actions: LinkedInActions): void {
    this.linkedInActions = actions;
  }

  /**
   * Set task creator
   */
  public setTaskCreator(creator: TaskCreator): void {
    this.taskCreator = creator;
  }

  /**
   * Start the sequence processing loop
   */
  public start(intervalMs: number = 60000): void {
    if (this.isRunning) {
      console.log('Sequence engine is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting sequence engine...');

    // Process immediately
    this.processDueEnrollments().catch(console.error);

    // Then set up interval
    this.processingInterval = setInterval(() => {
      this.processDueEnrollments().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop the sequence processing loop
   */
  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.isRunning = false;
    console.log('Sequence engine stopped');
  }

  /**
   * Process all due enrollments
   */
  public async processDueEnrollments(): Promise<StepExecutionResult[]> {
    const results: StepExecutionResult[] = [];

    try {
      const dueEnrollments = await sequencesClient.getDueEnrollments(50);
      console.log(`Processing ${dueEnrollments.length} due enrollments`);

      for (const enrollment of dueEnrollments) {
        try {
          const result = await this.processEnrollment(enrollment);
          results.push(result);
        } catch (error) {
          console.error('Error processing enrollment %s:', enrollment.id, error);
          results.push({
            success: false,
            stepId: enrollment.currentStepId,
            enrollmentId: enrollment.id,
            action: 'process_enrollment',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching due enrollments:', error);
    }

    return results;
  }

  /**
   * Process a single enrollment
   */
  public async processEnrollment(enrollment: SequenceEnrollment): Promise<StepExecutionResult> {
    // Get sequence and current step
    const sequence = await sequencesClient.getSequence(enrollment.sequenceId);
    if (!sequence) {
      return {
        success: false,
        stepId: enrollment.currentStepId,
        enrollmentId: enrollment.id,
        action: 'get_sequence',
        error: 'Sequence not found',
      };
    }

    // Check if sequence is active
    if (sequence.status !== 'active') {
      return {
        success: false,
        stepId: enrollment.currentStepId,
        enrollmentId: enrollment.id,
        action: 'check_sequence_status',
        error: `Sequence is ${sequence.status}, not active`,
      };
    }

    const currentStep = sequence.steps.find(s => s.id === enrollment.currentStepId);
    if (!currentStep) {
      return {
        success: false,
        stepId: enrollment.currentStepId,
        enrollmentId: enrollment.id,
        action: 'get_step',
        error: 'Current step not found',
      };
    }

    // Check if step is enabled
    if (!currentStep.enabled) {
      // Skip to next step
      await sequencesClient.advanceEnrollment(enrollment.id, 'skipped');
      return {
        success: true,
        stepId: currentStep.id,
        enrollmentId: enrollment.id,
        action: 'skip_disabled_step',
      };
    }

    // Get lead
    const lead = await leadsClient.getLead(enrollment.leadId);
    if (!lead) {
      await sequencesClient.updateEnrollmentStatus(enrollment.id, 'stopped', 'Lead not found');
      return {
        success: false,
        stepId: currentStep.id,
        enrollmentId: enrollment.id,
        action: 'get_lead',
        error: 'Lead not found',
      };
    }

    // Check schedule
    if (!this.isWithinSchedule(sequence)) {
      return {
        success: false,
        stepId: currentStep.id,
        enrollmentId: enrollment.id,
        action: 'check_schedule',
        error: 'Outside of sending schedule',
      };
    }

    // Execute the step
    return this.executeStep(sequence, currentStep, enrollment, lead);
  }

  /**
   * Execute a sequence step
   */
  private async executeStep(
    sequence: Sequence,
    step: SequenceStep,
    enrollment: SequenceEnrollment,
    lead: Lead
  ): Promise<StepExecutionResult> {
    const baseResult = {
      stepId: step.id,
      enrollmentId: enrollment.id,
    };

    try {
      switch (step.type) {
        case 'email':
          return await this.executeEmailStep(sequence, step, enrollment, lead);

        case 'linkedin_message':
        case 'linkedin_connection':
        case 'linkedin_view_profile':
        case 'linkedin_endorse':
          return await this.executeLinkedInStep(sequence, step, enrollment, lead);

        case 'task':
          return await this.executeTaskStep(sequence, step, enrollment, lead);

        case 'wait':
          // Wait steps are handled by the enrollment's nextActionAt field
          await sequencesClient.advanceEnrollment(enrollment.id, 'success');
          return {
            ...baseResult,
            success: true,
            action: 'wait',
            metadata: { waitConfig: step.waitConfig },
          };

        case 'condition':
          return await this.executeConditionStep(sequence, step, enrollment, lead);

        case 'call':
          // Calls create a task for the user
          return await this.executeCallStep(sequence, step, enrollment, lead);

        case 'sms':
          // SMS not implemented yet
          return {
            ...baseResult,
            success: false,
            action: 'sms',
            error: 'SMS not implemented',
          };

        default:
          return {
            ...baseResult,
            success: false,
            action: 'unknown',
            error: `Unknown step type: ${step.type}`,
          };
      }
    } catch (error) {
      return {
        ...baseResult,
        success: false,
        action: step.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute email step
   */
  private async executeEmailStep(
    sequence: Sequence,
    step: SequenceStep,
    enrollment: SequenceEnrollment,
    lead: Lead
  ): Promise<StepExecutionResult> {
    if (!this.emailSender) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'email',
        error: 'Email sender not configured',
      };
    }

    if (!lead.contact.email) {
      await sequencesClient.updateEnrollmentStatus(enrollment.id, 'stopped', 'No email address');
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'email',
        error: 'Lead has no email address',
      };
    }

    const config = step.emailConfig;
    if (!config) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'email',
        error: 'No email configuration',
      };
    }

    // Personalize content
    const subject = this.personalizeContent(config.subject || '', lead);
    const body = this.personalizeContent(config.body || '', lead);

    try {
      const result = await this.emailSender.send({
        to: lead.contact.email,
        from: sequence.senderEmail || 'noreply@example.com',
        fromName: sequence.senderName,
        subject,
        body: body + (sequence.signature || ''),
        replyTo: config.replyTo,
        trackOpens: config.trackOpens ?? true,
        trackClicks: config.trackClicks ?? true,
      });

      // Record interaction
      await leadsClient.addInteraction(lead.id, {
        type: 'email_sent',
        description: `Sent email: ${subject}`,
        metadata: {
          sequenceId: sequence.id,
          stepId: step.id,
          messageId: result.messageId,
        },
      });

      // Advance enrollment
      await sequencesClient.advanceEnrollment(enrollment.id, 'success', {
        messageId: result.messageId,
      });

      return {
        success: true,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'email',
        metadata: { messageId: result.messageId },
      };
    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'email',
        error: error instanceof Error ? error.message : 'Email send failed',
      };
    }
  }

  /**
   * Execute LinkedIn step
   */
  private async executeLinkedInStep(
    sequence: Sequence,
    step: SequenceStep,
    enrollment: SequenceEnrollment,
    lead: Lead
  ): Promise<StepExecutionResult> {
    if (!this.linkedInActions) {
      // Create a task instead
      if (this.taskCreator) {
        return this.createLinkedInTask(sequence, step, enrollment, lead);
      }
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: step.type,
        error: 'LinkedIn actions not configured',
      };
    }

    if (!lead.contact.linkedinUrl) {
      await sequencesClient.advanceEnrollment(enrollment.id, 'skipped', {
        reason: 'No LinkedIn URL',
      });
      return {
        success: true,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: step.type,
        metadata: { skipped: true, reason: 'No LinkedIn URL' },
      };
    }

    const config = step.linkedinConfig;

    try {
      let result: { success: boolean };

      switch (step.type) {
        case 'linkedin_view_profile':
          result = await this.linkedInActions.viewProfile(lead.contact.linkedinUrl);
          break;

        case 'linkedin_connection': {
          const connectionMessage = config?.message
            ? this.personalizeContent(config.message, lead)
            : undefined;
          result = await this.linkedInActions.sendConnectionRequest(
            lead.contact.linkedinUrl,
            connectionMessage
          );
          break;
        }

        case 'linkedin_message': {
          if (!config?.message) {
            return {
              success: false,
              stepId: step.id,
              enrollmentId: enrollment.id,
              action: step.type,
              error: 'No message configured',
            };
          }
          const message = this.personalizeContent(config.message, lead);
          result = await this.linkedInActions.sendMessage(lead.contact.linkedinUrl, message);
          break;
        }

        case 'linkedin_endorse':
          result = await this.linkedInActions.endorseSkills(
            lead.contact.linkedinUrl,
            lead.linkedinData?.skills || []
          );
          break;

        default:
          return {
            success: false,
            stepId: step.id,
            enrollmentId: enrollment.id,
            action: step.type,
            error: `Unknown LinkedIn step type: ${step.type}`,
          };
      }

      if (result.success) {
        // Record interaction
        await leadsClient.addInteraction(lead.id, {
          type: step.type === 'linkedin_connection' ? 'linkedin_connection' :
                step.type === 'linkedin_message' ? 'linkedin_message' :
                'linkedin_view',
          description: `LinkedIn action: ${step.name}`,
          metadata: {
            sequenceId: sequence.id,
            stepId: step.id,
          },
        });

        await sequencesClient.advanceEnrollment(enrollment.id, 'success');
      }

      return {
        success: result.success,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: step.type,
      };
    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: step.type,
        error: error instanceof Error ? error.message : 'LinkedIn action failed',
      };
    }
  }

  /**
   * Create a task for manual LinkedIn action
   */
  private async createLinkedInTask(
    sequence: Sequence,
    step: SequenceStep,
    enrollment: SequenceEnrollment,
    lead: Lead
  ): Promise<StepExecutionResult> {
    if (!this.taskCreator) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'create_task',
        error: 'Task creator not configured',
      };
    }

    const taskTitle = `${step.name} - ${lead.fullName}`;
    const taskDescription = [
      `Sequence: ${sequence.name}`,
      `Step: ${step.name}`,
      `Lead: ${lead.fullName}`,
      lead.contact.linkedinUrl ? `LinkedIn: ${lead.contact.linkedinUrl}` : '',
      step.linkedinConfig?.message ? `Message: ${this.personalizeContent(step.linkedinConfig.message, lead)}` : '',
    ].filter(Boolean).join('\n');

    try {
      const result = await this.taskCreator.create({
        title: taskTitle,
        description: taskDescription,
        assignTo: sequence.createdBy,
        leadId: lead.id,
        sequenceId: sequence.id,
      });

      if (result.success) {
        await sequencesClient.advanceEnrollment(enrollment.id, 'success', {
          taskId: result.taskId,
        });
      }

      return {
        success: result.success,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'create_linkedin_task',
        metadata: { taskId: result.taskId },
      };
    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'create_linkedin_task',
        error: error instanceof Error ? error.message : 'Task creation failed',
      };
    }
  }

  /**
   * Execute task step
   */
  private async executeTaskStep(
    sequence: Sequence,
    step: SequenceStep,
    enrollment: SequenceEnrollment,
    lead: Lead
  ): Promise<StepExecutionResult> {
    if (!this.taskCreator) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'task',
        error: 'Task creator not configured',
      };
    }

    const config = step.taskConfig;
    if (!config) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'task',
        error: 'No task configuration',
      };
    }

    const dueDate = config.dueInDays
      ? new Date(Date.now() + config.dueInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    try {
      const result = await this.taskCreator.create({
        title: this.personalizeContent(config.title, lead),
        description: config.description ? this.personalizeContent(config.description, lead) : undefined,
        assignTo: config.assignTo || sequence.createdBy,
        dueDate,
        leadId: lead.id,
        sequenceId: sequence.id,
      });

      if (result.success) {
        await sequencesClient.advanceEnrollment(enrollment.id, 'success', {
          taskId: result.taskId,
        });
      }

      return {
        success: result.success,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'task',
        metadata: { taskId: result.taskId },
      };
    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'task',
        error: error instanceof Error ? error.message : 'Task creation failed',
      };
    }
  }

  /**
   * Execute call step (creates a task)
   */
  private async executeCallStep(
    sequence: Sequence,
    step: SequenceStep,
    enrollment: SequenceEnrollment,
    lead: Lead
  ): Promise<StepExecutionResult> {
    if (!this.taskCreator) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'call',
        error: 'Task creator not configured',
      };
    }

    const config = step.callConfig;

    try {
      const result = await this.taskCreator.create({
        title: `Call ${lead.fullName}`,
        description: [
          config?.script ? `Script: ${this.personalizeContent(config.script, lead)}` : '',
          lead.contact.phone ? `Phone: ${lead.contact.phone}` : 'No phone number on file',
          `Expected duration: ${config?.duration || 15} minutes`,
        ].filter(Boolean).join('\n'),
        assignTo: sequence.createdBy,
        leadId: lead.id,
        sequenceId: sequence.id,
      });

      if (result.success) {
        await sequencesClient.advanceEnrollment(enrollment.id, 'success', {
          taskId: result.taskId,
        });
      }

      return {
        success: result.success,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'call',
        metadata: { taskId: result.taskId },
      };
    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'call',
        error: error instanceof Error ? error.message : 'Task creation failed',
      };
    }
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(
    sequence: Sequence,
    step: SequenceStep,
    enrollment: SequenceEnrollment,
    lead: Lead
  ): Promise<StepExecutionResult> {
    const config = step.conditionConfig;
    if (!config) {
      return {
        success: false,
        stepId: step.id,
        enrollmentId: enrollment.id,
        action: 'condition',
        error: 'No condition configuration',
      };
    }

    // Evaluate condition
    const conditionMet = await this.evaluateCondition(config.condition, lead, enrollment);

    // Determine next step
    const nextStepId = conditionMet ? config.trueStepId : config.falseStepId;

    if (nextStepId) {
      // Update enrollment to jump to the specified step
      // This requires custom handling - for now, just advance
      await sequencesClient.advanceEnrollment(enrollment.id, 'success', {
        conditionMet,
        nextStepId,
      });
    } else {
      await sequencesClient.advanceEnrollment(enrollment.id, 'success', {
        conditionMet,
      });
    }

    return {
      success: true,
      stepId: step.id,
      enrollmentId: enrollment.id,
      action: 'condition',
      metadata: { conditionMet, nextStepId },
    };
  }

  /**
   * Evaluate a condition
   */
  private async evaluateCondition(
    condition: { type: string; operator?: string; value?: unknown; withinDays?: number },
    lead: Lead,
    enrollment: SequenceEnrollment
  ): Promise<boolean> {
    const interactions = await leadsClient.getInteractions(lead.id);

    switch (condition.type) {
      case 'email_opened':
        return interactions.some(i =>
          i.type === 'email_opened' &&
          this.isWithinDays(i.createdAt, condition.withinDays || 7)
        );

      case 'email_clicked':
        return interactions.some(i =>
          i.type === 'email_clicked' &&
          this.isWithinDays(i.createdAt, condition.withinDays || 7)
        );

      case 'email_replied':
        return interactions.some(i =>
          i.type === 'email_replied' &&
          this.isWithinDays(i.createdAt, condition.withinDays || 7)
        );

      case 'linkedin_accepted':
        return interactions.some(i => i.type === 'linkedin_connection');

      case 'linkedin_replied':
        return interactions.some(i =>
          i.type === 'linkedin_message' &&
          i.metadata?.isReply === true
        );

      case 'tag_present':
        return lead.tags.includes(condition.value as string);

      case 'score_above':
        return lead.score.total > (condition.value as number);

      case 'score_below':
        return lead.score.total < (condition.value as number);

      default:
        return false;
    }
  }

  /**
   * Check if a date is within N days of now
   */
  private isWithinDays(dateStr: string, days: number): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    return diffDays <= days;
  }

  /**
   * Check if current time is within sequence schedule
   */
  private isWithinSchedule(sequence: Sequence): boolean {
    const schedule = sequence.schedule;
    const now = new Date();

    // Check day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDay = dayNames[now.getDay()];
    if (!schedule.sendingDays.includes(currentDay)) {
      return false;
    }

    // Check time of day
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime < schedule.sendingHours.start || currentTime > schedule.sendingHours.end) {
      return false;
    }

    return true;
  }

  /**
   * Personalize content with lead data
   * Uses split/join instead of RegExp to prevent ReDoS attacks
   */
  private personalizeContent(content: string, lead: Lead): string {
    const replacements: Record<string, string> = {
      '{{firstName}}': lead.firstName || '',
      '{{lastName}}': lead.lastName || '',
      '{{fullName}}': lead.fullName || '',
      '{{title}}': lead.title || '',
      '{{company}}': lead.company?.name || '',
      '{{email}}': lead.contact.email || '',
      '{{phone}}': lead.contact.phone || '',
    };

    let result = content;
    for (const [placeholder, value] of Object.entries(replacements)) {
      // Use split/join for safe string replacement (avoids regex ReDoS)
      result = result.split(placeholder).join(String(value));
    }

    return result;
  }

  /**
   * Handle reply detection (called by email webhook)
   */
  public async handleReply(leadId: string, sequenceId: string): Promise<void> {
    const enrollment = await sequencesClient.getEnrollment(sequenceId, leadId);
    if (!enrollment || enrollment.status !== 'active') {
      return;
    }

    const sequence = await sequencesClient.getSequence(sequenceId);
    if (sequence?.stopOnReply) {
      await sequencesClient.updateEnrollmentStatus(enrollment.id, 'replied', 'Lead replied');

      // Record interaction
      await leadsClient.addInteraction(leadId, {
        type: 'email_replied',
        description: 'Lead replied to sequence email',
        metadata: { sequenceId },
      });

      // Update sequence metrics
      await this.updateMetricsOnReply(sequence);
    }
  }

  /**
   * Handle bounce detection
   */
  public async handleBounce(leadId: string, sequenceId: string): Promise<void> {
    const enrollment = await sequencesClient.getEnrollment(sequenceId, leadId);
    if (!enrollment || enrollment.status !== 'active') {
      return;
    }

    const sequence = await sequencesClient.getSequence(sequenceId);
    if (sequence?.stopOnBounce) {
      await sequencesClient.updateEnrollmentStatus(enrollment.id, 'bounced', 'Email bounced');
    }
  }

  /**
   * Handle unsubscribe
   */
  public async handleUnsubscribe(leadId: string, sequenceId: string): Promise<void> {
    const enrollment = await sequencesClient.getEnrollment(sequenceId, leadId);
    if (!enrollment || enrollment.status !== 'active') {
      return;
    }

    const sequence = await sequencesClient.getSequence(sequenceId);
    if (sequence?.stopOnUnsubscribe) {
      await sequencesClient.updateEnrollmentStatus(enrollment.id, 'unsubscribed', 'Lead unsubscribed');
    }
  }

  /**
   * Update metrics after reply
   */
  private async updateMetricsOnReply(sequence: Sequence): Promise<void> {
    const metrics = { ...sequence.metrics };
    metrics.repliedLeads++;
    metrics.activeLeads = Math.max(0, metrics.activeLeads - 1);
    metrics.emailStats.replied++;
    metrics.emailStats.replyRate = metrics.emailStats.sent > 0
      ? (metrics.emailStats.replied / metrics.emailStats.sent) * 100
      : 0;

    await sequencesClient.updateSequence(sequence.id, { metrics });
  }
}

// Export singleton instance
export const sequenceEngine = new SequenceEngine();
