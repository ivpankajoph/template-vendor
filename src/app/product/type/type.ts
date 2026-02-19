export type VariantImage = {
  url: string;
  publicId: string;
};

export type Variant = {
  _id: string;
  variantSku: string;
  variantAttributes: Record<string, string>;
  actualPrice: number;
  discountPercent: number;
  finalPrice: number;
  stockQuantity: number;
  variantsImageUrls: VariantImage[];
  isActive: boolean;
  variantMetaTitle: string;
  variantMetaDescription: string;
  variantMetaKeywords: string[];
  variantCanonicalUrl: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type Product = {
  _id: string;
  ownerId?: string;
  productName: string;
  slug?: string;
  mainCategory?: string;
  mainCategoryData?: {
    name?: string;
    slug?: string;
    description?: string;
  };
  productCategory?: string;
  productCategoryData?: {
    name?: string;
    slug?: string;
    description?: string;
  };
  productSubCategories?: string[];
  productSubCategoryData?: Array<{
    _id?: string;
    name?: string;
    slug?: string;
  }>;
  brand: string;
  shortDescription?: string;
  description?: string;
  defaultImages?: { url: string; publicId: string }[];
  specifications?: Array<Record<string, string>>;
  isAvailable?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  baseSku?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  faqs?: FAQ[];
  variants: Variant[];
  vendor?: {
    name?: string;
    _id?: string;
  };
};
