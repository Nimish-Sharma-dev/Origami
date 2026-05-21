'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'
import {
  LayoutDashboard, FileText, Github, BarChart3,
  Target, Map, Download, Settings, Layers,
  LogOut, ChevronRight, Bell, Search, Menu, X,
  Zap, TrendingUp,
} from 'lucide-react'
import Image from 'next/image'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', badge: null },
  { href: '/resume', icon: FileText, label: 'Resume Builder', badge: 'AI' },
  { href: '/github', icon: Github, label: 'GitHub Analysis', badge: null },
  { href: '/skills', icon: BarChart3, label: 'Skills Graph', badge: null },
  { href: '/ats', icon: Target, label: 'ATS Score', badge: null },
  { href: '/roadmap', icon: Map, label: 'Career Roadmap', badge: 'New' },
  { href: '/export', icon: Download, label: 'Export Center', badge: null },
  { href: '/settings', icon: Settings, label: 'Settings', badge: null },
]

function Sidebar({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-white border-r border-emerald-50 z-40 flex flex-col
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-emerald-50">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">Origami</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-l-[3px] border-emerald-500 pl-2.5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    item.badge === 'AI' ? 'bg-emerald-100 text-emerald-700' :
                    item.badge === 'New' ? 'bg-teal-100 text-teal-700' : ''
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-emerald-50">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 mb-3">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
        setUser(data)
      }
    }
    fetchUser()
  }, [])

  const pageTitle = navItems.find(item => item.href === pathname)?.label || 'Dashboard'

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-emerald-50 flex items-center gap-4 px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="font-bold text-gray-900 text-lg">{pageTitle}</h1>
          </div>

          <div className="flex-1 max-w-md mx-auto hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search skills, repos, resumes..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-emerald-300 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Quick actions */}
            <Link
              href="/resume"
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-emerald-200 transition-all"
            >
              <Zap className="w-4 h-4" />
              Generate Resume
            </Link>

            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>

            {user && (
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
