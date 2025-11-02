import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, Plus, Play, Trash2, Eye, Loader2 } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    apiUrl: "",
    timeout: 120,
    numSamples: 50,
    tasks: {
      hellaswag: true,
      arc_easy: true,
      truthfulqa_mc2: true,
      mmlu_abstract_algebra: false,
    }
  });

  const utils = trpc.useUtils();
  const { data: configs, isLoading: configsLoading } = trpc.benchmarkConfig.list.useQuery();
  const { data: results, isLoading: resultsLoading } = trpc.benchmarkResult.list.useQuery();

  const createConfig = trpc.benchmarkConfig.create.useMutation({
    onSuccess: () => {
      toast.success("Configuration created successfully");
      utils.benchmarkConfig.list.invalidate();
      setIsCreateOpen(false);
      setFormData({
        name: "",
        apiUrl: "",
        timeout: 120,
        numSamples: 50,
        tasks: {
          hellaswag: true,
          arc_easy: true,
          truthfulqa_mc2: true,
          mmlu_abstract_algebra: false,
        }
      });
    },
    onError: (error) => {
      toast.error(`Failed to create configuration: ${error.message}`);
    }
  });

  const deleteConfig = trpc.benchmarkConfig.delete.useMutation({
    onSuccess: () => {
      toast.success("Configuration deleted");
      utils.benchmarkConfig.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const runBenchmark = trpc.benchmarkResult.run.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.benchmarkResult.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to start benchmark: ${error.message}`);
    }
  });

  const handleCreateConfig = () => {
    const selectedTasks = Object.entries(formData.tasks)
      .filter(([_, enabled]) => enabled)
      .map(([task]) => task);

    if (selectedTasks.length === 0) {
      toast.error("Please select at least one benchmark task");
      return;
    }

    createConfig.mutate({
      name: formData.name,
      apiUrl: formData.apiUrl,
      timeout: formData.timeout,
      numSamples: formData.numSamples,
      tasks: selectedTasks
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">{APP_TITLE}</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" onClick={() => logout()}>Sign Out</Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Manage your benchmark configurations and view results</p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Benchmark Configurations</CardTitle>
                <CardDescription>Create and manage your API endpoint configurations</CardDescription>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Configuration
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Benchmark Configuration</DialogTitle>
                    <DialogDescription>
                      Configure your AI backend endpoint and benchmark parameters
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Configuration Name</Label>
                      <Input
                        id="name"
                        placeholder="My AI Backend"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiUrl">API Endpoint URL</Label>
                      <Input
                        id="apiUrl"
                        type="url"
                        placeholder="https://api.example.com"
                        value={formData.apiUrl}
                        onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must support OpenAI-compatible /v1/chat/completions endpoint
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeout">Timeout (seconds)</Label>
                        <Input
                          id="timeout"
                          type="number"
                          min="10"
                          max="600"
                          value={formData.timeout}
                          onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numSamples">Samples per Task</Label>
                        <Input
                          id="numSamples"
                          type="number"
                          min="1"
                          max="1000"
                          value={formData.numSamples}
                          onChange={(e) => setFormData({ ...formData, numSamples: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Benchmark Tasks</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="hellaswag"
                            checked={formData.tasks.hellaswag}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, tasks: { ...formData.tasks, hellaswag: checked as boolean } })
                            }
                          />
                          <label htmlFor="hellaswag" className="text-sm font-medium">
                            HellaSwag - Commonsense reasoning
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="arc_easy"
                            checked={formData.tasks.arc_easy}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, tasks: { ...formData.tasks, arc_easy: checked as boolean } })
                            }
                          />
                          <label htmlFor="arc_easy" className="text-sm font-medium">
                            ARC-Easy - Grade-school science
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="truthfulqa_mc2"
                            checked={formData.tasks.truthfulqa_mc2}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, tasks: { ...formData.tasks, truthfulqa_mc2: checked as boolean } })
                            }
                          />
                          <label htmlFor="truthfulqa_mc2" className="text-sm font-medium">
                            TruthfulQA - Truthfulness evaluation
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="mmlu"
                            checked={formData.tasks.mmlu_abstract_algebra}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, tasks: { ...formData.tasks, mmlu_abstract_algebra: checked as boolean } })
                            }
                          />
                          <label htmlFor="mmlu" className="text-sm font-medium">
                            MMLU (Abstract Algebra) - Multitask understanding
                          </label>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleCreateConfig} 
                      disabled={createConfig.isPending}
                      className="w-full"
                    >
                      {createConfig.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Configuration"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : configs && configs.length > 0 ? (
                <div className="space-y-3">
                  {configs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">{config.apiUrl}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {config.tasks.length} tasks • {config.numSamples} samples • {config.timeout}s timeout
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => runBenchmark.mutate({ configId: config.id })}
                          disabled={runBenchmark.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/results/${config.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteConfig.mutate({ id: config.id })}
                          disabled={deleteConfig.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No configurations yet. Create your first one to get started!
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Benchmark Results</CardTitle>
              <CardDescription>View your latest benchmark runs</CardDescription>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : results && results.length > 0 ? (
                <div className="space-y-3">
                  {results.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            result.status === 'completed' ? 'bg-green-500' :
                            result.status === 'running' ? 'bg-blue-500 animate-pulse' :
                            result.status === 'failed' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}></span>
                          <span className="font-medium capitalize">{result.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(result.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {result.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/result/${result.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No benchmark results yet. Run your first benchmark to see results here!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
