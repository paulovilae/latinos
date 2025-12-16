import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import { useLanguage } from '../contexts/LanguageContext';

const RegisterPage: React.FC = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('error.allFieldsRequired'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('error.passwordsDoNotMatch'));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError(t('error.invalidEmail'));
        return;
    }
    if (password.length < 6) {
        setError(t('error.passwordTooShort', {minLength: 6}));
        return;
    }
    
    register(email, name);
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-up bg-light-bg dark:bg-dark-bg">
      <div className="max-w-md w-full space-y-8">
        <Card titleKey="registerPage.title" className="bg-light-card dark:bg-dark-card">
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-light-negative dark:text-dark-negative bg-light-negative/10 dark:bg-dark-negative/20 p-2 rounded">{error}</p>}
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('registerPage.namePlaceholder')}
              labelKey="registerPage.nameLabel"
            />
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('registerPage.emailPlaceholder')}
              labelKey="registerPage.emailLabel"
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('registerPage.passwordPlaceholder')}
              labelKey="registerPage.passwordLabel"
            />
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('registerPage.confirmPasswordPlaceholder')}
              labelKey="registerPage.confirmPasswordLabel"
            />
            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              {t('registerPage.register')}
            </Button>
            <p className="mt-4 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {t('registerPage.haveAccount')}{' '}
              <Link to="/login" className="font-medium text-light-accent dark:text-dark-accent hover:opacity-80">
                {t('registerPage.loginHere')}
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;