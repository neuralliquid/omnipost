import Airtable, { FieldSet, Record as AirtableRecord } from 'airtable';
import {
  Sequence,
  SequenceStatus,
  SequenceStep,
  SequenceEnrollment,
  CreateSequenceInput,
  UpdateSequenceInput,
  BulkEnrollInput,
  SequenceMetrics,
  EmailTemplate,
  LinkedInTemplate,
  createDefaultSchedule,
  createEmptySequenceMetrics,
} from '../../types/sequence';

/**
 * Escape a string value for use in Airtable formula
 * Prevents formula injection by escaping special characters
 */
function escapeAirtableFormulaValue(value: string): string {
  // Escape single quotes by doubling them and escape backslashes
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

/**
 * Pagination interface
 */
export interface SequencePagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * Sequence query response
 */
export interface SequenceQueryResponse {
  sequences: Sequence[];
  pagination: SequencePagination;
}

/**
 * Enrollment query response
 */
export interface EnrollmentQueryResponse {
  enrollments: SequenceEnrollment[];
  pagination: SequencePagination;
}

/**
 * Sequences data client for Airtable
 */
export class SequencesClient {
  private base: Airtable.Base | undefined;
  private sequencesTable: Airtable.Table<FieldSet> | undefined;
  private stepsTable: Airtable.Table<FieldSet> | undefined;
  private enrollmentsTable: Airtable.Table<FieldSet> | undefined;
  private emailTemplatesTable: Airtable.Table<FieldSet> | undefined;
  private linkedinTemplatesTable: Airtable.Table<FieldSet> | undefined;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Airtable connection for sequences
   */
  public initialize(): boolean {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      console.error('Missing required Airtable environment variables');
      return false;
    }

    try {
      this.base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
        process.env.AIRTABLE_BASE_ID
      );
      this.sequencesTable = this.base(process.env.AIRTABLE_SEQUENCES_TABLE || 'Sequences');
      this.stepsTable = this.base(process.env.AIRTABLE_STEPS_TABLE || 'SequenceSteps');
      this.enrollmentsTable = this.base(process.env.AIRTABLE_ENROLLMENTS_TABLE || 'SequenceEnrollments');
      this.emailTemplatesTable = this.base(process.env.AIRTABLE_EMAIL_TEMPLATES_TABLE || 'EmailTemplates');
      this.linkedinTemplatesTable = this.base(process.env.AIRTABLE_LINKEDIN_TEMPLATES_TABLE || 'LinkedInTemplates');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Sequences Airtable client:', error);
      return false;
    }
  }

  /**
   * Check if client is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Convert Airtable record to Sequence
   */
  private recordToSequence(record: AirtableRecord<FieldSet>, steps: SequenceStep[] = []): Sequence {
    const fields = record.fields;
    return {
      id: record.id,
      name: fields.Name as string,
      description: fields.Description as string | undefined,
      status: (fields.Status as SequenceStatus) || 'draft',
      steps: steps,
      entryStepId: fields.EntryStepId as string || (steps[0]?.id || ''),
      targetFilter: fields.TargetFilter ? JSON.parse(fields.TargetFilter as string) : undefined,
      excludeFilter: fields.ExcludeFilter ? JSON.parse(fields.ExcludeFilter as string) : undefined,
      schedule: fields.Schedule
        ? JSON.parse(fields.Schedule as string)
        : createDefaultSchedule(),
      stopOnReply: fields.StopOnReply as boolean ?? true,
      stopOnBounce: fields.StopOnBounce as boolean ?? true,
      stopOnUnsubscribe: fields.StopOnUnsubscribe as boolean ?? true,
      removeOnComplete: fields.RemoveOnComplete as boolean ?? false,
      senderName: fields.SenderName as string | undefined,
      senderEmail: fields.SenderEmail as string | undefined,
      signature: fields.Signature as string | undefined,
      abTest: fields.ABTest ? JSON.parse(fields.ABTest as string) : undefined,
      metrics: fields.Metrics
        ? JSON.parse(fields.Metrics as string)
        : createEmptySequenceMetrics(),
      tags: fields.Tags ? (fields.Tags as string).split(',').filter(Boolean) : [],
      createdAt: fields.CreatedAt as string || new Date().toISOString(),
      updatedAt: fields.UpdatedAt as string || new Date().toISOString(),
      createdBy: fields.CreatedBy as string || '',
    };
  }

  /**
   * Convert Airtable record to SequenceStep
   */
  private recordToStep(record: AirtableRecord<FieldSet>): SequenceStep {
    const fields = record.fields;
    return {
      id: record.id,
      order: fields.Order as number || 0,
      type: fields.Type as SequenceStep['type'],
      name: fields.Name as string,
      description: fields.Description as string | undefined,
      emailConfig: fields.EmailConfig ? JSON.parse(fields.EmailConfig as string) : undefined,
      linkedinConfig: fields.LinkedInConfig ? JSON.parse(fields.LinkedInConfig as string) : undefined,
      smsConfig: fields.SMSConfig ? JSON.parse(fields.SMSConfig as string) : undefined,
      callConfig: fields.CallConfig ? JSON.parse(fields.CallConfig as string) : undefined,
      taskConfig: fields.TaskConfig ? JSON.parse(fields.TaskConfig as string) : undefined,
      waitConfig: fields.WaitConfig ? JSON.parse(fields.WaitConfig as string) : undefined,
      conditionConfig: fields.ConditionConfig ? JSON.parse(fields.ConditionConfig as string) : undefined,
      enabled: fields.Enabled as boolean ?? true,
      createdAt: fields.CreatedAt as string || new Date().toISOString(),
      updatedAt: fields.UpdatedAt as string || new Date().toISOString(),
    };
  }

  /**
   * Convert Airtable record to SequenceEnrollment
   */
  private recordToEnrollment(record: AirtableRecord<FieldSet>): SequenceEnrollment {
    const fields = record.fields;
    return {
      id: record.id,
      sequenceId: fields.SequenceId as string,
      leadId: fields.LeadId as string,
      status: fields.Status as SequenceEnrollment['status'] || 'active',
      currentStepId: fields.CurrentStepId as string,
      currentStepNumber: fields.CurrentStepNumber as number || 1,
      completedSteps: fields.CompletedSteps ? (fields.CompletedSteps as string).split(',').filter(Boolean) : [],
      nextActionAt: fields.NextActionAt as string | undefined,
      lastActionAt: fields.LastActionAt as string | undefined,
      stepHistory: fields.StepHistory ? JSON.parse(fields.StepHistory as string) : [],
      abVariantId: fields.ABVariantId as string | undefined,
      enrolledAt: fields.EnrolledAt as string || new Date().toISOString(),
      completedAt: fields.CompletedAt as string | undefined,
      stoppedAt: fields.StoppedAt as string | undefined,
      stoppedReason: fields.StoppedReason as string | undefined,
      createdBy: fields.CreatedBy as string || '',
    };
  }

  // ============ Sequence CRUD ============

  /**
   * Create a new sequence
   * 
   * Creates a new sequence with the provided configuration including name, description,
   * steps, schedule, and behavior settings. Steps are created as child records and the
   * first step (by order) is set as the entry step.
   * 
   * @param {CreateSequenceInput} input - Sequence configuration data
   * @param {string} createdBy - ID of the user creating the sequence
   * @returns {Promise<Sequence>} The created sequence with all steps
   * @throws {Error} If client not initialized or creation fails
   */
  public async createSequence(input: CreateSequenceInput, createdBy: string): Promise<Sequence> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const now = new Date().toISOString();

    try {
      // Create the sequence record
      const sequenceRecord = await this.sequencesTable!.create({
        Name: input.name,
        Description: input.description,
        Status: 'draft',
        Schedule: JSON.stringify(input.schedule || createDefaultSchedule()),
        StopOnReply: input.stopOnReply ?? true,
        StopOnBounce: input.stopOnBounce ?? true,
        StopOnUnsubscribe: input.stopOnUnsubscribe ?? true,
        SenderName: input.senderName,
        SenderEmail: input.senderEmail,
        Tags: input.tags?.join(',') || '',
        Metrics: JSON.stringify(createEmptySequenceMetrics()),
        CreatedAt: now,
        UpdatedAt: now,
        CreatedBy: createdBy,
      });

      // Create steps
      const createdSteps: SequenceStep[] = [];
      for (const stepInput of input.steps) {
        const stepRecord = await this.stepsTable!.create({
          SequenceId: sequenceRecord.id,
          Order: stepInput.order,
          Type: stepInput.type,
          Name: stepInput.name,
          Description: stepInput.description,
          EmailConfig: stepInput.emailConfig ? JSON.stringify(stepInput.emailConfig) : undefined,
          LinkedInConfig: stepInput.linkedinConfig ? JSON.stringify(stepInput.linkedinConfig) : undefined,
          SMSConfig: stepInput.smsConfig ? JSON.stringify(stepInput.smsConfig) : undefined,
          CallConfig: stepInput.callConfig ? JSON.stringify(stepInput.callConfig) : undefined,
          TaskConfig: stepInput.taskConfig ? JSON.stringify(stepInput.taskConfig) : undefined,
          WaitConfig: stepInput.waitConfig ? JSON.stringify(stepInput.waitConfig) : undefined,
          ConditionConfig: stepInput.conditionConfig ? JSON.stringify(stepInput.conditionConfig) : undefined,
          Enabled: stepInput.enabled ?? true,
          CreatedAt: now,
          UpdatedAt: now,
        });
        createdSteps.push(this.recordToStep(stepRecord));
      }

      // Update entry step ID if we have steps
      if (createdSteps.length > 0) {
        const entryStep = createdSteps.sort((a, b) => a.order - b.order)[0];
        await this.sequencesTable!.update(sequenceRecord.id, {
          EntryStepId: entryStep.id,
        });
      }

      return this.recordToSequence(sequenceRecord, createdSteps);
    } catch (error) {
      console.error('Error creating sequence:', error);
      throw new Error('Failed to create sequence');
    }
  }

  /**
   * Get a sequence by ID
   * 
   * Retrieves a sequence record with all its associated steps sorted by order.
   * Returns null if the sequence is not found.
   * 
   * @param {string} id - ID of the sequence to retrieve
   * @returns {Promise<Sequence | null>} The sequence with steps or null if not found
   * @throws {Error} If client not initialized
   */
  public async getSequence(id: string): Promise<Sequence | null> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    try {
      const record = await this.sequencesTable!.find(id);

      // Fetch steps for this sequence
      const escapedId = escapeAirtableFormulaValue(id);
      const stepsRecords = await this.stepsTable!.select({
        filterByFormula: `{SequenceId} = '${escapedId}'`,
        sort: [{ field: 'Order', direction: 'asc' }],
      } as any).all();

      const steps = stepsRecords.map(r => this.recordToStep(r));

      return this.recordToSequence(record, steps);
    } catch (error) {
      console.error('Error fetching sequence:', error);
      return null;
    }
  }

  /**
   * Update a sequence
   * 
   * Updates one or more fields of an existing sequence. Only provided fields are updated;
   * undefined fields are left unchanged. The UpdatedAt timestamp is automatically set.
   * 
   * @param {string} id - ID of the sequence to update
   * @param {UpdateSequenceInput} input - Fields to update
   * @returns {Promise<Sequence>} The updated sequence with all steps
   * @throws {Error} If client not initialized or update fails
   */
  public async updateSequence(id: string, input: UpdateSequenceInput): Promise<Sequence> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const now = new Date().toISOString();
    const fields: Record<string, unknown> = { UpdatedAt: now };

    if (input.name !== undefined) fields.Name = input.name;
    if (input.description !== undefined) fields.Description = input.description;
    if (input.status !== undefined) fields.Status = input.status;
    if (input.schedule !== undefined) fields.Schedule = JSON.stringify(input.schedule);
    if (input.stopOnReply !== undefined) fields.StopOnReply = input.stopOnReply;
    if (input.stopOnBounce !== undefined) fields.StopOnBounce = input.stopOnBounce;
    if (input.stopOnUnsubscribe !== undefined) fields.StopOnUnsubscribe = input.stopOnUnsubscribe;
    if (input.senderName !== undefined) fields.SenderName = input.senderName;
    if (input.senderEmail !== undefined) fields.SenderEmail = input.senderEmail;
    if (input.tags !== undefined) fields.Tags = input.tags.join(',');
    if (input.metrics !== undefined) fields.Metrics = JSON.stringify(input.metrics);

    try {
      await this.sequencesTable!.update(id, fields as Partial<FieldSet>);
      return (await this.getSequence(id))!;
    } catch (error) {
      console.error('Error updating sequence:', error);
      throw new Error('Failed to update sequence');
    }
  }

  /**
   * Delete a sequence
   * 
   * Deletes a sequence and all its associated steps. This is a destructive operation
   * and cannot be undone.
   * 
   * @param {string} id - ID of the sequence to delete
   * @returns {Promise<boolean>} True if deletion was successful, false otherwise
   * @throws {Error} If client not initialized
   */
  public async deleteSequence(id: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    try {
      // Delete all steps first
      const escapedId = escapeAirtableFormulaValue(id);
      const stepsRecords = await this.stepsTable!.select({
        filterByFormula: `{SequenceId} = '${escapedId}'`,
      } as any).all();

      for (const step of stepsRecords) {
        await this.stepsTable!.destroy(step.id);
      }

      // Delete the sequence
      await this.sequencesTable!.destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting sequence:', error);
      return false;
    }
  }

  /**
   * Query sequences
   * 
   * Retrieves sequences with optional status filter. Results are paginated and sorted
   * by CreatedAt in descending order. Each sequence includes all its steps.
   * 
   * @param {Object} [options] - Query options
   * @param {SequenceStatus} [options.status] - Filter by sequence status
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.pageSize=20] - Number of records per page
   * @returns {Promise<SequenceQueryResponse>} Sequences and pagination info
   * @throws {Error} If client not initialized or query fails
   */
  public async querySequences(options?: {
    status?: SequenceStatus;
    page?: number;
    pageSize?: number;
  }): Promise<SequenceQueryResponse> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    try {
      const selectOptions: Record<string, unknown> = {
        pageSize: pageSize + 1,
        sort: [{ field: 'CreatedAt', direction: 'desc' }],
      };

      if (options?.status) {
        const escapedStatus = escapeAirtableFormulaValue(options.status);
        selectOptions.filterByFormula = `{Status} = '${escapedStatus}'`;
      }

      const records = await this.sequencesTable!.select(selectOptions as any).all();

      const hasMore = records.length > pageSize;
      const sequencesToReturn = hasMore ? records.slice(0, pageSize) : records;

      // Fetch steps for each sequence
      const sequences: Sequence[] = [];
      for (const record of sequencesToReturn) {
        const escapedRecordId = escapeAirtableFormulaValue(record.id);
        const stepsRecords = await this.stepsTable!.select({
          filterByFormula: `{SequenceId} = '${escapedRecordId}'`,
          sort: [{ field: 'Order', direction: 'asc' }],
        } as any).all();

        const steps = stepsRecords.map(r => this.recordToStep(r));
        sequences.push(this.recordToSequence(record, steps));
      }

      return {
        sequences,
        pagination: {
          page,
          pageSize,
          total: records.length,
          hasMore,
        },
      };
    } catch (error) {
      console.error('Error querying sequences:', error);
      throw new Error('Failed to query sequences');
    }
  }

  // ============ Step Management ============

  /**
   * Add a step to a sequence
   */
  public async addStep(
    sequenceId: string,
    step: Omit<SequenceStep, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SequenceStep> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const now = new Date().toISOString();

    try {
      const record = await this.stepsTable!.create({
        SequenceId: sequenceId,
        Order: step.order,
        Type: step.type,
        Name: step.name,
        Description: step.description,
        EmailConfig: step.emailConfig ? JSON.stringify(step.emailConfig) : undefined,
        LinkedInConfig: step.linkedinConfig ? JSON.stringify(step.linkedinConfig) : undefined,
        SMSConfig: step.smsConfig ? JSON.stringify(step.smsConfig) : undefined,
        CallConfig: step.callConfig ? JSON.stringify(step.callConfig) : undefined,
        TaskConfig: step.taskConfig ? JSON.stringify(step.taskConfig) : undefined,
        WaitConfig: step.waitConfig ? JSON.stringify(step.waitConfig) : undefined,
        ConditionConfig: step.conditionConfig ? JSON.stringify(step.conditionConfig) : undefined,
        Enabled: step.enabled ?? true,
        CreatedAt: now,
        UpdatedAt: now,
      });

      return this.recordToStep(record);
    } catch (error) {
      console.error('Error adding step:', error);
      throw new Error('Failed to add step');
    }
  }

  /**
   * Update a step
   */
  public async updateStep(
    stepId: string,
    update: Partial<SequenceStep>
  ): Promise<SequenceStep> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const now = new Date().toISOString();
    const fields: Record<string, unknown> = { UpdatedAt: now };

    if (update.order !== undefined) fields.Order = update.order;
    if (update.name !== undefined) fields.Name = update.name;
    if (update.description !== undefined) fields.Description = update.description;
    if (update.emailConfig !== undefined) fields.EmailConfig = JSON.stringify(update.emailConfig);
    if (update.linkedinConfig !== undefined) fields.LinkedInConfig = JSON.stringify(update.linkedinConfig);
    if (update.waitConfig !== undefined) fields.WaitConfig = JSON.stringify(update.waitConfig);
    if (update.enabled !== undefined) fields.Enabled = update.enabled;

    try {
      const record = await this.stepsTable!.update(stepId, fields as Partial<FieldSet>);
      return this.recordToStep(record);
    } catch (error) {
      console.error('Error updating step:', error);
      throw new Error('Failed to update step');
    }
  }

  /**
   * Delete a step
   */
  public async deleteStep(stepId: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    try {
      await this.stepsTable!.destroy(stepId);
      return true;
    } catch (error) {
      console.error('Error deleting step:', error);
      return false;
    }
  }

  // ============ Enrollment Management ============

  /**
   * Enroll a lead in a sequence
   * 
   * Creates a new enrollment record for a lead in the specified sequence. The lead
   * will start at the sequence's entry step with status 'active'. If the lead is
   * already actively enrolled in this sequence, an error is thrown.
   * 
   * @param {string} sequenceId - ID of the sequence to enroll the lead in
   * @param {string} leadId - ID of the lead to enroll
   * @param {string} createdBy - ID of the user creating the enrollment
   * @param {string} [startAt] - Optional ISO timestamp to start the sequence (defaults to now)
   * @returns {Promise<SequenceEnrollment>} The created enrollment record
   * @throws {Error} If lead is already enrolled, sequence not found, or enrollment fails
   */
  public async enrollLead(
    sequenceId: string,
    leadId: string,
    createdBy: string,
    startAt?: string
  ): Promise<SequenceEnrollment> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    // Check if already enrolled
    const existing = await this.getEnrollment(sequenceId, leadId);
    if (existing && existing.status === 'active') {
      throw new Error('Lead is already enrolled in this sequence');
    }

    const sequence = await this.getSequence(sequenceId);
    if (!sequence) {
      throw new Error('Sequence not found');
    }

    const now = new Date().toISOString();
    const entryStep = sequence.steps.sort((a, b) => a.order - b.order)[0];

    try {
      const record = await this.enrollmentsTable!.create({
        SequenceId: sequenceId,
        LeadId: leadId,
        Status: 'active',
        CurrentStepId: entryStep?.id || '',
        CurrentStepNumber: 1,
        CompletedSteps: '',
        NextActionAt: startAt || now,
        StepHistory: JSON.stringify([]),
        EnrolledAt: now,
        CreatedBy: createdBy,
      });

      // Update sequence metrics
      const metrics = sequence.metrics;
      metrics.totalEnrolled++;
      metrics.activeLeads++;
      await this.updateSequenceMetrics(sequenceId, metrics);

      return this.recordToEnrollment(record);
    } catch (error) {
      console.error('Error enrolling lead:', error);
      throw new Error('Failed to enroll lead');
    }
  }

  /**
   * Bulk enroll leads
   * 
   * Enrolls multiple leads in a sequence. Returns counts of successful enrollments,
   * skipped duplicates, and any errors encountered. If skipDuplicates is true, leads
   * already actively enrolled will be skipped instead of causing errors.
   * 
   * @param {BulkEnrollInput} input - Bulk enrollment configuration including sequenceId, leadIds, startAt, and skipDuplicates
   * @param {string} createdBy - ID of the user creating the enrollments
   * @returns {Promise<{enrolled: number, skipped: number, errors: Array<{leadId: string, error: string}>}>} Summary of enrollment results
   * @throws {Error} If client not initialized (individual lead errors are returned in results)
   */
  public async bulkEnroll(input: BulkEnrollInput, createdBy: string): Promise<{
    enrolled: number;
    skipped: number;
    errors: Array<{ leadId: string; error: string }>;
  }> {
    const results = {
      enrolled: 0,
      skipped: 0,
      errors: [] as Array<{ leadId: string; error: string }>,
    };

    for (const leadId of input.leadIds) {
      try {
        if (input.skipDuplicates) {
          const existing = await this.getEnrollment(input.sequenceId, leadId);
          if (existing && existing.status === 'active') {
            results.skipped++;
            continue;
          }
        }

        await this.enrollLead(input.sequenceId, leadId, createdBy, input.startAt);
        results.enrolled++;
      } catch (error) {
        results.errors.push({
          leadId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get enrollment for a specific lead in a sequence
   * 
   * Retrieves the enrollment record for a specific lead in a sequence, if it exists.
   * Returns null if no enrollment is found.
   * 
   * @param {string} sequenceId - ID of the sequence
   * @param {string} leadId - ID of the lead
   * @returns {Promise<SequenceEnrollment | null>} The enrollment record or null if not found
   * @throws {Error} If client not initialized
   */
  public async getEnrollment(sequenceId: string, leadId: string): Promise<SequenceEnrollment | null> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    try {
      const escapedSequenceId = escapeAirtableFormulaValue(sequenceId);
      const escapedLeadId = escapeAirtableFormulaValue(leadId);
      const records = await this.enrollmentsTable!.select({
        filterByFormula: `AND({SequenceId} = '${escapedSequenceId}', {LeadId} = '${escapedLeadId}')`,
        maxRecords: 1,
      } as any).all();

      if (records.length === 0) return null;
      return this.recordToEnrollment(records[0]);
    } catch (error: unknown) {
      console.error('Error fetching enrollment:', error);
      return null;
    }
  }

  /**
   * Query enrollments
   * 
   * Retrieves enrollments with optional filters for sequenceId, leadId, and status.
   * Results are paginated and sorted by EnrolledAt in descending order.
   * 
   * @param {Object} options - Query options
   * @param {string} [options.sequenceId] - Filter by sequence ID
   * @param {string} [options.leadId] - Filter by lead ID
   * @param {SequenceEnrollment['status']} [options.status] - Filter by enrollment status
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.pageSize=20] - Number of records per page
   * @returns {Promise<EnrollmentQueryResponse>} Enrollments and pagination info
   * @throws {Error} If client not initialized or query fails
   */
  public async queryEnrollments(options: {
    sequenceId?: string;
    leadId?: string;
    status?: SequenceEnrollment['status'];
    page?: number;
    pageSize?: number;
  }): Promise<EnrollmentQueryResponse> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;

    const conditions: string[] = [];
    if (options.sequenceId) {
      const escapedSequenceId = escapeAirtableFormulaValue(options.sequenceId);
      conditions.push(`{SequenceId} = '${escapedSequenceId}'`);
    }
    if (options.leadId) {
      const escapedLeadId = escapeAirtableFormulaValue(options.leadId);
      conditions.push(`{LeadId} = '${escapedLeadId}'`);
    }
    if (options.status) {
      const escapedStatus = escapeAirtableFormulaValue(options.status);
      conditions.push(`{Status} = '${escapedStatus}'`);
    }

    try {
      const selectOptions: Record<string, unknown> = {
        pageSize: pageSize + 1,
        sort: [{ field: 'EnrolledAt', direction: 'desc' }],
      };

      if (conditions.length > 0) {
        selectOptions.filterByFormula = conditions.length === 1
          ? conditions[0]
          : `AND(${conditions.join(', ')})`;
      }

      const records = await this.enrollmentsTable!.select(selectOptions as any).all();

      const hasMore = records.length > pageSize;
      const enrollmentsToReturn = hasMore ? records.slice(0, pageSize) : records;

      return {
        enrollments: enrollmentsToReturn.map(r => this.recordToEnrollment(r)),
        pagination: {
          page,
          pageSize,
          total: records.length,
          hasMore,
        },
      };
    } catch (error) {
      console.error('Error querying enrollments:', error);
      throw new Error('Failed to query enrollments');
    }
  }

  /**
   * Update enrollment status
   * 
   * Updates the status of a sequence enrollment and sets appropriate timestamps
   * based on the new status (e.g., CompletedAt for 'completed', StoppedAt for stopped statuses).
   * 
   * @param {string} enrollmentId - ID of the enrollment to update
   * @param {SequenceEnrollment['status']} status - New status value
   * @param {string} [reason] - Optional reason for status change (used for stopped statuses)
   * @returns {Promise<SequenceEnrollment>} Updated enrollment record
   * @throws {Error} If client not initialized or update fails
   */
  public async updateEnrollmentStatus(
    enrollmentId: string,
    status: SequenceEnrollment['status'],
    reason?: string
  ): Promise<SequenceEnrollment> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const now = new Date().toISOString();
    const fields: Record<string, unknown> = { Status: status };

    if (status === 'completed') {
      fields.CompletedAt = now;
    } else if (['stopped', 'replied', 'bounced', 'unsubscribed'].includes(status)) {
      fields.StoppedAt = now;
      if (reason) fields.StoppedReason = reason;
    }

    try {
      const record = await this.enrollmentsTable!.update(enrollmentId, fields as Partial<FieldSet>);
      return this.recordToEnrollment(record);
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      throw new Error('Failed to update enrollment status');
    }
  }

  /**
   * Move enrollment to next step
   * 
   * Advances an enrollment to the next step in its sequence, recording the step history,
   * calculating the next action time for wait steps, and marking the sequence as completed
   * if there are no more steps. The method handles step transitions and maintains history
   * of execution results.
   * 
   * @param {string} enrollmentId - ID of the enrollment to advance
   * @param {'success' | 'failed' | 'skipped'} result - Result of the current step execution
   * @param {Record<string, unknown>} [metadata] - Optional metadata about the step execution
   * @returns {Promise<SequenceEnrollment>} Updated enrollment record with new step
   * @throws {Error} If client not initialized, enrollment/sequence not found, or update fails
   */
  public async advanceEnrollment(
    enrollmentId: string,
    result: 'success' | 'failed' | 'skipped',
    metadata?: Record<string, unknown>
  ): Promise<SequenceEnrollment> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    let enrollment;
    try {
      enrollment = await this.enrollmentsTable!.find(enrollmentId);
    } catch (error: unknown) {
      console.error('Error fetching enrollment:', error);
      throw new Error(`Enrollment not found: ${enrollmentId}. ${error instanceof Error ? error.message : String(error)}`);
    }

    const enrollmentData = this.recordToEnrollment(enrollment);
    const sequence = await this.getSequence(enrollmentData.sequenceId);
    if (!sequence) {
      throw new Error('Sequence not found');
    }

    const now = new Date().toISOString();
    const currentStepIndex = sequence.steps.findIndex(s => s.id === enrollmentData.currentStepId);
    const nextStep = sequence.steps[currentStepIndex + 1];

    // Update step history
    const stepHistory = [...enrollmentData.stepHistory, {
      stepId: enrollmentData.currentStepId,
      executedAt: now,
      result,
      metadata,
    }];

    const fields: Record<string, unknown> = {
      LastActionAt: now,
      StepHistory: JSON.stringify(stepHistory),
      CompletedSteps: [...enrollmentData.completedSteps, enrollmentData.currentStepId].join(','),
    };

    if (nextStep) {
      fields.CurrentStepId = nextStep.id;
      fields.CurrentStepNumber = enrollmentData.currentStepNumber + 1;
      // Calculate next action time based on wait config if next step is a wait
      if (nextStep.waitConfig) {
        const delayMs = this.calculateDelayMs(nextStep.waitConfig);
        fields.NextActionAt = new Date(Date.now() + delayMs).toISOString();
      }
    } else {
      // Sequence complete
      fields.Status = 'completed';
      fields.CompletedAt = now;
    }

    try {
      const record = await this.enrollmentsTable!.update(enrollmentId, fields as Partial<FieldSet>);
      return this.recordToEnrollment(record);
    } catch (error: unknown) {
      console.error('Error advancing enrollment:', error);
      throw new Error(`Failed to advance enrollment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate delay in milliseconds from wait config
   */
  private calculateDelayMs(waitConfig: { duration: number; unit: string }): number {
    const multipliers: Record<string, number> = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
    };
    return waitConfig.duration * (multipliers[waitConfig.unit] || multipliers.days);
  }

  /**
   * Update sequence metrics
   */
  private async updateSequenceMetrics(sequenceId: string, metrics: SequenceMetrics): Promise<void> {
    try {
      await this.sequencesTable!.update(sequenceId, {
        Metrics: JSON.stringify(metrics),
        UpdatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating sequence metrics:', error);
    }
  }

  // ============ Templates ============

  /**
   * Create email template
   * 
   * Creates a new email template with the provided details including name, subject,
   * body content, variables, and optional category.
   * 
   * @param {Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>} template - Template data without generated fields
   * @returns {Promise<EmailTemplate>} The created email template with generated id and timestamps
   * @throws {Error} If client not initialized or template creation fails
   */
  public async createEmailTemplate(
    template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EmailTemplate> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const now = new Date().toISOString();

    try {
      const record = await this.emailTemplatesTable!.create({
        Name: template.name,
        Subject: template.subject,
        Body: template.body,
        Variables: JSON.stringify(template.variables),
        Category: template.category,
        CreatedAt: now,
        UpdatedAt: now,
      });

      return {
        id: record.id,
        name: record.fields.Name as string,
        subject: record.fields.Subject as string,
        body: record.fields.Body as string,
        variables: JSON.parse(record.fields.Variables as string || '[]'),
        category: record.fields.Category as string | undefined,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error creating email template:', error);
      throw new Error('Failed to create email template');
    }
  }

  /**
   * Get email templates
   * 
   * Retrieves all email templates sorted by name in ascending order.
   * 
   * @returns {Promise<EmailTemplate[]>} Array of all email templates
   * @throws {Error} If client not initialized or fetch fails
   */
  public async getEmailTemplates(): Promise<EmailTemplate[]> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    try {
      const records = await this.emailTemplatesTable!.select({
        sort: [{ field: 'Name', direction: 'asc' }],
      } as any).all();

      return records.map(r => ({
        id: r.id,
        name: r.fields.Name as string,
        subject: r.fields.Subject as string,
        body: r.fields.Body as string,
        variables: r.fields.Variables ? JSON.parse(r.fields.Variables as string) : [],
        category: r.fields.Category as string | undefined,
        createdAt: r.fields.CreatedAt as string,
        updatedAt: r.fields.UpdatedAt as string,
      }));
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw new Error('Failed to fetch email templates');
    }
  }

  /**
   * Get LinkedIn templates
   * 
   * Retrieves all LinkedIn templates sorted by name in ascending order.
   * 
   * @returns {Promise<LinkedInTemplate[]>} Array of all LinkedIn templates
   * @throws {Error} If client not initialized or fetch fails
   */
  public async getLinkedInTemplates(): Promise<LinkedInTemplate[]> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    try {
      const records = await this.linkedinTemplatesTable!.select({
        sort: [{ field: 'Name', direction: 'asc' }],
      } as any).all();

      return records.map(r => ({
        id: r.id,
        name: r.fields.Name as string,
        message: r.fields.Message as string,
        variables: r.fields.Variables ? JSON.parse(r.fields.Variables as string) : [],
        type: r.fields.Type as LinkedInTemplate['type'],
        characterCount: (r.fields.Message as string || '').length,
        createdAt: r.fields.CreatedAt as string,
        updatedAt: r.fields.UpdatedAt as string,
      }));
    } catch (error) {
      console.error('Error fetching LinkedIn templates:', error);
      throw new Error('Failed to fetch LinkedIn templates');
    }
  }

  // ============ Due Actions ============

  /**
   * Get enrollments with due actions
   * 
   * Returns active enrollments where NextActionAt is less than or equal to the current time,
   * sorted by NextActionAt in ascending order.
   * 
   * @param {number} [limit=50] - Maximum number of records to return (default: 50)
   * @returns {Promise<SequenceEnrollment[]>} Array of enrollments sorted by NextActionAt
   * @throws {Error} If client not initialized or fetch fails
   */
  public async getDueEnrollments(limit: number = 50): Promise<SequenceEnrollment[]> {
    if (!this.isInitialized()) {
      throw new Error('Sequences client not initialized');
    }

    const now = new Date().toISOString();
    const escapedNow = escapeAirtableFormulaValue(now);

    try {
      const records = await this.enrollmentsTable!.select({
        filterByFormula: `AND({Status} = 'active', {NextActionAt} <= '${escapedNow}')`,
        maxRecords: limit,
        sort: [{ field: 'NextActionAt', direction: 'asc' }],
      } as any).all();

      return records.map(r => this.recordToEnrollment(r));
    } catch (error) {
      console.error('Error fetching due enrollments:', error);
      throw new Error('Failed to fetch due enrollments');
    }
  }
}

// Export singleton instance
export const sequencesClient = new SequencesClient();
