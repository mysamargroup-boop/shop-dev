

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Product, BlogPost, Category, SiteImageData, SiteImage, Coupon, Subscription, SiteSettings, Review } from "./types";
import { supabaseAdmin } from "./supabase";
import { getTags as getTagsFromSupabase } from './data-supabase';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from "./whatsapp-cloud";
import path from 'path';
import { slugify } from "./utils";
const fs = require('fs').promises;

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'site-settings.json');

const siteSettingsSchema = z.object({
  owner_first_name: z.string().optional(),
  owner_last_name: z.string().optional(),
  logo_url: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
  contact_hours: z.string().optional(),
  maintenance_mode_enabled: z.coerce.boolean().optional(),
  maintenance_mode_message: z.string().optional(),
  social_facebook: z.string().url().optional().or(z.literal('')),
  social_instagram: z.string().url().optional().or(z.literal('')),
  social_youtube: z.string().url().optional().or(z.literal('')),
  social_linkedin: z.string().url().optional().or(z.literal('')),
  social_twitter: z.string().url().optional().or(z.literal('')),
  home_meta_title: z.string().optional(),
  home_meta_description: z.string().optional(),
  google_verification_code: z.string().optional(),
  google_tag_manager_id: z.string().optional(),
  invoice_business_name: z.string().optional(),
  invoice_business_address: z.string().optional(),
  invoice_logo_url: z.string().optional(),
  invoice_tax_percent: z.coerce.number().optional(),
  invoice_currency_symbol: z.string().optional(),
  invoice_gst_number: z.string().optional(),
  expected_delivery_min_days: z.coerce.number().optional(),
  expected_delivery_max_days: z.coerce.number().optional(),
  free_shipping_threshold: z.coerce.number().optional(),
  promo_banner_enabled: z.coerce.boolean().optional(),
  promo_banner_title: z.string().optional(),
  promo_banner_subtitle: z.string().optional(),
  timer_banner_enabled: z.coerce.boolean().optional(),
  timer_banner_title: z.string().optional(),
  timer_banner_image_url: z.string().optional(),
  timer_banner_end_date: z.string().optional(),
  theme_background: z.string().optional(),
  theme_muted: z.string().optional(),
  redirects: z.string().optional(),
  whatsapp_only_checkout_enabled: z.coerce.boolean().optional(),
  product_id_prefix: z.string().regex(/^[A-Z]{2}$/, "Must be exactly 2 capital letters").optional(),
});

const productSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional(),
  regularPrice: z.coerce.number().min(0.01, "Regular price must be positive"),
  salePrice: z.coerce.number().optional(),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL"),
  imageAlt: z.string().optional(),
  imageHint: z.string().optional(),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  imageAttribution: z.string().optional(),
  license: z.string().optional(),
  inventory: z.coerce.number().min(0, "Inventory can't be negative"),
  features: z.string().optional(),
  galleryImages: z.string().optional(),
  specificDescription: z.string().optional(),
  tags: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  badge: z.string().optional(),
  allowImageUpload: z.enum(['on', 'off']).optional(),
});


const blogPostSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  author: z.string().min(1, "Author is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  imageKey: z.string().min(1, "Image Key is required"),
  content: z.string().min(1, "Content is required"),
  /** Optional override to bypass placeholder image mapping */
  imageUrl: z.string().url("Must be a valid URL").optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url("Must be a valid URL").optional(),
  imageHint: z.string().optional(),
  linkUrl: z.string().url().optional().or(z.literal('')),
});

const siteImageSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL"),
  imageHint: z.string().optional(),
});


const toArray = (value?: string) => value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];

export async function getSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabaseAdmin()
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
  return data || [];
}

const subscriptionSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10).max(15).regex(/^\d+$/),
  source: z.string().optional(),
});

export async function createSubscription(input: { name: string; phone: string; source?: string }): Promise<{ success: boolean }> {
  const validated = subscriptionSchema.safeParse({
    name: input.name,
    phone: input.phone.replace(/\D/g, '').slice(-10) ? `91${'\'\'\''}${input.phone.replace(/\D/g, '').slice(-10)}` : input.phone,
    source: input.source,
  });
  if (!validated.success) {
    return { success: false };
  }
  
  const { error } = await supabaseAdmin()
    .from('subscriptions')
    .insert({
      name: validated.data.name,
      phone: validated.data.phone,
      source: validated.data.source,
    });

  if (error) {
    console.error('Error creating subscription:', error);
    return { success: false };
  }

  revalidatePath('/sr-admin/marketing');
  return { success: true };
}


