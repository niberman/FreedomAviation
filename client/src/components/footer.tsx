import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/falogo.png";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoImage}
                alt="Freedom Aviation Logo - Aircraft Management Colorado"
                className="h-8 w-auto"
                loading="lazy"
              />
              <span className="font-semibold text-lg">Freedom Aviation</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Premium aircraft management, detailing, and flight instruction at Centennial Airport (KAPA), Colorado.
            </p>
            <p className="text-xs text-muted-foreground">
              Colorado-Based. Front Range Focused.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Aircraft Management
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Aircraft Detailing
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Flight Instruction
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Hangar Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-semibold mb-3">Locations</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/partners/sky-harbour" className="hover:text-primary transition-colors">
                  Sky Harbour KAPA
                </Link>
              </li>
              <li>
                <Link href="/partners/fa-hangar" className="hover:text-primary transition-colors">
                  Freedom Aviation Hangar
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Centennial Airport (KAPA)<br />Englewood, Colorado</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a
                  href="tel:+19706182094"
                  data-testid="link-phone"
                  className="hover:text-primary transition-colors"
                >
                  (970) 618-2094
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a
                  href="mailto:info@freedomaviationco.com"
                  data-testid="link-email"
                  className="hover:text-primary transition-colors"
                >
                  info@freedomaviationco.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Freedom Aviation. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <Link href="/sitemap.xml" className="hover:text-primary transition-colors text-xs">
              Sitemap
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
