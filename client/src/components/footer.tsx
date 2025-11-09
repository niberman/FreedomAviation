import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/falogo.png";

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Staff
            </Button>
          </Link>
        </div>
      </div>
    </footer>
  );
}
