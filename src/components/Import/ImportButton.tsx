import React, { useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import BulkImportModal from './BulkImportModal';

interface ImportButtonProps {
  onImportComplete?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ImportButton: React.FC<ImportButtonProps> = ({
  onImportComplete,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportComplete = () => {
    setShowImportModal(false);
    if (onImportComplete) {
      onImportComplete();
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'rounded-lg transition-colors flex items-center space-x-2 font-medium';
    
    const variantClasses = {
      primary: 'bg-green-600 text-white hover:bg-green-700',
      secondary: 'border border-gray-200 text-gray-700 hover:bg-gray-50'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  };

  return (
    <>
      <button
        onClick={() => setShowImportModal(true)}
        className={getButtonClasses()}
      >
        <Upload className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
        <span>Import Excel</span>
      </button>

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />
    </>
  );
};

export default ImportButton;