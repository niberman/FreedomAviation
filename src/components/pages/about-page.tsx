'use client';

import { NavBar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Plane, Shield, Users } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About Freedom Aviation</h1>
              <p className="text-xl text-muted-foreground">
                Colorado&apos;s premier aircraft management company, dedicated to providing 
                exceptional service to owner-pilots at Centennial Airport.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Expert Care</h3>
                  <p className="text-muted-foreground">
                    Our team of aviation professionals brings decades of combined experience 
                    to every aircraft we manage.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
                  <p className="text-muted-foreground">
                    No hidden fees or surprise charges. We believe in straightforward, 
                    honest pricing for all our services.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Owner-Focused</h3>
                  <p className="text-muted-foreground">
                    Everything we do is designed with the owner-pilot in mind. 
                    Your flying experience is our priority.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    At Freedom Aviation, we believe that aircraft ownership should be a joy, 
                    not a burden. Our mission is to provide comprehensive aircraft management 
                    services that allow you to focus on what matters most: flying.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4">What Sets Us Apart</h3>
                  <ul className="space-y-3 mb-6">
                    {[
                      'Transparent, competitive pricing with no hidden fees',
                      'Comprehensive maintenance coordination and oversight',
                      'Professional aircraft detailing and care',
                      'Experienced flight instruction for owner proficiency',
                      'Convenient hangar facilities at KAPA',
                      'Dedicated concierge services',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/pricing">
                      <Button size="lg">View Our Pricing</Button>
                    </Link>
                    <Link href="/contact">
                      <Button size="lg" variant="outline">Schedule a Tour</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

