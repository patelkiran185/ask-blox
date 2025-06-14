import React from 'react';
import { AnimeNavBarDemo } from '@/components/ui/anime-navbar-demo';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      <AnimeNavBarDemo />
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-white text-6xl font-bold">About</h1>
      </div>
    </div>
  );
} 