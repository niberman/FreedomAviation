'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { isStaffRole } from '@/lib/roles';
import Image from 'next/image';

export function NavBar() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Check if user is admin or CFI
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    retry: false,
  });

  const isStaff = isStaffRole(userProfile?.role ?? null);
  const isDev = process.env.NODE_ENV !== 'production';
  const showStaffLink = isDev || isStaff;

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    try {
      await signOut();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to log out',
      });
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/hangars', label: 'Hangars' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href) ?? false;
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Auth buttons component
  const AuthButtons = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (loading) return null;

    const buttonClass = isMobile ? 'w-full justify-start' : '';
    const buttonSize = isMobile ? undefined : 'sm';

    if (user) {
      return (
        <>
          {/* Only show owner dashboard for non-staff users */}
          {!isStaff && (
            <Link href="/dashboard" onClick={closeMobileMenu}>
              <Button
                variant="outline"
                size={buttonSize}
                className={buttonClass}
              >
                <User className="h-4 w-4 mr-2" />
                My Dashboard
              </Button>
            </Link>
          )}
          {showStaffLink && (
            <Link href="/admin" onClick={closeMobileMenu}>
              <Button
                variant="outline"
                size={buttonSize}
                className={`${buttonClass} ${isMobile ? 'mb-2' : ''}`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Staff Portal
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size={buttonSize}
            className={buttonClass}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </>
      );
    }

    return (
      <>
        {isDev && (
          <Link href="/dashboard" onClick={closeMobileMenu}>
            <Button
              variant="outline"
              size={buttonSize}
              className={`${buttonClass} ${isMobile ? 'mb-2' : ''}`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Staff (Dev)
            </Button>
          </Link>
        )}
        <Link href="/login" onClick={closeMobileMenu}>
          <Button
            variant="default"
            size={buttonSize}
            className={isMobile ? 'w-full' : ''}
          >
            Login
          </Button>
        </Link>
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/images/falogo.png"
              alt="Freedom Aviation"
              width={32}
              height={32}
              className="h-7 sm:h-8 w-auto"
              style={{ width: 'auto' }}
            />
            <span className="font-semibold text-base sm:text-lg hidden sm:inline-block">
              Freedom Aviation
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  className="h-9"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side: Auth & Theme */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center gap-2">
              <AuthButtons />
            </div>

            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMobileMenu}>
                <Button
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  className="w-full justify-start h-11 text-base"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="pt-2 border-t space-y-1">
              <AuthButtons isMobile />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
