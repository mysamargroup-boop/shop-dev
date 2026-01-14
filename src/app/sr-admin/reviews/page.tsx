
"use client";

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { getReviewsAdmin, updateReviewStatus, deleteReview } from '@/lib/actions';
import type { Review } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function ReviewActions({ review }: { review: Review }) {
  const { toast } = useToast();

  const handleUpdate = async (isVerified: boolean) => {
    const result = await updateReviewStatus(review.id, isVerified);
    if (result.success) {
      toast({ title: 'Success', description: 'Review status updated.' });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this review?')) {
      const result = await deleteReview(review.id);
      if (result.success) {
        toast({ title: 'Success', description: 'Review deleted.' });
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={review.is_verified}
        onCheckedChange={(checked) => handleUpdate(checked)}
        aria-label="Toggle verification"
      />
      <Button variant="ghost" size="icon" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function fetchReviews() {
      const fetchedReviews = await getReviewsAdmin();
      setReviews(fetchedReviews);
    }
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Management</CardTitle>
          <CardDescription>Approve or delete customer reviews.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No reviews found.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-mono text-xs">{review.product_id}</TableCell>
                      <TableCell>{review.author_name}</TableCell>
                      <TableCell>{review.rating}/5</TableCell>
                      <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                      <TableCell className="text-right">
                        <ReviewActions review={review} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
