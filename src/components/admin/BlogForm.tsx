"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BlogPost } from "@/lib/types";
import { Loader2, Bold, Italic, Underline, Link2, Heading1, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Pilcrow } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SiteImage } from '@/lib/types';

type BlogFormProps = {
  action: (formData: FormData) => void;
  post?: BlogPost | null;
  buttonText: string;
  initialState: any;
  siteImages: SiteImage[];
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

export function BlogForm({ action, post, buttonText, initialState, siteImages }: BlogFormProps) {
  const state = initialState;
  const imageKeys = siteImages.map(img => img.id);
  const [title, setTitle] = useState(post?.title || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [imageKey, setImageKey] = useState(post?.imageKey || '');
  const [imageUrl, setImageUrl] = useState(post?.imageUrl || '');

  const SeoScoreIndicator = ({ score, text }: { score: number; text: string;}) => {
    const circumference = 2 * Math.PI * 18;
    const offset = circumference - (score / 100) * circumference;
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 w-full">
        <div className="relative h-10 w-10 flex-shrink-0">
          <svg className="transform -rotate-90" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" strokeWidth="3" stroke="hsl(var(--border))" fill="transparent" />
            <circle
              cx="20" cy="20" r="18"
              stroke="hsl(var(--primary))"
              fill="transparent"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{score}</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{text}</p>
        </div>
      </div>
    );
  };

  const [titleScore] = useMemo(() => {
    const len = title.length;
    let score = 0;
    if (len > 0 && len < 30) score = Math.round((len / 30) * 50);
    else if (len > 80) score = Math.max(20, 100 - (len - 80));
    else if (len >= 30 && len <= 80) score = 100 - Math.abs(len - 60) * 2;
    return [score];
  }, [title]);

  const [excerptScore] = useMemo(() => {
    const len = excerpt.length;
    let score = 0;
    if (len > 0 && len < 120) score = Math.round((len / 120) * 50);
    else if (len > 170) score = Math.max(20, 100 - (len - 170));
    else if (len >= 120) score = 100;
    return [score];
  }, [excerpt]);

  const [contentScore] = useMemo(() => {
    const textContent = content.replace(/<[^>]*>/g, '');
    const len = textContent.length;
    let score = 0;
    if (len > 0 && len < 300) score = Math.round((len / 300) * 50);
    else if (len > 1500) score = Math.max(20, 100 - ((len - 1500) / 20));
    else if (len >= 300) score = 100;
    return [score];
  }, [content]);

  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromState = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && content !== editor.innerHTML) {
      isUpdatingFromState.current = true;
      editor.innerHTML = content;
      const range = document.createRange();
      const sel = window.getSelection();
      if (sel) {
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setTimeout(() => {
        isUpdatingFromState.current = false;
      }, 0);
    }
  }, [content]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!isUpdatingFromState.current) {
      setContent(e.currentTarget.innerHTML);
    }
  }, []);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const handleLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      handleCommand('createLink', url);
    }
  };

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            {post ? "Edit Blog Post" : "Create New Blog Post"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <Label htmlFor="title">Post Title</Label>
            <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <div className="pt-2">
              <SeoScoreIndicator score={titleScore} text="Title Score" />
            </div>
             {state?.errors?.title && <p className="text-destructive text-sm">{state.errors.title[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Post Slug</Label>
            <Input id="slug" name="slug" defaultValue={post?.slug} disabled={!!post} required />
            <p className="text-xs text-muted-foreground">e.g., "my-awesome-post". Cannot be changed later.</p>
            {state?.errors?.slug && <p className="text-destructive text-sm">{state.errors.slug[0]}</p>}
          </div>

           <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input id="author" name="author" defaultValue={post?.author ?? "Woody Business"} required />
             {state?.errors?.author && <p className="text-destructive text-sm">{state.errors.author[0]}</p>}
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={post?.date ? new Date(post.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
             {state?.errors?.date && <p className="text-destructive text-sm">{state.errors.date[0]}</p>}
          </div>

           <div className="md:col-span-2 space-y-2">
            <Label htmlFor="imageKey">Image Key</Label>
            <select
                id="imageKey"
                name="imageKey"
                value={imageKey}
                onChange={(e) => setImageKey(e.target.value)}
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="" disabled>Select an image key</option>
                {siteImages.map(img => (
                    <option key={img.id} value={img.id}>{img.id} ({img.description})</option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground">Select an ID from Site Images (Admin → Site Images).</p>
            {state?.errors?.imageKey && <p className="text-destructive text-sm">{state.errors.imageKey[0]}</p>}
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional override)</Label>
            <Input id="imageUrl" name="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} required/>
            <p className="text-xs text-muted-foreground">A short summary of the post for blog listings.</p>
            {state?.errors?.excerpt && <p className="text-destructive text-sm">{state.errors.excerpt[0]}</p>}
            <div className="pt-2">
              <SeoScoreIndicator score={excerptScore} text="Meta Score" />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="content">Content</Label>
            <div className="rounded-md border border-input w-full">
              <div className="flex items-center flex-wrap gap-1 p-2 border-b bg-muted/50">
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('bold')} title="Bold"><Bold className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('italic')} title="Italic"><Italic className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('underline')} title="Underline"><Underline className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={handleLink} title="Link"><Link2 className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('insertUnorderedList')} title="Bullet List"><List className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('insertOrderedList')} title="Numbered List"><ListOrdered className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('justifyLeft')} title="Align Left"><AlignLeft className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('justifyCenter')} title="Align Center"><AlignCenter className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('justifyRight')} title="Align Right"><AlignRight className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('formatBlock', '<p>')} title="Paragraph"><Pilcrow className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('formatBlock', '<h1>')} title="H1"><Heading1 className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('formatBlock', '<h2>')} title="H2"><Heading2 className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => handleCommand('formatBlock', '<h3>')} title="H3"><Heading3 className="h-4 w-4" /></Button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="prose dark:prose-invert max-w-full min-h-[150px] p-3 focus:outline-none w-full [&_p]:my-0"
                onInput={handleInput}
              />
              <Textarea id="content" name="content" value={content} className="hidden" readOnly />
            </div>
            <p className="text-xs text-muted-foreground">Use toolbar to format your content.</p>
            {state?.errors?.content && <p className="text-destructive text-sm">{state.errors.content[0]}</p>}
            <div className="pt-2">
              <SeoScoreIndicator score={contentScore} text="Content Score" />
            </div>
          </div>
          
          <div className="md:col-span-2 flex justify-end mt-4">
            <SubmitButton text={buttonText} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}