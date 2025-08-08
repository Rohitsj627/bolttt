import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (webContainer && files.length > 0) {
      startPreview();
    }
  }, [webContainer, files.length]); // Only depend on files.length to avoid infinite loops

  if (!webContainer) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p>WebContainer is loading...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p>No files to preview</p>
          <p className="text-sm mt-2">Generate some code first</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        <div className="text-center">
          <p>Preview Error:</p>
          <p className="text-sm mt-2">{error}</p>
          <button 
            onClick={startPreview}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Setting up preview...</p>
          <p className="text-sm mt-2">Installing dependencies and starting dev server</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p>Waiting for dev server to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <iframe 
        src={url} 
        className="w-full h-full border-0 rounded"
        title="Preview"
        onError={() => setError("Failed to load preview")}
      />
    </div>
  );
}