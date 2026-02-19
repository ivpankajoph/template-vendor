"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Menu, ShoppingCart, Heart, User, Search, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import CartDrawer from "../cart/CartDrawer"
import Image from "next/image"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import { logoutCustomer } from "@/store/slices/customerAuthSlice"
import { useRouter } from "next/navigation"
import useDebounce from "@/hooks/useDebounce"

type SearchResult = {
  type: "product" | "category"
  id: string
  name: string
  slug?: string | null
  categorySlug?: string | null
  imageUrl?: string | null
}

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.customerAuth.token)
  const wishlistCount = useSelector(
    (state: RootState) => state.customerWishlist?.items?.length || 0,
  )
  const router = useRouter()
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", [])
  const debouncedSearch = useDebounce(search, 350)

  useEffect(() => {
    const query = debouncedSearch.trim()
    if (!query) {
      setResults([])
      setIsLoading(false)
      return
    }
    if (!apiBase) {
      setResults([])
      return
    }

    const controller = new AbortController()
    let isActive = true

    const runSearch = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `${apiBase}/search?query=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        )
        if (!response.ok) {
          throw new Error("Search request failed")
        }
        const data = await response.json()
        if (isActive) {
          setResults(Array.isArray(data?.results) ? data.results : [])
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Search error:", error)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    runSearch()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [apiBase, debouncedSearch])

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "Deals", href: "/deals" },
    { name: "Contact", href: "/contact" },
  ]

  const handleResultClick = (result: SearchResult) => {
    const targetSlug =
      result.type === "product" ? result.categorySlug : result.slug
    if (targetSlug) {
      router.push(`/categories/${targetSlug}`)
    }
    setSearch("")
    setResults([])
  }

  const renderResults = search.trim().length > 0

  return (
    <header className="w-full sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger className="md:hidden">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-4">
              <nav className="flex flex-col gap-3 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="text-xl font-bold">
            <Image src="/logo.png" alt="OPH-Mart" width={100} height={40} />
          </Link>
        </div>

        {/* Center: Search bar */}
        <div className="hidden md:flex w-1/3 items-center">
          <div className="relative w-full">
            <Input
              placeholder="Search for products or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            {renderResults && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-md border bg-background shadow-lg z-50 overflow-hidden">
                {isLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : results.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => handleResultClick(result)}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted/60 text-left"
                      >
                        {result.imageUrl ? (
                          <Image
                            src={result.imageUrl}
                            alt={result.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            IMG
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {result.name}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {result.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-sm text-muted-foreground">
                    No results found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Icons */}
    <div className="flex items-center gap-4">
      <Link href="/vendor">
        <Button variant="ghost" size="icon" className="hidden md:flex w-fit p-2">
          Become a Seller
        </Button>
      </Link>

          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart
                className={`h-5 w-5 ${
                  wishlistCount > 0 ? "fill-red-500 text-red-500" : ""
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Button>
          </Link>

  <div className="flex items-center gap-4">
  <CartDrawer />
</div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders">My Orders</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/cart">View Cart</Link>
            </DropdownMenuItem>
            {token ? (
              <DropdownMenuItem onClick={() => dispatch(logoutCustomer())}>
                Logout
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/login">Sign In</Link>
              </DropdownMenuItem>
            )}
          

            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t px-4 py-2 bg-background">
        <div className="relative">
          <Input
            placeholder="Search for products or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {renderResults && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-md border bg-background shadow-lg z-50 overflow-hidden">
              {isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}-mobile`}
                      type="button"
                      onClick={() => handleResultClick(result)}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted/60 text-left"
                    >
                      {result.imageUrl ? (
                        <Image
                          src={result.imageUrl}
                          alt={result.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          IMG
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {result.name}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {result.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">
                  No results found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
