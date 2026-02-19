interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  specifications?: any; // Can be string[], object, or mixed
}

interface Category {
  _id: string;
  name: string;
  description: string;
  image_url: string;
}

interface ApiResponse {
  category: Category;
  products: Product[];
}