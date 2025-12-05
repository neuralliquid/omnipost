'use server';

/**
 * Server Actions for Review Workflow
 * These functions run on the server and can be called from client components
 */

import { z } from 'zod';

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

    // Call the internal API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawInput: validated.data.rawInput }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Parse failed: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: validated.data.content }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Summarization failed: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: validated.data.prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Image generation failed: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
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
    console.log('Content approved:', { summary: summary?.substring(0, 100), hasImage: !!image });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

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
