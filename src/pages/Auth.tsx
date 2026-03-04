import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import logoPresencia from '@/assets/logo-presencia.png';

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="gradient-sanctuary flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isForgot) {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('auth.checkEmail'));
        setIsForgot(false);
      }
      setSubmitting(false);
      return;
    }

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
    } else {
      if (!fullName.trim()) {
        toast.error(t('auth.enterFullName'));
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('auth.accountCreated'));
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="gradient-sanctuary flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <img src={logoPresencia} alt="Presencia" className="h-10 w-auto" />
          <span className="text-2xl font-bold tracking-tight text-foreground">Presencia</span>
        </Link>
        <Card className="gradient-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">
              {isForgot ? t('auth.resetPassword') : isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </CardTitle>
            <CardDescription>
              {isForgot ? t('auth.resetDesc') : isLogin ? t('auth.signInDesc') : t('auth.signUpDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isForgot && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.fullNamePlaceholder')} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              {!isForgot && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
              )}
              <Button type="submit" className="glow-gold w-full font-semibold" disabled={submitting}>
                {submitting ? t('auth.loading') : isForgot ? t('auth.sendResetLink') : isLogin ? t('auth.signIn') : t('auth.createAccount')}
              </Button>
            </form>

            <div className="mt-6 space-y-2 text-center text-sm">
              {!isForgot && (
                <button onClick={() => setIsForgot(true)} className="text-soft-blue hover:text-energy-cyan transition-colors">
                  {t('auth.forgotPassword')}
                </button>
              )}
              <div>
                <button
                  onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }}
                  className="text-soft-blue hover:text-energy-cyan transition-colors"
                >
                  {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                </button>
              </div>
              {isForgot && (
                <button onClick={() => setIsForgot(false)} className="text-soft-blue hover:text-energy-cyan transition-colors">
                  {t('auth.backToSignIn')}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
