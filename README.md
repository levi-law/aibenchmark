# AI Backend Benchmark Tester

A full-featured web application for testing and evaluating custom AI backends using industry-standard benchmarks from the Hugging Face Open LLM Leaderboard.

## Features

- **Easy Configuration**: Simple GUI for setting up API endpoints and benchmark parameters
- **Multiple Benchmarks**: Support for HellaSwag, ARC-Easy, TruthfulQA, and MMLU evaluation tasks
- **Background Execution**: Benchmarks run asynchronously with real-time status tracking
- **Results Visualization**: Comprehensive performance metrics displayed as percentage scores
- **Historical Tracking**: Save and compare results across different configurations
- **Export Functionality**: Download detailed results in JSON format
- **User Authentication**: Secure access with Manus OAuth integration

## Tech Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components
- tRPC 11 for type-safe API calls
- Wouter for routing

### Backend
- Express 4 server
- tRPC 11 for end-to-end type safety
- Drizzle ORM with MySQL/TiDB database
- Python 3.11 for benchmark execution
- lm-evaluation-harness for standardized benchmarks

## Prerequisites

- Node.js 22.x
- Python 3.11
- pnpm package manager
- MySQL/TiDB database

## Installation

1. Clone the repository:
```bash
git clone https://github.com/levi-law/aibenchmark.git
cd aibenchmark
```

2. Install Node.js dependencies:
```bash
pnpm install
```

3. Install Python dependencies:
```bash
pip3 install lm-eval requests
```

4. Set up environment variables (create `.env` file):
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
OAUTH_SERVER_URL=your_oauth_server_url
VITE_OAUTH_PORTAL_URL=your_oauth_portal_url
VITE_APP_ID=your_app_id
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=your_owner_name
```

5. Push database schema:
```bash
pnpm db:push
```

6. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Create Configuration**: Click "New Configuration" and enter your API endpoint details
2. **Select Benchmarks**: Choose which evaluation tasks to run (HellaSwag, ARC-Easy, etc.)
3. **Run Benchmark**: Click "Run" to start the evaluation process
4. **View Results**: Monitor progress and view detailed metrics once completed
5. **Export Data**: Download results in JSON format for further analysis

## API Requirements

Your AI backend must support OpenAI-compatible `/v1/chat/completions` endpoint with the following format:

```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "max_tokens": 1024,
  "temperature": 0.0
}
```

## Benchmark Tasks

- **HellaSwag**: Commonsense reasoning about physical situations
- **ARC-Easy**: Grade-school level science questions
- **TruthfulQA**: Multiple-choice questions testing truthfulness
- **MMLU**: Multitask language understanding across various subjects

## Project Structure

```
├── benchmarks/          # Python benchmark scripts
│   ├── custom_lm.py    # Custom LM adapter
│   └── run_benchmark.py # Benchmark runner
├── client/             # Frontend React application
│   └── src/
│       ├── pages/      # Page components
│       └── components/ # Reusable UI components
├── server/             # Backend Express + tRPC
│   ├── routers.ts      # API routes
│   └── db.ts           # Database queries
├── drizzle/            # Database schema and migrations
└── shared/             # Shared types and constants
```

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm db:push` - Push database schema changes
- `pnpm lint` - Run linter
- `pnpm test` - Run tests

## License

Apache License 2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
