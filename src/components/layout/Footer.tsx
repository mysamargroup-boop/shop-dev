
import { getSiteSettings } from '@/lib/actions';
import { getCategories } from '@/lib/data-async';
import { FooterContent } from './FooterContent';

const Footer = async () => {
  const settings = await getSiteSettings();
  const allCategories = await getCategories();

  return <FooterContent settings={settings} allCategories={allCategories} />;
};

export default Footer;
