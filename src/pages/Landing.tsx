import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Shield, Code, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Zap, title: "Lightning Fast", description: "Process PDFs in seconds with our optimized preflight engine." },
  { icon: Shield, title: "Accurate Checks", description: "Industry-standard checks for fonts, colors, resolution, bleed, and more." },
  { icon: Code, title: "API-First", description: "RESTful API with comprehensive docs. Integrate in minutes." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with basic preflight checks",
    features: ["50 jobs/month", "1 API key", "Standard checks", "Community support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For teams that need more power",
    features: ["500 jobs/month", "5 API keys", "Advanced checks", "Priority support", "Webhook notifications"],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Unlimited scale for large organizations",
    features: ["Unlimited jobs", "Unlimited API keys", "Custom checks", "Dedicated support", "SLA guarantee", "SSO & SAML"],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PP</span>
            </div>
            <span className="font-semibold text-lg">PrintPreflight</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Button asChild size="sm">
              <Link to="/signup">Sign Up Free</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-24 md:py-32 text-center">
        <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">
          Trusted by 500+ print shops
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Automated PDF Preflight{" "}
          <span className="text-primary">Via API</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Catch print errors before they cost you. PrintPreflight checks fonts, colors, resolution, bleed, and more — all through a simple REST API.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/signup">
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://docs.printpreflight.com" target="_blank" rel="noopener noreferrer">
              View Docs
            </a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why PrintPreflight?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <Card key={f.title} className="border-0 shadow-sm bg-card">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Start free. Upgrade when you need more. No hidden fees.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? "border-primary shadow-lg ring-1 ring-primary/20" : "border shadow-sm"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mt-2 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">PP</span>
            </div>
            <span>PrintPreflight</span>
          </div>
          <p>© 2026 PrintPreflight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