export async function createProduct(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = productSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { features, galleryImages, tags, allowImageUpload, ...rest } = validatedFields.data;

  const supabase = supabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('products')
    .select('id')
    .eq('id', rest.id)
    .single();
  if (existingError && existingError.code !== 'PGRST116') {
    return { errors: { _form: ["Database error while checking existing product."] } };
  }
  if (existing) {
    return { errors: { id: ["A product with this ID already exists."] } };
  }

  const insertPayload = {
    id: rest.id,
    name: rest.name,
    short_description: rest.shortDescription || null,
    description: rest.description,
    regular_price: rest.regularPrice,
    sale_price: rest.salePrice || null,
    category_id: rest.category,
    sub_category: rest.subCategory || null,
    image_url: rest.imageUrl,
    image_alt: rest.imageAlt || null,
    image_hint: rest.imageHint || null,
    inventory: rest.inventory,
    tags: toArray(tags),
    gallery_images: toArray(galleryImages),
    allow_image_upload: allowImageUpload === 'on',
    video_url: rest.videoUrl || null,
    image_attribution: rest.imageAttribution || null,
    license: rest.license || null,
    material: rest.material || null,
    color: rest.color || null,
    badge: rest.badge || null,
    specific_description: rest.specificDescription || null,
    features: toArray(features),
    price: rest.salePrice || rest.regularPrice,
  };

  const { error } = await supabase
    .from('products')
    .insert(insertPayload);
  if (error) {
    return { errors: { _form: ["Database Error: Failed to create product."] } };
  }

  revalidatePath("/sr-admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function updateProduct(productId: string, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = productSchema.partial().safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { features, galleryImages, tags, allowImageUpload, lengthCm, widthCm, heightCm, ...rest } = validatedFields.data;

  const supabase = supabaseAdmin();
  const payload: any = {};
  if (rest.name !== undefined) payload.name = rest.name;
  if (rest.shortDescription !== undefined) payload.short_description = rest.shortDescription || null;
  if (rest.description !== undefined) payload.description = rest.description;
  if (rest.regularPrice !== undefined) payload.regular_price = rest.regularPrice;
  if (rest.salePrice !== undefined) payload.sale_price = rest.salePrice || null;
  if (rest.category !== undefined) payload.category_id = rest.category;
  if (rest.subCategory !== undefined) payload.sub_category = rest.subCategory || null;
  if (rest.imageUrl !== undefined) payload.image_url = rest.imageUrl;
  if (rest.imageAlt !== undefined) payload.image_alt = rest.imageAlt || null;
  if (rest.imageHint !== undefined) payload.image_hint = rest.imageHint || null;
  if (rest.inventory !== undefined) payload.inventory = rest.inventory;
  if (tags !== undefined) payload.tags = toArray(tags);
  if (galleryImages !== undefined) payload.gallery_images = toArray(galleryImages);
  if (allowImageUpload !== undefined) payload.allow_image_upload = allowImageUpload === 'on';
  if (rest.videoUrl !== undefined) payload.video_url = rest.videoUrl || null;
  if (rest.imageAttribution !== undefined) payload.image_attribution = rest.imageAttribution || null;
  if (rest.license !== undefined) payload.license = rest.license || null;
  if (rest.material !== undefined) payload.material = rest.material;
  if (rest.color !== undefined) payload.color = rest.color || null;
  if (rest.badge !== undefined) payload.badge = rest.badge || null;
  if (rest.specificDescription !== undefined) payload.specific_description = rest.specificDescription || null;
  if (features !== undefined) payload.features = toArray(features);
  if (rest.weightGrams !== undefined) payload.weight_grams = rest.weightGrams || null;
  if (lengthCm !== undefined) payload.dimensions_length = lengthCm ? Number(lengthCm) : null;
  if (widthCm !== undefined) payload.dimensions_width = widthCm ? Number(widthCm) : null;
  if (heightCm !== undefined) payload.dimensions_height = heightCm ? Number(heightCm) : null;

  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId);
  if (error) {
    return { errors: { _form: ["Database Error: Failed to update product."] } };
  }
  
  revalidatePath(`/sr-admin/products`);
  revalidatePath(`/sr-admin/products/${productId}/edit`);
  revalidatePath(`/collections`);
  revalidatePath("/");
  return { success: true };
}


