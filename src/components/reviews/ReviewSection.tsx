
'use client';

import { useState, useEffect } from 'react';
import type { Review } from '@/lib/types';
import { getReviewsByProductId } from '@/lib/data-supabase';
import ReviewForm from './ReviewForm';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Rating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5 text-yellow-500">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`} />
    ))}
  </div>
);

export default function ReviewSection({ productId, initialReviews }: { productId: string; initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = async () => {
    const fetchedReviews = await getReviewsByProductId(productId);
    setReviews(fetchedReviews);
  };
  
  const handleReviewSubmit = () => {
      fetchReviews();
      setShowForm(false);
  }

  return (
    <section className="my-16 border-t pt-12">
        <div className="text-center">
            <h2 className="text-3xl font-headline font-bold mb-4">Customer Reviews</h2>
            {reviews.length > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4">
                <Rating rating={reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length} />
                <p className="text-muted-foreground">Based on {reviews.length} reviews</p>
                </div>
            )}
            <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel Review' : 'Write a Review'}
            </Button>
        </div>
        
        <div className="max-w-2xl mx-auto">
            {showForm && (
                <div className='mt-8'>
                    <ReviewForm productId={productId} onReviewSubmit={handleReviewSubmit} />
                </div>
            )}

            <div className="space-y-6 mt-8">
                {reviews.length === 0 && !showForm ? (
                    <p className="text-muted-foreground text-center">Be the first to review this product!</p>
                ) : (
                    reviews.map((review, index) => (
                        <div key={review.id}>
                            <div className="flex items-center mb-2">
                                <p className="font-semibold">{review.author_name}</p>
                                <Separator orientation="vertical" className="h-4 mx-2" />
                                <Rating rating={review.rating} />
                            </div>
                            <p className="text-muted-foreground">{review.comment}</p>
                            <p className="text-xs text-muted-foreground/70 mt-2">
                                {new Date(review.created_at).toLocaleDateString()}
                            </p>
                            {index < reviews.length - 1 && <Separator className="mt-6"/>}
                        </div>
                    ))
                )}
            </div>
        </div>
    </section>
  );
}
