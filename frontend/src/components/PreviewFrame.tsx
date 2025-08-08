import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

interface PreviewFrameProps {
  files: any[];
  webContainer?: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startPreview() {
    if (!webContainer) {
      console.log("WebContainer not available");
      return;
    }
    
    if (files.length === 0) {
      console.log("No files to preview");
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("Starting preview setup...");
      
      // Check if package.json exists
      const hasPackageJson = files.some(file => 
        file.name === 'package.json' || 
        (file.children && file.children.some((child: any) => child.name === 'package.json'))
      );

      if (!hasPackageJson) {
        setError("No package.json found in project files");
        setLoading(false);
        return;
      }

      console.log("Installing dependencies...");
      const installProcess = await webContainer.spawn('npm', ['install']);

      let installOutput = "";
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          installOutput += data;
          console.log("Install:", data);
        }
      }));

      const installExitCode = await installProcess.exit;
      
      if (installExitCode !== 0) {
        console.error('Failed to install dependencies. Exit code:', installExitCode);
        console.error('Install output:', installOutput);
        setError(`Failed to install dependencies (exit code: ${installExitCode})`);
        setLoading(false);
        return;
      }
      
      console.log("Dependencies installed successfully, starting dev server...");
      
      // Start the dev server
      const devProcess = await webContainer.spawn('npm', ['run', 'dev']);
      
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('Dev server output:', data);
        }
      }));

      // Listen for server-ready event
      webContainer.on('server-ready', (port, url) => {
        console.log('Server ready on port:', port, 'URL:', url);
        setUrl(url);
        setLoading(false);
      });

      // Set a timeout in case server-ready event doesn't fire
      setTimeout(() => {
        if (!url && loading) {
          console.log("Timeout waiting for server, trying default URL");
          setUrl("http://localhost:5173");
          setLoading(false);
        }
      }, 10000);

    } catch (err) {
      console.error('Error starting preview:', err);
      setError(`Error starting preview: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }

  const refreshPreview = () => {
    setUrl("");
    startPreview();
  };

  useEffect(() => {
    if (webContainer && files.length > 0) {
      startPreview();
    }
  }, [webContainer, files.length]);

  if (!webContainer) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 rounded-lg border border-gray-800">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">Initializing WebContainer</p>
          <p className="text-sm">Setting up the development environment...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 rounded-lg border border-gray-800">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <p className="text-lg font-medium mb-2">Ready to build</p>
          <p className="text-sm">Your preview will appear here once you generate some code</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 rounded-lg border border-gray-800">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-400 mb-2">Preview Error</p>
          <p className="text-sm text-gray-400 mb-4 max-w-md">{error}</p>
          <button 
            onClick={refreshPreview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 rounded-lg border border-gray-800">
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">Building your project</p>
          <p className="text-sm">Installing dependencies and starting dev server...</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 rounded-lg border border-gray-800">
        <div className="text-center text-gray-400">
          <div className="animate-pulse w-12 h-12 bg-gray-800 rounded-lg mx-auto mb-4"></div>
          <p className="text-lg font-medium mb-2">Starting dev server</p>
          <p className="text-sm">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-400 font-mono">{url}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPreview}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(url, '_blank')}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      <iframe 
        src={url} 
        className="w-full h-[calc(100%-40px)] border-0"
        title="Preview"
        onError={() => setError("Failed to load preview")}
      />
    </div>
  );
}