export async function deleteProductAction(formData: FormData) {
  const productId = formData.get('id') as string;
  if (!productId) return;

  const supabase = supabaseAdmin();
  await supabase.from('products').delete().eq('id', productId);
  
  revalidatePath("/sr-admin/products");
  revalidatePath(`/collections`);
  revalidatePath("/");
}


export async function createBlogPost(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = blogPostSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { imageKey, imageUrl, date, ...rest } = validatedFields.data;
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('slug', rest.slug)
      .single();

  if (existing) {
      return { errors: { slug: ["A blog post with this slug already exists."] } };
  }
  
  const { error } = await supabase.from('blog_posts').insert({
    slug: rest.slug,
    title: rest.title,
    published_at: date ? new Date(date).toISOString() : null,
    author: rest.author,
    excerpt: rest.excerpt,
    image_key: imageKey,
    image_url: imageUrl,
    content: rest.content
  });

  if (error) {
    return { errors: { _form: ["Database Error: Failed to create blog post."] } };
  }

  revalidatePath("/sr-admin/blogs");
  revalidatePath("/blog");
  return { success: true };
}

export async function updateBlogPost(slug: string, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = blogPostSchema.partial().safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { imageKey, imageUrl, date, ...rest } = validatedFields.data;
  const supabase = supabaseAdmin();

  const updatePayload: any = {};
  if (rest.title !== undefined) updatePayload.title = rest.title;
  if (rest.author !== undefined) updatePayload.author = rest.author;
  if (rest.excerpt !== undefined) updatePayload.excerpt = rest.excerpt;
  if (rest.content !== undefined) updatePayload.content = rest.content;
  if (date !== undefined) updatePayload.published_at = date ? new Date(date).toISOString() : null;
  if (imageKey !== undefined) updatePayload.image_key = imageKey;
  if (imageUrl !== undefined) updatePayload.image_url = imageUrl;

  const { error } = await supabase
    .from('blog_posts')
    .update(updatePayload)
    .eq('slug', slug);

  if (error) {
    return { errors: { _form: ["Database Error: Failed to update blog post."] } };
  }
  
  revalidatePath(`/sr-admin/blogs`);
  revalidatePath(`/blog`);
  revalidatePath(`/blog/${slug}`);
  return { success: true };
}

export async function deleteBlogPostAction(slug: string) {
  const supabase = supabaseAdmin();
  await supabase.from('blog_posts').delete().eq('slug', slug);
  
  revalidatePath("/sr-admin/blogs");
  revalidatePath("/blog");
}

export async function updateSiteImage(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = siteImageSchema.safeParse(data);

    if (!validatedFields.success) {
        console.error("Validation failed", validatedFields.error.flatten().fieldErrors);
        return;
    }

    const { id, imageUrl, imageHint, name } = validatedFields.data;

    try {
        const { error } = await supabaseAdmin()
            .from('site_images')
            .update({
                image_url: imageUrl,
                image_hint: imageHint,
                name: name
            })
            .eq('id', id);

        if (error) throw error;

        revalidatePath(`/`, 'layout');
    } catch (error) {
        console.error("Error updating site image:", error);
    }
}


export async function createCategory(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = categorySchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, imageUrl, imageHint, linkUrl } = validatedFields.data;
  const id = slugify(name);
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();

  if (existing) {
      return { errors: { name: ["A category with this name already exists, resulting in a duplicate ID."] } };
  }
  
  const { error } = await supabase.from('categories').insert({
    id,
    name,
    image_url: imageUrl,
    image_hint: imageHint,
    link_url: linkUrl,
  });

  if (error) {
    return { errors: { _form: ["Database Error: Failed to create category."] } };
  }

  revalidatePath("/sr-admin/categories");
  revalidatePath("/collections");
  revalidatePath("/", "layout");
  return { success: true };
}


