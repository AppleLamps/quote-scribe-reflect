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
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Override Settings</DialogTitle>
          <DialogDescription>
            Here you can override the default system instructions and AI model.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="model-name">Model Name</Label>
            <Input
              id="model-name"
              value={localSettings.model}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, model: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={localSettings.systemPrompt}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  systemPrompt: e.target.value,
                })
              }
              className="min-h-[250px]"
            />
          </div>
        </div>
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
