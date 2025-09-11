"use client";

import React, { useState, useEffect, FC, ReactNode } from "react";
import {
  ArrowRight,
  Timer,
  Users,
  BarChart3,
  BookOpen,
  Check,
  Play,
  TrendingUp,
  Github,
  Twitter,
  Instagram,
  Flame,
  Activity,
  Coffee,
  Menu,
  LucideProps,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // Assuming this path is correct in your project
import { User } from "@supabase/supabase-js"; // For type safety

// --- TYPE DEFINITIONS ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "lg" | "icon";
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "secondary";
  className?: string;
}

interface Feature {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<LucideProps>;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular: boolean;
}

interface NavLink {
  href: string;
  label: string;
}

// --- SHARED UI COMPONENTS ---

const Button: FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    lg: "h-12 px-8 py-3 text-base",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card: FC<CardProps> = ({ children, className = "" }) => (
  <div
    className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardContent: FC<CardContentProps> = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Badge: FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

// --- PLACEHOLDER COMPONENTS (for Header) ---
// Replace these with your actual component implementations

const DropdownMenu: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="relative">{children}</div>
);
const DropdownMenuTrigger: FC<{ children: ReactNode; asChild?: boolean }> = ({
  children,
}) => <div>{children}</div>;
const DropdownMenuContent: FC<{
  children: ReactNode;
  align?: string;
  side?: string;
  className?: string;
}> = ({ children, className }) => (
  <div className={`absolute right-0 mt-2 ${className}`}>{children}</div>
);

// --- HEADER COMPONENT ---

const Header: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const navLinks: NavLink[] = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
  ];

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/30 supports-[backdrop-filter]:dark:bg-neutral-900/30">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
            <Timer className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Pomigo</span>
        </Link>

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

        {user ? (
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
            <Button onClick={handleSignOut} variant="ghost">
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        )}

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
                  {user ? (
                    <>
                      <Link href="/dashboard" className="w-full">
                        <Button className="w-full">Dashboard</Button>
                      </Link>
                      <Button
                        onClick={handleSignOut}
                        variant="ghost"
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/login" className="w-full">
                        <Button className="w-full">Get Started Free</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

// --- PAGE SECTIONS ---

const Hero: FC = () => (
  <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-background to-muted/20">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(151,192,168,0.1),transparent_50%)]" />
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="text-center lg:text-left space-y-8">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-tight">
              Study Together,
              <br />
              <span className="text-primary">Achieve More</span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Join the social Pomodoro revolution. Study with friends, track
            progress, and turn focus into a shared journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/login">
              <Button size="lg" className="group">
                Start Studying Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-xl" />
            <Card className="relative w-full max-w-sm bg-card/95 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-foreground mb-4 font-mono">
                    25:00
                  </div>
                  <Badge variant="secondary" className="mb-6">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Mathematics
                  </Badge>
                  <Button className="w-full rounded-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Focus Session
                  </Button>
                </div>
                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Friend Activity
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="text-lg">👩‍💻</div>
                      <div className="flex-1 text-sm text-muted-foreground">
                        Sarah completed a 25-min session in Physics.
                      </div>
                      <Flame className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="text-lg">👨‍🎓</div>
                      <div className="flex-1 text-sm text-muted-foreground">
                        Alex is on a roll. Completed 5 sessions.
                      </div>
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="text-lg">☕️</div>
                      <div className="flex-1 text-sm text-muted-foreground">
                        Mike took a 5-minute break.
                      </div>
                      <Coffee className="h-4 w-4 text-primary" />
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
);

const FeaturesSection: FC = () => {
  const features: Feature[] = [
    {
      icon: Timer,
      title: "Smart Pomodoro Timer",
      description:
        "Customizable focus sessions with intelligent break scheduling.",
    },
    {
      icon: Users,
      title: "Study With Friends",
      description:
        "See what your friends are studying and motivate each other.",
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description:
        "Visualize your study habits and maintain your study streaks.",
    },
    {
      icon: BookOpen,
      title: "Subject Organization",
      description: "Organize sessions by subject and track time across topics.",
    },
  ];
  return (
    <section id="features" className="py-24 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything you need to focus
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Pomigo combines proven productivity techniques with social
            accountability to help you build lasting study habits.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm"
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection: FC = () => {
  const steps: Step[] = [
    {
      number: "01",
      title: "Choose Your Focus",
      description:
        "Select a subject and start your personalized Pomodoro timer.",
      icon: Play,
    },
    {
      number: "02",
      title: "Study Together",
      description:
        "See your friends' progress and stay motivated through shared accountability.",
      icon: Users,
    },
    {
      number: "03",
      title: "Track & Improve",
      description:
        "Review your analytics, maintain streaks, and compete in leaderboards.",
      icon: TrendingUp,
    },
  ];
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How Pomigo Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and transform your study habits with the
            power of community.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-4 border-background text-sm font-bold text-foreground flex items-center justify-center shadow-lg">
                  {step.number}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent transform -translate-x-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection: FC = () => {
  const plans: Plan[] = [
    {
      name: "Free Forever",
      price: "$0",
      period: "always",
      features: [
        "Basic Pomodoro Timer",
        "Subject Tracking",
        "Up to 5 Friends",
        "Simple Analytics",
        "Community Support",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "Coming Soon",
      period: "",
      features: [
        "Everything in Free",
        "Unlimited Friends",
        "Advanced Analytics",
        "Custom Themes",
      ],
      cta: "Get Notified",
      popular: true,
    },
  ];
  return (
    <section id="pricing" className="py-24 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Start Free, Upgrade When Ready
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pomigo is free forever. Powerful pro features are coming soon for
            those who want to take their productivity to the next level.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative h-full transition-all duration-300 hover:shadow-lg ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Coming Soon
                </Badge>
              )}
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground ml-1">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={plan.popular}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer: FC = () => (
  <footer className="py-16 bg-background border-t border-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Pomigo</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
        <div className="flex space-x-2">
          {[Twitter, Instagram, Github].map((Icon, index) => (
            <a
              key={index}
              href="#"
              className="w-10 h-10 rounded-lg bg-muted hover:bg-accent transition-colors flex items-center justify-center"
              aria-label={`Social media link ${index + 1}`}
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
      <div className="pt-8 mt-8 border-t border-border text-center">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Pomigo. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

// --- MAIN PAGE COMPONENT ---

const PomigoLandingPage: FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default PomigoLandingPage;