export async function updateCategory(categoryId: string, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = categorySchema.partial().safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, imageUrl, imageHint, linkUrl } = validatedFields.data;
  const supabase = supabaseAdmin();

  const updatePayload: any = {};
  if (name !== undefined) updatePayload.name = name;
  if (imageUrl !== undefined) updatePayload.image_url = imageUrl;
  if (imageHint !== undefined) updatePayload.image_hint = imageHint;
  if (linkUrl !== undefined) updatePayload.link_url = linkUrl;

  const { error } = await supabase
    .from('categories')
    .update(updatePayload)
    .eq('id', categoryId);

  if (error) {
    return { errors: { _form: ["Database Error: Failed to update category."] } };
  }
  
  revalidatePath(`/sr-admin/categories`);
  revalidatePath(`/collections`);
  revalidatePath(`/collections/${categoryId}`);
  revalidatePath("/", "layout");
  return { success: true };
}


export async function deleteCategoryAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;

  const supabase = supabaseAdmin();
  await supabase.from('categories').delete().eq('id', id);
  
  revalidatePath("/sr-admin/categories");
  revalidatePath("/collections");
  revalidatePath("/", "layout");
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const fileContent = await fs.readFile(settingsFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading settings file:", error);
    return {};
  }
}

export async function updateSiteSettings(previousState: any, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = siteSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const currentSettings = await getSiteSettings();
        const updatedSettings = { ...currentSettings, ...validatedFields.data };
        await fs.writeFile(settingsFilePath, JSON.stringify(updatedSettings, null, 2));

        revalidatePath('/', 'layout');
        return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
        console.error("Error writing settings file:", error);
        return { message: 'File System Error: Failed to update settings.' };
    }
}



const couponSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  type: z.enum(['percent', 'flat']),
  value: z.coerce.number().min(0, "Value must be positive"),
});

const updateCouponSchema = couponSchema.extend({
  originalCode: z.string().min(1)
});

export async function getCoupons() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('coupons')
      .select('*')
      .order('code');
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function createCoupon(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = couponSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const supabase = supabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from('coupons')
      .select('code')
      .eq('code', validatedFields.data.code)
      .single();
    if (existingError && existingError.code !== 'PGRST116') {
      return { message: 'Database Error while checking coupon.', success: false };
    }
    if (existing) {
      return { message: 'Coupon code already exists.', success: false };
    }

    const insertPayload = {
      code: validatedFields.data.code,
      type: validatedFields.data.type,
      value: validatedFields.data.value,
      active: true,
    };
    const { error } = await supabase
      .from('coupons')
      .insert(insertPayload);
    if (error) {
      return { message: 'Database Error: Failed to create coupon.', success: false };
    }
    revalidatePath('/sr-admin/coupons');
    return { success: true, message: 'Coupon created successfully' };
  } catch (error) {
    return { message: 'Database Error: Failed to create coupon.', success: false };
  }
}

export async function updateCoupon(previousState: any, formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = updateCouponSchema.safeParse(data);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, success: false };
    }
    
    const { originalCode, ...couponData } = validatedFields.data;

    try {
        const supabase = supabaseAdmin();
        if (originalCode !== couponData.code) {
          const { data: exists, error: existsError } = await supabase
            .from('coupons')
            .select('code')
            .eq('code', couponData.code)
            .single();
          if (existsError && existsError.code !== 'PGRST116') {
            return { message: 'Database Error while checking coupon.', success: false };
          }
          if (exists) {
            return { message: 'The new coupon code already exists.', success: false };
          }
        }

        const { error } = await supabase
          .from('coupons')
          .update({
            code: couponData.code,
            type: couponData.type,
            value: couponData.value,
          })
          .eq('code', originalCode);
        if (error) {
          return { message: 'Database Error: Failed to update coupon.', success: false };
        }
        revalidatePath('/sr-admin/coupons');
        return { success: true, message: 'Coupon updated successfully.' };
    } catch (error) {
        return { message: 'Database Error: Failed to update coupon.', success: false };
    }
}


export async function deleteCoupon(code: string) {
  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('code', code);
    if (error) {
      return { message: 'Database Error: Failed to delete coupon.' };
    }
    revalidatePath('/sr-admin/coupons');
    return { success: true, message: 'Coupon deleted successfully' };
  } catch (error) {
    return { message: 'Database Error: Failed to delete coupon.' };
  }
}

