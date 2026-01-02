import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Youtube, 
  Instagram, 
  Facebook, 
  Mic, 
  Video, 
  BarChart3, 
  Calendar,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" role="document">
      {/* Minimal SSR-friendly meta injection hook via data attributes (no-op if hydrated) */}
      <div hidden id="page-seo"
           data-title="CreatorAI Studio – AI-Powered Content Creation"
           data-description="Generate scripts, voiceovers, thumbnails, schedule posts, and analyze performance with AI." />
      {/* Header */}
      <header className="border-b border-white/20 bg-white/10 backdrop-blur-sm" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">CreatorAI Studio</h1>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="main-content" className="py-24 px-4" role="main" aria-label="Hero">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Content Creation
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Create Viral Content with{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Magic
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform for content creators. Generate scripts, create videos, 
              discover trending niches, and scale your social media presence with AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-lg px-8 py-6"
              >
                Start Creating for Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>
            <nav aria-label="Help" className="text-sm text-blue-700 space-x-4">
              <Link href="/docs" className="underline hover:no-underline">Documentation</Link>
              <Link href="/faq" className="underline hover:no-underline">FAQ</Link>
              <Link href="/privacy" className="underline hover:no-underline">Privacy</Link>
              <Link href="/terms" className="underline hover:no-underline">Terms</Link>
            </nav>

            {/* Social Platform Icons */}
            <div className="flex justify-center items-center gap-8 mt-4">
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                title="YouTube"
                className="group inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Youtube aria-hidden="true" className="w-5 h-5 text-red-500 group-hover:text-red-600" />
                <span className="text-sm font-medium leading-none">YouTube</span>
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="group inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Instagram aria-hidden="true" className="w-5 h-5 text-pink-500 group-hover:text-pink-600" />
                <span className="text-sm font-medium leading-none">Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="group inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Facebook aria-hidden="true" className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
                <span className="text-sm font-medium leading-none">Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-white/50 backdrop-blur-sm" aria-label="Features">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Go Viral
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From idea generation to publishing, we've got every step of your content creation journey covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <CardTitle>AI Video Generation</CardTitle>
                <CardDescription>
                  Create faceless videos with AI-generated scripts, voiceovers, and visuals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <CardTitle>AI Voiceovers</CardTitle>
                <CardDescription>
                  Generate professional voiceovers with natural-sounding AI voices
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Niche Discovery</CardTitle>
                <CardDescription>
                  Find profitable niches and trending topics using AI and public data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Schedule and publish content across all platforms automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Track performance and monetization metrics across platforms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Multi-Platform</CardTitle>
                <CardDescription>
                  Connect YouTube, Instagram, Facebook, and more from one dashboard
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4" aria-label="Stats">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10M+</div>
              <div className="text-gray-600">Videos Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-gray-600">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$2M+</div>
              <div className="text-gray-600">Revenue Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-primary to-secondary" aria-label="Call to action">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Scale Your Content Creation?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of creators who are already using AI to grow their audience and revenue.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100"
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white" role="contentinfo">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">CreatorAI Studio</h1>
          </div>
          <p className="text-gray-400">
            © 2025 CreatorAI Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
