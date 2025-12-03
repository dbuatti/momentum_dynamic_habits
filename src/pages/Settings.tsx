import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Target,
  TrendingUp,
  Star,
  Flame,
  Shield,
  Crown,
  Zap,
  Trophy,
  Sparkles,
  Mountain,
  Award,
  Sun,
  Moon,
  Heart,
  Smile,
  CloudRain,
  Trees,
  Waves,
  Wind,
  Bird,
  Droplets,
  Volume2,
  Dumbbell,
  Timer,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const BadgeIcon = ({ icon: Icon, label, achieved }: { icon: React.ElementType, label: string, achieved?: boolean }) => (
  <div className="flex flex-col items-center space-y-1 text-center">
    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", achieved ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-100 dark:bg-gray-800')}>
      <Icon className={cn("w-7 h-7", achieved ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500')} />
    </div>
    <p className={cn("text-xs font-medium", achieved ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
  </div>
);

const SoundOption = ({ icon: Icon, label, selected }: { icon: React.ElementType, label: string, selected?: boolean }) => (
  <div className={cn("p-3 rounded-lg flex flex-col items-center space-y-1 cursor-pointer", selected ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-400' : 'bg-gray-100 dark:bg-gray-800')}>
    <Icon className={cn("w-6 h-6", selected ? 'text-blue-600 dark:text-blue-300' : 'text-muted-foreground')} />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

const Settings = () => {
  const { session, signOut } = useSession();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="sticky top-0 bg-gray-50/80 dark:bg-black/80 backdrop-blur-sm z-10 flex items-center p-4 border-b">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-center flex-grow">Your Journey</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* User Profile Card */}
        {session?.user && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={session.user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {session.user.user_metadata?.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="font-semibold">{session.user.user_metadata?.name || session.user.email}</p>
                <p className="text-sm text-muted-foreground">Logged in with Google</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Adaptive Goals */}
        <Card>
          <CardContent className="p-4 flex items-start space-x-4">
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 shrink-0"></div>
            <div>
              <h3 className="font-semibold">Adaptive Goals</h3>
              <p className="text-sm text-muted-foreground">
                Your daily goals adjust automatically based on your performance. If you're struggling, we'll ease up. If you're crushing it, we'll challenge you more. The timeline extends or shortens to keep you on track.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-3xl font-bold">7</p>
              <p className="text-sm text-muted-foreground">days active</p>
            </div>
            <div>
              <p className="text-3xl font-bold">338</p>
              <p className="text-sm text-muted-foreground">total journey days</p>
            </div>
            <div>
              <p className="text-xl font-semibold">Nov 27</p>
              <p className="text-sm text-muted-foreground">started</p>
            </div>
            <div>
              <p className="text-xl font-semibold">Oct 31, 2026</p>
              <p className="text-sm text-muted-foreground">target completion</p>
            </div>
          </CardContent>
        </Card>

        {/* Push-Ups Journey */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Push-Ups Journey</CardTitle>
            <Badge variant="secondary">Building steadily</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold">8</span>
              <span className="text-muted-foreground">/day</span>
              <span className="flex-grow text-right text-sm text-muted-foreground">target: <span className="font-semibold text-foreground">200</span></span>
            </div>
            <Progress value={4} className="w-full h-2 my-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4" />
                <span>331 days to go</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Target className="w-4 h-4" />
                <span>Oct 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meditation Journey */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Meditation Journey</CardTitle>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Ahead of schedule
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold">4</span>
              <span className="text-muted-foreground">min/day</span>
              <span className="flex-grow text-right text-sm text-muted-foreground">target: <span className="font-semibold text-foreground">120 min</span></span>
            </div>
            <Progress value={3.3} className="w-full h-2 my-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4" />
                <span>331 days to go</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Target className="w-4 h-4" />
                <span>Oct 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">BADGES (1/13)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-4">
            <BadgeIcon icon={Star} label="First Step" achieved />
            <BadgeIcon icon={Flame} label="Momentum Builder" />
            <BadgeIcon icon={Shield} label="Week Warrior" />
            <BadgeIcon icon={Target} label="Consistent Crusader" />
            <BadgeIcon icon={Crown} label="Monthly Master" />
            <BadgeIcon icon={Zap} label="Unstoppable" />
            <BadgeIcon icon={Trophy} label="Legendary" />
            <BadgeIcon icon={Sparkles} label="Century Club" />
            <BadgeIcon icon={Mountain} label="Iron Arms" />
            <BadgeIcon icon={Award} label="Push-up Champion" />
            <BadgeIcon icon={Sun} label="Zen Beginner" />
            <BadgeIcon icon={Moon} label="Zen Practitioner" />
            <BadgeIcon icon={Heart} label="Zen Master" />
          </CardContent>
        </Card>

        {/* Momentum Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Momentum Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>
              <div>
                <h4 className="font-semibold">Struggling</h4>
                <p className="text-sm text-muted-foreground">Goals reduced, timeline may extend. Focus on showing up.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
              <div>
                <h4 className="font-semibold">Building</h4>
                <p className="text-sm text-muted-foreground">Steady progress. Goals increase gradually.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
              <div>
                <h4 className="font-semibold">Strong</h4>
                <p className="text-sm text-muted-foreground">Great consistency! Goals increasing faster.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
              <div>
                <h4 className="font-semibold">Crushing</h4>
                <p className="text-sm text-muted-foreground">Ahead of schedule! Maximum progression.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meditation Sound */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-2">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Meditation Sound</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-2">
            <SoundOption icon={Smile} label="Silence" />
            <SoundOption icon={CloudRain} label="Rain" />
            <SoundOption icon={Trees} label="Forest" selected />
            <SoundOption icon={Waves} label="Ocean" />
            <SoundOption icon={Flame} label="Fire" />
            <SoundOption icon={Wind} label="Wind" />
            <SoundOption icon={Bird} label="Birds" />
            <SoundOption icon={Droplets} label="Stream" />
          </CardContent>
        </Card>

        {/* Lifetime Progress */}
        <div className="text-center py-6">
          <p className="text-sm font-semibold text-muted-foreground tracking-widest mb-4">LIFETIME PROGRESS</p>
          <div className="flex justify-center items-baseline space-x-8">
            <div className="flex items-center space-x-2">
              <Dumbbell className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">62</p>
                <p className="text-xs text-muted-foreground">push-ups</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold">0h 28m</p>
                <p className="text-xs text-muted-foreground">meditation</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;