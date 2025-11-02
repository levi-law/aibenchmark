#!/usr/bin/env python3
"""
Benchmark runner for custom AI backends using HF Open LLM Leaderboard tasks.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# Add benchmarks directory to path to import custom LM
sys.path.insert(0, str(Path(__file__).parent))

from lm_eval import evaluator
from custom_lm import CustomLM


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
    
    print("=" * 80)
    print("AI Backend Benchmark")
    print("=" * 80)
    print(f"API URL: {api_url}")
    print(f"Samples per task: {num_samples}")
    print(f"Timeout: {timeout}s")
    print(f"Tasks: {', '.join(tasks)}")
    print()
    
    # Initialize custom LM
    print("Initializing custom LM adapter...")
    try:
        lm = CustomLM(api_url=api_url, timeout=timeout)
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to initialize LM adapter: {str(e)}"
        }
    print()
    
    # Run evaluation
    print("Starting evaluation...")
    print("-" * 80)
    
    try:
        results = evaluator.simple_evaluate(
            model=lm,
            tasks=tasks,
            num_fewshot=0,  # 0-shot for faster evaluation
            limit=num_samples,  # Limit samples per task
            bootstrap_iters=0,  # Disable bootstrap for speed
        )
        
        print("-" * 80)
        print("\n✓ Evaluation completed successfully!\n")
        
        # Print summary
        print("=" * 80)
        print("BENCHMARK RESULTS SUMMARY")
        print("=" * 80)
        
        if "results" in results:
            for task_name, task_results in results["results"].items():
                print(f"\n{task_name.upper()}:")
                for metric_name, metric_value in task_results.items():
                    if isinstance(metric_value, (int, float)):
                        print(f"  {metric_name}: {metric_value:.4f}")
        
        print("\n" + "=" * 80)
        
        return {
            "success": True,
            "results": results
        }
        
    except Exception as e:
        print(f"\n✗ Evaluation failed: {e}")
        import traceback
        traceback.print_exc()
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
    
    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\nResults saved to: {args.output}")
    else:
        print("\n" + json.dumps(result, indent=2))
    
    sys.exit(0 if result.get("success") else 1)
