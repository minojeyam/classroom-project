import React from 'react';
import { Clock, Wrench, Star } from 'lucide-react';

interface ComingSoonPageProps {
  feature: string;
  description: string;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ feature, description }) => {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{feature}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        
        <div className="flex items-center justify-center space-x-2 text-teal-600 mb-6">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Coming Soon</span>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium text-teal-800">This feature is in development</span>
          </div>
          <p className="text-sm text-teal-700">
            We're working hard to bring you this feature. Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;