export async function toggleCouponStatus(code: string) {
    try {
        const supabase = supabaseAdmin();
        const { data: coupon, error: fetchError } = await supabase
          .from('coupons')
          .select('active')
          .eq('code', code)
          .single();
        if (fetchError) {
          return { message: 'Database Error: Failed to fetch coupon.' };
        }
        const current = !!(coupon && coupon.active);
        const { error } = await supabase
          .from('coupons')
          .update({ active: !current })
          .eq('code', code);
        if (error) {
          return { message: 'Database Error: Failed to update coupon.' };
        }
        revalidatePath('/sr-admin/coupons');
        return { success: true, message: 'Coupon status updated' };
    } catch (error) {
        return { message: 'Database Error: Failed to update coupon.' };
    }
}

const navigationLinkSchema = z.object({
  id: z.coerce.number().optional(),
  area: z.enum(['header', 'footer']),
  section: z.string().optional(),
  href: z.string().min(1),
  label: z.string().min(1),
  sort_order: z.coerce.number().optional(),
  is_mega_menu: z.coerce.boolean().optional(),
  special: z.coerce.boolean().optional(),
});

export async function createNavigationLink(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = navigationLinkSchema.safeParse(data);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const payload: any = {
    area: validated.data.area,
    href: validated.data.href,
    label: validated.data.label,
    sort_order: validated.data.sort_order ?? 0,
    is_mega_menu: validated.data.is_mega_menu ?? false,
    special: validated.data.special ?? false,
  };
  if (validated.data.area === 'footer') {
    payload.section = validated.data.section || 'Links';
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('navigation_links').insert(payload);
  if (error) {
    return { message: 'Database Error: Failed to create navigation link.' };
  }
  revalidatePath('/sr-admin/navigation');
  revalidatePath('/');
  return { success: true };
}

export async function updateNavigationLink(linkId: number, previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validated = navigationLinkSchema.partial().safeParse(data);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const payload: any = {};
  const fields = ['area','section','href','label','sort_order','is_mega_menu','special'] as const;
  for (const f of fields) {
    if ((validated.data as any)[f] !== undefined) payload[f] = (validated.data as any)[f];
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('navigation_links').update(payload).eq('id', linkId);
  if (error) {
    return { message: 'Database Error: Failed to update navigation link.' };
  }
  revalidatePath('/sr-admin/navigation');
  revalidatePath('/');
  return { success: true };
}

export async function deleteNavigationLink(formData: FormData) {
  const idRaw = formData.get('id');
  const id = idRaw ? Number(idRaw) : NaN;
  if (!id || Number.isNaN(id)) {
    return { message: 'Invalid link id' };
  }
  const supabase = supabaseAdmin();
  const { error } = await supabase.from('navigation_links').delete().eq('id', id);
  if (error) {
    return { message: 'Database Error: Failed to delete navigation link.' };
  }
  revalidatePath('/sr-admin/navigation');
  revalidatePath('/');
  return { success: true };
}


export async function bulkUpdateProductPrices(previousState: any, formData: FormData) {
  const idsRaw = String(formData.get('ids') || '').trim();
  const percent = Number(formData.get('percent') || 0);
  const mode = String(formData.get('mode') || '').toLowerCase();
  if (!idsRaw) {
    return { success: false, message: 'No products selected' };
  }
  if (!percent || percent <= 0) {
    return { success: false, message: 'Enter a valid percentage' };
  }
  if (mode !== 'increase' && mode !== 'decrease') {
    return { success: false, message: 'Invalid mode' };
  }
  const ids: string[] = idsRaw.includes(',') ? idsRaw.split(',').map(s => s.trim()).filter(Boolean) : JSON.parse(idsRaw);
  const factor = percent / 100;
  const supabase = supabaseAdmin();
  let updatedCount = 0;
  const { data: products, error } = await supabase
    .from('products')
    .select('id, regular_price, sale_price')
    .in('id', ids);
  if (error) {
    return { success: false, message: 'Failed to fetch selected products' };
  }
  for (const p of (products || [])) {
    const base = typeof p.sale_price === 'number' ? Number(p.sale_price) : (typeof p.regular_price === 'number' ? Number(p.regular_price) : 0);
    const change = base * factor;
    const newPrice = mode === 'increase' ? base + change : base - change;
    const nextRegular = Math.max(0.01, Number(newPrice.toFixed(2)));
    const { error: upErr } = await supabase
      .from('products')
      .update({ regular_price: nextRegular })
      .eq('id', p.id);
    if (!upErr) updatedCount++;
  }
  revalidatePath('/sr-admin/products');
  revalidatePath('/collections');
  revalidatePath('/');
  return { success: true, updatedCount };
}


const bulkWhatsappSchema = z.object({
  phoneNumbers: z.array(z.string()),
  templateName: z.string(),
  variables: z.array(z.string()),
});

export async function sendBulkWhatsappMessages(data: {
  phoneNumbers: string[],
  templateName: string,
  variables: string[]
}) {
  const validatedFields = bulkWhatsappSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error("Invalid data provided to sendBulkWhatsappMessages.");
  }
  
  const { phoneNumbers, templateName, variables } = validatedFields.data;
  let successCount = 0;
  let errorCount = 0;

  for (const number of phoneNumbers) {
    try {
      await sendWhatsAppTemplateMessage({
        to: `91${number}`,
        templateName: templateName,
        languageCode: 'en',
        bodyParameters: variables,
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to send message to ${number}:`, error);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

const bulkSimpleWhatsappSchema = z.object({
  phoneNumbers: z.array(z.string()),
  message: z.string().min(1),
});

export async function sendBulkSimpleWhatsappMessages(data: {
  phoneNumbers: string[];
  message: string;
}) {
  const validatedFields = bulkSimpleWhatsappSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error("Invalid data provided to sendBulkSimpleWhatsappMessages.");
  }

  const { phoneNumbers, message } = validatedFields.data;
  let successCount = 0;
  let errorCount = 0;

  for (const number of phoneNumbers) {
    try {
      await sendWhatsAppTextMessage({
        to: `91${number}`,
        body: message,
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to send message to ${number}:`, error);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}


export async function getTagsList(): Promise<string[]> {
  return getTagsFromSupabase();
}

export async function bulkAddTagToProducts(previousState: any, formData: FormData) {
  const idsRaw = String(formData.get('ids') || '').trim();
  const tag = String(formData.get('tag') || '').trim();
  
  if (!idsRaw) return { success: false, message: 'No products selected' };
  if (!tag) return { success: false, message: 'Select a tag' };
  
  const ids: string[] = idsRaw.includes(',') ? idsRaw.split(',').map(s => s.trim()).filter(Boolean) : JSON.parse(idsRaw);
  const supabase = supabaseAdmin();
  
  // 1. Fetch products to get current tags
  const { data: products, error } = await supabase
    .from('products')
    .select('id, tags')
    .in('id', ids);

  if (error || !products) {
    return { success: false, message: 'Failed to fetch products' };
  }

  let updatedCount = 0;

  // 2. Update each product if needed
  for (const p of products) {
    const currentTags = Array.isArray(p.tags) ? p.tags : [];
    // Check case-insensitive existence
    if (!currentTags.some((t: string) => t.toLowerCase() === tag.toLowerCase())) {
      const newTags = [...currentTags, tag];
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ tags: newTags })
        .eq('id', p.id);
        
      if (!updateError) {
        updatedCount++;
      }
    }
  }

  revalidatePath('/sr-admin/products');
  revalidatePath('/collections');
  revalidatePath('/');
  return { success: true, updatedCount };
}

export async function getReviewsAdmin(): Promise<Review[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => ({...r, author_name: r.customer_name}));
  } catch (error) {
    console.error('Error fetching reviews for admin:', error);
    return [];
  }
}

export async function updateReviewStatus(reviewId: string, isVerified: boolean) {
  try {
    const { error } = await supabaseAdmin()
      .from('reviews')
      .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
      .eq('id', reviewId);
    if (error) throw error;
    revalidatePath('/sr-admin/reviews');
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to update review status.' };
  }
}


export async function deleteReview(reviewId: string) {
  try {
    const { error } = await supabaseAdmin()
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw error;
    revalidatePath('/sr-admin/reviews');
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to delete review.' };
  }
}
