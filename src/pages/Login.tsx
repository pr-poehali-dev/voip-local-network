import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', phone: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://functions.poehali.dev/a8f30b33-3fc0-41e9-9521-78bb1cb2cab3/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка входа');
        return;
      }

      localStorage.setItem('voip_user', JSON.stringify(data.user));
      localStorage.setItem('voip_token', data.token);
      navigate('/');
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://functions.poehali.dev/a8f30b33-3fc0-41e9-9521-78bb1cb2cab3/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка регистрации');
        return;
      }

      localStorage.setItem('voip_user', JSON.stringify(data.user));
      localStorage.setItem('voip_token', data.token);
      navigate('/');
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="Phone" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">VoIP Control</h1>
          <p className="text-muted-foreground">Защищённая IP-телефония</p>
        </div>

        <Card className="border-border p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>Номер телефона</Label>
                  <Input
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={loginData.phone}
                    onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label>Пароль</Label>
                  <Input
                    type="password"
                    placeholder="Введите пароль"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Вход...
                    </>
                  ) : (
                    <>
                      <Icon name="LogIn" size={16} className="mr-2" />
                      Войти
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label>Имя пользователя</Label>
                  <Input
                    type="text"
                    placeholder="Иван Иванов"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label>Номер телефона</Label>
                  <Input
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label>Пароль</Label>
                  <Input
                    type="password"
                    placeholder="Создайте пароль"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      <Icon name="UserPlus" size={16} className="mr-2" />
                      Зарегистрироваться
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Shield" size={14} className="text-primary" />
            <span>Все данные защищены шифрованием TLS 1.3</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Icon name="Lock" size={14} className="text-primary" />
            <span>P2P звонки через WebRTC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
