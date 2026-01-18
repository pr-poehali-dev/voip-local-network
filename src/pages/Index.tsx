import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  name: string;
  phone: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
}

interface CallLog {
  id: number;
  from: string;
  to: string;
  duration: string;
  time: string;
  status: 'completed' | 'missed' | 'active';
}

export default function Index() {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Алексей Иванов', phone: '+7 (495) 123-45-67', role: 'admin', status: 'online' },
    { id: 2, name: 'Мария Петрова', phone: '+7 (812) 234-56-78', role: 'user', status: 'busy' },
    { id: 3, name: 'Дмитрий Сидоров', phone: '+7 (903) 345-67-89', role: 'user', status: 'offline' },
    { id: 4, name: 'Елена Смирнова', phone: '+7 (916) 456-78-90', role: 'user', status: 'online' },
  ]);

  const [callLogs, setCallLogs] = useState<CallLog[]>([
    { id: 1, from: '+7 (495) 123-45-67', to: '+7 (812) 234-56-78', duration: '5:23', time: '2 мин назад', status: 'completed' },
    { id: 2, from: '+7 (903) 345-67-89', to: '+7 (916) 456-78-90', duration: '12:45', time: '15 мин назад', status: 'completed' },
    { id: 3, from: '+7 (812) 234-56-78', to: '+7 (495) 123-45-67', duration: '—', time: '1 час назад', status: 'missed' },
    { id: 4, from: '+7 (916) 456-78-90', to: '+7 (903) 345-67-89', duration: '3:17', time: 'идёт сейчас', status: 'active' },
  ]);

  const [stats] = useState({
    activeUsers: 2,
    totalUsers: 4,
    activeCalls: 1,
    todayCalls: 47,
    serverStatus: 'online',
    encryption: 'enabled',
  });

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Icon name="Phone" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">VoIP Control</h1>
                <p className="text-sm text-muted-foreground">Защищённая IP-телефония</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="gradient-primary text-white border-0 px-3 py-1">
                <Icon name="Shield" size={14} className="mr-1" />
                Шифрование активно
              </Badge>
              <Button size="sm" className="gradient-primary">
                <Icon name="Settings" size={16} className="mr-2" />
                Настройки
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
                <Icon name="Server" size={24} className="text-primary" />
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-slow" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Статус сервера</p>
              <p className="text-2xl font-bold">Online</p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-secondary/50 transition-all duration-300">
            <div className="absolute inset-0 gradient-accent opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Icon name="Users" size={24} className="text-secondary" />
                <Badge variant="secondary">{stats.activeUsers}/{stats.totalUsers}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Активные пользователи</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/50 transition-all duration-300">
            <div className="absolute inset-0 bg-accent opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Icon name="PhoneCall" size={24} className="text-accent" />
                {stats.activeCalls > 0 && (
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">Активные звонки</p>
              <p className="text-2xl font-bold">{stats.activeCalls}</p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute inset-0 gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Icon name="BarChart3" size={24} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Звонков сегодня</p>
              <p className="text-2xl font-bold">{stats.todayCalls}</p>
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
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Icon name="TrendingUp" size={16} className="mr-2" />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-border">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Управление пользователями</h2>
                  <p className="text-sm text-muted-foreground">Добавляйте и управляйте пользователями системы</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary">
                      <Icon name="UserPlus" size={16} className="mr-2" />
                      Добавить пользователя
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Новый пользователь</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Имя пользователя</Label>
                        <Input placeholder="Иван Иванов" className="mt-1.5" />
                      </div>
                      <div>
                        <Label>Номер телефона</Label>
                        <Input placeholder="+7 (___) ___-__-__" className="mt-1.5" />
                      </div>
                      <div>
                        <Label>Роль</Label>
                        <Select>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Администратор</SelectItem>
                            <SelectItem value="user">Пользователь</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full gradient-primary">
                        Создать пользователя
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(user.status)} rounded-full border-2 border-card`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{user.name}</p>
                            {user.role === 'admin' && (
                              <Badge variant="secondary" className="text-xs">
                                <Icon name="Shield" size={12} className="mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Icon name="Phone" size={14} />
                            {user.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Icon name="Edit" size={14} className="mr-2" />
                          Изменить
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
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
                            <p className="font-medium mb-1">{call.from}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Icon name="ArrowRight" size={14} />
                              {call.to}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Длительность</p>
                            <p className="font-semibold">{call.duration}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Время</p>
                            <p className="font-semibold">{call.time}</p>
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

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="TrendingUp" size={20} className="text-primary" />
                  Статистика звонков за неделю
                </h3>
                <div className="space-y-4">
                  {[
                    { day: 'Понедельник', calls: 42, duration: '2:14:32' },
                    { day: 'Вторник', calls: 38, duration: '1:58:16' },
                    { day: 'Среда', calls: 51, duration: '2:42:08' },
                    { day: 'Четверг', calls: 47, duration: '2:21:45' },
                    { day: 'Пятница', calls: 39, duration: '2:05:23' },
                    { day: 'Суббота', calls: 23, duration: '1:12:56' },
                    { day: 'Воскресенье', calls: 18, duration: '0:54:12' },
                  ].map((stat) => (
                    <div key={stat.day} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stat.day}</span>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{stat.calls} звонков</span>
                          <span>{stat.duration}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary rounded-full transition-all duration-500"
                          style={{ width: `${(stat.calls / 51) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 border-border">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="Activity" size={20} className="text-secondary" />
                  Производительность системы
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Загрузка CPU</span>
                      <span className="text-sm text-muted-foreground">23%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '23%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Использование памяти</span>
                      <span className="text-sm text-muted-foreground">1.2 / 4 GB</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Сетевая нагрузка</span>
                      <span className="text-sm text-muted-foreground">45 Мбит/с</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Icon name="CheckCircle" size={16} className="text-green-500" />
                        Качество связи
                      </span>
                      <span className="text-sm font-bold text-green-500">Отлично</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Icon name="Shield" size={16} className="text-blue-500" />
                        Шифрование
                      </span>
                      <span className="text-sm font-bold text-blue-500">TLS 1.3</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
