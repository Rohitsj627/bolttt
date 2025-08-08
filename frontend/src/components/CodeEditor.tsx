import React from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';
import { Code2 } from 'lucide-react';

interface CodeEditorProps {
  file: FileItem | null;
}

export function CodeEditor({ file }: CodeEditorProps) {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-950 rounded-lg border border-gray-800">
        <div className="text-center">
          <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No file selected</p>
          <p className="text-sm">Select a file from the explorer to view its contents</p>
        </div>
      </div>
    );
  }

  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="h-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {file.type === 'folder' ? '📁' : '📄'}
          </span>
          <span className="text-sm text-gray-300 font-medium">{file.name}</span>
          <span className="text-xs text-gray-500">{file.path}</span>
        </div>
      </div>
      <Editor
        height="calc(100% - 40px)"
        language={getLanguage(file.name)}
        theme="vs-dark"
        value={file.content || ''}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          selectOnLineNumbers: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
}