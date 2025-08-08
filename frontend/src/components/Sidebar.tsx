import React from 'react';
import { FileExplorer } from './FileExplorer';
import { ChatInterface } from './ChatInterface';
import { FileItem } from '../types';

interface SidebarProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onSendMessage: (message: string) => Promise<void>;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  loading: boolean;
  activeTab: 'files' | 'chat';
  onTabChange: (tab: 'files' | 'chat') => void;
}

export function Sidebar({
  files,
  onFileSelect,
  onSendMessage,
  messages,
  loading,
  activeTab,
  onTabChange
}: SidebarProps) {
  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => onTabChange('files')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'bg-gray-800 text-gray-100 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          Files
        </button>
        <button
          onClick={() => onTabChange('chat')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-gray-800 text-gray-100 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' ? (
          <div className="p-4 h-full">
            <FileExplorer files={files} onFileSelect={onFileSelect} />
          </div>
        ) : (
          <div className="p-4 h-full">
            <ChatInterface
              onSendMessage={onSendMessage}
              messages={messages}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}