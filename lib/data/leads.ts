import Airtable, { FieldSet, Record as AirtableRecord } from 'airtable';
import { generateId } from '../utils/id';
import {
  Lead,
  LeadStatus,
  LeadSource,
  LeadTemperature,
  LeadFilter,
  CreateLeadInput,
  UpdateLeadInput,
  LeadTag,
  LeadList,
  LeadInteraction,
  BulkOperationResult,
  createDefaultScore,
  computeFullName,
} from '../../types/lead';

/**
 * Pagination interface for lead queries
 */
export interface LeadPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * Lead query response
 */
export interface LeadQueryResponse {
  leads: Lead[];
  pagination: LeadPagination;
}

/**
 * Leads data client for Airtable
 */
export class LeadsClient {
  private base: Airtable.Base | undefined;
  private leadsTable: Airtable.Table<FieldSet> | undefined;
  private tagsTable: Airtable.Table<FieldSet> | undefined;
  private listsTable: Airtable.Table<FieldSet> | undefined;
  private interactionsTable: Airtable.Table<FieldSet> | undefined;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Airtable connection for leads
   */
  public initialize(): boolean {
    if (
      !process.env.AIRTABLE_API_KEY ||
      !process.env.AIRTABLE_BASE_ID
    ) {
      console.error('Missing required Airtable environment variables');
      return false;
    }

    try {
      this.base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
        process.env.AIRTABLE_BASE_ID
      );
      // Use environment variable or default table names
      this.leadsTable = this.base(process.env.AIRTABLE_LEADS_TABLE || 'Leads');
      this.tagsTable = this.base(process.env.AIRTABLE_TAGS_TABLE || 'LeadTags');
      this.listsTable = this.base(process.env.AIRTABLE_LISTS_TABLE || 'LeadLists');
      this.interactionsTable = this.base(process.env.AIRTABLE_INTERACTIONS_TABLE || 'LeadInteractions');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Leads Airtable client:', error);
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
   * Convert Airtable record to Lead
   */
  private recordToLead(record: AirtableRecord<FieldSet>): Lead {
    const fields = record.fields;
    return {
      id: record.id,
      firstName: (fields.FirstName as string) || '',
      lastName: (fields.LastName as string) || '',
      fullName: computeFullName(
        (fields.FirstName as string) || '',
        (fields.LastName as string) || ''
      ),
      title: fields.Title as string | undefined,
      contact: {
        email: fields.Email as string | undefined,
        phone: fields.Phone as string | undefined,
        linkedinUrl: fields.LinkedInUrl as string | undefined,
        twitterHandle: fields.TwitterHandle as string | undefined,
        website: fields.Website as string | undefined,
      },
      company: fields.CompanyName ? {
        name: fields.CompanyName as string,
        industry: fields.CompanyIndustry as string | undefined,
        size: fields.CompanySize as string | undefined,
        website: fields.CompanyWebsite as string | undefined,
        linkedinUrl: fields.CompanyLinkedIn as string | undefined,
        location: fields.CompanyLocation as string | undefined,
        description: fields.CompanyDescription as string | undefined,
      } : undefined,
      status: (fields.Status as LeadStatus) || 'new',
      temperature: (fields.Temperature as LeadTemperature) || 'cold',
      assignedTo: fields.AssignedTo as string | undefined,
      score: fields.ScoreData
        ? JSON.parse(fields.ScoreData as string)
        : createDefaultScore(),
      source: (fields.Source as LeadSource) || 'manual',
      sourceDetails: fields.SourceDetails as string | undefined,
      utm: fields.UTMData ? JSON.parse(fields.UTMData as string) : undefined,
      tags: fields.Tags ? (fields.Tags as string).split(',') : [],
      lists: fields.Lists ? (fields.Lists as string).split(',') : [],
      interactions: [], // Loaded separately
      lastInteractionAt: fields.LastInteractionAt as string | undefined,
      nextFollowUpAt: fields.NextFollowUpAt as string | undefined,
      activeSequences: fields.ActiveSequences
        ? (fields.ActiveSequences as string).split(',')
        : [],
      completedSequences: fields.CompletedSequences
        ? (fields.CompletedSequences as string).split(',')
        : [],
      customFields: fields.CustomFields
        ? JSON.parse(fields.CustomFields as string)
        : undefined,
      notes: fields.Notes as string | undefined,
      createdAt: fields.CreatedAt as string || new Date().toISOString(),
      updatedAt: fields.UpdatedAt as string || new Date().toISOString(),
      createdBy: fields.CreatedBy as string || '',
      linkedinData: fields.LinkedInData
        ? JSON.parse(fields.LinkedInData as string)
        : undefined,
    };
  }

  /**
   * Convert Lead to Airtable fields
   */
  private leadToFields(lead: Partial<Lead>): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    if (lead.firstName !== undefined) fields.FirstName = lead.firstName;
    if (lead.lastName !== undefined) fields.LastName = lead.lastName;
    if (lead.title !== undefined) fields.Title = lead.title;

    // Contact fields
    if (lead.contact) {
      if (lead.contact.email !== undefined) fields.Email = lead.contact.email;
      if (lead.contact.phone !== undefined) fields.Phone = lead.contact.phone;
      if (lead.contact.linkedinUrl !== undefined) fields.LinkedInUrl = lead.contact.linkedinUrl;
      if (lead.contact.twitterHandle !== undefined) fields.TwitterHandle = lead.contact.twitterHandle;
      if (lead.contact.website !== undefined) fields.Website = lead.contact.website;
    }

    // Company fields
    if (lead.company) {
      if (lead.company.name !== undefined) fields.CompanyName = lead.company.name;
      if (lead.company.industry !== undefined) fields.CompanyIndustry = lead.company.industry;
      if (lead.company.size !== undefined) fields.CompanySize = lead.company.size;
      if (lead.company.website !== undefined) fields.CompanyWebsite = lead.company.website;
      if (lead.company.linkedinUrl !== undefined) fields.CompanyLinkedIn = lead.company.linkedinUrl;
      if (lead.company.location !== undefined) fields.CompanyLocation = lead.company.location;
      if (lead.company.description !== undefined) fields.CompanyDescription = lead.company.description;
    }

    if (lead.status !== undefined) fields.Status = lead.status;
    if (lead.temperature !== undefined) fields.Temperature = lead.temperature;
    if (lead.assignedTo !== undefined) fields.AssignedTo = lead.assignedTo;
    if (lead.score !== undefined) fields.ScoreData = JSON.stringify(lead.score);
    if (lead.source !== undefined) fields.Source = lead.source;
    if (lead.sourceDetails !== undefined) fields.SourceDetails = lead.sourceDetails;
    if (lead.utm !== undefined) fields.UTMData = JSON.stringify(lead.utm);
    if (lead.tags !== undefined) fields.Tags = lead.tags.join(',');
    if (lead.lists !== undefined) fields.Lists = lead.lists.join(',');
    if (lead.lastInteractionAt !== undefined) fields.LastInteractionAt = lead.lastInteractionAt;
    if (lead.nextFollowUpAt !== undefined) fields.NextFollowUpAt = lead.nextFollowUpAt;
    if (lead.activeSequences !== undefined) fields.ActiveSequences = lead.activeSequences.join(',');
    if (lead.completedSequences !== undefined) fields.CompletedSequences = lead.completedSequences.join(',');
    if (lead.customFields !== undefined) fields.CustomFields = JSON.stringify(lead.customFields);
    if (lead.notes !== undefined) fields.Notes = lead.notes;
    if (lead.linkedinData !== undefined) fields.LinkedInData = JSON.stringify(lead.linkedinData);

    fields.UpdatedAt = new Date().toISOString();

    return fields;
  }

