'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCopyToClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  error: string | null;
}

/**
 * Custom hook for copying text to clipboard with feedback state
 * @param resetDelay - Time in ms before resetting copied state (default: 2000)
 */
export function useCopyToClipboard(resetDelay = 2000): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) {
      setError('Nothing to copy');
      return false;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      // Check if clipboard API is available
      if (!navigator?.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setError(null);
        } catch {
          setError('Failed to copy');
          return false;
        } finally {
          document.body.removeChild(textArea);
        }
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
      }

      // Reset copied state after delay
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, resetDelay);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy';
      setError(errorMessage);
      setCopied(false);
      return false;
    }
  }, [resetDelay]);

  return { copied, copy, error };
}
