import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import loaderAnimation from './loader/animations/62d18998-eb09-48b7-a29a-e69b4e6fb833.json';

const Loader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Lottie 
        animationData={loaderAnimation}
        loop={true}
        className="w-24 h-24"
      />
      <div 
        className="flex items-center mt-4 justify-center space-x-1.5 cursor-pointer" 
        onClick={() => navigate('/home')}
      >
        <div className="h-6 w-6 sm:h-8 sm:w-8 transform transition-transform duration-300 hover:scale-105 hover:rotate-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-full w-full object-contain"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
          />
        </div>
        <h1 className="text-xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-blue-100 to-indigo-900 text-transparent bg-clip-text" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
          ScholarSync
        </h1>
      </div>
    </div>
  );
};

export default Loader;
