'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';

interface ImageUploadHandlerProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

export default function ImageUploadHandler({ onImagesChange, maxImages = 3 }: ImageUploadHandlerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  useEffect(() => {
    onImagesChange(selectedFiles);
  }, [selectedFiles, onImagesChange]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newFiles = [...selectedFiles, ...files].slice(0, maxImages);
      setSelectedFiles(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const uploadImages = async (orderItemId: string) => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    const uploadPromises = selectedFiles.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('orderItemId', orderItemId);

        const response = await fetch('/api/customer-uploads', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        return data.fileUrl;
      } catch (error) {
        console.error('Upload error:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    setUploading(false);
    
    return results.filter(url => url !== null) as string[];
  };

  return {
    selectedFiles,
    uploading,
    uploadedUrls,
    uploadImages,
    render: (
      <div className="my-6 p-4 border-dashed border-2 rounded-lg text-center">
        <h3 className="font-semibold mb-3 text-lg">Personalize with Your Photos</h3>
        <p className="text-muted-foreground text-sm mb-4">Upload up to {maxImages} images for customization.</p>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="rounded-md object-cover w-full h-full"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
            disabled={selectedFiles.length >= maxImages || uploading}
          />
          <label htmlFor="image-upload">
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={selectedFiles.length >= maxImages || uploading}
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Choose Images'}
              </span>
            </Button>
          </label>
        </div>
      </div>
    )
  };
}
