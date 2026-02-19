import React from 'react'

const Hero2 = () => {
  return (
    <div>
              <div className="relative z-10 bg-gray-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Feature 1 - Secure Payment */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-6 template-accent-soft template-accent">
                <svg
                  className="w-10 h-10 lg:w-12 lg:h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="2"
                    y="5"
                    width="20"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                Secure Payment
              </h3>
              <p className="text-gray-600 text-base lg:text-lg">
                Elementum feugiat diam
              </p>
            </div>

            {/* Feature 2 - Free Shipping */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-6 template-accent-soft template-accent">
                <svg
                  className="w-10 h-10 lg:w-12 lg:h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M1 6h15v9H1z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M16 8h2.5L21 11v4h-5V8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle
                    cx="6"
                    cy="18"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                Free Shipping
              </h3>
              <p className="text-gray-600 text-base lg:text-lg">
                For $50 order
              </p>
            </div>

            {/* Feature 3 - Delivered with Care */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-6 template-accent-soft template-accent">
                <svg
                  className="w-10 h-10 lg:w-12 lg:h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                Delivered with Care
              </h3>
              <p className="text-gray-600 text-base lg:text-lg">
                Lacinia pellentesque leo
              </p>
            </div>

            {/* Feature 4 - Excellent Service */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-6 template-accent-soft template-accent">
                <svg
                  className="w-10 h-10 lg:w-12 lg:h-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                Excellent Service
              </h3>
              <p className="text-gray-600 text-base lg:text-lg">
                Blandit gravida viverra
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero2
