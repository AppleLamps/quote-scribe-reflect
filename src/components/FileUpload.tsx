import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, File, FileImage, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  disabled?: boolean;
}

export function FileUpload({ onFilesChange, files, disabled }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || !user) return;

    setIsUploading(true);
    const uploadPromises: Promise<UploadedFile | null>[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        continue;
      }

      const fileId = `${user.id}/${Date.now()}-${file.name}`;
      
      uploadPromises.push(
        supabase.storage
          .from('quote-attachments')
          .upload(fileId, file)
          .then(({ data, error }) => {
            if (error) {
              toast({
                title: "Upload failed",
                description: `Failed to upload ${file.name}`,
                variant: "destructive",
              });
              return null;
            }
            
            const { data: { publicUrl } } = supabase.storage
              .from('quote-attachments')
              .getPublicUrl(data.path);

            return {
              id: data.path,
              name: file.name,
              url: publicUrl,
              type: file.type,
              size: file.size,
            };
          })
      );
    }

    try {
      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((result): result is UploadedFile => result !== null);
      
      if (successfulUploads.length > 0) {
        onFilesChange([...files, ...successfulUploads]);
        toast({
          title: "Files uploaded",
          description: `${successfulUploads.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload error",
        description: "An error occurred while uploading files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = async (fileToRemove: UploadedFile) => {
    try {
      // Remove from storage
      await supabase.storage
        .from('quote-attachments')
        .remove([fileToRemove.id]);

      // Update local state
      onFilesChange(files.filter(file => file.id !== fileToRemove.id));
      
      toast({
        title: "File removed",
        description: `${fileToRemove.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <FileImage className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="font-inter"
        >
          <Paperclip className="h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Attach Files'}
        </Button>
        <span className="text-sm text-muted-foreground font-inter">
          Images, documents, max 10MB each
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-background/30 border border-glass rounded-lg backdrop-blur-sm"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-inter truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground font-inter">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file)}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}