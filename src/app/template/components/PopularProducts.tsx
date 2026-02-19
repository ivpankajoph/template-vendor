import React from 'react';

export default function PopularProducts() {
  const categories = [
    {
      id: 1,
      name: 'Houseplants',
      image: 'https://images.unsplash.com/photo-1583753075968-1236ccb83c66?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGhvdXNlcGxhbnR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600'
    },
    {
      id: 2,
      name: 'Outdoor Plants',
      image: 'https://media.istockphoto.com/id/1350784657/photo/creative-office-lobby-in-3d.webp?a=1&b=1&s=612x612&w=0&k=20&c=UZoGCqnIkQRR0GU5jnjP1Y8dUijPR5UqBa4H-5uwGwM='
    },
    {
      id: 3,
      name: 'Succulents',
      image: 'https://images.unsplash.com/photo-1544474921-9df05bc76d66?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGhvdXNlcGxhbnR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600'
    },
    {
      id: 4,
      name: 'Desert Bloom',
      image: 'https://media.istockphoto.com/id/1075485340/photo/white-trachelospermum-jasminoides-blooming-in-garden-closeup.webp?a=1&b=1&s=612x612&w=0&k=20&c=JxbQWVLJA7R9URwhyp5C77himNhyreQf22htAfuhgY4='
    }
  ];

  return (
    <div className="bg-white py-16 lg:py-20 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-12 lg:mb-16">
          Popular Products
        </h2>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {categories.map((category) => (
            <div key={category.id} className="group cursor-pointer">
              {/* Category Image */}
              <div className="relative overflow-hidden bg-white mb-6 aspect-square flex items-center justify-center">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Category Name */}
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 text-center">
                {category.name}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Border with Yellow Line */}
      
  

    </div>
  );
}