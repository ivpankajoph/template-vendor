"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-12"
      >
        <CheckCircle className="mx-auto text-green-500 w-20 h-20 mb-6" />
        <h1 className="text-5xl font-extrabold mb-4 text-primary">Thank You!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your vendor registration is complete. You will receive all verification and account details via your registered email shortly.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          Meanwhile, you can explore our <Link href="/vendor" className="text-primary font-semibold underline">Vendor Dashboard</Link> or go back to the <Link href="/" className="text-primary font-semibold underline">Homepage</Link>.
        </p>
        <Link href="/vendor">
          <button className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg hover:bg-primary/90 transition">
           You are welcome 
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
