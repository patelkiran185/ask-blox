"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { LucideIcon, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import { useRouter, usePathname } from "next/navigation"
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  defaultActive?: string
}

export function AnimeNavBar({ items, defaultActive = "Home" }: NavBarProps) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Determine active tab based on current pathname
  const getActiveTab = () => {
    const currentItem = items.find(item => {
      if (item.url === "/" && pathname === "/") return true
      if (item.url !== "/" && pathname.startsWith(item.url)) return true
      return false
    })
    return currentItem?.name || defaultActive
  }
  
  const activeTab = getActiveTab()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const handleNavClick = (item: NavItem) => {
    // Handle authentication for protected pages
    if ((item.name === "Dashboard" || item.name === "Learn") && !isSignedIn) {
      router.push("/sign-in")
      return
    }
    
    // Navigate to the page
    router.push(item.url)
    setIsMobileMenuOpen(false)
  }

  if (!mounted) return null

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[1000] px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo */}
          <Link href="/" className="flex-shrink-0">
        <img src="/icon.png" alt="AskBlox" className="w-10 h-10 rounded-full" />
          </Link>
        
          {/* Desktop Navigation */}
        <motion.div 
            className="hidden md:flex items-center gap-3 bg-black/50 border border-white/10 backdrop-blur-lg py-2 px-2 rounded-full shadow-lg relative"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name
            const isHovered = hoveredTab === item.name

            return (
                <button
                key={item.name}
                  onClick={() => handleNavClick(item)}
                onMouseEnter={() => setHoveredTab(item.name)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-6 py-3 rounded-full transition-all duration-300",
                  "text-white/70 hover:text-white",
                  isActive && "text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3],
                      scale: [1, 1.03, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur-md" />
                    <div className="absolute inset-[-4px] bg-blue-600/20 rounded-full blur-xl" />
                    <div className="absolute inset-[-8px] bg-blue-600/15 rounded-full blur-2xl" />
                    <div className="absolute inset-[-12px] bg-blue-600/5 rounded-full blur-3xl" />
                    
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0"
                      style={{
                        animation: "shine 3s ease-in-out infinite"
                      }}
                    />
                  </motion.div>
                )}

                <motion.span
                    className="relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
          
                <AnimatePresence>
                  {isHovered && !isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-white/10 rounded-full -z-10"
                    />
                  )}
                </AnimatePresence>
                </button>
            )
          })}
        </motion.div>
        
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-black/50 border border-white/10 backdrop-blur-lg text-white"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Desktop User Section */}
          <div className="hidden md:flex items-center flex-shrink-0">
          <SignedIn>
            <div style={{ zIndex: 999999 }}>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10",
                    userButtonPopoverCard: "z-[999999]",
                    userButtonPopoverActions: "z-[999999]"
                  }
                }}
              />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <button className="text-white/70 hover:text-white transition-colors duration-300 px-4 py-2 rounded-full border border-white/20 hover:border-white/40 text-sm font-medium">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-lg md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black/90 border-l border-white/10 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <img src="/icon.png" alt="AskBlox" className="w-8 h-8 rounded-full" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Mobile Navigation Items */}
                <div className="flex-1 px-6 py-4">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.name

                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavClick(item)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-300 mb-2",
                          isActive 
                            ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" 
                            : "text-white/70 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Mobile User Section */}
                <div className="p-6 border-t border-white/10">
                  <SignedIn>
                    <div className="flex items-center gap-3">
                      <UserButton
                        appearance={{
                          elements: {
                            userButtonAvatarBox: "w-10 h-10",
                          }
                        }}
                      />
                      <span className="text-white/70 text-sm">Account</span>
                    </div>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 