  /**
   * Build Airtable filter formula from LeadFilter
   */
  private buildFilterFormula(filter: LeadFilter): string {
    const conditions: string[] = [];

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      const statusConditions = statuses.map(s => `{Status} = '${s}'`);
      conditions.push(`OR(${statusConditions.join(', ')})`);
    }

    if (filter.temperature) {
      const temps = Array.isArray(filter.temperature) ? filter.temperature : [filter.temperature];
      const tempConditions = temps.map(t => `{Temperature} = '${t}'`);
      conditions.push(`OR(${tempConditions.join(', ')})`);
    }

    if (filter.source) {
      const sources = Array.isArray(filter.source) ? filter.source : [filter.source];
      const sourceConditions = sources.map(s => `{Source} = '${s}'`);
      conditions.push(`OR(${sourceConditions.join(', ')})`);
    }

    if (filter.assignedTo) {
      conditions.push(`{AssignedTo} = '${filter.assignedTo}'`);
    }

    if (filter.scoreMin !== undefined) {
      conditions.push(`{ScoreTotal} >= ${filter.scoreMin}`);
    }

    if (filter.scoreMax !== undefined) {
      conditions.push(`{ScoreTotal} <= ${filter.scoreMax}`);
    }

    if (filter.createdAfter) {
      conditions.push(`IS_AFTER({CreatedAt}, '${filter.createdAfter}')`);
    }

