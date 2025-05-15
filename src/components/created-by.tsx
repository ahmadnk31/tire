import { useState, useEffect } from 'react';

export const CreatedBy = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [heartBeat, setHeartBeat] = useState(false);

  // Heart beat animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartBeat(prev => !prev);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full py-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto flex justify-center items-center">
        <div 
          className="flex items-center transition-all duration-500 ease-in-out transform"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="text-gray-300">Created with</span>
          <span 
            className={`mx-2 text-red-500 text-xl transition-transform duration-500 ${heartBeat ? 'scale-125' : 'scale-100'}`}
          >
            ❤️
          </span>
          <span className="text-gray-300">by</span>
          <a 
            href="https://ahmadullah.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`ml-2 font-bold transition-all duration-300 relative ${isHovered ? 'text-blue-400' : 'text-blue-300'}`}
          >
            ahmadullah.dev
            <span 
              className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 ${isHovered ? 'w-full' : 'w-0'}`}
            ></span>
          </a>
        </div>
      </div>
    </footer>
  );
};

