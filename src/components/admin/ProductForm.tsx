

"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product, Category } from "@/lib/types";
import { getCategories } from "@/lib/data";
import { getTags } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2, Sparkles, AlertCircle, Bold, Italic, Underline, List, ListOrdered, Link2, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Pilcrow } from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { generateProductDescription } from "@/ai/flows/generate-product-description";
import { Switch } from "../ui/switch";
import { CldUploadWidget } from "next-cloudinary";

type ProductFormProps = {
  action: (formData: FormData) => void;
  product?: Product | null;
  buttonText: string;
  initialState: any;
};

const SeoScoreIndicator = ({ score, text }: { score: number; text: string;}) => {
  const getGradientColor = (score: number) => {
    if (score > 80) return 'from-green-500 to-green-400';
    if (score > 50) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 w-full">
        <div className="relative h-10 w-10 flex-shrink-0">
            <svg className="transform -rotate-90" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" strokeWidth="3" stroke="hsl(var(--border))" fill="transparent" />
            <circle
                cx="20" cy="20" r="18"
                stroke={`url(#gradient-${score > 80 ? 'green' : score > 50 ? 'yellow' : 'red'})`}
                fill="transparent"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <defs>
                <linearGradient id="gradient-green">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
                <linearGradient id="gradient-yellow">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
                <linearGradient id="gradient-red">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
            </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{score}</span>
        </div>
        <div className="flex-1">
            <p className="font-semibold text-sm">{text}</p>
        </div>
    </div>
  );
};


function SubmitButton({ text }: { text: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full md:w-auto">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? "Saving..." : text}
        </Button>
    );
}

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromState = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && value !== editor.innerHTML) {
      isUpdatingFromState.current = true;
      editor.innerHTML = value;
      // We need to restore cursor position after updating innerHTML
      const range = document.createRange();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const originalRange = sel.getRangeAt(0);
        const startContainer = originalRange.startContainer;
        const startOffset = originalRange.startOffset;
        
        try {
          // Check if the previous container is still in the editor
          if(editor.contains(startContainer)) {
             range.setStart(startContainer, startOffset);
             range.collapse(true);
             sel.removeAllRanges();
             sel.addRange(range);
          }
        } catch(e) {
            // fallback to end of content
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
      }
      setTimeout(() => {
         isUpdatingFromState.current = false;
      }, 0);
    }
  }, [value]);


  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!isUpdatingFromState.current) {
        onChange(e.currentTarget.innerHTML);
    }
  }, [onChange]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleFormatBlock = (tag: string) => {
    handleCommand('formatBlock', `<${tag}>`);
  };

  return (
    <div className="rounded-md border border-input w-full">
      <div className="flex items-center flex-wrap gap-1 p-2 border-b bg-muted/50">
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('bold')} title="Bold"><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('italic')} title="Italic"><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('underline')} title="Underline"><Underline className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={handleLink} title="Link"><Link2 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleFormatBlock('p')} title="Paragraph"><Pilcrow className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleFormatBlock('h1')} title="Heading 1"><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleFormatBlock('h2')} title="Heading 2"><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleFormatBlock('h3')} title="Heading 3"><Heading3 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('insertUnorderedList')} title="Bullet List"><List className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('insertOrderedList')} title="Numbered List"><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('justifyLeft')} title="Align Left"><AlignLeft className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('justifyCenter')} title="Align Center"><AlignCenter className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('justifyRight')} title="Align Right"><AlignRight className="h-4 w-4" /></Button>
      </div>
      <div
        id="description-editor"
        ref={editorRef}
        contentEditable
        className="prose dark:prose-invert max-w-full min-h-[150px] p-3 focus:outline-none w-full [&_p]:my-0"
        onInput={handleInput}
      />
      <Textarea name="description" value={value} className="hidden" readOnly />
    </div>
  );
};


