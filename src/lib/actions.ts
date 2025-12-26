

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import type { Product, BlogPost, Category, SiteImageData, SiteImage, Coupon, Subscription, SiteSettings } from "./types";
import { supabaseAdmin } from "./supabase";
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from "./whatsapp-cloud";

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
  tags: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  badge: z.string().optional(),
  allowImageUpload: z.enum(['on', 'off']).optional(),
  weightGrams: z.coerce.number().optional(),
  lengthCm: z.coerce.number().optional(),
  widthCm: z.coerce.number().optional(),
  heightCm: z.coerce.number().optional(),
  /** legacy */
  weight: z.string().optional(),
  dimensions: z.string().optional(),
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
    id: z.string().min(1, "ID is required").regex(/^[a-z0-9-]+$/, "ID can only contain lowercase letters, numbers, and hyphens."),
    name: z.string().min(1, "Name is required"),
    imageUrl: z.string().url("Must be a valid URL"),
    imageHint: z.string().min(1, "Image hint is required"),
    linkUrl: z.string().url("Must be a valid URL").optional(),
});

const siteImageSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL"),
  imageHint: z.string().optional(),
});


const toArray = (value?: string) => value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];

const productsFilePath = path.join(process.cwd(), 'src', 'lib', 'products.json');
const blogsFilePath = path.join(process.cwd(), 'src/lib', 'blogs.json');
const imagesFilePath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');
const categoriesFilePath = path.join(process.cwd(), 'src', 'lib', 'categories.json');
const subscriptionsFilePath = path.join(process.cwd(), 'src', 'lib', 'subscriptions.json');
const tagsFilePath = path.join(process.cwd(), 'src', 'lib', 'tags.json');

async function readJsonFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    if (filePath.includes('products')) return { products: [] };
    if (filePath.includes('blogs')) return { posts: [] };
    if (filePath.includes('placeholder-images')) return { placeholderImages: [], videos: [] };
    if (filePath.includes('categories')) return { categories: [] };
    if (filePath.includes('coupons')) return { coupons: [] };
    return {};
  }
}

async function writeJsonFile(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

const subscriptionSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10).max(15).regex(/^\d+$/),
  source: z.string().optional(),
});

export async function getSubscriptions(): Promise<Subscription[]> {
  const data = await readJsonFile(subscriptionsFilePath);
  const list = Array.isArray(data.subscriptions) ? data.subscriptions : [];
  return list;
}

