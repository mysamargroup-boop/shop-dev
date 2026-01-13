

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import type { Product, BlogPost, Category, SiteImageData, SiteImage, Coupon, Subscription, SiteSettings, Sample } from "./types";
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from "./whatsapp-cloud";

const productSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be positive"),
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

const sampleSchema = z.object({
  id: z.string().optional(),
  productName: z.string().min(1, "Product Name is required"),
  customerName: z.string().min(1, "Customer Name is required"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("A valid Image URL is required"),
});


const toArray = (value?: string) => value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];

const productsFilePath = path.join(process.cwd(), 'src', 'lib', 'products.json');
const blogsFilePath = path.join(process.cwd(), 'src/lib', 'blogs.json');
const imagesFilePath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');
const categoriesFilePath = path.join(process.cwd(), 'src', 'lib', 'categories.json');
const subscriptionsFilePath = path.join(process.cwd(), 'src', 'lib', 'subscriptions.json');
const tagsFilePath = path.join(process.cwd(), 'src', 'lib', 'tags.json');
const couponsFilePath = path.join(process.cwd(), 'src', 'lib', 'coupons.json');
const samplesFilePath = path.join(process.cwd(), 'src', 'lib', 'samples.json');

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
    if (filePath.includes('samples')) return { samples: [] };
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

  const products = await readJsonFile(productsFilePath);
  const existingProduct = products.find((p: Product) => p.id === validatedFields.data.id);
  if (existingProduct) {
      return { errors: { id: ["A product with this ID already exists."] } };
  }
  
  const { features, galleryImages, tags, allowImageUpload, lengthCm, widthCm, heightCm, ...rest } = validatedFields.data;

  const newProduct: Product = {
    ...rest,
    allowImageUpload: allowImageUpload === 'on',
    features: toArray(features),
    galleryImages: toArray(galleryImages),
    tags: toArray(tags),
    dimensionsCm: (lengthCm || widthCm || heightCm)
      ? {
          length: Number(lengthCm || 0),
          width: Number(widthCm || 0),
          height: Number(heightCm || 0),
        }
      : undefined,
  };

  products.push(newProduct);
  await writeJsonFile(productsFilePath, products);

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

  const products = await readJsonFile(productsFilePath);
  const productIndex = products.findIndex((p: Product) => p.id === productId);

  if (productIndex === -1) {
    return { errors: { _form: ["Product not found"] } };
  }

  const productToUpdate = products[productIndex];
  const { features, galleryImages, tags, allowImageUpload, lengthCm, widthCm, heightCm, ...rest } = validatedFields.data;

  const updatedProduct: Product = { ...productToUpdate, ...rest };
  
  updatedProduct.allowImageUpload = allowImageUpload === 'on';
  if (lengthCm !== undefined || widthCm !== undefined || heightCm !== undefined) {
    updatedProduct.dimensionsCm = {
      length: Number(lengthCm || productToUpdate.dimensionsCm?.length || 0),
      width: Number(widthCm || productToUpdate.dimensionsCm?.width || 0),
      height: Number(heightCm || productToUpdate.dimensionsCm?.height || 0),
    };
  }

  if (features !== undefined) updatedProduct.features = toArray(features);
  if (galleryImages !== undefined) updatedProduct.galleryImages = toArray(galleryImages);
  if (tags !== undefined) updatedProduct.tags = toArray(tags);

  products[productIndex] = updatedProduct;
  await writeJsonFile(productsFilePath, products);
  
  // Update tags.json if new tags are present
  if (updatedProduct.tags && updatedProduct.tags.length > 0) {
      const tagsData = await readJsonFile(tagsFilePath);
      const existingTags = new Set<string>(tagsData.tags || []);
      let tagsChanged = false;
      updatedProduct.tags.forEach(t => {
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
  revalidatePath(`/collections/${productToUpdate.category.toLowerCase().replace(/ /g, '-')}/${productId}`);
  revalidatePath("/");
  return { success: true };
}


export async function deleteProductAction(formData: FormData) {
  const productId = formData.get('id') as string;
  if (!productId) return;

  let products = await readJsonFile(productsFilePath);
  const product = products.find((p: Product) => p.id === productId);
  if(!product) return;

  products = products.filter((p: Product) => p.id !== productId);
  await writeJsonFile(productsFilePath, products);
  
  revalidatePath("/wb-admin/products");
  revalidatePath(`/collections/${product.category.toLowerCase().replace(/ /g, '-')}`);
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
  social_facebook: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  social_instagram: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  social_youtube: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  social_linkedin: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  social_twitter: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  upload_provider: z.enum(['supabase', 'r2']).optional(),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
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
  whatsapp_only_checkout_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  whatsapp_business_number: z.string().optional(),
  whatsapp_message_template: z.string().optional(),
  promo_banner_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  promo_banner_title: z.string().optional(),
  promo_banner_subtitle: z.string().optional(),
  timer_banner_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  timer_banner_title: z.string().optional(),
  timer_banner_image_url: z.string().optional(),
  timer_banner_end_date: z.string().optional(),
  theme_background: z.string().optional(),
  theme_muted: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_address: z.string().optional(),
  contact_hours: z.string().optional(),
  redirects: z.string().optional(),
  maintenance_mode_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  maintenance_mode_message: z.string().optional(),
  shiprocket_enabled: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  shiprocket_api_email: z.string().optional(),
  shiprocket_api_password: z.string().optional(),
});

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await readJsonFile(settingsFilePath);
  const banners = await readJsonFile(bannersFilePath);
  return { ...settings, ...banners };
}

