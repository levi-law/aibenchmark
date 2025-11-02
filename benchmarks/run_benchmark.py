#!/usr/bin/env python3
"""
Benchmark runner for custom AI backends using HF Open LLM Leaderboard tasks.
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Add benchmarks directory to path to import custom LM
sys.path.insert(0, str(Path(__file__).parent))

def run_benchmarks(
    api_url: str,
    num_samples: int = 50,
    timeout: int = 120,
    tasks: list = None
):
    """
    Run HF Open LLM Leaderboard benchmark subset.
    
    Args:
        api_url: URL of API endpoint
        num_samples: Number of samples per task
        timeout: Request timeout in seconds
        tasks: List of task names to run
    
    Returns:
        dict: Benchmark results or error information
    """
    if tasks is None:
        tasks = ["hellaswag", "arc_easy", "truthfulqa_mc2"]
    
    print("=" * 80, file=sys.stderr)
    print("AI Backend Benchmark", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    print(f"API URL: {api_url}", file=sys.stderr)
    print(f"Samples per task: {num_samples}", file=sys.stderr)
    print(f"Timeout: {timeout}s", file=sys.stderr)
    print(f"Tasks: {', '.join(tasks)}", file=sys.stderr)
    print(file=sys.stderr)
    
    # Initialize custom LM
    print("Initializing custom LM adapter...", file=sys.stderr)
    try:
        from custom_lm import CustomLM
        lm = CustomLM(api_url=api_url, timeout=timeout)
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to initialize LM adapter: {str(e)}"
        }
    print(file=sys.stderr)
    
    # Run evaluation
    print("Starting evaluation...", file=sys.stderr)
    print("-" * 80, file=sys.stderr)
    
    try:
        from lm_eval import evaluator
        
        results = evaluator.simple_evaluate(
            model=lm,
            tasks=tasks,
            num_fewshot=0,  # 0-shot for faster evaluation
            limit=num_samples,  # Limit samples per task
            bootstrap_iters=0,  # Disable bootstrap for speed
        )
        
        print("-" * 80, file=sys.stderr)
        print("\n✓ Evaluation completed successfully!\n", file=sys.stderr)
        
        # Print summary to stderr
        print("=" * 80, file=sys.stderr)
        print("BENCHMARK RESULTS SUMMARY", file=sys.stderr)
        print("=" * 80, file=sys.stderr)
        
        if "results" in results:
            for task_name, task_results in results["results"].items():
                print(f"\n{task_name.upper()}:", file=sys.stderr)
                for metric_name, metric_value in task_results.items():
                    if isinstance(metric_value, (int, float)):
                        print(f"  {metric_name}: {metric_value:.4f}", file=sys.stderr)
        
        print("\n" + "=" * 80, file=sys.stderr)
        
        return {
            "success": True,
            "results": results
        }
        
    except Exception as e:
        print(f"\n✗ Evaluation failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Run AI backend benchmarks")
    parser.add_argument("--api-url", required=True, help="API endpoint URL")
    parser.add_argument("--samples", type=int, default=50, help="Number of samples per task")
    parser.add_argument("--timeout", type=int, default=120, help="Request timeout in seconds")
    parser.add_argument("--tasks", nargs="+", default=None, help="Tasks to run")
    parser.add_argument("--output", help="Output JSON file path")
    
    args = parser.parse_args()
    
    result = run_benchmarks(
        api_url=args.api_url,
        num_samples=args.samples,
        timeout=args.timeout,
        tasks=args.tasks
    )
    
    # Output JSON to stdout
    print(json.dumps(result, indent=2))
    
    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\nResults also saved to: {args.output}", file=sys.stderr)
    
    sys.exit(0 if result.get("success") else 1)