export async function createSubscription(input: { name: string; phone: string; source?: string }): Promise<{ success: boolean }> {
  const validated = subscriptionSchema.safeParse({
    name: input.name,
    phone: input.phone.replace(/\D/g, '').slice(-10) ? `91${input.phone.replace(/\D/g, '').slice(-10)}` : input.phone,
    source: input.source,
  });
  if (!validated.success) {
    return { success: false };
  }
  const fileData = await readJsonFile(subscriptionsFilePath);
  const list: Subscription[] = Array.isArray(fileData.subscriptions) ? fileData.subscriptions : [];
  const record: Subscription = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: validated.data.name,
    phone: validated.data.phone,
    source: validated.data.source,
    created_at: new Date().toISOString(),
  };
  list.push(record);
  await writeJsonFile(subscriptionsFilePath, { ...fileData, subscriptions: list });
  revalidatePath('/wb-admin/marketing');
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

  const { features, galleryImages, tags, allowImageUpload, lengthCm, widthCm, heightCm, ...rest } = validatedFields.data;

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
    weight_grams: rest.weightGrams || null,
    dimensions_length: lengthCm ? Number(lengthCm) : null,
    dimensions_width: widthCm ? Number(widthCm) : null,
    dimensions_height: heightCm ? Number(heightCm) : null,
    weight: rest.weight || null,
    dimensions: rest.dimensions || null,
  };

  const { error } = await supabase
    .from('products')
    .insert(insertPayload);
  if (error) {
    return { errors: { _form: ["Database Error: Failed to create product."] } };
  }

  revalidatePath("/wb-admin/products");
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
  if (rest.material !== undefined) payload.material = rest.material || null;
  if (rest.color !== undefined) payload.color = rest.color || null;
  if (rest.badge !== undefined) payload.badge = rest.badge || null;
  if (rest.specificDescription !== undefined) payload.specific_description = rest.specificDescription || null;
  if (features !== undefined) payload.features = toArray(features);
  if (rest.weightGrams !== undefined) payload.weight_grams = rest.weightGrams || null;
  if (lengthCm !== undefined) payload.dimensions_length = lengthCm ? Number(lengthCm) : null;
  if (widthCm !== undefined) payload.dimensions_width = widthCm ? Number(widthCm) : null;
  if (heightCm !== undefined) payload.dimensions_height = heightCm ? Number(heightCm) : null;
  if (rest.weight !== undefined) payload.weight = rest.weight || null;
  if (rest.dimensions !== undefined) payload.dimensions = rest.dimensions || null;

  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId);
  if (error) {
    return { errors: { _form: ["Database Error: Failed to update product."] } };
  }
  
  // Update tags.json if new tags are present
  const updatedTagsArr = tags !== undefined ? toArray(tags) : undefined;
  if (updatedTagsArr && updatedTagsArr.length > 0) {
      const tagsData = await readJsonFile(tagsFilePath);
      const existingTags = new Set<string>(tagsData.tags || []);
      let tagsChanged = false;
      updatedTagsArr.forEach(t => {
          if (!existingTags.has(t)) {
              existingTags.add(t);
              tagsChanged = true;
          }
      });
      if (tagsChanged) {
          await writeJsonFile(tagsFilePath, { tags: Array.from(existingTags).sort() });
      }
  }
  
  revalidatePath(`/wb-admin/products`);
  revalidatePath(`/wb-admin/products/${productId}/edit`);
  revalidatePath(`/collections`);
  revalidatePath("/");
  return { success: true };
}


export async function deleteProductAction(formData: FormData) {
  const productId = formData.get('id') as string;
  if (!productId) return;

  const supabase = supabaseAdmin();
  await supabase.from('products').delete().eq('id', productId);
  
  revalidatePath("/wb-admin/products");
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

  const fileData = await readJsonFile(blogsFilePath);
  const existingPost = fileData.posts.find((p: BlogPost) => p.slug === validatedFields.data.slug);
  if (existingPost) {
      return { errors: { slug: ["A blog post with this slug already exists."] } };
  }
  
  const { imageKey, imageUrl, ...rest } = validatedFields.data;
  
  const newPost = {
    ...rest,
    imageKey,
    ...(imageUrl ? { imageUrl } : {}),
  };

  fileData.posts.push(newPost);
  await writeJsonFile(blogsFilePath, fileData);

  revalidatePath("/wb-admin/blogs");
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

  const fileData = await readJsonFile(blogsFilePath);
  const postIndex = fileData.posts.findIndex((p: BlogPost) => p.slug === slug);

  if (postIndex === -1) {
    return { errors: { _form: ["Blog post not found"] } };
  }
  
  const postToUpdate = fileData.posts[postIndex];
  const { imageKey, imageUrl, ...rest } = validatedFields.data;

  const updatedPost = { 
    ...postToUpdate, 
    ...rest,
    ...(imageKey && { imageKey }),
    ...(imageUrl && { imageUrl }),
  };

  fileData.posts[postIndex] = updatedPost;
  await writeJsonFile(blogsFilePath, fileData);
  
  revalidatePath(`/wb-admin/blogs`);
  revalidatePath(`/blog`);
  revalidatePath(`/blog/${slug}`);
  return { success: true };
}

export async function deleteBlogPostAction(slug: string) {
  const fileData = await readJsonFile(blogsFilePath);
  
  fileData.posts = fileData.posts.filter((p: BlogPost) => p.slug !== slug);
  await writeJsonFile(blogsFilePath, fileData);
  
  revalidatePath("/wb-admin/blogs");
  revalidatePath("/blog");
}

