"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";
import PromotionalBanner from "@/components/promotional-banner";

export default function VendorPage() {
  const router = useRouter();

  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-screen flex flex-col items-center bg-background text-foreground overflow-hidden">
        <section className="w-full flex flex-col items-center justify-center text-center py-32 px-6 bg-gradient-to-b from-primary/10 to-background">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-top-6 duration-500">
            Become a Vendor
          </h1>
          <p className="max-w-3xl text-lg md:text-2xl text-muted-foreground animate-in fade-in slide-in-from-bottom-6 duration-500">
            Start selling your products to thousands of customers with our trusted platform.
            Manage everything with ease and grow your business faster.
          </p>
          <div className="mt-10 animate-in fade-in zoom-in-95 duration-500">
            <Button
              size="lg"
              onClick={() => router.push("/vendor/registration")}
              className="text-lg px-8 py-6 rounded-full"
            >
              Join as Vendor
            </Button>
          </div>
        </section>

        <section className="w-full max-w-7xl px-6 py-24 grid md:grid-cols-3 gap-10">
          {[
            {
              title: "Expand Your Reach",
              desc: "Access customers from all over the world and grow your audience.",
            },
            {
              title: "Easy Store Management",
              desc: "Track orders, manage stock, and view analytics in real time.",
            },
            {
              title: "Boost Your Brand",
              desc: "Promote your products with our marketing and SEO tools.",
            },
          ].map((item, index) => (
            <div key={index} className="transition-transform hover:scale-[1.03]">
              <Card className="shadow-lg border border-border hover:shadow-xl transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </section>

        <section className="w-full py-24 bg-muted/30">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-16">
            What Our Vendors Say
          </h2>
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {[
                {
                  name: "Aman Traders",
                  feedback:
                    "Joining this platform transformed our business. The dashboard is intuitive and customers love our storefront!",
                },
                {
                  name: "StyleSphere",
                  feedback:
                    "Our sales doubled in three months. The support team is incredible and the analytics are super helpful!",
                },
                {
                  name: "TechMania",
                  feedback:
                    "This is hands-down the best marketplace platform out there. Easy to use and full of growth tools!",
                },
              ].map((test, index) => (
                <CarouselItem key={index}>
                  <div className="flex flex-col items-center text-center p-8">
                    <Card className="max-w-3xl w-full bg-background shadow-md border border-border">
                      <CardContent className="py-10">
                        <p className="text-xl italic text-muted-foreground">
                          "{test.feedback}"
                        </p>
                        <h3 className="mt-6 text-2xl font-semibold text-primary">
                          - {test.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>

        <section className="w-full py-24 flex flex-col items-center text-center">
          <h3 className="text-5xl font-bold mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            Ready to Join the Marketplace?
          </h3>
          <Button
            size="lg"
            className="text-lg px-10 py-6 rounded-full"
            onClick={() => router.push("/vendor/registration")}
          >
            Become a Vendor Today
          </Button>
        </section>
      </div>
      <Footer />
    </>
  );
}
