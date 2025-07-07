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

export function QuoteGenerator() {
  const [inputText, setInputText] = useState("");
  const [generatedQuote, setGeneratedQuote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [additionalDirections, setAdditionalDirections] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { saveQuote } = useQuotes(user?.id);

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
          directions: additionalDirections.trim() || undefined
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedQuote(data.quote);
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
      await navigator.clipboard.writeText(`"${generatedQuote}"`);
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
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <Sparkles className="h-10 w-10 text-transparent bg-gradient-primary bg-clip-text" />
              <div className="absolute inset-0 h-10 w-10 bg-gradient-primary opacity-20 blur-xl"></div>
            </div>
            <h1 className="text-5xl md:text-7xl font-playfair font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
              Quote Scribe Reflect
            </h1>
          </div>
          <div className="space-y-4">
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-inter font-light">
              Transform any text or image into profound wisdom
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed font-inter">
              Share your thoughts, upload photos, or paste articles to discover deeper meanings through AI-generated reflections
            </p>
          </div>
        </div>

        {/* Input Section */}
        <Card className="mb-12 shadow-luxury border-glass bg-gradient-card backdrop-blur-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-luxury"></div>
          <CardContent className="p-8 relative z-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="input-text" className="text-base font-medium text-foreground font-inter">
                  Share your text
                </label>
                <Textarea
                  id="input-text"
                  placeholder="Share your thoughts, paste an article, or simply attach images to reflect upon..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[220px] resize-none text-base leading-relaxed bg-background/30 border-glass focus:border-white/30 focus:shadow-glow font-inter backdrop-blur-sm transition-luxury"
                  disabled={isLoading}
                />
              </div>
              
              <FileUpload
                onFilesChange={setAttachedFiles}
                files={attachedFiles}
                disabled={isLoading}
              />
              
              <div className="space-y-3">
                <label htmlFor="additional-directions" className="text-base font-medium text-foreground font-inter">
                  Additional directions (optional)
                </label>
                <Textarea
                  id="additional-directions"
                  placeholder="Provide specific instructions for the AI (e.g., 'Make it humorous', 'Focus on hope', 'Use a philosophical tone')..."
                  value={additionalDirections}
                  onChange={(e) => setAdditionalDirections(e.target.value)}
                  className="min-h-[100px] resize-none text-base leading-relaxed bg-background/30 border-glass focus:border-white/30 focus:shadow-glow font-inter backdrop-blur-sm transition-luxury"
                  disabled={isLoading}
                />
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
                      Reflecting...
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
          <Card className="shadow-elegant border-glass bg-gradient-card backdrop-blur-xl relative overflow-hidden group animate-fade-in">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-luxury"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-primary rounded-full"></div>
            <CardContent className="p-12 relative z-10">
              <div className="text-center space-y-8">
                <div className="relative inline-block">
                  <Quote className="h-12 w-12 text-transparent bg-gradient-primary bg-clip-text mx-auto" />
                  <div className="absolute inset-0 h-12 w-12 bg-gradient-primary opacity-20 blur-xl mx-auto"></div>
                </div>
                
                <blockquote className="text-2xl md:text-3xl font-playfair font-medium leading-relaxed text-foreground italic max-w-4xl mx-auto">
                  "{generatedQuote}"
                </blockquote>
                
                <div className="flex items-center justify-center">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent w-48"></div>
                </div>
                
                <div className="space-y-6">
                  <p className="text-base text-muted-foreground/80 font-inter font-light">
                    Generated reflection from your content
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="luxury"
                      size="sm"
                      onClick={handleCopyQuote}
                      className="font-inter transition-luxury hover:scale-105"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Quote
                    </Button>
                    {user && (
                      <Button
                        variant="luxury"
                        size="sm"
                        onClick={handleSaveQuote}
                        className="font-inter transition-luxury hover:scale-105"
                      >
                        <Save className="h-4 w-4" />
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
      <footer className="border-t border-glass bg-gradient-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground/80 font-inter font-light">
            Powered by AI • Transform your words into wisdom
          </p>
        </div>
      </footer>
    </div>
  );
}