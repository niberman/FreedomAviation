'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ContactPage() {
  const searchParams = useSearchParams();
  const [source, setSource] = useState('contact-page');
  const [showSuccess, setShowSuccess] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Set origin for form redirect
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    const sourceParam = searchParams.get('source');
    const successParam = searchParams.get('success');

    if (successParam === 'true') {
      setShowSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', '/contact');
    }

    if (sourceParam) {
      setSource(sourceParam);
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'source_attribution',
          source: sourceParam,
        });
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 bg-background">
        {/* Hero Header */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Contact Freedom Aviation
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Our team is ready to help you elevate your aircraft ownership
                experience. Reach out for personalized service and expert
                guidance.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form and Info */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              {/* Success Message */}
              {showSuccess && (
                <Alert className="mb-8 border-green-600 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Thank you!</strong> Your message has been sent
                    successfully. We&apos;ll get back to you within 24 hours.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
                {/* Contact Form */}
                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-xl">Send us a message</CardTitle>
                    <CardDescription className="text-sm">
                      Fill out the form below and we&apos;ll get back to you within 24
                      hours.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <form
                      action="https://formsubmit.co/info@freedomaviationco.com"
                      method="POST"
                      className="space-y-3 sm:space-y-4"
                      data-testid="form-contact"
                    >
                      <input
                        type="hidden"
                        name="_subject"
                        value="Freedom Aviation Inquiry"
                      />
                      <input type="hidden" name="_captcha" value="false" />
                      <input
                        type="hidden"
                        name="_next"
                        value={`${origin}/contact?success=true`}
                      />
                      <input type="hidden" name="_template" value="table" />
                      <input type="hidden" name="source" value={source} />

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="name" className="text-sm">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          placeholder="Your full name"
                          data-testid="input-name"
                          className="h-11 sm:h-10"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="your@email.com"
                          data-testid="input-email"
                          className="h-11 sm:h-10"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="phone" className="text-sm">Phone (optional)</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(720)-310-0443"
                          data-testid="input-phone"
                          className="h-11 sm:h-10"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="message" className="text-sm">Message</Label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          rows={5}
                          placeholder="Tell us how we can help..."
                          data-testid="textarea-message"
                          className="min-h-[120px]"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 sm:h-10 text-base"
                        data-testid="button-submit"
                      >
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-lg sm:text-xl">Get in Touch</CardTitle>
                      <CardDescription className="text-sm">
                        Prefer to reach us directly? Here&apos;s how:
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">Email</div>
                          <a
                            href="mailto:info@freedomaviationco.com"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            data-testid="link-email"
                          >
                            info@freedomaviationco.com
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">Phone</div>
                          <a
                            href="tel:+17203100443"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            data-testid="link-phone"
                          >
                            (720) 310-0443
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">Location</div>
                          <div className="text-muted-foreground">
                            Centennial Airport (KAPA)
                            <br />
                            Englewood, Colorado
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

