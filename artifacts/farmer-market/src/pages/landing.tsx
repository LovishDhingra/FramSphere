import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Shield, TrendingUp, MapPin, MessageSquare, ArrowRight, CheckCircle, Sprout, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Exploitation Detection",
    description: "Instantly spot if a trader is offering below-fair prices using live mandi data and MSP benchmarks.",
  },
  {
    icon: TrendingUp,
    title: "Price Intelligence",
    description: "Track real-time prices across 88+ mandis in 20 states. Know the best time and place to sell.",
  },
  {
    icon: MapPin,
    title: "Market Finder",
    description: "Find the highest-paying market near you using GPS. We show mandis within 200 km of your location.",
  },
  {
    icon: MessageSquare,
    title: "AI Kisan Advisor",
    description: "Ask any farming or market question in plain language. Get expert advice powered by AI, 24/7.",
  },
];

const benefits = [
  "Compare offers against MSP and mandi modal prices",
  "Get 7-day price forecasts with weather impact",
  "Instant exploitation anomaly alerts",
  "Discover government schemes you qualify for",
  "State-wise and crop-wise price explorer",
];

const hindiQuotes = [
  {
    quote: "उत्तम खेती, मध्यम बान, निकृष्ट चाकरी, भीख निदान।",
    meaning: "Farming is the best livelihood; let no farmer beg.",
  },
  {
    quote: "किसान अन्नदाता है, धरती का असली रक्षक।",
    meaning: "The farmer is the food-giver, the true guardian of the earth.",
  },
  {
    quote: "मेहनत की रोटी सबसे मीठी होती है।",
    meaning: "Bread earned through hard work is the sweetest.",
  },
  {
    quote: "खेत मेरा मंदिर है, फसल मेरी पूजा।",
    meaning: "The farm is my temple; the harvest is my prayer.",
  },
  {
    quote: "बिना मेहनत के फसल नहीं, बिना फसल के जीवन नहीं।",
    meaning: "No crop without toil; no life without crop.",
  },
  {
    quote: "जो भूमि से प्यार करे, वही असली किसान है।",
    meaning: "One who loves the land is the true farmer.",
  },
];

function HindiQuoteCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % hindiQuotes.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + hindiQuotes.length) % hindiQuotes.length);
  const next = () => setCurrent((c) => (c + 1) % hindiQuotes.length);

  return (
    <div className="relative bg-primary/5 border border-primary/15 rounded-2xl px-8 py-8 text-center overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none text-8xl flex items-center justify-center">
        🌾
      </div>
      <p className="text-xl md:text-2xl font-bold text-primary leading-relaxed mb-3 relative z-10">
        "{hindiQuotes[current].quote}"
      </p>
      <p className="text-sm text-muted-foreground italic relative z-10">{hindiQuotes[current].meaning}</p>
      <div className="flex items-center justify-center gap-3 mt-5 relative z-10">
        <button onClick={prev} className="p-1.5 rounded-full hover:bg-primary/10 transition-colors">
          <ChevronLeft className="h-4 w-4 text-primary" />
        </button>
        <div className="flex gap-1.5">
          {hindiQuotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-primary" : "w-1.5 bg-primary/30"}`}
            />
          ))}
        </div>
        <button onClick={next} className="p-1.5 rounded-full hover:bg-primary/10 transition-colors">
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-foreground">Farm Sphere</h1>
              <p className="text-xs text-muted-foreground">किसान पहले, हमेशा</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="font-medium">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-primary/20">
          <Sprout className="h-4 w-4" />
          AI-Powered for Indian Farmers
        </div>
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight mb-4">
          Protect Your Harvest,{" "}
          <span className="text-primary">Maximize Your Profit</span>
        </h2>
        <p className="text-base text-primary/80 font-semibold italic mb-2">
          "हर किसान की आवाज़, हर फसल का साथ"
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Farm Sphere gives you real-time mandi prices, exploitation alerts, AI-powered advice, and market recommendations — all in one platform built for Indian farmers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/sign-up">
            <Button size="lg" className="text-base px-8 h-12 font-semibold gap-2">
              Start for Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="text-base px-8 h-12 font-semibold">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">No credit card required · Free forever</p>
      </section>

      {/* Hindi Quotes Carousel */}
      <section className="py-12 px-6 bg-card border-t border-b">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-2xl">🌾</span>
            <h3 className="text-lg font-semibold text-foreground mt-2">किसानों के लिए प्रेरणा</h3>
            <p className="text-sm text-muted-foreground">Wisdom from the fields of India</p>
          </div>
          <HindiQuoteCarousel />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-3 text-foreground">Everything a Farmer Needs</h3>
          <p className="text-center text-muted-foreground mb-12">One platform to track prices, detect fraud, and grow smarter.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border rounded-xl p-6 flex gap-4 hover:border-primary/40 transition-colors">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{f.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-card border-t">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h3 className="text-3xl font-bold mb-4 text-foreground">Why Farmers Choose Farm Sphere</h3>
            <p className="text-muted-foreground mb-8">Live data from 88+ mandis across India gives you an edge that middlemen don't want you to have.</p>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex flex-col gap-4 items-center">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center w-full max-w-xs">
              <div className="text-5xl font-extrabold text-primary mb-2">88+</div>
              <div className="text-sm font-medium text-foreground">Mandis Covered</div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="bg-background border rounded-xl p-5 text-center">
                <div className="text-3xl font-extrabold text-primary mb-1">20</div>
                <div className="text-xs text-muted-foreground">States</div>
              </div>
              <div className="bg-background border rounded-xl p-5 text-center">
                <div className="text-3xl font-extrabold text-primary mb-1">10+</div>
                <div className="text-xs text-muted-foreground">Major Crops</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-primary text-primary-foreground text-center">
        <p className="text-primary-foreground/70 text-base font-medium italic mb-2">"खेत मेरा मंदिर है, फसल मेरी पूजा" 🌾</p>
        <h3 className="text-3xl font-bold mb-3">Ready to Take Back Control?</h3>
        <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">Join thousands of farmers who use Farm Sphere to sell smarter and protect their income.</p>
        <Link href="/sign-up">
          <Button size="lg" variant="secondary" className="text-base px-10 h-12 font-semibold gap-2">
            Create Your Free Account
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 Farm Sphere · Kisan Helpline:{" "}
          <span className="font-semibold text-foreground">1800-180-1551</span>
        </p>
      </footer>
    </div>
  );
}
