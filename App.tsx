import React, { useState, useRef, useCallback } from 'react';
import { Button } from './components/Button';
import { CopyResult } from './components/CopyResult';
import { calculateMD5, modifyFileMD5 } from './utils/fileUtils';
import { generateViralCopy } from './services/geminiService';
import { ProcessedFile, AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [fileData, setFileData] = useState<ProcessedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copyVersions, setCopyVersions] = useState<string[]>([]);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    
    setState(AppState.PROCESSING);
    setCopyVersions([]); // Reset previous copy
    
    try {
      // 1. Calculate Original MD5
      const originalHash = await calculateMD5(file);
      
      // 2. Modify File and Calculate New MD5
      const { blob: modifiedBlob, hash: modifiedHash } = await modifyFileMD5(file);
      
      setFileData({
        originalFile: file,
        originalHash,
        modifiedBlob,
        modifiedHash,
        fileName: file.name
      });
      
      setState(AppState.DONE);
    } catch (error) {
      console.error(error);
      alert("Error processing file.");
      setState(AppState.IDLE);
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDownload = () => {
    if (!fileData?.modifiedBlob) return;
    
    const url = URL.createObjectURL(fileData.modifiedBlob);
    const link = document.createElement('a');
    link.href = url;
    // Prepend "new_" to filename
    link.download = `new_${fileData.fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateCopy = async () => {
    if (!fileData) return;
    setGeneratingCopy(true);
    try {
      const text = await generateViralCopy(fileData.fileName);
      // Split by the separator we defined in the prompt
      const versions = text.split('||VERSION_SPLIT||').map(v => v.trim()).filter(v => v.length > 0);
      setCopyVersions(versions);
    } catch (e) {
      alert("AI generation failed. Please check your API key.");
    } finally {
      setGeneratingCopy(false);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setFileData(null);
    setCopyVersions([]);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col items-center">
      <header className="mb-12 text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
          MD5 Modifier
        </h1>
        <p className="text-gray-600 text-lg">
          Change your file's digital fingerprint instantly without damaging content.
          <br/>
          <span className="text-sm text-pink-500 font-medium">✨ Plus: AI-powered social media caption generator included!</span>
        </p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Tool */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8">
            {state === AppState.IDLE && (
              <div 
                className={`
                  border-4 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
                  ${dragActive ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400 hover:bg-white/50'}
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  className="hidden" 
                  onChange={handleChange} 
                />
                <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Upload or Drop File</h3>
                <p className="text-gray-500 text-sm">Supports images, videos, archives</p>
              </div>
            )}

            {state === AppState.PROCESSING && (
              <div className="text-center py-16">
                 <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-gray-600 font-medium">Calculating Hashes...</p>
              </div>
            )}

            {state === AppState.DONE && fileData && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Result</h3>
                  <button onClick={reset} className="text-sm text-gray-500 hover:text-red-500 underline">Start Over</button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">File Name</p>
                    <p className="text-gray-800 truncate font-mono">{fileData.fileName}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-xs text-red-400 uppercase tracking-wider font-bold mb-1">Old MD5</p>
                        <p className="text-gray-800 font-mono text-sm break-all">{fileData.originalHash}</p>
                     </div>
                     
                     <div className="flex flex-col items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                     </div>

                     <div className="bg-green-50 p-4 rounded-xl border border-green-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg">NEW</div>
                        <p className="text-xs text-green-600 uppercase tracking-wider font-bold mb-1">New MD5</p>
                        <p className="text-gray-900 font-mono text-base font-bold break-all">{fileData.modifiedHash}</p>
                     </div>
                  </div>
                </div>

                <Button onClick={handleDownload} fullWidth className="mt-4 shadow-xl shadow-pink-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Modified File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Copywriting */}
        <div className="flex flex-col gap-6">
           <div className={`
             bg-gradient-to-br from-white to-pink-50/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 h-full
             transition-opacity duration-500
             ${state === AppState.DONE ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none translate-y-4 lg:translate-y-0'}
           `}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 p-2 rounded-lg text-white shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Xiaohongshu Wizard</h2>
              </div>
              
              <p className="text-gray-600 mb-6 text-sm">
                Need to share this tool or file? Generate viral, click-worthy captions instantly.
              </p>

              {copyVersions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  {!generatingCopy ? (
                    <Button variant="secondary" onClick={handleGenerateCopy} disabled={state !== AppState.DONE}>
                      Generate Viral Copy 🪄
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                       <span className="text-pink-500 font-medium text-sm animate-pulse">Brewing magic...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                   {copyVersions.map((copy, idx) => (
                     <CopyResult key={idx} content={copy} index={idx} />
                   ))}
                   <Button variant="secondary" onClick={handleGenerateCopy} fullWidth className="mt-4">
                     Regenerate
                   </Button>
                </div>
              )}
           </div>
        </div>
      </main>

      <footer className="mt-16 text-center text-gray-400 text-sm">
        <p>MD5 modification appends a null byte to the file end. Use responsibly.</p>
      </footer>
    </div>
  );
};

export default App;
