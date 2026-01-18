import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { WebRTCCall } from '@/lib/webrtc';

interface User {
  id: number;
  username: string;
  phone: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
}

interface CallLog {
  id: number;
  caller_id: number;
  receiver_id: number;
  caller_phone: string;
  receiver_phone: string;
  duration: number;
  started_at: string;
  ended_at: string | null;
  status: 'completed' | 'missed' | 'active';
}

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  
  const [inCall, setInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callingUser, setCallingUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const webrtcCallRef = useRef<WebRTCCall | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('voip_user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    loadUsers();
    loadCallLogs();

    const interval = setInterval(() => {
      loadUsers();
      loadCallLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (inCall && callTimerRef.current === null) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (!inCall && callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [inCall]);

  const loadUsers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/a8f30b33-3fc0-41e9-9521-78bb1cb2cab3');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadCallLogs = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/46bdfd79-a9fb-4730-9257-eeba1e141fb5');
      const data = await response.json();
      setCallLogs(data.calls || []);
    } catch (error) {
      console.error('Failed to load call logs:', error);
    }
  };

  const startCall = async (receiver: User) => {
    if (!currentUser) return;

    try {
      setCallingUser(receiver);
      
      webrtcCallRef.current = new WebRTCCall(
        (stream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
          }
        },
        () => {
          setInCall(false);
          setCallingUser(null);
          toast({ title: 'Звонок завершён' });
        }
      );

      await webrtcCallRef.current.startCall(receiver.id, currentUser.id);
      setInCall(true);
      
      toast({
        title: 'Звонок начат',
        description: `Звоним ${receiver.username}...`
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось начать звонок',
        variant: 'destructive'
      });
      setCallingUser(null);
    }
  };

  const endCall = async () => {
    if (webrtcCallRef.current) {
      await webrtcCallRef.current.endCall();
    }
    setInCall(false);
    setCallingUser(null);
  };

  const toggleMute = () => {
    if (webrtcCallRef.current) {
      const stream = webrtcCallRef.current.getLocalStream();
      if (stream) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = isMuted;
        });
        setIsMuted(!isMuted);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('voip_user');
    localStorage.removeItem('voip_token');
    navigate('/login');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  const getCallStatusBadge = (status: CallLog['status']) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Завершён</Badge>;
      case 'missed': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Пропущен</Badge>;
      case 'active': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">Активен</Badge>;
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <audio ref={remoteAudioRef} autoPlay />
      
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Icon name="Phone" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">VoIP Control</h1>
                <p className="text-sm text-muted-foreground">Привет, {currentUser.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="gradient-primary text-white border-0 px-3 py-1">
                <Icon name="Shield" size={14} className="mr-1" />
                Шифрование активно
              </Badge>
              <Button size="sm" variant="outline" onClick={logout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Users" size={24} className="text-primary" />
                <Badge variant="secondary">{users.filter(u => u.status === 'online').length}/{users.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Онлайн</p>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'online').length}</p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-secondary/50 transition-all duration-300">
            <div className="absolute inset-0 gradient-accent opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Phone" size={24} className="text-secondary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Звонков сегодня</p>
              <p className="text-2xl font-bold">{callLogs.length}</p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/50 transition-all duration-300">
            <div className="absolute inset-0 bg-accent opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Icon name="User" size={24} className="text-accent" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Ваш номер</p>
              <p className="text-lg font-bold">{currentUser.phone}</p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Shield" size={24} className="text-primary" />
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-slow" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Статус</p>
              <p className="text-2xl font-bold">Online</p>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="calls" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Icon name="Phone" size={16} className="mr-2" />
              Журнал звонков
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-border">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold mb-1">Доступные пользователи</h2>
                <p className="text-sm text-muted-foreground">Нажмите на пользователя чтобы позвонить</p>
              </div>
              <div className="divide-y divide-border">
                {users.filter(u => u.id !== currentUser.id).map((user) => (
                  <div key={user.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                            {user.username.charAt(0)}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(user.status)} rounded-full border-2 border-card`} />
                        </div>
                        <div>
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Icon name="Phone" size={14} />
                            {user.phone}
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="gradient-primary"
                        onClick={() => startCall(user)}
                        disabled={inCall || user.status !== 'online'}
                      >
                        <Icon name="Phone" size={16} className="mr-2" />
                        Позвонить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="calls">
            <Card className="border-border">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold mb-1">Журнал звонков</h2>
                <p className="text-sm text-muted-foreground">История всех звонков в системе</p>
              </div>
              <div className="divide-y divide-border">
                {callLogs.map((call) => (
                  <div key={call.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="PhoneOutgoing" size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium mb-1">{call.caller_phone}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Icon name="ArrowRight" size={14} />
                              {call.receiver_phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Длительность</p>
                            <p className="font-semibold">{formatDuration(call.duration)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Время</p>
                            <p className="font-semibold">{new Date(call.started_at).toLocaleString('ru-RU')}</p>
                          </div>
                        </div>
                      </div>
                      {getCallStatusBadge(call.status)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={inCall} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {callingUser ? `Звонок с ${callingUser.username}` : 'Активный звонок'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                {callingUser?.username.charAt(0) || '?'}
              </div>
              <p className="text-3xl font-bold mb-2">{formatDuration(callDuration)}</p>
              <p className="text-muted-foreground">{callingUser?.phone}</p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant={isMuted ? 'default' : 'outline'}
                className="rounded-full w-16 h-16"
                onClick={toggleMute}
              >
                <Icon name={isMuted ? 'MicOff' : 'Mic'} size={24} />
              </Button>
              
              <Button
                size="lg"
                className="rounded-full w-20 h-20 bg-destructive hover:bg-destructive/90"
                onClick={endCall}
              >
                <Icon name="PhoneOff" size={32} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
