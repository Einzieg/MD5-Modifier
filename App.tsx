import React, { useState, useRef } from 'react';
import { Button } from './components/Button';
import { calculateMD5, modifyFileMD5 } from './utils/fileUtils';
import { ProcessedFile, AppState } from './types';

const getTimestamp = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (filesToProcess: File[]) => {
    setState(AppState.PROCESSING);
    
    try {
      // Process files concurrently
      const promises = filesToProcess.map(async (file): Promise<ProcessedFile | null> => {
        try {
          const originalHash = await calculateMD5(file);
          const { blob: modifiedBlob, hash: modifiedHash } = await modifyFileMD5(file);
          return {
            originalFile: file,
            originalHash,
            modifiedBlob,
            modifiedHash,
            fileName: file.name
          };
        } catch (err) {
          console.error(`Error processing ${file.name}`, err);
          return null;
        }
      });

      const processed = await Promise.all(promises);
      const successful = processed.filter((p): p is ProcessedFile => p !== null);
      
      setProcessedFiles(successful);
      setState(AppState.DONE);
    } catch (error) {
      console.error(error);
      alert("Error processing files.");
      setState(AppState.IDLE);
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDownload = (file: ProcessedFile) => {
    const url = URL.createObjectURL(file.modifiedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const parts = file.fileName.split('.');
    const ext = parts.length > 1 ? `.${parts.pop()}` : '';
    
    // Naming convention: YYYYMMDDHHMMSS.ext
    link.download = `${getTimestamp()}${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (processedFiles.length === 0) return;

    // If only one file, just download it directly
    if (processedFiles.length === 1) {
      handleDownload(processedFiles[0]);
      return;
    }

    setIsZipping(true);

    try {
      const zip = new window.JSZip();
      const timestamp = getTimestamp();

      processedFiles.forEach((file, index) => {
        const parts = file.fileName.split('.');
        const ext = parts.length > 1 ? `.${parts.pop()}` : '';
        
        // Naming convention inside zip: YYYYMMDDHHMMSS_Index.ext
        const finalName = `${timestamp}_${index + 1}${ext}`;
        zip.file(finalName, file.modifiedBlob);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      
      // Zip naming convention: YYYYMMDDHHMMSS.zip
      link.download = `${timestamp}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to zip files", error);
      alert("Failed to create zip archive.");
    } finally {
      setIsZipping(false);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setProcessedFiles([]);
    setIsZipping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          <span className="text-sm text-pink-500 font-medium">✨ Supports Batch Processing!</span>
        </p>
      </header>

      <main className="w-full max-w-3xl flex flex-col gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8">
          {state === AppState.IDLE && (
            <div 
              className={`
                border-4 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer min-h-[300px] flex flex-col items-center justify-center
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
                multiple
                className="hidden" 
                onChange={handleChange} 
              />
              <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Files</h3>
              <p className="text-gray-500">Drag & drop multiple files here</p>
              <p className="text-xs text-gray-400 mt-2">Images, Videos, Archives supported</p>
            </div>
          )}

          {state === AppState.PROCESSING && (
            <div className="text-center py-24 min-h-[300px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-6"></div>
                <p className="text-gray-800 font-bold text-lg">Processing Files...</p>
                <p className="text-gray-500 text-sm mt-2">Calculating and modifying hashes</p>
            </div>
          )}

          {state === AppState.DONE && processedFiles.length > 0 && (
            <div className="animate-fade-in flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Results ({processedFiles.length})
                </h3>
                <button onClick={reset} className="text-sm text-gray-500 hover:text-red-500 underline">
                  Start Over
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 max-h-[500px] no-scrollbar">
                {processedFiles.map((file, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="min-w-[2rem] h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                            {file.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                          </div>
                          <p className="text-gray-800 font-medium truncate text-sm" title={file.fileName}>
                            {file.fileName}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDownload(file)}
                          className="text-pink-500 hover:bg-pink-50 p-1.5 rounded-lg transition-colors"
                          title="Download this file"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-xs">
                      <div className="bg-red-50 p-2 rounded text-gray-600 font-mono truncate">
                        {file.originalHash.substring(0, 8)}...
                      </div>
                      <div className="text-gray-300">→</div>
                      <div className="bg-green-50 p-2 rounded text-green-700 font-mono font-bold truncate">
                        {file.modifiedHash.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                  <Button onClick={handleDownloadAll} isLoading={isZipping} fullWidth className="shadow-lg shadow-pink-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {processedFiles.length > 1 ? `Download All as ZIP (${processedFiles.length})` : 'Download File'}
                  </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 text-center text-gray-400 text-sm">
        <p>MD5 modification appends a null byte to the file end. Use responsibly.</p>
      </footer>
    </div>
  );
};

export default App;