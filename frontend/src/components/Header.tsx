import React from 'react';
import { Zap, Terminal as TerminalIcon, Settings } from 'lucide-react';

interface HeaderProps {
  prompt: string;
  onToggleTerminal: () => void;
  terminalVisible: boolean;
}

export function Header({ prompt, onToggleTerminal, terminalVisible }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-100">Bolt Clone</h1>
          </div>
          <div className="h-6 w-px bg-gray-600" />
          <div className="max-w-md">
            <p className="text-sm text-gray-400 truncate">{prompt}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTerminal}
            className={`p-2 rounded-lg transition-colors ${
              terminalVisible
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title="Toggle Terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}