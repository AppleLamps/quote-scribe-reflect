import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Quote, Save, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes } from "@/hooks/useQuotes";
import { FileUpload, UploadedFile } from "@/components/FileUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AI_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Fast & balanced' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Best reasoning' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Good balance' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Fastest' },
  { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', description: 'Latest reasoning' },
  { value: 'openai/gpt-5', label: 'GPT-5', description: 'Powerful all-rounder' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Cost effective' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano', description: 'Ultra fast' },
  { value: 'openai/gpt-5.2', label: 'GPT-5.2', description: 'Enhanced reasoning' },
];


export function QuoteGenerator() {
  const [inputText, setInputText] = useState("");
  const [generatedQuote, setGeneratedQuote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [additionalDirections, setAdditionalDirections] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");
  const { toast } = useToast();
  const { user } = useAuth();
  const { saveQuote } = useQuotes(user?.id);
  

  // Ensure we don't double-wrap quotes: remove outer matching quotes if present
  const sanitizeQuote = (text: string) => {
    if (!text) return "";
    const trimmed = text.trim();
    const pairs: [string, string][] = [
      ['"', '"'],
      ['“', '”'],
      ['«', '»'],
      ['‹', '›'],
      ["'", "'"]
    ];
    for (const [open, close] of pairs) {
      if (trimmed.startsWith(open) && trimmed.endsWith(close)) {
        return trimmed.slice(open.length, trimmed.length - close.length).trim();
      }
    }
    return trimmed;
  };

  const generateQuote = async () => {
    if (!inputText.trim() && attachedFiles.length === 0) {
      toast({
        title: "Input Required",
        description: "Please enter some text or attach files to generate a quote from.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { 
          text: inputText.trim(), 
          files: attachedFiles,
          directions: additionalDirections.trim() || undefined,
          model: selectedModel,
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedQuote(sanitizeQuote(data.quote));
      toast({
        title: "Quote Generated",
        description: "Your profound reflection has been created!",
      });
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setInputText("");
    setGeneratedQuote("");
    setAttachedFiles([]);
    setAdditionalDirections("");
    setSelectedModel("google/gemini-3-flash-preview");
  };

  const handleSaveQuote = async () => {
    if (!generatedQuote) return;
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save quotes to your collection.",
        variant: "destructive",
      });
      return;
    }

    await saveQuote(generatedQuote, inputText);
  };

  const handleCopyQuote = async () => {
    if (!generatedQuote) return;

    try {
      await navigator.clipboard.writeText(`"${sanitizeQuote(generatedQuote)}"`);
      toast({
        title: "Quote Copied",
        description: "The quote has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Error copying quote:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy quote. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Hero Section */}
        <div className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        {/* Input Section */}
        <Card variant="floating" className="mb-12 overflow-hidden relative group animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
          <CardContent className="p-10 relative z-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label htmlFor="input-text" className="text-lg font-semibold text-foreground font-inter tracking-wide">
                  Share your text
                </label>
                <Textarea
                  id="input-text"
                  variant="glass"
                  placeholder="Share your thoughts, paste an article, or simply attach images to reflect upon..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] text-base leading-relaxed font-inter"
                  disabled={isLoading}
                />
              </div>
              
              <div className="transform hover:scale-[1.02] transition-all duration-300">
                <FileUpload
                  onFilesChange={setAttachedFiles}
                  files={attachedFiles}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-4">
                <label htmlFor="additional-directions" className="text-lg font-semibold text-foreground font-inter tracking-wide">
                  Additional directions
                  <span className="text-sm font-normal text-muted-foreground ml-2">(optional)</span>
                </label>
                <Textarea
                  id="additional-directions"
                  variant="glass"
                  placeholder="Provide specific instructions for the AI (e.g., 'Make it humorous', 'Focus on hope', 'Use a philosophical tone')..."
                  value={additionalDirections}
                  onChange={(e) => setAdditionalDirections(e.target.value)}
                  className="min-h-[100px] text-base leading-relaxed font-inter"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-4">
                <label className="text-lg font-semibold text-foreground font-inter tracking-wide">
                  AI Model
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
                  <SelectTrigger className="bg-card/50 border-border/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="font-medium">{m.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">— {m.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={generateQuote}
                  disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
                  className="min-w-[160px] h-12 text-base font-inter"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Reflecting on your words...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Quote
                    </>
                  )}
                </Button>
                
                {(inputText || generatedQuote || attachedFiles.length > 0 || additionalDirections) && (
                  <Button
                    variant="luxury"
                    size="lg"
                    onClick={clearAll}
                    disabled={isLoading}
                    className="h-12 font-inter"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Quote Section */}
        {generatedQuote && (
          <Card variant="premium" className="relative overflow-hidden group animate-slide-in-from-bottom">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-all duration-700"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-primary rounded-full shadow-glow"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-primary/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-primary/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
            <CardContent className="p-16 relative z-10">
              <div className="text-center space-y-10">
                <div className="relative inline-block animate-glow-pulse">
                  <Quote className="h-16 w-16 text-transparent bg-gradient-primary bg-clip-text mx-auto" />
                  <div className="absolute inset-0 h-16 w-16 bg-gradient-primary opacity-20 blur-xl mx-auto"></div>
                </div>
                
                <blockquote className="text-3xl md:text-4xl font-playfair font-medium leading-relaxed text-foreground italic max-w-4xl mx-auto tracking-wide">
                  "{sanitizeQuote(generatedQuote)}"
                </blockquote>
                
                <div className="flex items-center justify-center">
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent w-64"></div>
                </div>
                
                <div className="space-y-8">
                  <p className="text-lg text-muted-foreground/80 font-inter font-light tracking-wide">
                    Generated reflection from your content
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="luxury"
                      size="lg"
                      onClick={handleCopyQuote}
                      className="font-inter transition-all duration-300 hover:scale-105 hover:shadow-floating"
                    >
                      <Copy className="h-5 w-5" />
                      Copy Quote
                    </Button>
                    {user && (
                      <Button
                        variant="luxury"
                        size="lg"
                        onClick={handleSaveQuote}
                        className="font-inter transition-all duration-300 hover:scale-105 hover:shadow-floating"
                      >
                        <Save className="h-5 w-5" />
                        Save Quote
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-glass-border bg-gradient-card/60 backdrop-blur-xl relative">
        <div className="absolute inset-0 bg-gradient-accent/10"></div>
        <div className="container mx-auto px-4 py-12 text-center relative z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent w-32"></div>
            </div>
            <p className="text-base text-muted-foreground/80 font-inter font-light tracking-wide">
              Powered by AI • Transform your words into wisdom
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}