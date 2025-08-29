"use client";
import { useEffect, useState } from "react";
import { Timer, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Navigation links configuration
const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    setUser(null);
  };

  return (
    <header
      className="
        sticky top-0 z-50 w-full 
        border-b border-border 
        bg-white/40 dark:bg-neutral-900/40 
        backdrop-blur-xl 
        supports-[backdrop-filter]:bg-white/30 
        supports-[backdrop-filter]:dark:bg-neutral-900/30
      "
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
            <Timer className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Pomigo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        {user ? (
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
            <Button onClick={handleSignOut} variant="ghost">
              Sign Out
            </Button>
            <ThemeToggle />
          </div>
        ) : (
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started Free</Button>
            </Link>
            <ThemeToggle />
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              side="bottom"
              className="mt-2 w-screen rounded-none border-t border-border bg-white/90 px-4 py-4 backdrop-blur-md dark:bg-neutral-900/90"
            >
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="border-t border-border pt-4 flex flex-col gap-3">
                  <Button variant="ghost" className="w-full">
                    Sign In
                  </Button>
                  <Button className="w-full">Get Started Free</Button>
                </div>

                <div className="flex justify-center pt-2">
                  <ThemeToggle />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
