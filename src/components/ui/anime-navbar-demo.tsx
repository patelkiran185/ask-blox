"use client"

import * as React from "react"
import { Home, BookOpen, LayoutDashboard, Info, MessageSquare, Brain } from "lucide-react"
import { AnimeNavBar } from "@/components/ui/anime-navbar"

const items = [
  {
    name: "Home",
    url: "/",
    icon: Home,
  },
  {
    name: "Learn",
    url: "/learn",
    icon: BookOpen,
  },
  {
    name: "Rev Interview",
    url: "/reverse-interview",
    icon: MessageSquare,
  },
  {
    name: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "MindMap",
    url: "/mindmap",
    icon: Brain,
  },
  {
    name: "About",
    url: "/about",
    icon: Info,
  },
]

export function AnimeNavBarDemo() {
  return <AnimeNavBar items={items} defaultActive="Home" />
} 