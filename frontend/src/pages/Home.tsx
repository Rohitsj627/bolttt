import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Sparkles, Code, Rocket } from 'lucide-react';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  const examplePrompts = [
    "Build a modern todo app with React and TypeScript",
    "Create a landing page for a SaaS product",
    "Make a portfolio website with dark mode",
    "Build a simple blog with markdown support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Zap className="w-16 h-16 text-blue-400" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-100 mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Bolt Clone
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Describe your dream website, and watch as AI builds it step by step with live preview and integrated terminal
          </p>
          
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-gray-400">
              <Code className="w-5 h-5" />
              <span className="text-sm">Live Coding</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Rocket className="w-5 h-5" />
              <span className="text-sm">Instant Preview</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">AI Powered</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-800">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to build... Be as specific as possible!"
              className="w-full h-32 p-4 bg-gray-800/50 text-gray-100 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 text-lg"
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              ✨ Generate Website
            </button>
          </div>
        </form>

        <div className="mt-12">
          <p className="text-center text-gray-400 mb-6">Try these examples:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg text-left text-gray-300 hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-200 text-sm"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}