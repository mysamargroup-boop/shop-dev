'use client';
import { useEffect, useState } from 'react';
import { getTags } from '@/lib/data';
import { addTag, deleteTag } from '@/lib/actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export default function TagsAdminPage() {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    (async () => {
      const list = await getTags();
      setTags(list);
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-center flex-1">Product Tags</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Tag</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <form action={async (formData: FormData) => { await addTag(undefined, formData); }} className="flex gap-2 w-full max-w-md">
            <Input name="name" placeholder="Enter tag name" value={newTag} onChange={e => setNewTag(e.target.value)} />
            <Button type="submit" disabled={!newTag.trim()}>Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map(tag => (
              <TableRow key={tag}>
                <TableCell className="font-medium">{tag}</TableCell>
                <TableCell className="text-right">
                  <form action={async (formData: FormData) => { await deleteTag(undefined, formData); }}>
                    <input type="hidden" name="name" value={tag} />
                    <Button type="submit" variant="destructive" size="sm">Delete</Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
