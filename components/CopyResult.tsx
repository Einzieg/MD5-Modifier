import React from 'react';

interface CopyResultProps {
  content: string;
  index: number;
}

export const CopyResult: React.FC<CopyResultProps> = ({ content, index }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  // Simple parsing to split title from body if possible, otherwise just show raw
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const title = lines.length > 0 ? lines[0] : "Draft";
  const body = lines.slice(1).join('\n');

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-pink-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded-full">
          Version {index + 1}
        </span>
        <button 
          onClick={handleCopy}
          className="text-gray-400 hover:text-pink-500 transition-colors text-sm font-medium flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy
        </button>
      </div>
      <div className="text-gray-800 space-y-2">
         {/* Render lines preserving line breaks */}
         {lines.map((line, i) => (
           <p key={i} className={`text-sm ${i === 0 ? 'font-bold text-lg mb-2 text-gray-900' : 'text-gray-600'}`}>
             {line}
           </p>
         ))}
      </div>
    </div>
  );
};
