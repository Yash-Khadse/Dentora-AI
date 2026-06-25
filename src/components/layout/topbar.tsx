"use client";

import { useTheme } from "next-themes";
import { Bell, Sun, Moon, Search, Flame, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db/supabase";

interface TopbarProps {
  userInitials?: string;
  avatarUrl?: string;
  userName?: string;
  streak?: number;
  unreadNotifications?: number;
  onMobileMenuClick?: () => void;
}

export function Topbar({
  userInitials = "DS",
  avatarUrl,
  userName = "Student",
  streak = 0,
  unreadNotifications = 0,
  onMobileMenuClick,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-14 lg:h-16 border-b border-border bg-card/80 backdrop-blur-sm px-3 lg:px-6 flex items-center gap-2 lg:gap-4 shrink-0">
      {/* Mobile: hamburger + brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onMobileMenuClick}
        >
          <Menu size={20} />
        </Button>
        <span className="font-bold text-sm dentora-gradient-text">Dentora AI</span>
      </div>

      {/* Desktop: search */}
      <div className="relative hidden lg:flex flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search topics, notes, questions..."
          className="pl-9 bg-background h-9 text-sm"
        />
      </div>

      {/* Spacer on mobile so right icons are pushed to edge */}
      <div className="flex-1 lg:hidden" />

      <div className="flex items-center gap-1 lg:gap-2">
        {/* Study streak — full on sm+, icon-only on xs */}
        {streak > 0 && (
          <>
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg text-sm font-medium">
              <Flame size={14} />
              <span>{streak}d streak</span>
            </div>
            <div className="flex sm:hidden items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1.5 rounded-lg text-xs font-bold">
              <Flame size={13} />
              <span>{streak}</span>
            </div>
          </>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell size={16} />
          {unreadNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-destructive">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </Badge>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 lg:px-2 lg:py-1.5 hover:bg-accent/50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{userName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
