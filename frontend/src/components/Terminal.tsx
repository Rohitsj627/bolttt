import React, { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Terminal as TerminalIcon, X, Minimize2, Maximize2 } from 'lucide-react';

interface TerminalProps {
  webContainer?: WebContainer;
  isVisible: boolean;
  onToggle: () => void;
}

export function Terminal({ webContainer, isVisible, onToggle }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('/home/project');

  const executeCommand = async (command: string) => {
    if (!webContainer || !command.trim()) return;

    setOutput(prev => [...prev, `$ ${command}`]);
    
    try {
      const process = await webContainer.spawn('sh', ['-c', command]);
      
      let commandOutput = '';
      process.output.pipeTo(new WritableStream({
        write(data) {
          commandOutput += data;
        }
      }));

      const exitCode = await process.exit;
      
      if (commandOutput) {
        setOutput(prev => [...prev, commandOutput]);
      }
      
      if (exitCode !== 0) {
        setOutput(prev => [...prev, `Command exited with code ${exitCode}`]);
      }
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 transition-all duration-300 ${
      isMinimized ? 'h-12' : 'h-80'
    } z-50`}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Terminal</span>
          <span className="text-xs text-gray-500">{currentDirectory}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="h-full flex flex-col">
          <div
            ref={terminalRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-300 bg-gray-900"
          >
            {output.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {line}
              </div>
            ))}
          </div>
          <div className="flex items-center px-4 py-2 bg-gray-800 border-t border-gray-700">
            <span className="text-green-400 mr-2">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent text-gray-300 outline-none font-mono text-sm"
              placeholder="Enter command..."
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}