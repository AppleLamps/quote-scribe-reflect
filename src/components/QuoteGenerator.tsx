import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Quote } from "lucide-react";

export function QuoteGenerator() {
  const [inputText, setInputText] = useState("");
  const [generatedQuote, setGeneratedQuote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateQuote = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to generate a quote from.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { text: inputText.trim() }
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
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Quote Scribe Reflect
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform any text into profound wisdom. Paste your article, thoughts, or stories, 
            and discover the deeper meanings within through AI-generated reflections.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="input-text" className="text-sm font-medium text-foreground">
                  Share your text
                </label>
                <Textarea
                  id="input-text"
                  placeholder="Paste your article, thoughts, journal entry, or any text you'd like to reflect upon..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] resize-none text-base leading-relaxed bg-background/50 border-border/50 focus:border-primary/50"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={generateQuote}
                  disabled={isLoading || !inputText.trim()}
                  className="min-w-[140px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reflecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Quote
                    </>
                  )}
                </Button>
                
                {(inputText || generatedQuote) && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={clearAll}
                    disabled={isLoading}
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
          <Card className="shadow-glow border-primary/20 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <Quote className="h-8 w-8 text-primary mx-auto opacity-60" />
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed text-foreground italic">
                  "{generatedQuote}"
                </blockquote>
                <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent w-24 mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  Generated reflection from your text
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by AI • Transform your words into wisdom
          </p>
        </div>
      </footer>
    </div>
  );
}