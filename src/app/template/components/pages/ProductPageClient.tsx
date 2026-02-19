"use client"
import React, { useState } from 'react';
import { Star, ShoppingCart, Minus, Plus, Search } from 'lucide-react';

export default function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const incrementQuantity = () => setQuantity(quantity + 1);
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <a href="#" className="template-accent-hover">Home</a>
            <span>/</span>
            <a href="#" className="template-accent-hover">Accessories</a>
            <span>/</span>
            <a href="#" className="template-accent-hover">Garden Glow</a>
          </div>
        </div>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative bg-white rounded-lg overflow-hidden">
            <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10">
              <Search size={20} />
            </button>
            <img
              src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&q=80"
              alt="Golden Glow Plant"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Golden Glow
            </h1>

            {/* Price and Shipping */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">₹85.00</span>
              <span className="font-medium template-accent">+ Free Shipping</span>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-6">
              Faucibus lacus tincidunt molestie accumsan nibh non odio aliquam molestie purus tristique sed tempor convallis eros fusce amet urna egestas maximus pulvhinar tortor.
            </p>

            <p className="text-gray-600 leading-relaxed mb-8">
              Scelerisque facilisis maxus pellentesque in ultricies etiam morbi ac egestas elementum ut ut morbi ut molestie.
            </p>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={decrementQuantity}
                  className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="text"
                  value={quantity}
                  readOnly
                  className="w-16 h-12 text-center border-x border-gray-300 focus:outline-none"
                />
                <button
                  onClick={incrementQuantity}
                  className="w-10 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button className="flex-1 text-white px-8 h-12 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 template-accent-bg template-accent-bg-hover">
                Add to cart
              </button>
            </div>

            {/* Category */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600">
                <span className="font-semibold">Category:</span>{' '}
                <a href="#" className="template-accent">
                  Indoor Plants
                </a>
              </p>
            </div>

            {/* Payment Methods */}
            <div className="mt-8 border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-3 font-medium">
                Guaranteed Safe Checkout
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                  alt="Visa"
                  className="h-8 object-contain"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg"
                  alt="Mastercard"
                  className="h-8 object-contain"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg"
                  alt="American Express"
                  className="h-8 object-contain"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                  alt="PayPal"
                  className="h-8 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 font-semibold transition-colors ${
                  activeTab === 'description'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 font-semibold transition-colors ${
                  activeTab === 'reviews'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Reviews (0)
              </button>
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Faucibus lacus tincidunt molestie accumsan nibh non odio aliquam molestie purus tristique sed tempor convallis eros fusce amet urna egestas maximus pulvhinar tortor.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Tincidunt mauris, pharetra aliquam urna in magnis ornare et mi velit, quisquamerat at a molestie, pharetra vulputate maximus suspendisse volutpat etiam sit et faucibus malesuada euismod felis erat enim amet at pharetra vitae.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Scelerisque facilisis maxius pellentesque in ultricies etiam morbi ac egestas elementum ut ut morbi ut molestie.
                </p>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="text-center py-12">
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 text-white w-12 h-12 rounded-md shadow-lg flex items-center justify-center transition-all transform hover:scale-105 z-50 template-accent-bg template-accent-bg-hover"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

