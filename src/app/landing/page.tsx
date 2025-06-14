'use client';
import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { AnimeNavBarDemo } from '@/components/ui/anime-navbar-demo';
import { ShimmerButton } from "@/components/magicui/shimmer-button";

function LandingPage() {
    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Anime Navigation Bar */}
            <AnimeNavBarDemo />
            
            {/* Video Background */}
            <video 
                className="absolute top-0 left-0 w-full h-full object-cover z-[-1]"
                autoPlay 
                muted 
                loop 
                playsInline
            >
                <source src="/images/bg3.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center h-full px-6">
                <div className="max-w-4xl text-center space-y-8">
                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
                        Reinvent the Way You
                        <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Prep for Interviews
                        </span>
                    </h1>
                    
                    {/* Subheading */}
                    <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed max-w-2xl mx-auto">
                    Say goodbye to boring PDFs. Visualize your prep journey, master your thinking style, 
                    and flip the script with bold questions—It&apos;s prep, leveled up.
                    </p>
                    
                    
                    
                                        {/* Call to Action */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 max-w-md mx-auto">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <ShimmerButton>
                                    Get Started

                                </ShimmerButton>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <Link href="/dashboard">
                                <ShimmerButton >
                                    Get Started
                                </ShimmerButton>
                            </Link>
                        </SignedIn>
                        
                        <Link href="/about">
                            <ShimmerButton >
                                Learn More
                            </ShimmerButton>
                        </Link>
                    </div>
                </div>
            </div>
            
            
        </div>
    );
}

export default LandingPage;

