# GitHub Portfolio Analyzer & Enhancer 🚀

> **"Turn your GitHub profile into a recruiter magnet."**

A powerful, AI-driven tool designed specifically for **students and early-career developers** to analyze their GitHub portfolios, identify red flags, and get actionable, recruiter-focused feedback.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-orange) ![GraphQL](https://img.shields.io/badge/GitHub-GraphQL-pink)

---

## 🎯 The Problem

Most student portfolios fail to get interviews because:

- ❌ **They look generic** (class projects, tutorial clones).
- ❌ **They lack documentation** (recruiters skip repos without READMEs).
- ❌ **They show no impact** (just code, no "what/why/how").
- ❌ **They lack consistency** (bursts of commits vs. steady habits).

Recruiters spend **<60 seconds** on a profile. If they don't see value immediately, they move on.

## ✨ The Solution

This isn't just a stats viewer. It's an **intelligent career coach** that:

1.  **🕵️ Detects your profile type** (Student, Professional, or Open Source Contributor).
2.  **⚖️ Adjusts scoring logic** based on your level (e.g., students aren't penalized for lacking 10k stars).
3.  **🧠 Uses Gemini 1.5 Flash AI** to read your code and give _specific_ advice (e.g., "Add a demo link to repo X").
4.  **⚡ Optimizes for speed** using GitHub GraphQL API (analyzing full profiles in seconds).

---

## 🚀 Key Features

### 1. **Student-Centric Scoring Engine** 🎓

Unlike other tools that just count stars, we analyze **6 key dimensions** weighted for potential:

| Dimension                | Weight | Why It Matters                                    |
| ------------------------ | ------ | ------------------------------------------------- |
| **Code Quality**         | 20%    | Clean code, TS habits, linting setup.             |
| **Project Impact**       | 20%    | detailed READMEs, demo links, "Why I built this". |
| **Current & Active**     | 20%    | Recent commits, not just old forks.               |
| **Production Readiness** | 15%    | CI/CD, tests, ENV handling.                       |
| **Technical Skill**      | 15%    | Framework variety, complexity.                    |
| **Community Trust**      | 10%    | PRs, issues, collaboration.                       |

_Scores are auto-adjusted: A student with good READMEs can score higher than a senior dev with empty repos._

### 2. **AI-Powered Analysis (Gemini 1.5 Flash)** 🤖

We don't just say "Fix your docs." We say:

> _"Your 'E-commerce-App' is a strong project but lacks a live demo. Deploy it to Vercel and add the link to the description to boost your Impact score by 15 points."_

### 3. **Smart & Efficient Data Fetching** ⚡

- **GraphQL-First Architecture**: Fetches user, repos, commits, and file trees in **2-3 API calls** (vs ~130+ widely used by other tools).
- **Auto-Fallback**: Automatically switches to REST API if GraphQL fails or is blocked.
- **Resilient**: Works even with strict rate limits.

### 4. **Recruiter-Ready Insights** 👔

- **Red Flag Detection**: Warns about "tutorial hell" (only forks), "ghost town" (no recent activity), or "mystery code" (no docs).
- **Quick Wins**: Tasks you can do in <30 mins to boost your score immediately.

### 5. **Advanced GitHub Stats & Metrics** 📊

- **Global Activity**: Total commits, PRs, issues, and contributions across all repositories.
- **Streak Tracking**: Visualizes current and longest contribution streaks to show consistency.
- **Language Breakdown**: "Most Used Languages" graph to showcase technical breadth.

### 6. **Gamified Profile Badges** 🏆

- **Smart Classification**: Auto-detects if you're a **Student**, **Pro**, or **Open Source Contributor**.
- **Achievement Unlocks**: Displays GitHub achievements like "Pull Shark", "YOLO", and "Quickdraw".
- **"AI Roast" Mode**: A sarcastic, fun analysis tag that gives you a reality check (e.g., _"The Fork Collector"_).

### 7. **Export to PDF Report** 📄

- **One-Click Download**: Turn your analysis into a professional, clean PDF report.
- **Print-Optimized**: Automatic styling removes UI elements for a distraction-free document.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Data Fetching**: GitHub GraphQL API + Octokit (REST fallback)
- **AI Model**: Google Gemini 1.5 Flash
- **Deployment**: Vercel

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- GitHub Personal Access Token (`public_repo` scope)
- Google Gemini API Key (Free tier works great)

### Steps

1. **Clone & Install**

   ```bash
   git clone https://github.com/Md-Juned-45/GitHub-Portfolio-Analyzer-Enhancer.git
   cd GitHub-Portfolio-Analyzer-Enhancer
   npm install
   ```

2. **Configure Environment**
   Create a `.env.local` file:

   ```env
   # Get from https://github.com/settings/tokens
   GITHUB_TOKEN=your_github_pat_here
   # Optional: Comma-separated tokens to multiply rate limits (Layer 4)
   GITHUB_TOKENS=token1,token2,token3

   # Get from https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_key_here
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to start analyzing!

---

## 🤝 Contributing

Built with ❤️ for the **UnsaidTalks Hackathon**.
We welcome PRs! Please check the [Project Board](https://github.com/users/Md-Juned-45/projects/1) for open issues.

## 📄 License

MIT License. Free for everyone to use and learn from.

---

<div align="center">
  <strong>⭐ Star this repo if it helped you land an interview! ⭐</strong>
</div>
