import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowLeft, Loader2, Download } from "lucide-react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";

export default function ResultDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const resultId = parseInt(id || "0");

  const { data: result, isLoading } = trpc.benchmarkResult.getById.useQuery(
    { id: resultId },
    { enabled: isAuthenticated && resultId > 0 }
  );

  const downloadResults = () => {
    if (!result?.results) return;
    
    const dataStr = JSON.stringify(result.results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `benchmark-result-${result.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Result Not Found</CardTitle>
            <CardDescription>The requested benchmark result could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
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
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Benchmark Result Details</h2>
          <p className="text-muted-foreground">
            Run completed on {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Status</CardTitle>
                <CardDescription>Current state of the benchmark run</CardDescription>
              </div>
              {result.status === 'completed' && result.results && (
                <Button onClick={downloadResults} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  result.status === 'completed' ? 'bg-green-500' :
                  result.status === 'running' ? 'bg-blue-500 animate-pulse' :
                  result.status === 'failed' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}></span>
                <span className="text-lg font-semibold capitalize">{result.status}</span>
              </div>
              {result.errorMessage && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Error:</p>
                  <p className="text-sm text-destructive/80 mt-1">{result.errorMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {result.status === 'completed' && result.results && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Scores across all benchmark tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.results.results ? (
                    <div className="space-y-6">
                      {Object.entries(result.results.results).map(([taskName, taskResults]: [string, any]) => (
                        <div key={taskName} className="border-b last:border-b-0 pb-4 last:pb-0">
                          <h4 className="font-semibold text-lg mb-3 capitalize">
                            {taskName.replace(/_/g, ' ')}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(taskResults).map(([metricName, metricValue]: [string, any]) => {
                              if (typeof metricValue === 'number') {
                                return (
                                  <div key={metricName} className="bg-accent/50 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {metricName.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                      {(metricValue * 100).toFixed(2)}%
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No detailed metrics available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuration Details</CardTitle>
                  <CardDescription>Parameters used for this benchmark run</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.results.config && (
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-medium">{result.results.config.model || 'Custom API'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Tasks</span>
                        <span className="font-medium">
                          {result.results.config.tasks?.join(', ') || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Limit</span>
                        <span className="font-medium">{result.results.config.limit || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Num Fewshot</span>
                        <span className="font-medium">{result.results.config.num_fewshot || 0}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {result.status === 'running' && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Benchmark is currently running...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take several minutes depending on the number of samples and tasks.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
