import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalsProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-7xl',
};

const Modals = ({ isOpen, onClose, title, children, size = 'md' }: ModalsProps) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal Panel */}
        <div
          className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full ${sizeClasses[size]} sm:p-6`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Title */}
          {title && (
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
            </div>
          )}

          {/* Content */}
          <div className="mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modals;
