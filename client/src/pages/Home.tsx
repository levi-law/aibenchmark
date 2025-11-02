import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Zap, BarChart3, Shield } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <nav className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">{APP_TITLE}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </nav>

        <main className="container py-16">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Test Your AI Backend Performance
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Run standardized benchmarks on your custom AI backends using industry-standard evaluation tasks from the Hugging Face Open LLM Leaderboard.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Benchmarking
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Easy Configuration</CardTitle>
                <CardDescription>
                  Simply provide your API endpoint URL and configure benchmark parameters through an intuitive interface.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Comprehensive Results</CardTitle>
                <CardDescription>
                  Get detailed performance metrics across multiple benchmark tasks including HellaSwag, ARC-Easy, and TruthfulQA.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Save & Compare</CardTitle>
                <CardDescription>
                  Store your benchmark configurations and results for easy comparison and historical tracking.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Supported Benchmarks</CardTitle>
                <CardDescription>Industry-standard evaluation tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-semibold">HellaSwag</h4>
                    <p className="text-sm text-muted-foreground">Commonsense reasoning about physical situations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-semibold">ARC-Easy</h4>
                    <p className="text-sm text-muted-foreground">Grade-school level science questions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-semibold">TruthfulQA</h4>
                    <p className="text-sm text-muted-foreground">Multiple-choice questions testing truthfulness</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-semibold">MMLU</h4>
                    <p className="text-sm text-muted-foreground">Multitask language understanding across various subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="container max-w-4xl text-center px-4">
        <Activity className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {APP_TITLE}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Professional benchmarking platform for AI backends. Test your custom LLM endpoints with industry-standard evaluation tasks.
        </p>
        <Button size="lg" className="text-lg px-8 py-6" asChild>
          <a href={getLoginUrl()}>Sign In to Get Started</a>
        </Button>
      </div>
    </div>
  );
}
