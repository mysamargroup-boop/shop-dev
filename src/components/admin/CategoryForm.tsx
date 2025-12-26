
"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";
import { Loader2 } from "lucide-react";

type CategoryFormProps = {
  action: (formData: FormData) => void;
  category?: Category | null;
  buttonText: string;
  initialState: any;
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

export function CategoryForm({ action, category, buttonText, initialState }: CategoryFormProps) {
  const state = initialState;

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            {category ? "Edit Category" : "Create New Category"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" name="name" defaultValue={category?.name} required />
             {state?.errors?.name && <p className="text-destructive text-sm">{state.errors.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">Category ID (Slug)</Label>
            <Input id="id" name="id" defaultValue={category?.id} disabled={!!category} required />
            <p className="text-xs text-muted-foreground">e.g., "desk-accessories". Cannot be changed later.</p>
            {state?.errors?.id && <p className="text-destructive text-sm">{state.errors.id[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" name="imageUrl" defaultValue={category?.imageUrl} required />
            {state?.errors?.imageUrl && <p className="text-destructive text-sm">{state.errors.imageUrl[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageHint">Image Hint</Label>
            <Input id="imageHint" name="imageHint" defaultValue={category?.imageHint} required />
            <p className="text-xs text-muted-foreground">e.g., "desk accessories". Two words max.</p>
            {state?.errors?.imageHint && <p className="text-destructive text-sm">{state.errors.imageHint[0]}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="linkUrl">Link URL (optional)</Label>
            <Input id="linkUrl" name="linkUrl" defaultValue={category?.linkUrl} placeholder="https://..." />
            {state?.errors?.linkUrl && <p className="text-destructive text-sm">{state.errors.linkUrl[0]}</p>}
          </div>
          
          <div className="flex justify-end mt-4">
            <SubmitButton text={buttonText} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
