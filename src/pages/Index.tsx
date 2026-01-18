import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  name: string;
  phone: string;
  peer_id: string;
  status: 'online' | 'offline' | 'busy' | 'in_call';
}

interface CallState {
  isInCall: boolean;
  isCalling: boolean;
  isReceivingCall: boolean;
  remotePeerId: string | null;
  remoteUserName: string | null;
  callStartTime: number | null;
}

const API_BASE = 'https://functions.poehali.dev/cf10f403-5f90-48c4-9bcd-4f8eb9aea79f';

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isCalling: false,
    isReceivingCall: false,
    remotePeerId: null,
    remoteUserName: null,
    callStartTime: null,
  });

  const { toast } = useToast();
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (callState.isInCall && callState.callStartTime) {
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callState.callStartTime!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callState.isInCall, callState.callStartTime]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/?action=list`);
      const data = await response.json();
      if (data.users) {
        setUsers(data.users.filter((u: User) => u.id !== currentUser?.id));
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const handleLogin = async () => {
    if (!loginName.trim()) {
      toast({ title: 'Ошибка', description: 'Введите ваше имя', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName, phone: loginPhone }),
      });
      const data = await response.json();
      
      if (data.user) {
        setCurrentUser(data.user);
        setShowLogin(false);
        loadUsers();
        toast({ title: 'Подключено', description: `Добро пожаловать, ${loginName}!` });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось подключиться', variant: 'destructive' });
    }
  };

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async (targetUser: User) => {
    try {
      setCallState({
        isInCall: false,
        isCalling: true,
        isReceivingCall: false,
        remotePeerId: targetUser.peer_id,
        remoteUserName: targetUser.name,
        callStartTime: null,
      });

      await createPeerConnection();
      
      toast({ title: 'Вызов', description: `Звоним ${targetUser.name}...` });
      
      setTimeout(() => {
        setCallState(prev => ({
          ...prev,
          isInCall: true,
          isCalling: false,
          callStartTime: Date.now(),
        }));
        toast({ title: 'Звонок принят', description: `Разговор с ${targetUser.name}` });
      }, 2000);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось начать звонок', variant: 'destructive' });
      endCall();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setCallState({
      isInCall: false,
      isCalling: false,
      isReceivingCall: false,
      remotePeerId: null,
      remoteUserName: null,
      callStartTime: null,
    });
    setIsMuted(false);
    setCallDuration(0);
    
    toast({ title: 'Звонок завершён' });
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
      case 'in_call': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadUsers();
      const interval = setInterval(loadUsers, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  if (showLogin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <Icon name="Phone" size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 animate-fade-in">VoIP Network</h1>
            <p className="text-muted-foreground animate-fade-in">Войдите для начала звонков</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Ваше имя</Label>
              <Input
                placeholder="Иван Иванов"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="mt-1.5"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <Label>Номер телефона (опционально)</Label>
              <Input
                placeholder="+7 (___) ___-__-__"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                className="mt-1.5"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full gradient-primary">
              <Icon name="LogIn" size={18} className="mr-2" />
              Войти в сеть
            </Button>
          </div>
        </Card>
      </div>
    );
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
                <h1 className="text-xl font-bold">VoIP Network</h1>
                <p className="text-sm text-muted-foreground">{currentUser?.name}</p>
              </div>
            </div>
            <Badge className="gradient-primary text-white border-0 px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Онлайн
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {(callState.isInCall || callState.isCalling || callState.isReceivingCall) && (
          <Card className="mb-8 p-8 border-2 border-primary bg-card/50 backdrop-blur animate-scale-in">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-slow">
                <Icon 
                  name={callState.isInCall ? "Phone" : callState.isReceivingCall ? "PhoneIncoming" : "PhoneOutgoing"} 
                  size={48} 
                  className="text-white" 
                />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">{callState.remoteUserName}</h2>
              
              {callState.isInCall && (
                <p className="text-3xl font-mono text-primary mb-6">{formatDuration(callDuration)}</p>
              )}
              
              {callState.isCalling && (
                <p className="text-muted-foreground mb-6 animate-pulse">Вызов...</p>
              )}

              <div className="flex items-center justify-center gap-4">
                {(callState.isInCall || callState.isCalling) && (
                  <>
                    <Button 
                      onClick={toggleMute} 
                      size="lg" 
                      variant={isMuted ? "destructive" : "outline"}
                      className="hover-scale"
                    >
                      <Icon name={isMuted ? "MicOff" : "Mic"} size={20} className="mr-2" />
                      {isMuted ? 'Включить' : 'Выключить'} микрофон
                    </Button>
                    <Button onClick={endCall} size="lg" variant="destructive" className="hover-scale">
                      <Icon name="PhoneOff" size={20} className="mr-2" />
                      Завершить
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="border-border animate-fade-in">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Активные пользователи</h2>
              <p className="text-sm text-muted-foreground">Нажмите "Позвонить" для начала звонка</p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Icon name="Users" size={14} className="mr-1" />
              {users.length} онлайн
            </Badge>
          </div>
          
          <div className="divide-y divide-border">
            {users.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Icon name="Users" size={48} className="mx-auto mb-4 opacity-30" />
                <p>Нет других пользователей онлайн</p>
                <p className="text-sm mt-2">Откройте сайт в новой вкладке и войдите под другим именем</p>
              </div>
            )}
            
            {users.map((user) => (
              <div key={user.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(user.status)} rounded-full border-2 border-card animate-pulse`} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{user.name}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Icon name="Phone" size={14} />
                          {user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => startCall(user)}
                    disabled={user.status === 'in_call' || callState.isInCall || callState.isCalling || callState.isReceivingCall}
                    className="gradient-primary hover-scale"
                  >
                    <Icon name="Phone" size={16} className="mr-2" />
                    Позвонить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
