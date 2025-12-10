import Airtable, { FieldSet, Record as AirtableRecord } from 'airtable';
import {
  Form,
  FormStatus,
  FormField,
  FormSubmission,
  CreateFormInput,
  UpdateFormInput,
  createDefaultTheme,
  createEmptyFormMetrics,
  generateEmbedCode,
} from '../../types/survey';

/**
 * Pagination interface
 */
export interface FormPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * Form query response
 */
export interface FormQueryResponse {
  forms: Form[];
  pagination: FormPagination;
}

/**
 * Submission query response
 */
export interface SubmissionQueryResponse {
  submissions: FormSubmission[];
  pagination: FormPagination;
}

/**
 * Forms data client for Airtable
 */
export class FormsClient {
  private base: Airtable.Base | undefined;
  private formsTable: Airtable.Table<FieldSet> | undefined;
  private fieldsTable: Airtable.Table<FieldSet> | undefined;
  private submissionsTable: Airtable.Table<FieldSet> | undefined;
  private initialized: boolean = false;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Use provided URL, environment variable, or fall back to default
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    this.initialize();
  }

  /**
   * Initialize Airtable connection for forms
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
      this.formsTable = this.base(process.env.AIRTABLE_FORMS_TABLE || 'Forms');
      this.fieldsTable = this.base(process.env.AIRTABLE_FORM_FIELDS_TABLE || 'FormFields');
      this.submissionsTable = this.base(process.env.AIRTABLE_SUBMISSIONS_TABLE || 'FormSubmissions');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Forms Airtable client:', error);
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
   * Convert Airtable record to Form
   */
  private recordToForm(record: AirtableRecord<FieldSet>, fields: FormField[] = []): Form {
    const data = record.fields;
    const formId = record.id;

    return {
      id: formId,
      name: data.Name as string,
      description: data.Description as string | undefined,
      type: (data.Type as Form['type']) || 'form',
      status: (data.Status as FormStatus) || 'draft',
      fields: fields,
      pages: data.Pages ? JSON.parse(data.Pages as string) : undefined,
      isMultiPage: data.IsMultiPage as boolean ?? false,
      theme: data.Theme ? JSON.parse(data.Theme as string) : createDefaultTheme(),
      showProgressBar: data.ShowProgressBar as boolean ?? true,
      showPageNumbers: data.ShowPageNumbers as boolean ?? true,
      allowMultipleSubmissions: data.AllowMultipleSubmissions as boolean ?? false,
      requireAuthentication: data.RequireAuthentication as boolean ?? false,
      captchaEnabled: data.CaptchaEnabled as boolean ?? false,
      expiresAt: data.ExpiresAt as string | undefined,
      submissionLimit: data.SubmissionLimit as number | undefined,
      completionSettings: data.CompletionSettings
        ? JSON.parse(data.CompletionSettings as string)
        : { showMessage: true, message: 'Thank you for your submission!' },
      notificationSettings: data.NotificationSettings
        ? JSON.parse(data.NotificationSettings as string)
        : { notifyOnSubmission: false, notificationEmails: [], includeResponses: false },
      integrations: data.Integrations
        ? JSON.parse(data.Integrations as string)
        : { createLead: true, leadSource: 'form' },
      metrics: data.Metrics
        ? JSON.parse(data.Metrics as string)
        : createEmptyFormMetrics(),
      publicUrl: `${this.baseUrl}/forms/${formId}`,
      embedCode: generateEmbedCode(formId, this.baseUrl),
      tags: data.Tags ? (data.Tags as string).split(',').filter(Boolean) : [],
      createdAt: data.CreatedAt as string || new Date().toISOString(),
      updatedAt: data.UpdatedAt as string || new Date().toISOString(),
      createdBy: data.CreatedBy as string || '',
    };
  }

  /**
   * Convert Airtable record to FormField
   */
  private recordToField(record: AirtableRecord<FieldSet>): FormField {
    const data = record.fields;
    return {
      id: record.id,
      type: data.Type as FormField['type'],
      name: data.Name as string,
      label: data.Label as string,
      placeholder: data.Placeholder as string | undefined,
      helpText: data.HelpText as string | undefined,
      defaultValue: data.DefaultValue ? JSON.parse(data.DefaultValue as string) : undefined,
      order: data.Order as number || 0,
      options: data.Options ? JSON.parse(data.Options as string) : undefined,
      ratingConfig: data.RatingConfig ? JSON.parse(data.RatingConfig as string) : undefined,
      npsConfig: data.NPSConfig ? JSON.parse(data.NPSConfig as string) : undefined,
      matrixConfig: data.MatrixConfig ? JSON.parse(data.MatrixConfig as string) : undefined,
      fileConfig: data.FileConfig ? JSON.parse(data.FileConfig as string) : undefined,
      validation: data.Validation ? JSON.parse(data.Validation as string) : { required: false },
      conditionalLogic: data.ConditionalLogic ? JSON.parse(data.ConditionalLogic as string) : undefined,
      leadField: data.LeadField as string | undefined,
      createdAt: data.CreatedAt as string || new Date().toISOString(),
      updatedAt: data.UpdatedAt as string || new Date().toISOString(),
    };
  }

  /**
   * Convert Airtable record to FormSubmission
   */
  private recordToSubmission(record: AirtableRecord<FieldSet>): FormSubmission {
    const data = record.fields;
    return {
      id: record.id,
      formId: data.FormId as string,
      responses: data.Responses ? JSON.parse(data.Responses as string) : {},
      metadata: data.Metadata ? JSON.parse(data.Metadata as string) : {},
      score: data.Score as number | undefined,
      maxScore: data.MaxScore as number | undefined,
      passed: data.Passed as boolean | undefined,
      leadId: data.LeadId as string | undefined,
      startedAt: data.StartedAt as string || new Date().toISOString(),
      completedAt: data.CompletedAt as string || new Date().toISOString(),
      duration: data.Duration as number || 0,
      isPartial: data.IsPartial as boolean ?? false,
      isSpam: data.IsSpam as boolean ?? false,
    };
  }

  // ============ Form CRUD ============

  /**
   * Create a new form
   */
  public async createForm(input: CreateFormInput, createdBy: string): Promise<Form> {
    if (!this.isInitialized()) {
      throw new Error('Forms client not initialized');
    }

    const now = new Date().toISOString();

    try {
      // Create the form record
      const formRecord = await this.formsTable!.create({
        Name: input.name,
        Description: input.description,
        Type: input.type,
        Status: 'draft',
        Theme: JSON.stringify(input.theme || createDefaultTheme()),
        Integrations: JSON.stringify(input.integrations || { createLead: true, leadSource: 'form' }),
        CompletionSettings: JSON.stringify({ showMessage: true, message: 'Thank you for your submission!' }),
        NotificationSettings: JSON.stringify({ notifyOnSubmission: false, notificationEmails: [], includeResponses: false }),
        Metrics: JSON.stringify(createEmptyFormMetrics()),
        Tags: input.tags?.join(',') || '',
        IsMultiPage: false,
        AllowMultipleSubmissions: false,
        RequireAuthentication: false,
        CaptchaEnabled: false,
        ShowProgressBar: true,
        ShowPageNumbers: true,
        CreatedAt: now,
        UpdatedAt: now,
        CreatedBy: createdBy,
      });

      // Create fields
      const createdFields: FormField[] = [];
      for (const fieldInput of input.fields) {
        const fieldRecord = await this.fieldsTable!.create({
          FormId: formRecord.id,
          Type: fieldInput.type,
          Name: fieldInput.name,
          Label: fieldInput.label,
          Placeholder: fieldInput.placeholder,
          HelpText: fieldInput.helpText,
          Order: fieldInput.order,
          Options: fieldInput.options ? JSON.stringify(fieldInput.options) : undefined,
          Validation: JSON.stringify(fieldInput.validation || { required: false }),
          LeadField: fieldInput.leadField,
          CreatedAt: now,
          UpdatedAt: now,
        });
        createdFields.push(this.recordToField(fieldRecord));
      }

      return this.recordToForm(formRecord, createdFields);
    } catch (error) {
      console.error('Error creating form:', error);
      throw new Error('Failed to create form');
    }
  }

  /**
   * Get a form by ID
   */
  public async getForm(id: string): Promise<Form | null> {
    if (!this.isInitialized()) {
      throw new Error('Forms client not initialized');
    }

    try {
      const record = await this.formsTable!.find(id);

      // Fetch fields for this form
      const fieldsRecords = await this.fieldsTable!.select({
        filterByFormula: `{FormId} = '${id}'`,
        sort: [{ field: 'Order', direction: 'asc' }],
      } as any).all();

      const fields = fieldsRecords.map(r => this.recordToField(r));

      return this.recordToForm(record, fields);
    } catch (error) {
      console.error('Error fetching form:', error);
      return null;
    }
  }

  /**
   * Update a form
   */
  public async updateForm(id: string, input: UpdateFormInput): Promise<Form> {
    if (!this.isInitialized()) {
      throw new Error('Forms client not initialized');
    }

    const now = new Date().toISOString();
    const fields: Record<string, unknown> = { UpdatedAt: now };

    if (input.name !== undefined) fields.Name = input.name;
    if (input.description !== undefined) fields.Description = input.description;
    if (input.status !== undefined) fields.Status = input.status;
    if (input.theme !== undefined) fields.Theme = JSON.stringify(input.theme);
    if (input.completionSettings !== undefined) fields.CompletionSettings = JSON.stringify(input.completionSettings);
    if (input.notificationSettings !== undefined) fields.NotificationSettings = JSON.stringify(input.notificationSettings);
    if (input.integrations !== undefined) fields.Integrations = JSON.stringify(input.integrations);
    if (input.tags !== undefined) fields.Tags = input.tags.join(',');

    try {
      await this.formsTable!.update(id, fields as Partial<FieldSet>);
      return (await this.getForm(id))!;
    } catch (error: unknown) {
      console.error('Error updating form:', error);
      throw new Error(`Failed to update form: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a form
   */
  public async deleteForm(id: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Forms client not initialized');
    }

    try {
      // Delete all fields first
      const fieldsRecords = await this.fieldsTable!.select({
        filterByFormula: `{FormId} = '${id}'`,
      } as any).all();

      for (const field of fieldsRecords) {
        await this.fieldsTable!.destroy(field.id);
      }

      // Delete the form
      await this.formsTable!.destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      return false;
    }
  }

  /**
   * Query forms
   */
  public async queryForms(options?: {
    status?: FormStatus;
    type?: Form['type'];
    page?: number;
    pageSize?: number;
  }): Promise<FormQueryResponse> {
    if (!this.isInitialized()) {
      throw new Error('Forms client not initialized');
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    const conditions: string[] = [];
    if (options?.status) conditions.push(`{Status} = '${options.status}'`);
    if (options?.type) conditions.push(`{Type} = '${options.type}'`);

    try {
      const selectOptions: Record<string, unknown> = {
        pageSize: pageSize + 1,
        sort: [{ field: 'CreatedAt', direction: 'desc' }],
      };

      if (conditions.length > 0) {
        selectOptions.filterByFormula = conditions.length === 1
          ? conditions[0]
          : `AND(${conditions.join(', ')})`;
      }

      const records = await this.formsTable!.select(selectOptions as any).all();

      const hasMore = records.length > pageSize;
      const formsToReturn = hasMore ? records.slice(0, pageSize) : records;

      // Fetch fields for each form
      const forms: Form[] = [];
      for (const record of formsToReturn) {
        const fieldsRecords = await this.fieldsTable!.select({
          filterByFormula: `{FormId} = '${record.id}'`,
          sort: [{ field: 'Order', direction: 'asc' }],
        } as any).all();

        const fields = fieldsRecords.map(r => this.recordToField(r));
        forms.push(this.recordToForm(record, fields));
      }

      return {
        forms,
        pagination: {
          page,
          pageSize,
          total: records.length,
          hasMore,
        },
      };
    } catch (error) {
      console.error('Error querying forms:', error);
      throw new Error('Failed to query forms');
    }
  }

  // ============ Submissions ============

  /**
   * Create a form submission
   */
  public async createSubmission(
    formId: string,
    responses: Record<string, unknown>,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
    },
    startedAt?: string
  ): Promise<FormSubmission> {
    if (!this.isInitialized()) {
      throw new Error('Forms client not initialized');
    }

    const now = new Date().toISOString();
    const start = startedAt || now;
    const duration = Math.floor((new Date(now).getTime() - new Date(start).getTime()) / 1000);

    try {
      const record = await this.submissionsTable!.create({
        FormId: formId,
        Responses: JSON.stringify(responses),
        Metadata: JSON.stringify(metadata || {}),
        StartedAt: start,
        CompletedAt: now,
        Duration: duration,
        IsPartial: false,
        IsSpam: false,
      });

      // Update form metrics
      await this.incrementSubmissionCount(formId);

      return this.recordToSubmission(record);
    } catch (error) {
      console.error('Error creating submission:', error);
      throw new Error('Failed to create submission');
    }
  }

  /**
   * Get submissions for a form
   */
  public async getSubmissions(formId: string, options?: {
    page?: number;
    pageSize?: number;
  }): Promise<SubmissionQueryResponse> {
    if (!this.isInitialized()) {
      throw new Error('Forms client not initialized');
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    try {
      const records = await this.submissionsTable!.select({
        filterByFormula: `{FormId} = '${formId}'`,
        pageSize: pageSize + 1,
        sort: [{ field: 'CompletedAt', direction: 'desc' }],
      } as any).all();

      const hasMore = records.length > pageSize;
      const submissionsToReturn = hasMore ? records.slice(0, pageSize) : records;

      return {
        submissions: submissionsToReturn.map(r => this.recordToSubmission(r)),
        pagination: {
          page,
          pageSize,
          total: records.length,
          hasMore,
        },
      };
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw new Error('Failed to fetch submissions');
    }
  }

  /**
   * Increment submission count for a form
   */
  private async incrementSubmissionCount(formId: string): Promise<void> {
    try {
      const form = await this.getForm(formId);
      if (!form) return;

      const metrics = { ...form.metrics };
      metrics.submissions++;
      metrics.completionRate = metrics.starts > 0
        ? (metrics.submissions / metrics.starts) * 100
        : 0;

      await this.formsTable!.update(formId, {
        Metrics: JSON.stringify(metrics),
        UpdatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating form metrics:', error);
    }
  }

  /**
   * Track form view
   */
  public async trackView(formId: string): Promise<void> {
    try {
      const form = await this.getForm(formId);
      if (!form) return;

      const metrics = { ...form.metrics };
      metrics.views++;

      await this.formsTable!.update(formId, {
        Metrics: JSON.stringify(metrics),
      });
    } catch (error) {
      console.error('Error tracking form view:', error);
    }
  }

  /**
   * Track form start
   */
  public async trackStart(formId: string): Promise<void> {
    try {
      const form = await this.getForm(formId);
      if (!form) return;

      const metrics = { ...form.metrics };
      metrics.starts++;

      await this.formsTable!.update(formId, {
        Metrics: JSON.stringify(metrics),
      });
    } catch (error) {
      console.error('Error tracking form start:', error);
    }
  }
}

// Export singleton instance
export const formsClient = new FormsClient();
