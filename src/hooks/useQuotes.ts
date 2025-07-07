import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Quote {
  id: string;
  content: string;
  source_text?: string;
  created_at: string;
  updated_at: string;
}

export function useQuotes(userId?: string) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuotes = async () => {
    if (!userId) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error loading quotes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [userId]);

  const saveQuote = async (content: string, sourceText?: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .insert({
          user_id: userId,
          content,
          source_text: sourceText,
        });

      if (error) throw error;

      toast({
        title: "Quote saved",
        description: "Your quote has been saved to your collection.",
      });

      // Refresh quotes
      fetchQuotes();
    } catch (error: any) {
      console.error('Error saving quote:', error);
      toast({
        title: "Error saving quote",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Quote deleted",
        description: "The quote has been removed from your collection.",
      });

      // Refresh quotes
      fetchQuotes();
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      toast({
        title: "Error deleting quote",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    quotes,
    loading,
    saveQuote,
    deleteQuote,
    refetch: fetchQuotes,
  };
}