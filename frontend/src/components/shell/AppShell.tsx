import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { getNavigation } from "../../lib/constants"
import { useAuth } from "../../lib/auth-context"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const { activeRole, roleNames } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-primary-900">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary-950/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`
        z-50 transition-all duration-300 ease-in-out
        ${isMobile
          ? `fixed inset-y-0 left-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-[280px]`
          : `${sidebarCollapsed ? "w-[80px]" : "w-[260px]"} relative`
        }
      `}>
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => {
          if (isMobile) setSidebarOpen(true)
          else setSidebarCollapsed(!sidebarCollapsed)
        }} />
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-36 sm:px-8 md:px-10 lg:py-6 lg:pb-6">
          <div className="mx-auto max-w-[1600px] h-full">
            {children}
          </div>
        </main>
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-primary-100 px-4 flex items-center justify-around shadow-lg overflow-x-auto">
            {getNavigation(roleNames, activeRole?.name).flatMap((group) => group.items).slice(0, 5).map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  className="flex shrink-0 flex-col items-center justify-center gap-1 text-primary-400 hover:text-accent transition-colors"
                  onClick={() => navigate(item.href)}
                >
                  {Icon && <Icon size={20} />}
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
