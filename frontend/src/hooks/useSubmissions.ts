import { useState, useEffect, useCallback } from 'react';
import { submissionService } from '../services/submissionService';
import { Submission } from '../types';

export const useSubmissions = (eventId: string) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await submissionService.getGallery(eventId);
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, loading, error, refetch: fetchSubmissions };
};
