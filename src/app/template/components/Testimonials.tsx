import React from 'react';

export default function CustomerTestimonials() {
  const testimonials = [
    {
      id: 1,
      text: "I am absolutely thrilled with the service I received from their company! They were attentive, responsive, and genuinely cared about meeting my needs. I highly recommend them.",
      author: "Your Client",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
    },
    {
      id: 2,
      text: "I am absolutely thrilled with the service I received from their company! They were attentive, responsive, and genuinely cared about meeting my needs. I highly recommend them.",
      author: "Your Client",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
    },
    {
      id: 3,
      text: "Their team exceeded our expectations. Their creative approach and attention to detail brought our vision to life. Highly recommended!",
      author: "Your Client",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80"
    }
  ];

  return (
    <div className="py-16 lg:py-20 template-accent-gradient">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12 lg:mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-base lg:text-lg">
            Discover the reasons why people loves us and become your go-to partner.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* First Testimonial - Takes full width on first row for desktop */}
          <div className="lg:col-span-1 lg:row-span-1">
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm h-full">
              {/* Quote Icon */}
              <div className="text-5xl font-serif mb-6 template-accent">"</div>
              
              {/* Testimonial Text */}
              <p className="text-gray-700 text-base lg:text-lg mb-6 leading-relaxed">
                {testimonials[0].text}
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonials[0].avatar}
                  alt={testimonials[0].author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="text-gray-600 font-medium">
                  {testimonials[0].author}
                </span>
              </div>
            </div>
          </div>

          {/* Second Column - Two stacked testimonials */}
          <div className="flex flex-col gap-8">
            {/* Second Testimonial */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm">
              {/* Quote Icon */}
              <div className="text-5xl font-serif mb-6 template-accent">"</div>
              
              {/* Testimonial Text */}
              <p className="text-gray-700 text-base lg:text-lg mb-6 leading-relaxed">
                {testimonials[1].text}
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonials[1].avatar}
                  alt={testimonials[1].author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="text-gray-600 font-medium">
                  {testimonials[1].author}
                </span>
              </div>
            </div>

            {/* Third Testimonial */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm">
              {/* Quote Icon */}
              <div className="text-5xl font-serif mb-6 template-accent">"</div>
              
              {/* Testimonial Text */}
              <p className="text-gray-700 text-base lg:text-lg mb-6 leading-relaxed">
                {testimonials[2].text}
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonials[2].avatar}
                  alt={testimonials[2].author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="text-gray-600 font-medium">
                  {testimonials[2].author}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

 

 
    </div>
  );
}
