'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cat, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateAvatar } from '@/lib/utils'

interface NavbarProps {
  user: { id: string; name: string; email: string }
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/dashboard', label: 'Phòng học', icon: LayoutDashboard },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <Cat className="h-5 w-5 text-white" />
          </div>
          <span className="hidden font-semibold text-white sm:block">Cat Learning Hub</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-brand/10 text-brand-light'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-light">
              {generateAvatar(user.name)}
            </div>
            <span className="hidden text-sm text-gray-300 sm:block">{user.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