    if (filter.createdBefore) {
      conditions.push(`IS_BEFORE({CreatedAt}, '${filter.createdBefore}')`);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      conditions.push(
        `OR(FIND('${searchTerm}', LOWER({FirstName})) > 0, ` +
        `FIND('${searchTerm}', LOWER({LastName})) > 0, ` +
        `FIND('${searchTerm}', LOWER({Email})) > 0, ` +
        `FIND('${searchTerm}', LOWER({CompanyName})) > 0)`
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      const tagConditions = filter.tags.map(t => `FIND('${t}', {Tags}) > 0`);
      conditions.push(`OR(${tagConditions.join(', ')})`);
    }

    if (filter.inSequence) {
      conditions.push(`FIND('${filter.inSequence}', {ActiveSequences}) > 0`);
    }

    if (filter.notInSequence) {
      conditions.push(`FIND('${filter.notInSequence}', {ActiveSequences}) = 0`);
    }

    if (conditions.length === 0) return '';
    if (conditions.length === 1) return conditions[0];
    return `AND(${conditions.join(', ')})`;
  }

  /**
   * Create a new lead
   */
  public async createLead(input: CreateLeadInput, createdBy: string): Promise<Lead> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const now = new Date().toISOString();
    const fields: Record<string, unknown> = {
      FirstName: input.firstName,
      LastName: input.lastName,
      Title: input.title,
      Email: input.contact?.email,
      Phone: input.contact?.phone,
      LinkedInUrl: input.contact?.linkedinUrl,
      TwitterHandle: input.contact?.twitterHandle,
      Website: input.contact?.website,
      CompanyName: input.company?.name,
      CompanyIndustry: input.company?.industry,
      CompanySize: input.company?.size,
      CompanyWebsite: input.company?.website,
      CompanyLinkedIn: input.company?.linkedinUrl,
      CompanyLocation: input.company?.location,
      Status: 'new',
      Temperature: 'cold',
      Source: input.source,
      SourceDetails: input.sourceDetails,
      Tags: input.tags?.join(',') || '',
      Notes: input.notes,
      ScoreData: JSON.stringify(createDefaultScore()),
      CustomFields: input.customFields ? JSON.stringify(input.customFields) : undefined,
      LinkedInData: input.linkedinData ? JSON.stringify(input.linkedinData) : undefined,
      CreatedAt: now,
      UpdatedAt: now,
      CreatedBy: createdBy,
      ActiveSequences: '',
      CompletedSequences: '',
    };

