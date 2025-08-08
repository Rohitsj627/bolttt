import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Terminal } from '../components/Terminal';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const { webcontainer, loading: webContainerLoading } = useWebContainer();

  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [sidebarTab, setSidebarTab] = useState<'files' | 'chat'>('files');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [terminalVisible, setTerminalVisible] = useState(false);
  
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({status}) => status === "pending").forEach(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? [];
        let currentFileStructure = [...originalFiles];
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);
  
          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }
  
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }
    });

    if (updateHappened) {
      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }
      }))
    }
  }, [steps]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          mountStructure[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
  
        return mountStructure[file.name];
      };
  
      files.forEach(file => processFile(file, true));
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
  
    if (webcontainer && Object.keys(mountStructure).length > 0) {
      console.log("Mounting files to WebContainer...");
      webcontainer.mount(mountStructure);
    }
  }, [files, webcontainer]);

  async function init() {
    console.log("Starting initialization with prompt:", prompt);
    
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
    
    console.log("Template response:", response.data);
    setTemplateSet(true);
    
    const {prompts, uiPrompts} = response.data;

    setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: "pending"
    })));

    console.log("Sending chat request...");
    setLoading(true);
    
    try {
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...prompts, prompt].map(content => ({
          role: "user",
          content
        }))
      });
      
      console.log("Chat response received:", stepsResponse.data);

      setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
        ...x,
        status: "pending" as "pending"
      }))]);

      setLlmMessages([...prompts, prompt].map(content => ({
        role: "user",
        content
      })));

      setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}]);
      
      // Add initial chat message
      setChatMessages([{
        role: 'assistant',
        content: `I've created your project based on: "${prompt}". You can now ask me to modify or enhance it!`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Error in chat request:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSendMessage = async (message: string) => {
    const newMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setLoading(true);

    try {
      const llmMessage = {
        role: "user" as "user",
        content: message
      };

      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...llmMessages, llmMessage]
      });

      setLlmMessages(x => [...x, llmMessage]);
      setLlmMessages(x => [...x, {
        role: "assistant",
        content: stepsResponse.data.response
      }]);
      
      setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
        ...x,
        status: "pending" as "pending"
      }))]);

      const assistantMessage: Message = {
        role: 'assistant',
        content: "I've updated your project based on your request!",
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prompt) {
      init();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header 
        prompt={prompt} 
        onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
        terminalVisible={terminalVisible}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          files={files}
          onFileSelect={setSelectedFile}
          onSendMessage={handleSendMessage}
          messages={chatMessages}
          loading={loading}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
        />
        
        <div className="flex-1 flex flex-col p-6 gap-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-gray-800 text-gray-100 border border-gray-700'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-gray-800 text-gray-100 border border-gray-700'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              Preview
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'code' ? (
              <CodeEditor file={selectedFile} />
            ) : (
              <PreviewFrame webContainer={webcontainer!} files={files} />
            )}
          </div>
        </div>
      </div>
      
      <Terminal 
        webContainer={webcontainer}
        isVisible={terminalVisible}
        onToggle={() => setTerminalVisible(!terminalVisible)}
      />
    </div>
  );
}