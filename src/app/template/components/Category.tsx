import React from 'react';

export default function OurCategories() {
  const categories = [
    {
      id: 1,
      name: 'Houseplants',
      image: 'https://plus.unsplash.com/premium_photo-1677531681345-102b4f01198e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aG91c2VwbGFudHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600'
    },
    {
      id: 2,
      name: 'Outdoor Plants',
      image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&q=80'
    },
    {
      id: 3,
      name: 'Succulents',
      image: 'https://images.unsplash.com/photo-1509937528035-ad76254b0356?w=800&q=80'
    },
    {
      id: 4,
      name: 'Desert Bloom',
      image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&q=80'
    }
  ];

  return (
    <div className="bg-white py-16 lg:py-20 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-12 lg:mb-16">
          Our Categories
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