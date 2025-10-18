import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/freedom-aviation-logo.png";

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoImage}
                alt="Freedom Aviation"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg">Freedom Aviation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Premium aircraft management
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/#services"
                  data-testid="link-aircraft-management"
                  className="hover-elevate block"
                >
                  Aircraft Management
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  data-testid="link-flight-instruction"
                  className="hover-elevate block"
                >
                  Flight Instruction
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  data-testid="link-maintenance"
                  className="hover-elevate block"
                >
                  Maintenance Coordination
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  data-testid="link-concierge"
                  className="hover-elevate block"
                >
                  Concierge Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/dashboard"
                  data-testid="link-owner-portal"
                  className="hover-elevate block"
                >
                  Owner Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/contact?source=footer_pricing"
                  data-testid="link-pricing-calculator"
                  className="hover-elevate block"
                >
                  Pricing Calculator
                </Link>
              </li>
              <li>
                <a
                  href="mailto:info@freedomaviationco.com"
                  data-testid="link-support"
                  className="hover-elevate block"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@freedomaviationco.com"
                  data-testid="link-contact"
                  className="hover-elevate block"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Centennial Airport (KAPA)
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a
                  href="tel:9706182094"
                  data-testid="link-phone"
                  className="hover-elevate"
                >
                  (970) 618-2094
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:info@freedomaviationco.com"
                  data-testid="link-email"
                  className="hover-elevate"
                >
                  info@freedomaviationco.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 Freedom Aviation. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              data-testid="link-privacy"
              className="hover-elevate"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              data-testid="link-terms"
              className="hover-elevate"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
