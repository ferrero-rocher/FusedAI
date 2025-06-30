"use client"

import { useState, useRef, useEffect } from "react";
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import React from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import * as FaIcons from 'react-icons/fa';

const TABS = ["Frontend", "Backend"] as const;
type Tab = typeof TABS[number];

function extractHTMLFromCode(code: string) {
  // Remove triple backticks and language tags
  let cleaned = code.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '');
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  // Convert className to class
  cleaned = cleaned.replace(/className=/g, 'class=');
  // Extract the first <div>...</div> block
  const divMatch = cleaned.match(/<div[\s\S]*?<\/div>/);
  if (divMatch) {
    return divMatch[0];
  }
  // Fallback: return cleaned string
  return cleaned;
}

function parseOpenAIResponse(response: string) {
  // Try to extract jsx, tsx, or js block in order
  let jsxMatch = response.match(/```jsx[\s\S]*?```/);
  if (!jsxMatch) jsxMatch = response.match(/```tsx[\s\S]*?```/);
  if (!jsxMatch) jsxMatch = response.match(/```js[\s\S]*?```/);
  let jsxCode = jsxMatch ? jsxMatch[0].replace(/```[a-zA-Z]*\n?|```/g, '').replace(/^\/\/.*\n/, '').trim() : '';
  // If still not found, try to find the first code block that is not css
  if (!jsxCode) {
    const blocks = [...response.matchAll(/```([a-zA-Z]*)\n([\s\S]*?)```/g)];
    for (const [, lang, code] of blocks) {
      if (lang !== 'css') {
        jsxCode = code.replace(/^\/\/.*\n/, '').trim();
        break;
      }
    }
  }
  // Extract css block
  const cssMatch = response.match(/```css[\s\S]*?```/);
  let cssCode = cssMatch ? cssMatch[0].replace(/```css\n?|```/g, '').replace(/^\/\/.*\n/, '').trim() : '';
  return { jsxCode, cssCode };
}

function getSandpackFilesWithTailwind(response: string) {
  const { jsxCode, cssCode } = parseOpenAIResponse(response);
  let appCode = jsxCode;

  if (appCode) {
    // If there is CSS and it's not already imported, add the import
    if (cssCode && !/import .\/styles\.css/.test(appCode)) {
      appCode = `import './styles.css';\n${appCode}`;
    }
  } else {
    // Fallback: Hello world
    appCode = `export default function App() { return <h1>Hello world</h1>; }`;
  }

  return {
    '/App.js': appCode,
    ...(cssCode ? { '/styles.css': cssCode } : {}),
    '/index.js': `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './index.css';\nconst root = createRoot(document.getElementById('root'));\nroot.render(<App />);`,
    '/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,
    '/tailwind.config.js': `module.exports = { content: ['./App.js'], theme: { extend: {} }, plugins: [] }`,
    '/postcss.config.js': `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`,
    '/package.json': JSON.stringify({ dependencies: { react: '18.2.0', 'react-dom': '18.2.0', tailwindcss: '^3.4.1', autoprefixer: '^10.0.0', postcss: '^8.0.0', 'react-icons': '^4.12.0', bootstrap: '^5.3.3' } }),
  };
}

function IframePreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.1/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-transparent">
          ${extractHTMLFromCode(code).replace(/className=/g, 'class=')}
        </body>
        </html>
      `);
      doc.close();
    }
  }, [code]);
  return (
    <iframe
      ref={iframeRef}
      title="Live Preview"
      className="w-full min-h-[200px] rounded-xl border border-gray-200 shadow-inner bg-white"
      sandbox="allow-scripts allow-same-origin"
      style={{ background: 'transparent' }}
    />
  );
}

function cleanJSXForLive(jsxCode: string) {
  // Remove lines that start with // or are empty
  return jsxCode
    .split('\n')
    .filter(line => !line.trim().startsWith('//') && line.trim() !== '')
    .join('\n');
}

function prepareLiveCode(jsxCode: string) {
  const cleaned = jsxCode
    .split('\n')
    .filter(line =>
      !line.trim().startsWith('import') &&
      !line.trim().startsWith('export') &&
      !line.trim().startsWith('//') &&
      line.trim() !== ''
    )
    .join('\n');

  // Try to find a component definition
  const match = cleaned.match(/(?:const|function)\s+(\w+)\s*[=\(]/);
  if (match) {
    // Only keep the component definition and append a default export
    return `${cleaned}\nexport default ${match[1]};`;
  }
  // Otherwise, assume it's just JSX and wrap in a default export function
  return `export default function App() { return (${cleaned}); }`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Frontend");
  const [prompt, setPrompt] = useState({ Frontend: "", Backend: "" });
  const [output, setOutput] = useState({ Frontend: "", Backend: "" });
  const [loading, setLoading] = useState({ Frontend: false, Backend: false });
  const [error, setError] = useState({ Frontend: "", Backend: "" });

  const handleTabClick = (tab: Tab) => setActiveTab(tab);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt((prev) => ({ ...prev, [activeTab]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError((prev) => ({ ...prev, [activeTab]: "" }));
    setLoading((prev) => ({ ...prev, [activeTab]: true }));

    if (activeTab === "Frontend") {
      try {
        const res = await fetch("http://localhost:8000/api/generate-ui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.Frontend }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to generate code");
        }
        const data = await res.json();
        setOutput((prev) => ({ ...prev, Frontend: data.code }));
      } catch (err: any) {
        setError((prev) => ({ ...prev, Frontend: err.message || "Unknown error" }));
        setOutput((prev) => ({ ...prev, Frontend: "" }));
      } finally {
        setLoading((prev) => ({ ...prev, Frontend: false }));
      }
    } else {
      // Backend tab: call /api/generate-endpoint, include frontend code and prompt as context
      try {
        // Add frontend code and prompt as context for the backend prompt
        const frontendContext = output.Frontend
          ? `\n\n[Frontend prompt]\n${prompt.Frontend}\n\n[Frontend code]\n${output.Frontend}\n\n`
          : '';
        const backendPromptWithContext = frontendContext + prompt.Backend;
        const res = await fetch("http://localhost:8000/api/generate-endpoint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: backendPromptWithContext }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to generate code");
        }
        const data = await res.json();
        setOutput((prev) => ({ ...prev, Backend: data.code }));
      } catch (err: any) {
        setError((prev) => ({ ...prev, Backend: err.message || "Unknown error" }));
        setOutput((prev) => ({ ...prev, Backend: "" }));
      } finally {
        setLoading((prev) => ({ ...prev, Backend: false }));
      }
    }
  };

  // Prepare liveCode for react-live preview
  const liveCode = prepareLiveCode(parseOpenAIResponse(output.Frontend).jsxCode);
  console.log('Live code for preview:', liveCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-pink-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">FusedAI</h1>
        </div>
        <p className="text-gray-500 text-center max-w-md">Experiment with your Frontend and Backend prompts in a beautiful, unified interface.</p>
      </header>

      <main className="w-full max-w-4xl bg-white/90 rounded-2xl shadow-2xl p-8 backdrop-blur-md border border-blue-100">
        {/* Tab Buttons */}
        <div className="flex mb-8 border-b border-gray-200 relative">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`relative px-8 py-3 font-semibold focus:outline-none transition-all duration-200
                ${activeTab === tab
                  ? "text-blue-700"
                  : "text-gray-400 hover:text-blue-500"}
              `}
              onClick={() => handleTabClick(tab)}
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
              role="tab"
              type="button"
            >
              {activeTab === tab && (
                <span className="absolute left-1/2 -bottom-[1.5px] -translate-x-1/2 w-2/3 h-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 shadow-md animate-fadeIn" />
              )}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === "Backend" && output.Frontend && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              <strong>Note:</strong> The backend code generator is aware of your current frontend code and prompt. You can reference the login form or any UI you generated above in your backend prompt!
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5" id={`tabpanel-${activeTab}`}>
            <label className="block text-gray-700 font-medium mb-1 text-lg">
              {activeTab} Prompt
            </label>
            <textarea
              className="w-full min-h-[90px] border border-blue-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-y bg-blue-50/60 shadow-inner transition-all duration-200 placeholder:text-gray-400"
              placeholder={`Enter your ${activeTab.toLowerCase()} prompt...`}
              value={prompt[activeTab]}
              onChange={handlePromptChange}
              disabled={loading[activeTab]}
              required
            />
            <button
              type="submit"
              className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={loading[activeTab] || !prompt[activeTab].trim()}
            >
              {loading[activeTab] ? (
                <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Submitting...</span>
              ) : (
                "Submit"
              )}
            </button>
          </form>

          {/* Error Message */}
          {error[activeTab] && (
            <div className="mt-4 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error[activeTab]}
            </div>
          )}

          {/* Code Viewer */}
          <div className="mt-7">
            <label className="block text-gray-700 font-medium mb-1 text-lg">Generated Code</label>
            <div className="bg-gray-900 rounded-xl p-4 shadow-inner border border-gray-700">
              <pre className="w-full min-h-[200px] max-h-[400px] overflow-auto text-green-400 font-mono text-sm leading-relaxed">
                {output[activeTab] || <span className="text-gray-500">No code generated yet.</span>}
              </pre>
            </div>
          </div>

          {/* Live Preview - Frontend Tab Only */}
          {activeTab === "Frontend" && output.Frontend && (
            <div className="mt-7">
              <label className="block text-gray-700 font-medium mb-1 text-lg">Live Preview</label>
              <Sandpack
                template="react"
                files={getSandpackFilesWithTailwind(output.Frontend)}
                options={{
                  showTabs: false,
                  showLineNumbers: true,
                  showInlineErrors: true,
                  editorHeight: 300,
                  editorWidthPercentage: 60,
                  wrapContent: true,
                  previewHeight: 350,
                }}
                customSetup={{
                  dependencies: {
                    react: "18.2.0",
                    "react-dom": "18.2.0",
                    tailwindcss: "^3.4.1",
                    autoprefixer: "^10.0.0",
                    postcss: "^8.0.0",
                    "react-icons": "^4.12.0"
                  },
                }}
              />
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  );
} 