    try {
      const record = await this.leadsTable!.create(fields);
      return this.recordToLead(record);
    } catch (error) {
      console.error('Error creating lead:', error);
      throw new Error('Failed to create lead');
    }
  }

  /**
   * Get a lead by ID
   */
  public async getLead(id: string): Promise<Lead | null> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    try {
      const record = await this.leadsTable!.find(id);
      return this.recordToLead(record);
    } catch (error) {
      console.error('Error fetching lead:', error);
      return null;
    }
  }

  /**
   * Update a lead
   */
  public async updateLead(id: string, input: UpdateLeadInput): Promise<Lead> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const fields = this.leadToFields(input as Partial<Lead>);

    try {
      const record = await this.leadsTable!.update(id, fields);
      return this.recordToLead(record);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw new Error('Failed to update lead');
    }
  }

  /**
   * Delete a lead
   */
  public async deleteLead(id: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    try {
      await this.leadsTable!.destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }

  /**
   * Query leads with filters and pagination
   */
  public async queryLeads(
    filter?: LeadFilter,
    options?: { page?: number; pageSize?: number; sortField?: string; sortDirection?: 'asc' | 'desc' }
  ): Promise<LeadQueryResponse> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const sortField = options?.sortField || 'CreatedAt';
    const sortDirection = options?.sortDirection || 'desc';

    try {
      const selectOptions: Record<string, unknown> = {
        pageSize: pageSize + 1, // Fetch one extra to check for more pages
        sort: [{ field: sortField, direction: sortDirection }],
      };

      if (filter) {
        const formula = this.buildFilterFormula(filter);
        if (formula) {
          selectOptions.filterByFormula = formula;
        }
      }

      const records = await this.leadsTable!.select(selectOptions as any).all();

      const hasMore = records.length > pageSize;
      const leadsToReturn = hasMore ? records.slice(0, pageSize) : records;

      return {
        leads: leadsToReturn.map(r => this.recordToLead(r)),
        pagination: {
          page,
          pageSize,
          total: records.length, // Note: Airtable doesn't provide total count easily
          hasMore,
        },
      };
    } catch (error) {
      console.error('Error querying leads:', error);
      throw new Error('Failed to query leads');
    }
  }

  /**
   * Add an interaction to a lead
   */
  public async addInteraction(
    leadId: string,
    interaction: Omit<LeadInteraction, 'id' | 'createdAt'>
  ): Promise<LeadInteraction> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const now = new Date().toISOString();
    const interactionRecord: LeadInteraction = {
      ...interaction,
      id: generateId(),
      createdAt: now,
    };

    try {
      await this.interactionsTable!.create({
        LeadId: leadId,
        InteractionId: interactionRecord.id,
        Type: interactionRecord.type,
        Description: interactionRecord.description,
        Metadata: JSON.stringify(interactionRecord.metadata || {}),
        CreatedAt: now,
        CreatedBy: interactionRecord.createdBy || '',
      });

      // Update last interaction timestamp on lead
      await this.leadsTable!.update(leadId, {
        LastInteractionAt: now,
        UpdatedAt: now,
      });

      return interactionRecord;
    } catch (error) {
      console.error('Error adding interaction:', error);
      throw new Error('Failed to add interaction');
    }
  }

  /**
   * Get interactions for a lead
   */
  public async getInteractions(leadId: string): Promise<LeadInteraction[]> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    try {
      const records = await this.interactionsTable!.select({
        filterByFormula: `{LeadId} = '${leadId}'`,
        sort: [{ field: 'CreatedAt', direction: 'desc' }],
      } as any).all();

      return records.map(r => ({
        id: r.fields.InteractionId as string,
        type: r.fields.Type as LeadInteraction['type'],
        description: r.fields.Description as string,
        metadata: r.fields.Metadata ? JSON.parse(r.fields.Metadata as string) : undefined,
        createdAt: r.fields.CreatedAt as string,
        createdBy: r.fields.CreatedBy as string | undefined,
      }));
    } catch (error) {
      console.error('Error fetching interactions:', error);
      throw new Error('Failed to fetch interactions');
    }
  }

  // ============ Tags Management ============

  /**
   * Create a tag
   */
  public async createTag(tag: Omit<LeadTag, 'id' | 'createdAt'>): Promise<LeadTag> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const now = new Date().toISOString();

    try {
      const record = await this.tagsTable!.create({
        Name: tag.name,
        Color: tag.color,
        Description: tag.description || '',
        CreatedAt: now,
      });

      return {
        id: record.id,
        name: record.fields.Name as string,
        color: record.fields.Color as string,
        description: record.fields.Description as string | undefined,
        createdAt: now,
      };
    } catch (error) {
      console.error('Error creating tag:', error);
      throw new Error('Failed to create tag');
    }
  }

  /**
   * Get all tags
   */
  public async getTags(): Promise<LeadTag[]> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    try {
      const records = await this.tagsTable!.select({
        sort: [{ field: 'Name', direction: 'asc' }],
      } as any).all();

      return records.map(r => ({
        id: r.id,
        name: r.fields.Name as string,
        color: r.fields.Color as string,
        description: r.fields.Description as string | undefined,
        createdAt: r.fields.CreatedAt as string,
      }));
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw new Error('Failed to fetch tags');
    }
  }

  /**
   * Delete a tag
   */
  public async deleteTag(id: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    try {
      await this.tagsTable!.destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
  }

  // ============ Lists Management ============

  /**
   * Create a lead list
   */
  public async createList(list: Omit<LeadList, 'id' | 'createdAt' | 'updatedAt' | 'leadCount'>): Promise<LeadList> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const now = new Date().toISOString();

    try {
      const record = await this.listsTable!.create({
        Name: list.name,
        Description: list.description || '',
        Type: list.type,
        Filter: list.filter ? JSON.stringify(list.filter) : undefined,
        LeadIds: list.leadIds?.join(',') || '',
        CreatedAt: now,
        UpdatedAt: now,
        CreatedBy: list.createdBy,
      });

      return {
        id: record.id,
        name: record.fields.Name as string,
        description: record.fields.Description as string | undefined,
        type: record.fields.Type as 'static' | 'dynamic',
        filter: record.fields.Filter ? JSON.parse(record.fields.Filter as string) : undefined,
        leadIds: record.fields.LeadIds ? (record.fields.LeadIds as string).split(',').filter(Boolean) : [],
        leadCount: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: list.createdBy,
      };
    } catch (error) {
      console.error('Error creating list:', error);
      throw new Error('Failed to create list');
    }
  }

  /**
   * Get all lists
   */
  public async getLists(): Promise<LeadList[]> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    try {
      const records = await this.listsTable!.select({
        sort: [{ field: 'Name', direction: 'asc' }],
      } as any).all();

      return records.map(r => ({
        id: r.id,
        name: r.fields.Name as string,
        description: r.fields.Description as string | undefined,
        type: r.fields.Type as 'static' | 'dynamic',
        filter: r.fields.Filter ? JSON.parse(r.fields.Filter as string) : undefined,
        leadIds: r.fields.LeadIds ? (r.fields.LeadIds as string).split(',').filter(Boolean) : [],
        leadCount: r.fields.LeadIds ? (r.fields.LeadIds as string).split(',').filter(Boolean).length : 0,
        createdAt: r.fields.CreatedAt as string,
        updatedAt: r.fields.UpdatedAt as string,
        createdBy: r.fields.CreatedBy as string,
      }));
    } catch (error) {
      console.error('Error fetching lists:', error);
      throw new Error('Failed to fetch lists');
    }
  }

  // ============ Bulk Operations ============

  /**
   * Bulk update leads
   */
  public async bulkUpdate(
    leadIds: string[],
    update: UpdateLeadInput
  ): Promise<BulkOperationResult> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const results: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const fields = this.leadToFields(update as Partial<Lead>);

    // Airtable supports batch updates of up to 10 records
    const batches: string[][] = [];
    for (let i = 0; i < leadIds.length; i += 10) {
      batches.push(leadIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      try {
        const updates = batch.map(id => ({ id, fields }));
        await this.leadsTable!.update(updates as any);
        results.success += batch.length;
      } catch (error) {
        results.failed += batch.length;
        batch.forEach(id => {
          results.errors.push({
            leadId: id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }
    }

    return results;
  }

  /**
   * Bulk delete leads
   */
  public async bulkDelete(leadIds: string[]): Promise<BulkOperationResult> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const results: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Airtable supports batch deletes of up to 10 records
    const batches: string[][] = [];
    for (let i = 0; i < leadIds.length; i += 10) {
      batches.push(leadIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      try {
        await this.leadsTable!.destroy(batch);
        results.success += batch.length;
      } catch (error) {
        results.failed += batch.length;
        batch.forEach(id => {
          results.errors.push({
            leadId: id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }
    }

    return results;
  }

  /**
   * Add tag to multiple leads
   */
  public async bulkAddTag(leadIds: string[], tagId: string): Promise<BulkOperationResult> {
    if (!this.isInitialized()) {
      throw new Error('Leads client not initialized');
    }

    const results: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const leadId of leadIds) {
      try {
        const lead = await this.getLead(leadId);
        if (!lead) {
          results.failed++;
          results.errors.push({ leadId, error: 'Lead not found' });
          continue;
        }

        if (!lead.tags.includes(tagId)) {
          await this.updateLead(leadId, { tags: [...lead.tags, tagId] });
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          leadId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const leadsClient = new LeadsClient();
