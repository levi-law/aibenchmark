# AI Backend Benchmark Tester - User Guide

**Purpose:** Test and evaluate your custom AI backends using industry-standard benchmarks from the Hugging Face Open LLM Leaderboard.

**Access:** Login required

---

## Powered by Manus

This application is built with cutting-edge technologies for optimal performance and reliability. The frontend leverages **React 19** with **TypeScript** for type-safe development, styled with **Tailwind CSS 4** for a modern, responsive design, and uses **shadcn/ui** components for a polished user interface. The backend is powered by **tRPC 11** for end-to-end type safety and **Express 4** for robust server-side operations. Data persistence is handled by **Drizzle ORM** with a **MySQL/TiDB** database, ensuring reliable storage of configurations and results. Authentication is seamlessly integrated through **Manus OAuth**, providing secure user management. The entire stack is deployed on **auto-scaling infrastructure with global CDN**, ensuring fast load times and high availability worldwide.

---

## Using Your Website

The AI Backend Benchmark Tester allows you to evaluate your custom AI backends against standardized benchmarks. Start by clicking "Go to Dashboard" from the home page. Once in the dashboard, click "New Configuration" to set up your first benchmark. Enter a descriptive name for your configuration, paste your API endpoint URL (must support OpenAI-compatible `/v1/chat/completions` endpoint), and adjust the timeout and sample count as needed. Select which benchmark tasks you want to run by checking the boxes for HellaSwag, ARC-Easy, TruthfulQA, or MMLU. Click "Create Configuration" to save it.

To run a benchmark, find your saved configuration in the list and click the "Run" button. The benchmark will execute in the background, which may take several minutes depending on your settings. You can monitor progress in the "Recent Benchmark Results" section, where running benchmarks show a pulsing blue indicator. Once completed, click "View Details" to see comprehensive performance metrics broken down by task and metric type, displayed as percentage scores for easy interpretation.

Your configurations and results are automatically saved, allowing you to compare performance across different API endpoints or configuration changes over time. Use the "View" button next to any configuration to see all historical results for that specific setup. Download detailed results in JSON format using the "Download JSON" button on the result detail page for further analysis or record-keeping.

---

## Managing Your Website

Access the Management UI through the collapsible panel on the right side of the screen. The **Dashboard** panel provides real-time status monitoring and analytics for your published site. Use the **Database** panel to directly view and manage benchmark configurations and results stored in your database. The **Settings** panel contains several important sub-sections: **General** for updating your website title and logo, **Domains** for customizing your site's URL or binding custom domains, and **Secrets** for managing environment variables securely.

To publish your site, first ensure you have saved a checkpoint (the system will prompt you if needed). Then click the **Publish** button in the top-right corner of the Management UI header. Your site will be deployed to production with automatic scaling and global CDN distribution.

---

## Next Steps

Talk to Manus AI anytime to request changes or add features. Try running your first benchmark to see how your AI backend performs against industry standards!
