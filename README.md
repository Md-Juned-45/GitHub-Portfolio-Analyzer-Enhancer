# GitHub Portfolio Analyzer & Enhancer

> **Turn your repositories into recruiter-ready proof**

A powerful AI-powered tool that analyzes GitHub profiles and provides actionable, recruiter-focused feedback to help students and early-career developers improve their portfolio.

🔗 **[Live Demo](#)** | 📹 **[Video Walkthrough](#)**

![GitHub Portfolio Analyzer Banner](https://via.placeholder.com/1200x400/1a1b26/ffffff?text=GitHub+Portfolio+Analyzer)

---

## 🎯 The Problem

For many students and developers, GitHub is their primary portfolio. Yet most profiles fail to communicate real skill, impact, or consistency to recruiters due to:

- ❌ Incomplete READMEs and poor documentation
- ❌ Unclear project structure and organization
- ❌ No understanding of what recruiters actually look for
- ❌ Lack of objective feedback on portfolio quality
- ❌ Projects that don't signal real-world relevance

**A strong GitHub profile opens doors. A weak one silently closes them.**

---

## ✨ Our Solution

This tool provides:

1. **📊 Objective GitHub Portfolio Score (0-100)** - Data-driven assessment across 6 key dimensions
2. **🚨 Red Flag Detection** - Identifies critical issues recruiters notice immediately
3. **💡 AI-Powered Insights** - Gemini 2.0 generates specific, actionable suggestions
4. **⚡ Quick Wins** - High-impact improvements you can make in under 1 hour
5. **👔 Recruiter Perspective** - See exactly what hiring managers see in 60 seconds

---

## 🚀 Key Features

### 1. **6-Dimension Scoring System**

Each dimension includes:

- Score (0-100)
- Weight in overall score
- Specific feedback
- **"Why it matters to recruiters"** explanation

| Dimension                      | Weight | What We Analyze                                     |
| ------------------------------ | ------ | --------------------------------------------------- |
| 📄 **Documentation Quality**   | 20%    | README presence, length, quality in top repos       |
| 🏗️ **Code Structure**          | 15%    | Repository organization, descriptions, topics       |
| 📈 **Activity Consistency**    | 20%    | Commit frequency, recency, active development       |
| 📌 **Repository Organization** | 15%    | Pinned repos, profile bio, repo descriptions        |
| 🌟 **Project Impact**          | 15%    | Stars, original work vs forks, real-world relevance |
| 💻 **Technical Depth**         | 15%    | Language diversity, modern frameworks, complexity   |

### 2. **Red Flag Detection**

Automatically identifies deal-breakers:

- Missing READMEs in visible repos
- Dormant accounts (6+ months inactive)
- Only forked repositories (no original work)
- No pinned repositories
- Portfolio dilution (too many trivial repos)

### 3. **AI-Powered Actionable Suggestions**

Using **Google Gemini 2.0**, we generate:

- 5-7 specific, prioritized improvement suggestions
- **Not generic advice** - mentions actual repo names and specific actions
- Ranked by **Impact/Effort ratio** (Quick Wins first)
- Time estimates for each suggestion (e.g., "30 minutes", "2 hours")

### 4. **Recruiter Preview Mode**

See what a recruiter sees in their first 60 seconds:

- First impression summary
- Top strengths that stand out
- Concerns or red flags
- Overall hiring signal

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **APIs**:
  - GitHub REST API + GraphQL (via Octokit)
  - Google Gemini 2.0 Flash Exp (AI analysis)
- **Deployment**: Vercel

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- GitHub Personal Access Token ([Get one here](https://github.com/settings/tokens))
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/Md-Juned-45/GitHub-Portfolio-Analyzer-Enhancer.git
   cd GitHub-Portfolio-Analyzer-Enhancer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your API keys:

   ```env
   # GitHub Personal Access Token (needs 'public_repo' scope)
   GITHUB_TOKEN=your_github_token_here

   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

---

## 🎥 Demo Video

> **📹 [Watch the 5-minute walkthrough](#)**

The demo video covers:

1. **Problem Statement** - Why GitHub profiles fail to impress recruiters (30s)
2. **Solution Overview** - What the tool does (1 min)
3. **Live Analysis** - Analyzing a real GitHub profile (3 min)
4. **Key Differentiators** - How we stand out vs existing tools (30s)

---

## 📸 Screenshots

### Landing Page

![Landing Page](https://via.placeholder.com/800x500/1a1b26/ffffff?text=Landing+Page)

### Analysis Results

![Results Page](https://via.placeholder.com/800x500/1a1b26/ffffff?text=Analysis+Results)

### Score Breakdown

![Score Dimensions](https://via.placeholder.com/800x500/1a1b26/ffffff?text=Score+Dimensions)

---

## 🎯 Differentiation Strategy

Unlike existing GitHub analyzers (GitSight, GitLook, etc.), we focus on:

1. **✅ Recruiter-Specific Scoring** - Each dimension explicitly explains "why recruiters care"
2. **✅ Brutal Honesty** - "Archive this repo" instead of generic "improve documentation"
3. **✅ Priority Matrix** - Suggestions ranked by High Impact/Low Effort first
4. **✅ Red Flag Callouts** - Explicitly name deal-breakers recruiters notice
5. **✅ Specific Feedback** - Mentions actual repo names, not vague advice

**Example Generic Feedback**: "Your profile could use more documentation."  
**Our Feedback**: "Repo `hello-world` has no README. Recruiters will skip it in 3 seconds. Archive it or spend 15 minutes adding a README with: problem, tech stack, and demo link."

---

## 📊 How We Score

### Scoring Logic Example: Documentation Quality

```typescript
// Check README presence in top repos (50 points)
const topRepos =
  pinnedRepos.length > 0 ? pinnedRepos : repositories.slice(0, 3);
const topReposNoReadme = topRepos.filter((r) => !r.has_readme);

if (topReposNoReadme.length >= 2) {
  // RED FLAG: Missing READMEs in visible repos
}

// Check README quality (50 points)
const qualityReadmes = topRepos.filter(
  (r) => r.has_readme && r.readme_length > 500,
);
score += (qualityReadmes.length / topRepos.length) * 50;
```

This transparent logic helps users understand **exactly** why their score is what it is.

---

## 🧠 AI Analysis

We use **Gemini 2.0 Flash Exp** with a carefully crafted prompt that:

1. Provides complete context (repos, metrics, current scores, red flags)
2. Requests **specific, actionable feedback** (no generic advice)
3. Demands **brutally honest recruiter perspective**
4. Returns structured JSON with:
   - Profile summary (2 sentences)
   - Recruiter perspective (100 words)
   - Quick wins (under 1 hour each)
   - 5-7 prioritized suggestions with impact/effort/time estimates

**Fallback**: If AI fails, we use rule-based suggestions from red flags and low-scoring dimensions.

---

## 🔜 Future Enhancements

- [ ] **Before/After Comparison** - Show score improvement after implementing suggestions
- [ ] **Role-Specific Filtering** - Frontend vs Backend vs Full-Stack lens
- [ ] **PDF Export** - Downloadable report for applications
- [ ] **Live Rescoring** - Real-time score updates as changes are made
- [ ] **Integration with LinkedIn** - Cross-validate portfolio with LinkedIn profile

---

## 👥 Contributing

This project was built for the **GitHub Portfolio Analyzer & Enhancer Hackathon** by [UnsaidTalks](https://unsaidtalks.com/).

Contributions, issues, and feature requests are welcome!

---

## 📄 License

MIT License - feel free to use this tool to improve your GitHub portfolio!

---

## 🙏 Acknowledgments

- **GitHub API** - For comprehensive repository data
- **Google Gemini** - For powerful AI-driven insights
- **UnsaidTalks** - For organizing this hackathon
- **Next.js & Vercel** - For amazing developer experience

---

## 📧 Contact

**Built by**: [Your Name]  
**GitHub**: [@Md-Juned-45](https://github.com/Md-Juned-45)  
**Hackathon**: GitHub Portfolio Analyzer & Enhancer by UnsaidTalks

---

<div align="center">
  <strong>⭐ If this tool helped you, consider starring the repo!</strong>
</div>
