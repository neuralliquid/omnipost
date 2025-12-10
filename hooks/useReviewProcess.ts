import { useState } from 'react';
import axios from 'axios';

export type ReviewStep =
  | 'input'
  | 'parsing'
  | 'summarizing'
  | 'generating'
  | 'approving'
  | 'approved';

interface ParsedData {
  [key: string]: unknown;
}

interface SummaryData {
  [key: string]: unknown;
}

interface ImageData {
  [key: string]: unknown;
}

interface ParseApiResponse {
  data: ParsedData;
  message?: string;
}

interface SummarizeApiResponse {
  data: SummaryData;
  message?: string;
}

interface ImageApiResponse {
  data: ImageData;
  message?: string;
}

interface ApproveApiResponse {
  data: unknown;
  message?: string;
}

/**
 * Custom hook for managing the content review process
 */
export function useReviewProcess() {
  const [rawInput, setRawInput] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [image, setImage] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<ReviewStep>('input');

  // Handle input change
  const handleRawInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawInput(e.target.value);
  };

  // Parse text
  const parseText = async () => {
    setIsLoading(true);
    setCurrentStep('parsing');
    try {
      const response = await axios.post<ParseApiResponse>('/api/parse', { rawInput });
      setParsedData(response.data.data);
      setCurrentStep('summarizing');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate summary
  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post<SummarizeApiResponse>('/api/summarize', {
        rawText: parsedData,
      });
      setSummary(response.data.data);
      setCurrentStep('generating');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate image
  const generateImage = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post<ImageApiResponse>('/api/generate-image', {
        context: summary,
      });
      setImage(response.data.data);
      setCurrentStep('approving');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve content
  const approveContent = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post<ApproveApiResponse>('/api/approve-content', {
        summary,
        image,
      });
      console.error('Content approved:', response.data);
      setCurrentStep('approved');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the process
  const resetProcess = () => {
    setRawInput('');
    setParsedData(null);
    setSummary(null);
    setImage(null);
    setError(null);
    setCurrentStep('input');
  };

  // Go back to previous step
  const goToPreviousStep = (step: ReviewStep) => {
    setCurrentStep(step);
  };

  // Set initial input (e.g., from URL params)
  const setInitialInput = (input: string) => {
    setRawInput(input);
  };

  // Error handling helper
  const handleError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      setError(err.response?.data?.message || err.message);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unknown error occurred');
    }
  };

  return {
    rawInput,
    parsedData,
    summary,
    image,
    error,
    isLoading,
    currentStep,
    handleRawInputChange,
    parseText,
    generateSummary,
    generateImage,
    approveContent,
    resetProcess,
    goToPreviousStep,
    setInitialInput,
  };
}
