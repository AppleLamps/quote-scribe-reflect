import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, ImageIcon, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { FileUpload, UploadedFile } from "@/components/FileUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const IMAGE_MODELS = [
  { value: 'google/gemini-3.1-flash-image-preview', label: 'Nano Banana 2', description: 'Fast & high quality' },
  { value: 'google/gemini-3-pro-image-preview', label: 'Nano Banana Pro', description: 'Best quality (slower)' },
  { value: 'google/gemini-2.5-flash-image', label: 'Nano Banana', description: 'Fast generation' },
];

const STEP_MESSAGES = [
  { text: "Crafting the perfect prompt...", duration: 6000 },
  { text: "Generating your image...", duration: 0 },
];

export function ImageGenerator() {
  const [inputText, setInputText] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [additionalDirections, setAdditionalDirections] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-3.1-flash-image-preview");
  const { toast } = useToast();
  const { user } = useAuth();

  // Animate progress bar during loading
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setLoadingStep(0);
      return;
    }

    // Move to step 2 after ~6s
    const stepTimer = setTimeout(() => {
      setLoadingStep(1);
    }, STEP_MESSAGES[0].duration);

    // Smooth progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev; // cap at 92 until done
        return prev + (prev < 40 ? 2 : prev < 70 ? 1 : 0.3);
      });
    }, 300);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(interval);
    };
  }, [isLoading]);

  const generateImage = async () => {
    if (!inputText.trim() && attachedFiles.length === 0) {
      toast({
        title: "Input Required",
        description: "Please enter some text or attach files to generate an image from.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          text: inputText.trim(),
          files: attachedFiles.length > 0 ? attachedFiles : undefined,
          directions: additionalDirections.trim() || undefined,
          model: selectedModel,
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setProgress(100);
      setGeneratedImage(data.imageUrl);
      setImageDescription(data.description || "");
      toast({
        title: "Image Generated",
        description: "Your visual representation has been created!",
      });
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setInputText("");
    setGeneratedImage("");
    setImageDescription("");
    setAttachedFiles([]);
    setAdditionalDirections("");
    setSelectedModel("google/gemini-3.1-flash-image-preview");
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `lampscribe-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Image Downloaded",
      description: "The image has been saved to your device.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <Card variant="floating" className="mb-12 overflow-hidden relative group animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
          <CardContent className="p-10 relative z-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label htmlFor="input-text" className="text-lg font-semibold text-foreground font-inter tracking-wide">
                  Describe what to visualize
                </label>
                <Textarea
                  id="input-text"
                  variant="glass"
                  placeholder="Share your thoughts, paste text, or attach images — AI will create a visual representation..."
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
                  Artistic direction
                  <span className="text-sm font-normal text-muted-foreground ml-2">(optional)</span>
                </label>
                <Textarea
                  id="additional-directions"
                  variant="glass"
                  placeholder="Style guidance (e.g., 'Oil painting style', 'Minimalist', 'Dark and moody', 'Vibrant watercolor')..."
                  value={additionalDirections}
                  onChange={(e) => setAdditionalDirections(e.target.value)}
                  className="min-h-[100px] text-base leading-relaxed font-inter"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-4">
                <label className="text-lg font-semibold text-foreground font-inter tracking-wide">
                  Image Model
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
                  <SelectTrigger className="bg-card/50 border-border/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((m) => (
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
                  onClick={generateImage}
                  disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
                  className="min-w-[160px] h-12 text-base font-inter"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Image
                    </>
                  )}
                </Button>

                {(inputText || generatedImage || attachedFiles.length > 0 || additionalDirections) && (
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

        {/* Loading Progress Section */}
        {isLoading && (
          <Card variant="premium" className="relative overflow-hidden mb-12 animate-fade-in-up">
            <CardContent className="p-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <div className="absolute inset-0 h-8 w-8 bg-primary/20 blur-lg"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground font-inter animate-pulse">
                      {STEP_MESSAGES[loadingStep].text}
                    </p>
                    <p className="text-sm text-muted-foreground font-inter mt-1">
                      Step {loadingStep + 1} of 2
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                {/* Shimmer placeholder for the image */}
                <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-[300px] md:h-[400px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Image Section */}
        {generatedImage && !isLoading && (
          <Card variant="premium" className="relative overflow-hidden group animate-slide-in-from-bottom">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-all duration-700"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-primary rounded-full shadow-glow"></div>
            <CardContent className="p-10 relative z-10">
              <div className="text-center space-y-8">
                <div className="relative inline-block animate-glow-pulse">
                  <ImageIcon className="h-12 w-12 text-transparent bg-gradient-primary bg-clip-text mx-auto" />
                  <div className="absolute inset-0 h-12 w-12 bg-gradient-primary opacity-20 blur-xl mx-auto"></div>
                </div>

                <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-floating">
                  <img
                    src={generatedImage}
                    alt={imageDescription || "AI generated image"}
                    className="w-full h-auto"
                  />
                </div>

                {imageDescription && (
                  <p className="text-base text-muted-foreground/80 font-inter font-light tracking-wide max-w-2xl mx-auto">
                    {imageDescription}
                  </p>
                )}

                <div className="flex items-center justify-center">
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent w-64"></div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    variant="luxury"
                    size="lg"
                    onClick={handleDownload}
                    className="font-inter transition-all duration-300 hover:scale-105 hover:shadow-floating"
                  >
                    <Download className="h-5 w-5" />
                    Download Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <footer className="border-t border-glass-border bg-gradient-card/60 backdrop-blur-xl relative">
        <div className="absolute inset-0 bg-gradient-accent/10"></div>
        <div className="container mx-auto px-4 py-12 text-center relative z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent w-32"></div>
            </div>
            <p className="text-base text-muted-foreground/80 font-inter font-light tracking-wide">
              Powered by AI • Transform your words into imagery
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
