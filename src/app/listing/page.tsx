"use client"
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Heart, SlidersHorizontal } from 'lucide-react'

// Mock product data
const PRODUCTS = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  brand: ['Modern Botany', 'Rustic Roots', 'Planted'][i % 3],
  price: 40 + i * 10,
  color: ['Emerald', 'Peach', 'Lavender', 'Mint'][i % 4],
  image: `/images/product-${(i % 6) + 1}.jpg`,
}))

export default function ProductCatalogPage() {
  const [selectedFilters, setSelectedFilters] = useState<{ brand?: string[]; color?: string[] }>({})
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const toggleFilter = (key: string, value: string) => {
    setSelectedFilters((prev) => {
      const arr = prev[key as keyof typeof prev] || []
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  const filteredProducts = PRODUCTS.filter((p) => {
    const brandMatch = !selectedFilters.brand?.length || selectedFilters.brand.includes(p.brand)
    const colorMatch = !selectedFilters.color?.length || selectedFilters.color.includes(p.color)
    const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1]
    return brandMatch && colorMatch && priceMatch
  })

  const activeFilters = [
    ...(selectedFilters.brand || []).map((b) => ({ type: 'brand', value: b })),
    ...(selectedFilters.color || []).map((c) => ({ type: 'color', value: c })),
  ]

  const clearFilter = (type: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: prev[type as keyof typeof prev]?.filter((v) => v !== value),
    }))
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:block lg:w-1/4 xl:w-1/5 bg-gray-50 p-6 border-r overflow-y-auto">
        <FilterContent
          selectedFilters={selectedFilters}
          toggleFilter={toggleFilter}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <Input placeholder="Search products..." className="max-w-sm" />

          <div className="flex items-center gap-3">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Filter
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-6 overflow-y-auto">
                <FilterContent
                  selectedFilters={selectedFilters}
                  toggleFilter={toggleFilter}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setSelectedFilters({})}>
                    Reset
                  </Button>
                  <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map((f, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => clearFilter(f.type, f.value)}
              >
                {f.value} ✕
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setSelectedFilters({})}>
              Clear all
            </Button>
          </div>
        )}

        {/* Product grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              whileHover={{ scale: 1.02 }}
              className="transition-all"
            >
              <Card className="overflow-hidden border border-gray-200 hover:shadow-md">
                <CardContent className="p-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 sm:h-56 object-cover"
                  />
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-1 p-4">
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                  <p className="font-medium">${product.price}</p>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Heart className="w-4 h-4 mr-1" /> Add to Wishlist
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}

function FilterContent({ selectedFilters, toggleFilter, priceRange, setPriceRange }: any) {
  const BRANDS = ['Modern Botany', 'Rustic Roots', 'Planted']
  const COLORS = ['Denim', 'Emerald', 'Lavender', 'Mint', 'Peach', 'Plum', 'Salmon']

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Brand</h3>
        <div className="space-y-2">
          {BRANDS.map((b) => (
            <label key={b} className="flex items-center gap-2">
              <Checkbox
                checked={selectedFilters.brand?.includes(b)}
                onCheckedChange={() => toggleFilter('brand', b)}
              />
              {b}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2">Color</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <Badge
              key={c}
              variant={selectedFilters.color?.includes(c) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleFilter('color', c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-2">Price Range</h3>
        <Slider
          defaultValue={[priceRange[0], priceRange[1]]}
          min={0}
          max={500}
          step={10}
          onValueChange={(val) => setPriceRange(val as [number, number])}
        />
        <div className="text-sm text-gray-500 mt-2">
          ${priceRange[0]} - ${priceRange[1]}
        </div>
      </div>
    </div>
  )
}