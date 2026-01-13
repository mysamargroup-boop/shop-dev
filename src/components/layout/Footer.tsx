'use client';

import { getSiteSettings } from '@/lib/actions';
import { getCategories } from '@/lib/data-async';
import { FooterContent } from './FooterContent';
import { useEffect, useState } from 'react';
import type { SiteSettings, Category } from '@/lib/types';

const Footer = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [s, c] = await Promise.all([getSiteSettings(), getCategories()]);
            setSettings(s);
            setAllCategories(c);
        } catch (error) {
            console.error("Failed to fetch footer data", error);
        }
    };
    fetchData();
  }, []);

  if (!settings) return null;

  return <FooterContent settings={settings} allCategories={allCategories} />;
};

export default Footer;
