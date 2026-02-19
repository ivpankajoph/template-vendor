import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-muted/30 text-foreground border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand & About */}
        <div>
          <h3 className="text-lg font-bold mb-4">ShopEase</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your one-stop online store for everything you love. Shop the latest
            trends, unbeatable deals, and premium products — all in one place.
          </p>
          <div className="flex gap-3 mt-5">
            <Link
              href="#"
              className="p-2 rounded-full bg-background hover:bg-primary/10 transition"
            >
              <Facebook className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              className="p-2 rounded-full bg-background hover:bg-primary/10 transition"
            >
              <Instagram className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              className="p-2 rounded-full bg-background hover:bg-primary/10 transition"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              className="p-2 rounded-full bg-background hover:bg-primary/10 transition"
            >
              <Youtube className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:underline">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/returns" className="hover:underline">
                Returns & Refunds
              </Link>
            </li>
            <li>
              <Link href="/shipping" className="hover:underline">
                Shipping Info
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/data-deletion" className="hover:underline">
                Data Deletion
              </Link>
            </li>
          </ul>
        </div>

        

        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-1" />
              <span>Office No 834 Gaur City Mall, Greater Noida, Gautam Budhdha Nagar 201310, India</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+919873138444" className="hover:underline">
                +91 9873138444
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:support@shopease.com" className="hover:underline">
                support@shopease.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border py-4 text-center text-xs sm:text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 px-6">
          <p>© {new Date().getFullYear()} ShopEase. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
