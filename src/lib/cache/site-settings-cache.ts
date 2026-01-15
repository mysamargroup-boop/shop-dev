'use client';

import { useState, useEffect } from 'react';
import { getCachedSiteSettings as getRedisSettings, setCachedSiteSettings as setRedisSettings } from '../redis';

// Fallback cache for site settings when Redis is not available
let fallbackSettings: any = null;
let fallbackTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedSiteSettings(): Promise<any> {
  try {
    // Try Redis first
    const redisData = await getRedisSettings();
    if (redisData) {
      return redisData;
    }
  } catch (error) {
    console.log('Redis not available, using fallback cache');
  }
  
  // Fallback to memory cache
  const now = Date.now();
  if (fallbackSettings && (now - fallbackTimestamp) < CACHE_DURATION) {
    return fallbackSettings;
  }
  
  try {
    const response = await fetch('/api/site-settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    
    const data = await response.json();
    
    // Update fallback cache
    fallbackSettings = data;
    fallbackTimestamp = now;
    
    return data;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return fallbackSettings || {};
  }
}

export async function setCachedSiteSettingsData(settings: any): Promise<void> {
  try {
    // Try Redis first
    await setRedisSettings(settings);
  } catch (error) {
    console.log('Redis not available, using fallback cache');
  }
  
  // Update fallback cache
  fallbackSettings = settings;
  fallbackTimestamp = Date.now();
}

export function clearSiteSettingsCache(): void {
  fallbackSettings = null;
  fallbackTimestamp = 0;
}

// Hook for React components
export function useSiteSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getCachedSiteSettings().then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, []);
  
  return { settings, loading, refetch: getCachedSiteSettings };
}
