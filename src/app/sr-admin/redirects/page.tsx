
import { redirect } from 'next/navigation';

export default function RedirectsPage() {
  redirect('/sr-admin/settings?tab=redirects');
}
