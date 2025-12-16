import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError(t('error.bothFieldsRequired')); // Example new translation key
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError(t('error.invalidEmail')); // Example new translation key
        return;
    }
    login(email, email.split('@')[0]); // Use part of email as mock name
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-up bg-light-bg dark:bg-dark-bg">
      <div className="max-w-md w-full space-y-8">
        <Card titleKey="loginPage.title" className="bg-light-card dark:bg-dark-card">
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-light-negative dark:text-dark-negative bg-light-negative/10 dark:bg-dark-negative/20 p-2 rounded">{error}</p>}
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('loginPage.emailPlaceholder')} // Add placeholder key
              labelKey="loginPage.emailLabel"
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('loginPage.passwordPlaceholder')} // Add placeholder key
              labelKey="loginPage.passwordLabel"
            />
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-light-accent dark:text-dark-accent focus:ring-light-accent dark:focus:ring-dark-accent border-light-border dark:border-dark-border rounded bg-light-card dark:bg-dark-card" />
                <label htmlFor="remember-me" className="ml-2 block text-light-text-secondary dark:text-dark-text-secondary"> {t('loginPage.rememberMe')} </label>
              </div>
              <a href="#" className="font-medium text-light-accent dark:text-dark-accent hover:opacity-80"> {t('loginPage.forgotPassword')} </a>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              {t('loginPage.signIn')}
            </Button>
            <p className="mt-4 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {t('loginPage.noAccount')}{' '}
              <Link to="/register" className="font-medium text-light-accent dark:text-dark-accent hover:opacity-80">
                {t('loginPage.registerHere')}
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;