export async function updateSiteSettings(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const mode = formData.get('_mode');
  
  const validatedFields = siteSettingsSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const { 
        timer_banner_enabled, timer_banner_title, timer_banner_image_url, timer_banner_end_date,
        ...otherSettings 
    } = validatedFields.data;

    // Always update general settings file
    const currentSettings = await readJsonFile(settingsFilePath);
    const newSettings = { ...currentSettings, ...otherSettings };
    await writeJsonFile(settingsFilePath, newSettings);

    // Conditionally update banners file if in banners mode or all mode
    if (mode === 'bannersOnly' || mode === 'all') {
        const currentBanners = await readJsonFile(bannersFilePath);
        const newBanners = { 
            ...currentBanners, 
            timer_banner_enabled, 
            timer_banner_title, 
            timer_banner_image_url, 
            timer_banner_end_date 
        };
        await writeJsonFile(bannersFilePath, newBanners);
    }
    
    revalidatePath('/', 'layout');
    return { success: true, message: 'Settings updated successfully' };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { message: 'Database Error: Failed to update settings.', success: false };
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

export async function getCoupons(): Promise<Coupon[]> {
  const data = await readJsonFile(couponsFilePath);
  return data.coupons || [];
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
    const fileData = await readJsonFile(couponsFilePath);
    const coupons: Coupon[] = fileData.coupons || [];
    
    if (coupons.some((c) => c.code === validatedFields.data.code)) {
        return { message: 'Coupon code already exists.', success: false };
    }

    const newCoupon: Coupon = {
      ...validatedFields.data,
      active: true,
    };

    coupons.push(newCoupon);
    await writeJsonFile(couponsFilePath, { ...fileData, coupons });
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
        const fileData = await readJsonFile(couponsFilePath);
        let coupons: Coupon[] = fileData.coupons || [];
        
        const couponIndex = coupons.findIndex(c => c.code === originalCode);
        if (couponIndex === -1) {
            return { message: 'Coupon to update not found.', success: false };
        }

        // If code is changed, check for conflicts
        if (originalCode !== couponData.code && coupons.some(c => c.code === couponData.code)) {
             return { message: 'The new coupon code already exists.', success: false };
        }

        coupons[couponIndex] = { ...coupons[couponIndex], ...couponData };

        await writeJsonFile(couponsFilePath, { ...fileData, coupons });
        revalidatePath('/wb-admin/coupons');
        return { success: true, message: 'Coupon updated successfully.' };
    } catch (error) {
        return { message: 'Database Error: Failed to update coupon.', success: false };
    }
}


export async function deleteCoupon(code: string) {
  try {
    const fileData = await readJsonFile(couponsFilePath);
    const coupons = fileData.coupons || [];
    const updatedCoupons = coupons.filter((c: any) => c.code !== code);
    await writeJsonFile(couponsFilePath, { ...fileData, coupons: updatedCoupons });
    revalidatePath('/wb-admin/coupons');
    return { success: true, message: 'Coupon deleted successfully' };
  } catch (error) {
    return { message: 'Database Error: Failed to delete coupon.' };
  }
}

export async function toggleCouponStatus(code: string) {
    try {
        const fileData = await readJsonFile(couponsFilePath);
        const coupons = fileData.coupons || [];
        const updatedCoupons = coupons.map((c: any) => c.code === code ? { ...c, active: !c.active } : c);
        await writeJsonFile(couponsFilePath, { ...fileData, coupons: updatedCoupons });
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
  const products = await readJsonFile(productsFilePath);
  let updatedCount = 0;
  const factor = percent / 100;
  const updated = (products as Product[]).map((p: Product) => {
    if (ids.includes(p.id)) {
      const change = p.price * factor;
      const newPrice = mode === 'increase' ? p.price + change : p.price - change;
      p.price = Math.max(0.01, Number(newPrice.toFixed(2)));
      updatedCount++;
    }
    return p;
  });
  await writeJsonFile(productsFilePath, updated);
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


export async function createSample(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = sampleSchema.safeParse(data);

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  const fileData = await readJsonFile(samplesFilePath);
  const samples: Sample[] = fileData.samples || [];
  
  const newSample: Sample = {
    ...validatedFields.data,
    id: `sample-${Date.now()}`,
  };

  samples.push(newSample);
  await writeJsonFile(samplesFilePath, { ...fileData, samples });

  revalidatePath('/wb-admin/samples');
  revalidatePath('/samples');
  return { success: true };
}

export async function updateSample(previousState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const validatedFields = sampleSchema.safeParse(data);

  if (!validatedFields.success || !validatedFields.data.id) {
    return { errors: validatedFields.error?.flatten().fieldErrors };
  }

  const fileData = await readJsonFile(samplesFilePath);
  const samples: Sample[] = fileData.samples || [];
  const sampleIndex = samples.findIndex(s => s.id === validatedFields.data.id);

  if (sampleIndex === -1) {
    return { message: "Sample not found." };
  }

  samples[sampleIndex] = { ...samples[sampleIndex], ...validatedFields.data };
  await writeJsonFile(samplesFilePath, { ...fileData, samples });

  revalidatePath('/wb-admin/samples');
  revalidatePath('/samples');
  return { success: true };
}

export async function deleteSample(id: string) {
  const fileData = await readJsonFile(samplesFilePath);
  let samples: Sample[] = fileData.samples || [];
  samples = samples.filter(s => s.id !== id);
  await writeJsonFile(samplesFilePath, { ...fileData, samples });
  revalidatePath('/wb-admin/samples');
  revalidatePath('/samples');
  return { success: true };
}
