import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Mock accounts
const MOCK_ACCOUNTS = {
  police: {
    email: 'smith@police.gov',
    password: 'police123',
    userData: {
      id: 'police-123',
      email: 'smith@police.gov',
      name: 'Officer Smith',
      role: 'police',
      phone: '9876543210'
    }
  },
  user: {
    email: 'john@example.com',
    password: 'password123',
    userData: {
      id: 'user-123',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'user',
      phone: '1234567890'
    }
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if it's a mock account
      const mockAccount = Object.values(MOCK_ACCOUNTS).find(
        account => account.email === email && account.password === password
      );

      if (mockAccount) {
        login(mockAccount.userData, true);
        toast({
          title: "Login successful",
          description: mockAccount.userData.role === 'police' 
            ? "Welcome back, Officer!" 
            : "Welcome back!",
        });
        navigate(mockAccount.userData.role === 'police' 
          ? '/police/dashboard' 
          : '/dashboard'
        );
        return;
      }

      // For regular users, use Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      
      // Update auth store with user data
      login({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userData.fullName,
        role: userData.role,
        phone: userData.phone
      }, true);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Redirect based on user role
      if (userData.role === 'user') {
        navigate('/dashboard');
      } else if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = "Failed to login. Please check your credentials.";
      
      if (error instanceof Error) {
        switch (error.message) {
          case 'auth/user-not-found':
            errorMessage = "No account found with this email.";
            break;
          case 'auth/wrong-password':
            errorMessage = "Incorrect password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid email address.";
            break;
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled.";
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 bg-fir-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">JE</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-fir-800">JusticeEcho</h1>
        <p className="text-gray-600 mt-2">Crime Reporting and Management System</p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email and password to login
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a 
                  href="#" 
                  className="text-sm font-medium text-fir-600 hover:text-fir-700"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/forgot-password');
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="text-sm text-gray-600">
              <strong>Demo Accounts:</strong>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="border border-gray-200 rounded p-2">
                  <div className="font-semibold">User</div>
                  <div className="text-xs">john@example.com</div>
                  <div className="text-xs">password123</div>
                </div>
                <div className="border border-gray-200 rounded p-2">
                  <div className="font-semibold">Police</div>
                  <div className="text-xs">smith@police.gov</div>
                  <div className="text-xs">police123</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button 
              type="submit" 
              className="w-full bg-fir-700 hover:bg-fir-800"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              Don't have an account?{" "}
              <a 
                href="#" 
                className="font-medium text-fir-600 hover:text-fir-700"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                Register now
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
