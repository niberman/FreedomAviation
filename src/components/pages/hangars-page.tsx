'use client';

import { NavBar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MapPin, Plane, Shield, Thermometer } from 'lucide-react';

export function HangarsPage() {
  const hangars = [
    {
      name: 'Sky Harbour',
      location: 'KAPA - East Ramp',
      description: 'Premium climate-controlled hangars with full concierge services.',
      features: ['Climate Controlled', 'Security', '24/7 Access', 'Pilot Lounge'],
      availability: 'Limited',
    },
    {
      name: 'Freedom Aviation Hangar',
      location: 'KAPA - South Ramp',
      description: 'Modern facilities with convenient access to the runway.',
      features: ['Heated', 'Security', 'Aircraft Detailing', 'Maintenance Bay'],
      availability: 'Available',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Hangar Services</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Premium hangar facilities at Centennial Airport with full-service amenities 
                for your aircraft.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
              {hangars.map((hangar, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <Plane className="h-16 w-16 text-slate-600" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{hangar.name}</CardTitle>
                      <Badge variant={hangar.availability === 'Available' ? 'default' : 'secondary'}>
                        {hangar.availability}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {hangar.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{hangar.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {hangar.features.map((feature, j) => (
                        <Badge key={j} variant="outline">{feature}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Thermometer className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Climate Controlled</h3>
                  <p className="text-sm text-muted-foreground">
                    Year-round protection from Colorado&apos;s extreme weather
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Secure Facilities</h3>
                  <p className="text-sm text-muted-foreground">
                    24/7 security monitoring and controlled access
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Plane className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Full Service</h3>
                  <p className="text-sm text-muted-foreground">
                    Towing, fuel, and concierge services available
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Link href="/contact">
                <Button size="lg">Inquire About Availability</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