export async function updateSiteImage(formData: FormData) {
    const data = Object.fromEntries(formData.entries());
    const validatedFields = siteImageSchema.safeParse(data);

    if (!validatedFields.success) {
        console.error("Validation failed", validatedFields.error.flatten().fieldErrors);
        return;
    }

    const fileData = await readJsonFile(imagesFilePath) as SiteImageData;
    const imageIndex = fileData.placeholderImages.findIndex((img: SiteImage) => img.id === validatedFields.data.id);

    if (imageIndex === -1) {
        console.error("Image not found");
        return;
    }
    
    fileData.placeholderImages[imageIndex].imageUrl = validatedFields.data.imageUrl;
    
    if (validatedFields.data.imageHint !== undefined) {
      fileData.placeholderImages[imageIndex].imageHint = validatedFields.data.imageHint;
    }

    if (validatedFields.data.name !== undefined) {
        fileData.placeholderImages[imageIndex].name = validatedFields.data.name;
    }

    await writeJsonFile(imagesFilePath, fileData);

    revalidatePath(`/`, 'layout');
}


export async function createCategory(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = categorySchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const fileData = await readJsonFile(categoriesFilePath);
  const existingCategory = fileData.categories.find((c: Category) => c.id === validatedFields.data.id);
  if (existingCategory) {
      return { errors: { id: ["A category with this ID already exists."] } };
  }
  
  const newCategory: Category = validatedFields.data;

  fileData.categories.push(newCategory);
  await writeJsonFile(categoriesFilePath, fileData);

  revalidatePath("/wb-admin/categories");
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

  const fileData = await readJsonFile(categoriesFilePath);
  const categoryIndex = fileData.categories.findIndex((c: Category) => c.id === categoryId);

  if (categoryIndex === -1) {
    return { errors: { _form: ["Category not found"] } };
  }

  const updatedCategory = { ...fileData.categories[categoryIndex], ...validatedFields.data };
  fileData.categories[categoryIndex] = updatedCategory;
  await writeJsonFile(categoriesFilePath, fileData);
  
  revalidatePath(`/wb-admin/categories`);
  revalidatePath(`/collections`);
  revalidatePath(`/collections/${categoryId}`);
  revalidatePath("/", "layout");
  return { success: true };
}


export async function deleteCategoryAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;

  const fileData = await readJsonFile(categoriesFilePath);
  
  fileData.categories = fileData.categories.filter((c: Category) => c.id !== id);
  await writeJsonFile(categoriesFilePath, fileData);
  
  revalidatePath("/wb-admin/categories");
  revalidatePath("/collections");
  revalidatePath("/", "layout");
}

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'site-settings.json');
const bannersFilePath = path.join(process.cwd(), 'src', 'lib', 'banners.json');

const siteSettingsSchema = z.object({
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  contact_email: z.string().email("Invalid email address").optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
  contact_hours: z.string().optional(),
  social_facebook: z.string().optional(),
  social_instagram: z.string().optional(),
  social_youtube: z.string().optional(),
  social_linkedin: z.string().optional(),
  social_twitter: z.string().optional(),
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
  promo_banner_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  promo_banner_title: z.string().optional(),
  promo_banner_subtitle: z.string().optional(),
  timer_banner_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  timer_banner_title: z.string().optional(),
  timer_banner_image_url: z.string().optional(),
  timer_banner_end_date: z.string().optional(),
  theme_background: z.string().optional(),
  theme_muted: z.string().optional(),
  redirects: z.string().optional(),
  maintenance_mode_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  maintenance_mode_message: z.string().optional(),
  advance_payment_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  advance_payment_percent: z.coerce.number().optional(),
});

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await readJsonFile(settingsFilePath);
  const banners = await readJsonFile(bannersFilePath);
  return { ...settings, ...banners };
}