export function ProductForm({ action, product, buttonText, initialState }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [description, setDescription] = useState(product?.description || '');
  const [name, setName] = useState(product?.name || '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [productId, setProductId] = useState(product?.id || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(product?.imageAlt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tagsInput, setTagsInput] = useState(product?.tags?.join(", ") || "");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTagSuggestions, setFilteredTagSuggestions] = useState<string[]>([]);
  
  const getAdvice = useCallback((score: number, type: 'title' | 'desc' | 'meta' | 'id' | 'url' | 'alt') => {
      let advice = [];
      if (type === 'title') {
          if (score < 50) advice.push("Too short. Aim for 50-70 characters.");
          else if (score < 100) advice.push("Length is okay, but could be longer.");
          else advice.push("Good length.");
      } else if (type === 'desc') {
          if (score < 50) advice.push("Too short. Aim for 500+ characters.");
          else advice.push("Good length.");
      } else if (type === 'meta') {
           if (score < 50) advice.push("Too short. Aim for 140-160 characters.");
           else if (score < 100) advice.push("Length is good.");
           else advice.push("Excellent length.");
      } else if (type === 'id') {
          if (!/^[a-zA-Z0-9-]+$/.test(productId)) advice.push("Use only letters, numbers, hyphens.");
          else advice.push("Good ID format.");
      } else if (type === 'url') {
          if (!imageUrl) advice.push("URL is required.");
          else if (!/^(https?:\/\/)/.test(imageUrl)) advice.push("Must be a valid http/https link.");
          else advice.push("URL format is valid.");
      } else if (type === 'alt') {
           if (!imageAlt) advice.push("Alt text is crucial for accessibility & SEO.");
           else if (imageAlt.length < 10) advice.push("Provide a more descriptive alt text.");
           else advice.push("Good, descriptive alt text.");
      }
      return advice.map((item, index) => <p key={index}>{item}</p>);
  }, [productId, imageUrl, imageAlt]);

  const [nameScore] = useMemo(() => {
      const len = name.length;
      let score = 0;
      if (len > 0 && len < 30) score = Math.round((len / 30) * 50);
      else if (len > 80) score = Math.max(0, 100 - (len - 80));
      else if (len >= 30 && len <= 80) score = 100 - Math.abs(len - 60) * 2;
      return [score];
  }, [name]);
  
  const [descriptionScore] = useMemo(() => {
    const textContent = description.replace(/<[^>]*>/g, '');
    const len = textContent.length;
    let score = 0;
    if (len > 0 && len < 300) score = Math.round((len / 300) * 50);
    else if (len > 1500) score = Math.max(20, 100 - ((len - 1500) / 20));
    else if (len >= 300) score = 100;
    return [score];
  }, [description]);
  
  const [shortDescriptionScore] = useMemo(() => {
    const len = shortDescription.length;
    let score = 0;
    if (len > 0 && len < 120) score = Math.round((len / 120) * 50);
    else if (len > 170) score = Math.max(20, 100 - (len - 170));
    else if (len >= 120) score = 100;
    return [score];
  }, [shortDescription]);

  const [idScore] = useMemo(() => {
      const len = productId.length;
      let score = 0;
      if (len === 0) score = 0;
      else if (!/^[a-zA-Z0-9-]+$/.test(productId)) score = 10;
      else if (len > 50) score = Math.max(20, 100 - (len - 50));
      else score = 100;
      return [score];
  }, [productId]);
  
  const [urlScore] = useMemo(() => {
    let score = 0;
    if (!imageUrl) score = 0;
    else if (!/^(https?:\/\/)/.test(imageUrl)) score = 10;
    else score = 100;
    return [score];
  }, [imageUrl]);
  
  const [altScore] = useMemo(() => {
    let score = 0;
    if (!imageAlt) score = 0;
    else if (imageAlt.length < 10) score = 50;
    else if (imageAlt.length > 125) score = Math.max(20, 100 - (imageAlt.length - 125));
    else score = 100;
    return [score];
  }, [imageAlt]);


  const state = initialState;
  
  const isCloudinaryEnabled = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    async function fetchData() {
        const [fetchedCategories, fetchedTags] = await Promise.all([
            getCategories(),
            getTags()
        ]);
        setCategories(fetchedCategories);
        setAllTags(fetchedTags);
    }
    fetchData();
  }, []);
  
  const handleTagsChange = (val: string) => {
    setTagsInput(val);
    const parts = val.split(",").map(s => s.trim()).filter(Boolean);
    const current = parts[parts.length - 1] || "";
    if (current.length === 0) {
      setFilteredTagSuggestions([]);
      return;
    }
    const existing = new Set(parts.map(p => p.toLowerCase()));
    const suggestions = allTags.filter(t => t.toLowerCase().includes(current.toLowerCase()) && !existing.has(t.toLowerCase()));
    setFilteredTagSuggestions(suggestions.slice(0, 8));
  };
  
  const applyTagSuggestion = (tag: string) => {
    const parts = tagsInput.split(",").map(s => s.trim()).filter(Boolean);
    const existing = new Set(parts.map(p => p.toLowerCase()));
    if (!existing.has(tag.toLowerCase())) {
      parts[parts.length - 1] = tag;
      const next = Array.from(new Set(parts.map(p => p.trim()))).join(", ");
      setTagsInput(next);
      setShowTagSuggestions(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!name) {
      alert("Please enter a product name first.");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({ productName: name });
      if (result.description) {
        setDescription(`<p>${result.description.replace(/\\n/g, '</p><p>')}</p>`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate description.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form action={action}>
        <Card>
            <CardHeader>
            <CardTitle className="font-headline text-2xl">
                {product ? "Edit Product" : "Create New Product"}
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

            <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 space-y-2 w-full">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" name="name" value={name} onChange={e => setName(e.target.value)} required />
                    {state?.errors?.name && <p className="text-destructive text-sm">{state.errors.name[0]}</p>}
                </div>
                <div className="flex-shrink-0 pt-0 sm:pt-8 w-full sm:w-auto">
                    <SeoScoreIndicator score={nameScore} text="Title Score" />
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">{getAdvice(nameScore, 'title')}</div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="description">Description</Label>
                      <Button type="button" size="sm" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4 text-accent"/>}
                          Generate with AI
                      </Button>
                  </div>
                  <RichTextEditor value={description} onChange={setDescription} />
                  {state?.errors?.description && <p className="text-destructive text-sm">{state.errors.description[0]}</p>}
              </div>
              <div className="flex-shrink-0 pt-0 sm:pt-8 w-full sm:w-auto">
                <SeoScoreIndicator score={descriptionScore} text="Desc. Score" />
                <div className="text-xs text-muted-foreground mt-2 space-y-1">{getAdvice(descriptionScore, 'desc')}</div>
              </div>
            </div>

             <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 space-y-2 w-full">
                    <Label htmlFor="shortDescription">Short Description (for SEO)</Label>
                    <Input id="shortDescription" name="shortDescription" value={shortDescription} onChange={e => setShortDescription(e.target.value)} />
                </div>
                <div className="flex-shrink-0 pt-0 sm:pt-8 w-full sm:w-auto">
                  <SeoScoreIndicator score={shortDescriptionScore} text="Meta Score" />
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">{getAdvice(shortDescriptionScore, 'meta')}</div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="id">Product ID (SKU)</Label>
                        <Input id="id" name="id" value={productId} onChange={e => setProductId(e.target.value)} disabled={!!product} required />
                        {state?.errors?.id && <p className="text-destructive text-sm">{state.errors.id[0]}</p>}
                    </div>
                     <div className="flex-shrink-0 pt-0 sm:pt-8 w-full sm:w-auto">
                        <SeoScoreIndicator score={idScore} text="ID/URL Score" />
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">{getAdvice(idScore, 'id')}</div>
                     </div>
                </div>
                
                <div className="space-y-2">
                    {/* Placeholder for alignment */}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="regularPrice">Regular Price</Label>
                    <Input id="regularPrice" name="regularPrice" type="number" step="0.01" defaultValue={product?.regularPrice ?? product?.price} required />
                    {state?.errors?.regularPrice && <p className="text-destructive text-sm">{state.errors.regularPrice[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="salePrice">Sale Price</Label>
                    <Input id="salePrice" name="salePrice" type="number" step="0.01" defaultValue={product?.salePrice ?? ''} />
                    {state?.errors?.salePrice && <p className="text-destructive text-sm">{state.errors.salePrice[0]}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="inventory">Inventory</Label>
                    <Input id="inventory" name="inventory" type="number" defaultValue={product?.inventory} required/>
                    {state?.errors?.inventory && <p className="text-destructive text-sm">{state.errors.inventory[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={product?.category} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    {state?.errors?.category && <p className="text-destructive text-sm">{state.errors.category[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subCategory">Sub Category</Label>
                    <Input id="subCategory" name="subCategory" defaultValue={product?.subCategory} />
                    <p className="text-xs text-muted-foreground">e.g., Pen Holders, Calendars</p>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-start w-full">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="imageUrl">Main Image URL</Label>
                        <div className="flex gap-2">
                            <Input id="imageUrl" name="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required/>
                            {isCloudinaryEnabled && (
                                <CldUploadWidget
                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                                    options={{ sources: ['local', 'url', 'unsplash'], multiple: false }}
                                    onSuccess={(result: any) => {
                                        const url = result?.info?.secure_url || '';
                                        if (url) setImageUrl(url);
                                    }}
                                >
                                    {({ open }) => (
                                    <Button type="button" variant="outline" onClick={() => open()}>
                                        Upload
                                    </Button>
                                    )}
                                </CldUploadWidget>
                            )}
                        </div>
                        {state?.errors?.imageUrl && <p className="text-destructive text-sm">{state.errors.imageUrl[0]}</p>}
                    </div>
                     <div className="flex-shrink-0 pt-0 sm:pt-8 w-full sm:w-auto">
                        <SeoScoreIndicator score={urlScore} text="URL Score" />
                         <div className="text-xs text-muted-foreground mt-2 space-y-1">{getAdvice(urlScore, 'url')}</div>
                     </div>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-start w-full">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="imageAlt">Image Alt (accessibility)</Label>
                        <Input id="imageAlt" name="imageAlt" value={imageAlt} onChange={e => setImageAlt(e.target.value)} />
                    </div>
                    <div className="flex-shrink-0 pt-0 sm:pt-8 w-full sm:w-auto">
                        <SeoScoreIndicator score={altScore} text="Alt Text Score" />
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">{getAdvice(altScore, 'alt')}</div>
                     </div>
                </div>


                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="galleryImages">Gallery Images (comma-separated URLs)</Label>
                    <Textarea id="galleryImages" name="galleryImages" defaultValue={product?.galleryImages?.join(", ")} />
                    <p className="text-xs text-muted-foreground">Paste multiple image URLs, separated by a comma.</p>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="features">Features (comma-separated)</Label>
                    <Textarea id="features" name="features" defaultValue={product?.features.join(", ")} />
                    {state?.errors?.features && <p className="text-destructive text-sm">{state.errors.features[0]}</p>}
                    <p className="text-xs text-muted-foreground">e.g., "Rich in fiber, Gluten-free, Boosts immunity"</p>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <div className="relative">
                          <Input
                            id="tags"
                            name="tags"
                            value={tagsInput}
                            onFocus={() => setShowTagSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 100)}
                            onChange={e => handleTagsChange(e.target.value)}
                          />
                          {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full border rounded-md bg-background shadow">
                              {filteredTagSuggestions.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-muted"
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => applyTagSuggestion(s)}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">e.g., Best Seller, {allTags.join(', ')}</p>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <h3 className="text-lg font-medium font-headline border-t pt-6 mt-4">Specifications</h3>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="weightGrams">Weight (grams)</Label>
                    <Input id="weightGrams" name="weightGrams" type="number" step="1" defaultValue={product?.weightGrams} />
                    <p className="text-xs text-muted-foreground">Enter numeric grams, e.g., 250</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                    <Label htmlFor="lengthCm">Length (cm)</Label>
                    <Input id="lengthCm" name="lengthCm" type="number" step="0.1" defaultValue={product?.dimensionsCm?.length} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="widthCm">Width (cm)</Label>
                    <Input id="widthCm" name="widthCm" type="number" step="0.1" defaultValue={product?.dimensionsCm?.width} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="heightCm">Height (cm)</Label>
                    <Input id="heightCm" name="heightCm" type="number" step="0.1" defaultValue={product?.dimensionsCm?.height} />
                    </div>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="videoUrl">Product Video URL (optional)</Label>
                    <Input id="videoUrl" name="videoUrl" defaultValue={product?.videoUrl} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="imageHint">Main Image Hint</Label>
                    <Input id="imageHint" name="imageHint" defaultValue={product?.imageHint} />
                    <p className="text-xs text-muted-foreground">e.g., "foxtail millet"</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="imageAttribution">Image Attribution / License</Label>
                    <Input id="imageAttribution" name="imageAttribution" defaultValue={product?.imageAttribution} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input id="material" name="material" defaultValue={product?.material} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" defaultValue={product?.color} />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="badge">Badge</Label>
                    <Select name="badge" defaultValue={product?.badge}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select badge" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Best Seller">Best Seller</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Limited">Limited</SelectItem>
                    </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Displayed on product cards.</p>
                </div>
                
                <div className="md:col-span-2 flex items-center space-x-2 pt-4">
                    <Switch id="allowImageUpload" name="allowImageUpload" defaultChecked={product?.allowImageUpload} />
                    <Label htmlFor="allowImageUpload">Allow customer image uploads for this product</Label>
                </div>
            </div>
            
            <div className="flex justify-end mt-4">
                <SubmitButton text={buttonText} />
            </div>
            </CardContent>
        </Card>
    </form>
  );
}
