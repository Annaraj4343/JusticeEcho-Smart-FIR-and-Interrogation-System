import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <div className="space-y-4">
          <Link
            to="/"
            className="text-blue-500 hover:text-blue-700 underline block"
          >
            Return to Home
          </Link>
          <Link
            to="/aadhar-verification"
            className="text-blue-500 hover:text-blue-700 underline block"
          >
            Go to Aadhar Verification
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