export async function updateSiteSettings(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = siteSettingsSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const mode = formData.get('_mode');

  try {
    if (mode === 'bannersOnly') {
        const currentBanners = await readJsonFile(bannersFilePath);
        const { 
            timer_banner_enabled, 
            timer_banner_title, 
            timer_banner_image_url, 
            timer_banner_end_date 
        } = validatedFields.data;
        
        const newBanners = { 
            ...currentBanners, 
            timer_banner_enabled, 
            timer_banner_title, 
            timer_banner_image_url, 
            timer_banner_end_date 
        };
        await writeJsonFile(bannersFilePath, newBanners);
        revalidatePath('/', 'layout');
        return { success: true, message: 'Banner settings updated successfully' };
    }

    const currentSettings = await readJsonFile(settingsFilePath);
    // Exclude banner settings from site-settings.json
    const { 
        timer_banner_enabled, 
        timer_banner_title, 
        timer_banner_image_url, 
        timer_banner_end_date, 
        ...otherSettings 
    } = validatedFields.data;

    const newSettings = { ...currentSettings, ...otherSettings };
    await writeJsonFile(settingsFilePath, newSettings);
    revalidatePath('/', 'layout'); 
    return { success: true, message: 'Settings updated successfully' };
  } catch (error) {
    return { message: 'Database Error: Failed to update settings.' };
  }
}

const couponsFilePath = path.join(process.cwd(), 'src', 'lib', 'coupons.json');

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
    revalidatePath('/wb-admin/coupons');
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
        revalidatePath('/wb-admin/coupons');
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
    revalidatePath('/wb-admin/coupons');
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
        revalidatePath('/wb-admin/coupons');
        return { success: true, message: 'Coupon status updated' };
    } catch (error) {
        return { message: 'Database Error: Failed to update coupon.' };
    }
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
  revalidatePath('/wb-admin/products');
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
  const data = await readJsonFile(tagsFilePath);
  const list = Array.isArray(data.tags) ? data.tags : [];
  return list;
}

export async function addTag(previousState: any, formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  if (!name) {
    return { success: false, message: 'Tag name is required' };
  }
  const data = await readJsonFile(tagsFilePath);
  const list: string[] = Array.isArray(data.tags) ? data.tags : [];
  if (list.map(t => t.toLowerCase()).includes(name.toLowerCase())) {
    return { success: false, message: 'Tag already exists' };
  }
  list.push(name);
  await writeJsonFile(tagsFilePath, { ...data, tags: list });
  revalidatePath('/wb-admin/tags');
  return { success: true };
}

export async function deleteTag(previousState: any, formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  if (!name) return { success: false };
  const data = await readJsonFile(tagsFilePath);
  const list: string[] = Array.isArray(data.tags) ? data.tags : [];
  const updated = list.filter(t => t.toLowerCase() !== name.toLowerCase());
  await writeJsonFile(tagsFilePath, { ...data, tags: updated });
  revalidatePath('/wb-admin/tags');
  return { success: true };
}

export async function bulkAddTagToProducts(previousState: any, formData: FormData) {
  const idsRaw = String(formData.get('ids') || '').trim();
  const tag = String(formData.get('tag') || '').trim();
  if (!idsRaw) return { success: false, message: 'No products selected' };
  if (!tag) return { success: false, message: 'Select a tag' };
  const ids: string[] = idsRaw.includes(',') ? idsRaw.split(',').map(s => s.trim()).filter(Boolean) : JSON.parse(idsRaw);
  const products = await readJsonFile(productsFilePath);
  let updatedCount = 0;
  const updated = (products as Product[]).map((p: Product) => {
    if (ids.includes(p.id)) {
      const current = Array.isArray(p.tags) ? p.tags : [];
      if (!current.map(t => t.toLowerCase()).includes(tag.toLowerCase())) {
        p.tags = [...current, tag];
        updatedCount++;
      }
    }
    return p;
  });
  await writeJsonFile(productsFilePath, updated);
  revalidatePath('/wb-admin/products');
  revalidatePath('/collections');
  revalidatePath('/');
  return { success: true, updatedCount };
}
