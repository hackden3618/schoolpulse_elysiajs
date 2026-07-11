import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { Settings } from "lucide-react"
import { navigation } from "../../lib/constants"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // If moving to desktop, ensure drawer is closed
      if (!mobile) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-primary-900">
      {/* Mobile Drawer Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-primary-950/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
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

      {/* Main Application Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 md:px-10">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-primary-100 px-4 flex items-center justify-around shadow-lg">
            {navigation[0]?.items.map((item) => {
              const Icon = item.icon
              return (
                <button 
                  key={item.href} 
                  className="flex flex-col items-center justify-center gap-1 text-primary-400 hover:text-accent transition-colors"
                  onClick={() => navigate(item.href)}
                >
                  {Icon && <Icon size={20} />}
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              )
            })}
            <button 
              className="flex flex-col items-center justify-center gap-1 text-primary-400 hover:text-accent transition-colors"
              onClick={() => navigate("/settings")}
            >
              <Settings size={20} />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
