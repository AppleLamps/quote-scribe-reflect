import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const { toast } = useToast();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  const handleSave = () => {
    setSettings(localSettings);
    toast({
      title: 'Settings Saved',
      description: 'Your new settings have been applied.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Override Settings</DialogTitle>
          <DialogDescription>
            Customize the AI model and system prompts for both generators.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">Image Generator</TabsTrigger>
            <TabsTrigger value="quote">Quote Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="image">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="image-model-name">Model Name</Label>
                <Input
                  id="image-model-name"
                  value={localSettings.image.model}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      image: { ...localSettings.image, model: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image-system-prompt">System Prompt</Label>
                <Textarea
                  id="image-system-prompt"
                  value={localSettings.image.systemPrompt}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      image: { ...localSettings.image, systemPrompt: e.target.value },
                    })
                  }
                  className="min-h-[250px]"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quote">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="quote-model-name">Model Name</Label>
                <Input
                  id="quote-model-name"
                  value={localSettings.quote.model}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      quote: { ...localSettings.quote, model: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quote-system-prompt">System Prompt</Label>
                <Textarea
                  id="quote-system-prompt"
                  value={localSettings.quote.systemPrompt}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      quote: { ...localSettings.quote, systemPrompt: e.target.value },
                    })
                  }
                  className="min-h-[250px]"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
