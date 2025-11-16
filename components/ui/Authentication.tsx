import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from './LoginForm';

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}

const Authentication: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/user');
        setUser(response.data);
      } catch (err: unknown) {
        const error = err as Error & {
          response?: {
            data?: { message?: string },
            status?: number
          }
        };
        setError(error.response?.data?.message || error.message);
      }
    };
    fetchUser();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (err: unknown) {
      const error = err as Error & {
        response?: {
          data?: { message?: string }
        }
      };
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Authentication</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {user ? (
        <div>
          <p>Welcome, {user.name}</p>
          <button onClick={logout} disabled={isLoading}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : (
        <LoginForm 
          onLoginSuccess={handleLoginSuccess}
          redirectPath=""
        />
      )}
    </div>
  );
};

export default Authentication;
