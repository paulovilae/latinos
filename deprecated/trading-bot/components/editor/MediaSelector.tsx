import React, { useState } from 'react';

interface MediaSelectorProps {
  onSelect: (url: string, id: string) => void;
  onCancel: () => void;
}

/**
 * A simplified media selector that doesn't rely on backend connections
 */
const MediaSelector: React.FC<MediaSelectorProps> = ({ onSelect, onCancel }) => {
  const [customUrl, setCustomUrl] = useState('');
  
  // Sample images for quick selection
  const sampleImages = [
    {
      id: 'sample1',
      url: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJsb2NrY2hhaW58ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=70',
      title: 'Blockchain Visualization'
    },
    {
      id: 'sample2',
      url: 'https://images.unsplash.com/photo-1621405788930-bcee940d0783?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGNyeXB0b3xlbnwwfHwwfHx8MA&auto=format&fit=crop&w=600&q=70',
      title: 'Crypto Trading'
    },
    {
      id: 'sample3',
      url: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8dHJhZGluZ3xlbnwwfHwwfHx8MA%3D&auto=format&fit=crop&w=600&q=70',
      title: 'Financial Charts'
    }
  ];

  return (
    <div className="media-selector bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Media Library</h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      
      {/* Custom URL input */}
      <div className="mb-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <label className="block mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Use custom image URL</span>
          <input 
            type="text" 
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="block w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded"
          />
        </label>
        
        <button
          onClick={() => customUrl && onSelect(customUrl, 'custom-url')}
          disabled={!customUrl}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Use This URL
        </button>
      </div>
      
      {/* Sample images grid */}
      <div>
        <h4 className="text-sm font-medium mb-2">Sample Images</h4>
        <div className="grid grid-cols-3 gap-2">
          {sampleImages.map(item => (
            <div 
              key={item.id} 
              className="media-item relative aspect-square overflow-hidden rounded border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
              onClick={() => onSelect(item.url, item.id)}
              title={item.title}
            >
              <img 
                src={item.url} 
                alt={item.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity">
                <span className="text-white opacity-0 hover:opacity-100">Select</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MediaSelector;