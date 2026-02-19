import React from 'react';
import { Star } from 'lucide-react';

export default function TrendingProducts() {
  const products = [
    {
      id: 1,
      name: 'Tropical Breeze',
      category: 'Indoor Plants',
      price: 80.00,
      image: 'https://plus.unsplash.com/premium_photo-1668073438756-76fe6a233c56?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
      rating: 0
    },
    {
      id: 2,
      name: 'Zen Bamboo Grove',
      category: 'Indoor Plants',
      price: 90.00,
      image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80',
      rating: 0
    },
    {
      id: 3,
      name: 'Starlight Succulent',
      category: 'Indoor Plants',
      price: 95.00,
      image: 'https://images.unsplash.com/photo-1617111490936-07b47eafdcd4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=676',
      rating: 0
    }
  ];

  return (
    <div className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-12 lg:mb-16">
          Trending Products
        </h2>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gray-100 mb-4 aspect-square">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Rating Stars */}
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className="text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  />
                ))}
              </div>

              {/* Product Name */}
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-1">
                {product.name}
              </h3>

              {/* Category */}
              <p className="text-gray-500 text-sm lg:text-base mb-2">
                {product.category}
              </p>

              {/* Price */}
              <p className="text-gray-900 text-lg lg:text-xl font-semibold">
                ₹{product.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>


  
    </div>
  );
}