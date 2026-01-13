
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createSample, updateSample, deleteSample } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import type { Sample, Product, Category } from '@/lib/types';
import { Trash2, Loader2, Edit, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';
import { getProducts, getCategories } from '@/lib/data-async';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const initialState = {
  errors: {},
  success: false,
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
      {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Sample' : 'Create Sample')}
    </Button>
  );
}

export default function SamplesForm({ samples }: { samples: Sample[] }) {
  const [createState, createFormAction] = useFormState(createSample, initialState);
  const [updateState, updateFormAction] = useFormState(updateSample, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [productName, setProductName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);


  const state = isEditing ? updateState : createState;
  
  useEffect(() => {
    async function fetchData() {
        const [products, categories] = await Promise.all([getProducts(), getCategories()]);
        setAllProducts(products);
        setAllCategories(categories);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: `Sample ${isEditing ? 'updated' : 'created'} successfully.` });
      handleCancelEdit();
    } else if (state?.errors && Object.keys(state.errors).length > 0) {
        toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [createState, updateState, isEditing, toast, state]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sample?')) {
        const result = await deleteSample(id);
        if (result.success) {
            toast({ title: "Success", description: "Sample deleted." });
        } else {
            toast({ title: "Error", description: "Failed to delete sample.", variant: "destructive" });
        }
    }
  };

  const handleEdit = (sample: Sample) => {
      setIsEditing(sample.id);
      setProductName(sample.productName);
      setCustomerName(sample.customerName);
      setCategory(sample.category);
      setImageUrl(sample.imageUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setIsEditing(null);
    setProductName('');
    setCustomerName('');
    setCategory('');
    setImageUrl('');
    formRef.current?.reset();
  }

  const action = isEditing ? updateFormAction : createFormAction;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? `Editing Sample: ${isEditing}`: 'Add New Sample'}</CardTitle>
          <CardDescription>{isEditing ? 'Update the details for this sample.' : 'Add a new image to the customer gallery.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={action} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <input type="hidden" name="id" value={isEditing || ''} />
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name</Label>
               <Select name="productName" value={productName} onValueChange={setProductName} required>
                <SelectTrigger id="productName">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors?.productName && <p className="text-destructive text-sm">{state.errors.productName[0]}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input id="customerName" name="customerName" placeholder="e.g., Anjali S." required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
               {state?.errors?.customerName && <p className="text-destructive text-sm">{state.errors.customerName[0]}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
                <Select name="category" value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {allCategories.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
               {state?.errors?.category && <p className="text-destructive text-sm">{state.errors.category[0]}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              {state?.errors?.imageUrl && <p className="text-destructive text-sm">{state.errors.imageUrl[0]}</p>}
            </div>
            <div className="flex gap-2 md:col-span-2 justify-end">
              {isEditing && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
              <SubmitButton isEditing={!!isEditing} />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Samples</CardTitle>
          <CardDescription>Manage the samples currently in your gallery.</CardDescription>
        </CardHeader>
        <CardContent>
          {samples.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No samples found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {samples.map((sample) => (
                <Card key={sample.id} className="flex flex-col">
                   <CardHeader className="flex-row gap-4 items-center">
                     <Image src={sample.imageUrl} alt={sample.productName} width={64} height={64} className="rounded-md object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                     <div>
                       <CardTitle className="text-base">{sample.productName}</CardTitle>
                       <CardDescription>{sample.customerName} | {sample.category}</CardDescription>
                     </div>
                   </CardHeader>
                   <CardFooter className="flex justify-end gap-2 mt-auto">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sample)} title="Edit">
                          <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sample.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                   </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
