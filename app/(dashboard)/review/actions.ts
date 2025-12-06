'use server';

/**
 * Server Actions for Review Workflow
 * These functions run on the server and can be called from client components
 */

import { z } from 'zod';
import { parseText } from '@/lib/services/parse-service';
import { summarizeText } from '@/lib/services/summarize-service';
import { generateImage as generateImageService } from '@/lib/services/image-service';

// Validation schemas
const ParseSchema = z.object({
  rawInput: z.string().min(1, 'Content is required'),
});

const SummarizeSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

const ImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
});

// Response types
export interface ParseResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface SummarizeResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ImageResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ApproveResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Parse raw content using AI
 * Calls the parse service directly instead of making an HTTP request
 */
export async function parseContent(
  _prevState: ParseResult | null,
  formData: FormData
): Promise<ParseResult> {
  try {
    const rawInput = formData.get('rawInput') as string;

    const validated = ParseSchema.safeParse({ rawInput });
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input',
      };
    }

    // Call the parse service directly
    const result = await parseText(validated.data.rawInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Parse failed',
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Parse action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed',
    };
  }
}

/**
 * Generate summary using AI
 * Calls the summarize service directly instead of making an HTTP request
 */
export async function summarizeContent(
  _prevState: SummarizeResult | null,
  formData: FormData
): Promise<SummarizeResult> {
  try {
    const content = formData.get('content') as string;

    const validated = SummarizeSchema.safeParse({ content });
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input',
      };
    }

    // Call the summarize service directly
    const result = await summarizeText(validated.data.content);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Summarization failed',
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Summarize action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Summarization failed',
    };
  }
}

/**
 * Generate image using AI
 * Calls the image service directly instead of making an HTTP request
 */
export async function generateImage(
  _prevState: ImageResult | null,
  formData: FormData
): Promise<ImageResult> {
  try {
    const prompt = formData.get('prompt') as string;

    const validated = ImageSchema.safeParse({ prompt });
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input',
      };
    }

    // Call the image service directly
    const result = await generateImageService(validated.data.prompt);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Image generation failed',
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Generate image action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image generation failed',
    };
  }
}

/**
 * Approve and publish content
 */
export async function approveContent(
  _prevState: ApproveResult | null,
  formData: FormData
): Promise<ApproveResult> {
  try {
    const summary = formData.get('summary') as string;
    const image = formData.get('image') as string;

    // In a real implementation, this would save to a database and trigger publishing
    console.error('Content approved:', { summary: summary?.substring(0, 100), hasImage: !!image });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Content approved successfully!',
    };
  } catch (error) {
    console.error('Approve action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Approval failed',
    };
  }
}
