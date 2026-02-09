import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login page
    navigate('/login');
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="inline-block w-16 h-16 bg-fir-700 rounded-full flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">JE</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">JusticeEcho</h1>
        <p className="text-xl text-gray-600 mb-8">A Modern Voice-Based Crime Reporting System</p>
        <div className="mt-4">
          <div className="animate-spin h-6 w-6 border-2 border-fir-600 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
