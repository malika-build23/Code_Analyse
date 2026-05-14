# CodeReviewAI ⚡

An AI-powered code review tool built with React + Vite that analyzes your code for bugs, performance issues, and improvements — instantly.

![CodeReviewAI](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-blue?style=flat-square) ![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square) ![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square)

---

## Features

- **Code Quality Score** — Get an instant score out of 100 with a letter grade (A–F)
- **Bug Detection** — Identifies bugs with severity levels (critical / high / medium / low) and line numbers
- **Performance Analysis** — Time and space complexity with Big O notation
- **Category Breakdown** — Scores across Correctness, Performance, Readability, Security, and Best Practices
- **Suggested Improvements** — Before/after code comparisons for actionable fixes
- **Optimized Code** — A fully rewritten, corrected version of your code ready to copy or use
- **10 Languages Supported** — JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, Swift
- **Clean Dark UI** — Minimal, distraction-free interface with smooth animations

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/codereview-ai.git
cd codereview-ai
```

### 2. Get a Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key

### 3. Add your API key to `.env`

Create a `.env` file in the root of the project:

```bash
touch .env
```

Open it and add your key:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore` by default with Vite.

### 4. Install dependencies

```bash
npm install
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage

1. Paste your code into the editor on the left
2. Select the programming language from the panel on the right
3. Click **Analyze Code**
4. Review your results:
   - **Overview** — Score, grade, complexity, strengths, and issues
   - **Bugs tab** — Each bug with severity, line number, and a suggested fix
   - **Improvements tab** — Refactoring suggestions with before/after code
   - **Optimized Code tab** — Copy or load the fully improved version back into the editor

---

## Project Structure

```
codereview-ai/
├── src/
│   ├── App.jsx        # Main application component
│   └── main.jsx       # React entry point
├── index.html
├── .env               # Your API key goes here (create this)
├── .gitignore
├── package.json
└── vite.config.js
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key from AI Studio |

---

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **Google Gemini 2.5 Flash** — AI model for code analysis
- **IBM Plex Mono + Outfit** — Typography
- **Pure CSS-in-JS** — No external UI library

---

## License

MIT
