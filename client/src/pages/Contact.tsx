import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Seo, getLocalBusinessJsonLd, getBreadcrumbJsonLd } from "@/components/Seo";
import { brandKeywords } from "@/seo/keywords";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Helmet } from "react-helmet-async";

export default function Contact() {
  const [source, setSource] = useState("contact-page");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get("source");
    const successParam = params.get("success");

    if (successParam === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/contact");
    }

    if (sourceParam) {
      setSource(sourceParam);
      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "source_attribution",
          source: sourceParam,
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Contact Freedom Aviation - Centennial Airport Colorado Aircraft Management"
        description="Contact Freedom Aviation for premium aircraft management and flight instruction at Centennial Airport (KAPA) Colorado. Call (970) 618-2094 or email. Serving Denver and the Front Range."
        keywords={brandKeywords()}
        canonical="/contact"
      />
      {/* Local Business and Breadcrumb Schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(getLocalBusinessJsonLd())}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Contact", url: "/contact" }
          ]))}
        </script>
      </Helmet>

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contact Freedom Aviation
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Our team is ready to help you elevate your aircraft ownership
              experience. Reach out for personalized service and expert
              guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Success Message */}
            {showSuccess && (
              <Alert className="mb-8 border-green-600 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Thank you!</strong> Your message has been sent
                  successfully. We'll get back to you within 24 hours.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you within 24
                    hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    action="https://formsubmit.co/info@freedomaviationco.com"
                    method="POST"
                    className="space-y-4"
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
                      value={`${window.location.origin}/contact?success=true`}
                    />
                    <input type="hidden" name="_template" value="table" />
                    <input type="hidden" name="source" value={source} />

                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Your full name"
                        data-testid="input-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="your@email.com"
                        data-testid="input-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(970) 618-2094"
                        data-testid="input-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        placeholder="Tell us how we can help..."
                        data-testid="textarea-message"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-submit"
                    >
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Get in Touch</CardTitle>
                    <CardDescription>
                      Prefer to reach us directly? Here's how:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Email</div>
                        <a
                          href="mailto:noah@freedomaviationco.com"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-email"
                        >
                          noah@freedomaviationco.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <a
                          href="tel:+19706182094"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-phone"
                        >
                          970-618-2094
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

                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">
                        Business Hours:
                      </strong>
                      <br />
                      Monday - Friday: 8:00 AM - 6:00 PM MT
                      <br />
                      Saturday: 9:00 AM - 4:00 PM MT
                      <br />
                      Sunday: By appointment
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
