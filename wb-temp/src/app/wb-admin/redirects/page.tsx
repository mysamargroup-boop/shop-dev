
import { redirect } from 'next/navigation';

export default function RedirectsPage() {
  redirect('/wb-admin/settings?tab=redirects');
}
