import { Plane, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plane className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Freedom Aviation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Premium aircraft management and expert flight instruction.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover-elevate cursor-pointer">
                Aircraft Management
              </li>
              <li className="hover-elevate cursor-pointer">
                Flight Instruction
              </li>
              <li className="hover-elevate cursor-pointer">
                Maintenance Coordination
              </li>
              <li className="hover-elevate cursor-pointer">
                Concierge Service
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover-elevate cursor-pointer">Owner Portal</li>
              <li className="hover-elevate cursor-pointer">
                Pricing Calculator
              </li>
              <li className="hover-elevate cursor-pointer">Support</li>
              <li className="hover-elevate cursor-pointer">Contact Us</li>
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
                (720) 555-FREE
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                fly@freedomaviation.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 Freedom Aviation. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover-elevate cursor-pointer">Privacy Policy</span>
            <span className="hover-elevate cursor-pointer">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
