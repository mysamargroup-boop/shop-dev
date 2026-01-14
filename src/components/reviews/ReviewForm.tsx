
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createReview } from '@/lib/data-supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  author_name: z.string().min(2, 'Name is required').max(50),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const StarRating = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-8 w-8 cursor-pointer transition-colors ${
            star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
          }`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};

export default function ReviewForm({ productId, onReviewSubmit }: { productId: string, onReviewSubmit: () => void }) {
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      author_name: '',
      comment: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit: SubmitHandler<ReviewFormValues> = async (data) => {
    try {
      const newReview = await createReview({
        ...data,
        product_id: productId,
        is_verified: false,
      });

      if (newReview) {
        toast({
          title: 'Review Submitted',
          description: 'Thank you! Your review is pending approval.',
        });
        form.reset();
        onReviewSubmit();
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your review. Please try again.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your thoughts about this product.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Rating</FormLabel>
                  <FormControl>
                    <StarRating rating={field.value} setRating={(value) => field.onChange(value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us what you think..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
