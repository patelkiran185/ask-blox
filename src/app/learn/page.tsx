import React from 'react';
import { AnimeNavBarDemo } from '@/components/ui/anime-navbar-demo';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

export default function ReverseInterviewPage() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      
      <SignedIn>
        <div className="min-h-screen bg-black">
          <AnimeNavBarDemo />
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-white text-6xl font-bold">Learn</h1>
          </div>
        </div>
      </SignedIn>
    </>
  );
} 