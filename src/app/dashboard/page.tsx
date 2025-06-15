'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertCircle } from 'lucide-react';
import { AnimeNavBarDemo } from '@/components/ui/anime-navbar-demo';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

interface Skill {
  name: string;
  proficient: boolean;
}

interface Category {
  id: string;
  name: string;
  score: number;
  color: string;
  skills: Skill[];
  x: number;
  y: number;
  size: number;
}

interface Position {
  x: number;
  y: number;
  size: number;
}

interface SkillLevel {
  level: string;
  color: string;
  bgColor: string;
}

const CONTAINER_WIDTH = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9, 1000) : 1000; // Responsive width
const CONTAINER_HEIGHT = typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.8, 800) : 800; // Responsive height

const DashboardPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popupView, setPopupView] = useState<'main' | 'resources' | 'strategies'>('main');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [fetchedRecommendations, setFetchedRecommendations] = useState<{ title: string; url: string; }[] | null>(null);
  const [fetchedStrategies, setFetchedStrategies] = useState<{ title: string; url: string; platform: string; }[] | null>(null);
  const [windowSize, setWindowSize] = useState({ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT });

  // Interview preparation categories with dummy data
const initialCategories: Omit<Category, 'x' | 'y' | 'size'>[] = [
  {
      id: '1',
    name: 'Projects',
    score: 85,
      color: '#4F46E5', // Indigo
      skills: [
        { name: 'Project Planning', proficient: true },
        { name: 'Technical Implementation', proficient: true },
        { name: 'Problem Solving', proficient: true },
        { name: 'Documentation', proficient: false },
        { name: 'Testing', proficient: false },
      ]
  },
  {
      id: '2',
    name: 'Technical',
      score: 72,
      color: '#059669', // Emerald
      skills: [
        { name: 'System Design', proficient: true },
        { name: 'Data Structures', proficient: true },
        { name: 'Algorithms', proficient: true },
        { name: 'Database Design', proficient: false },
        { name: 'API Design', proficient: false },
      ]
  },
  {
      id: '3',
    name: 'Behavioral',
      score: 45,
      color: '#7C3AED', // Violet
      skills: [
        { name: 'Communication', proficient: true },
        { name: 'Teamwork', proficient: true },
        { name: 'Leadership', proficient: false },
        { name: 'Conflict Resolution', proficient: false },
        { name: 'Time Management', proficient: false },
      ]
  },
  {
      id: '4',
    name: 'Experience',
      score: 60,
      color: '#DC2626', // Red
      skills: [
        { name: 'Industry Knowledge', proficient: true },
        { name: 'Best Practices', proficient: true },
        { name: 'Tools & Technologies', proficient: false },
        { name: 'Methodologies', proficient: false },
        { name: 'Standards', proficient: false },
      ]
    },
    {
      id: '5',
      name: 'Problem-solving',
      score: 30,
      color: '#EA580C', // Orange
      skills: [
        { name: 'Code Optimization', proficient: false },
        { name: 'Debugging', proficient: false },
        { name: 'Time Complexity', proficient: false },
        { name: 'Space Complexity', proficient: false },
        { name: 'Edge Cases', proficient: false },
      ]
    }
  ];

  const lackingSkills = React.useMemo(() => {
    return selectedCategory ? selectedCategory.skills.filter(skill => !skill.proficient) : [];
  }, [selectedCategory]);

  const proficientSkills = React.useMemo(() => {
    return selectedCategory ? selectedCategory.skills.filter(skill => skill.proficient) : [];
  }, [selectedCategory]);

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: Math.min(window.innerWidth * 0.9, 1000),
        height: Math.min(window.innerHeight * 0.8, 800)
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to generate non-overlapping positions around center (all calculations in pixels)
  const generateNonOverlappingPositions = (
    categories: Omit<Category, 'x' | 'y' | 'size'>[],
    containerWidth: number,
    containerHeight: number
  ): Position[] => {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const minBufferDistance = 30;
    const padding = 60; // Padding from container edges

    const positions: Position[] = [];
    
    categories.forEach((cat) => {
      // Calculate responsive bubble size based on screen width
      const maxBubbleSize = Math.min(250, containerWidth * 0.25);
      const minBubbleSize = Math.max(80, containerWidth * 0.15);
      const currentBubbleDiameter_px = Math.max(minBubbleSize, Math.min(maxBubbleSize, cat.score * 1.7 + 60));
      const currentBubbleRadius_px = currentBubbleDiameter_px / 2;

      // Start position below navbar
      let x_px = centerX + (Math.random() - 0.5) * (containerWidth * 0.6);
      let y_px = centerY + (Math.random() - 0.5) * (containerHeight * 0.6);

      let attempts = 0;
      const maxPlacementAttempts = 100;

      let hasOverlap = true;
      while (hasOverlap && attempts < maxPlacementAttempts) {
        hasOverlap = false;
        let dx_total = 0;
        let dy_total = 0;

        // Check for overlaps with already placed bubbles
        for (const pos of positions) {
          const otherBubbleDiameter_px = pos.size;
          const otherBubbleRadius_px = otherBubbleDiameter_px / 2;

          const pos_x_px = (pos.x / 100) * containerWidth;
          const pos_y_px = (pos.y / 100) * containerHeight;

          const dx = x_px - pos_x_px;
          const dy = y_px - pos_y_px;

          const distanceBetweenCenters_px = Math.sqrt(dx * dx + dy * dy);
          const minRequiredDistanceBetweenCenters_px = currentBubbleRadius_px + otherBubbleRadius_px + minBufferDistance;

          if (distanceBetweenCenters_px < minRequiredDistanceBetweenCenters_px) {
            hasOverlap = true;

            // Calculate repulsion force
            const overlap = minRequiredDistanceBetweenCenters_px - distanceBetweenCenters_px;
            const angle = Math.atan2(dy, dx);
            const force = Math.min(overlap * 0.5, 20); // Limit maximum force

            dx_total += Math.cos(angle) * force;
            dy_total += Math.sin(angle) * force;
          }
        }

        if (hasOverlap) {
          x_px += dx_total;
          y_px += dy_total;
        
          // Clamp to container bounds with padding
          x_px = Math.max(currentBubbleRadius_px + padding, Math.min(containerWidth - currentBubbleRadius_px - padding, x_px));
          y_px = Math.max(currentBubbleRadius_px + padding, Math.min(containerHeight - currentBubbleRadius_px - padding, y_px));
        }
        
        attempts++;
      }

      positions.push({
        x: (x_px / containerWidth) * 100,
        y: (y_px / containerHeight) * 100,
        size: currentBubbleDiameter_px,
      });
    });
    
    return positions;
  };

  // Function to fetch real-time recommendations from your backend API
  const fetchRecommendations = async (lackingSkills: Skill[]) => {
    console.log('Fetching real-time recommendations for lacking skills:', lackingSkills.map(s => s.name).join(', '));

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lackingSkills: lackingSkills.map(s => s.name),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  };

  // Function to fetch strategies from various platforms
  const fetchStrategies = async (skill: string) => {
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skill: skill,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return [];
    }
  };

  // Update useEffect to use windowSize
  useEffect(() => {
    const positions = generateNonOverlappingPositions(initialCategories, windowSize.width, windowSize.height);
    
    const initCategories = initialCategories.map((cat, index) => ({
      ...cat,
      ...positions[index],
    }));
    setCategories(initCategories);
  }, [windowSize]); // Recalculate positions when window size changes

  useEffect(() => {
    if (selectedCategory && lackingSkills.length > 0) {
      setFetchedRecommendations(null); // Clear previous recommendations
      // Pass only lackingSkills to the fetch function
      fetchRecommendations(lackingSkills).then(resources => {
        setFetchedRecommendations(resources);
      });
    } else {
      setFetchedRecommendations(null); // Clear if no category selected or no lacking skills
    }
  }, [selectedCategory, lackingSkills]); // Remove proficientSkills from dependency array

  useEffect(() => {
    if (selectedSkill && popupView === 'strategies') {
      setFetchedStrategies(null);
      fetchStrategies(selectedSkill).then(strategies => {
        setFetchedStrategies(strategies);
      });
    }
  }, [selectedSkill, popupView]);

  const getSkillLevel = (score: number): SkillLevel => {
    if (score >= 90) return { level: 'Expert', color: '#059669', bgColor: 'from-emerald-500 to-emerald-600' };
    if (score >= 80) return { level: 'Advanced', color: '#4F46E5', bgColor: 'from-indigo-500 to-indigo-600' };
    if (score >= 70) return { level: 'Proficient', color: '#7C3AED', bgColor: 'from-violet-500 to-violet-600' };
    if (score >= 60) return { level: 'Intermediate', color: '#DC2626', bgColor: 'from-red-500 to-red-600' };
    if (score >= 40) return { level: 'Beginner', color: '#EA580C', bgColor: 'from-orange-500 to-orange-600' };
    return { level: 'Novice', color: '#6B7280', bgColor: 'from-gray-500 to-gray-600' };
  };

  // Update the getPercentageFontSize function to be responsive
  const getPercentageFontSize = (bubbleSize: number) => {
    const minFontSize = Math.max(12, windowSize.width * 0.015);
    const maxFontSize = Math.min(24, windowSize.width * 0.025);

    if (bubbleSize <= 80) return minFontSize;
    if (bubbleSize >= 250) return maxFontSize;

    const ratio = (bubbleSize - 80) / (250 - 80);
    return minFontSize + ratio * (maxFontSize - minFontSize);
  };

  // Update the getNameFontSize function to be responsive
  const getNameFontSize = (bubbleSize: number) => {
    const minFontSize = Math.max(8, windowSize.width * 0.01);
    const maxFontSize = Math.min(14, windowSize.width * 0.015);

    if (bubbleSize <= 80) return minFontSize;
    if (bubbleSize >= 250) return maxFontSize;

    const ratio = (bubbleSize - 80) / (250 - 80);
    return minFontSize + ratio * (maxFontSize - minFontSize);
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      
      <SignedIn>
        <div className="min-h-screen bg-black overflow-hidden">
          <AnimeNavBarDemo />
          <div className="relative">
            <div className="relative w-full h-[calc(100vh-80px)] bg-black overflow-hidden">
              {/* Enhanced animated background particles */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0.1, 0.8, 0.1],
                      scale: [0.5, 2.5, 0.5],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 4,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Main visualization container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative" style={{ width: `${windowSize.width}px`, height: `${windowSize.height}px` }}>
                  <AnimatePresence>
                    {categories.map((category: Category, index: number) => (
                      <motion.div
                        key={category.id}
                        className="absolute cursor-pointer"
                        style={{
                          left: `${category.x}%`,
                          top: `${category.y}%`,
                          width: `${category.size}px`,
                          height: `${category.size}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          x: [0, 10, -10, 0],
                          y: [0, -8, 8, 0],
                          rotate: [0, 2, -2, 0],
                        }}
                        transition={{
                          scale: {
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          },
                          x: {
                            duration: 12 + Math.random() * 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.5,
                          },
                          y: {
                            duration: 12 + Math.random() * 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.5,
                          },
                          rotate: {
                            duration: 12 + Math.random() * 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.5,
                          }
                        }}
                        whileHover={{ 
                          scale: 1.1,
                          transition: { duration: 0.3 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {/* Outer intense pulsing glow */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `radial-gradient(circle, ${category.color}50 0%, ${category.color}20 50%, transparent 80%)`,
                            transform: 'scale(1.6)',
                            filter: 'blur(12px)',
                          }}
                          animate={{
                            opacity: [0.4, 1, 0.4],
                            scale: [1.4, 1.8, 1.4],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.4,
                          }}
                        />
                        
                        {/* Circumference glow ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: 'transparent',
                            border: `3px solid ${category.color}80`,
                            transform: 'scale(1.05)',
                            filter: 'blur(2px)',
                            boxShadow: `
                              0 0 20px ${category.color}80,
                              0 0 40px ${category.color}60,
                              inset 0 0 20px ${category.color}40
                            `,
                          }}
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [1.02, 1.08, 1.02],
                            borderColor: [`${category.color}60`, `${category.color}FF`, `${category.color}60`],
                          }}
                          transition={{
                            duration: 3.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.6,
                          }}
                        />
                        
                        {/* Secondary glow pulse */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `radial-gradient(circle, ${category.color}60 0%, transparent 70%)`,
                            transform: 'scale(1.3)',
                            filter: 'blur(6px)',
                          }}
                          animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1.2, 1.4, 1.2],
                          }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.3,
                          }}
                        />
                        
                        {/* Glass bubble container */}
                        <div className="relative w-full h-full">
                          {/* Main liquid glass sphere */}
                          <div
                            className="absolute inset-0 rounded-full border border-white/20 backdrop-blur-md"
                            style={{
                              background: `
                                radial-gradient(circle at 35% 25%, rgba(255,255,255,0.25) 0%, transparent 50%),
                                radial-gradient(circle at 65% 75%, ${category.color}15 0%, transparent 60%),
                                linear-gradient(135deg, 
                                  rgba(255,255,255,0.1) 0%, 
                                  ${category.color}12 30%,
                                  ${category.color}08 70%,
                                  rgba(255,255,255,0.05) 100%
                                )
                              `,
                              boxShadow: `
                                inset 0 3px 40px rgba(255,255,255,0.15),
                                inset 0 -3px 30px ${category.color}20,
                                0 20px 60px ${category.color}20,
                                0 0 100px ${category.color}15,
                                0 0 20px ${category.color}40
                              `,
                            }}
                          />
                          
                          {/* Gradient liquid fill with wave animation */}
                          <div
                            className="absolute inset-1 rounded-full overflow-hidden"
                            style={{
                              background: `
                                linear-gradient(180deg, 
                                      #000 0%, 
                                      #000 ${100 - category.score}%, 
                                      ${category.color}40 ${100 - category.score}%, 
                                      ${category.color}60 ${100 - category.score + 10}%,
                                      ${category.color}80 100%
                                ),
                                radial-gradient(ellipse at center bottom, 
                                      ${category.color}70 0%, 
                                      ${category.color}50 40%,
                                      ${category.color}30 100%
                                )
                              `,
                            }}
                          >
                            {/* Animated liquid surface with enhanced gradient */}
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: `
                                  radial-gradient(ellipse at 50% ${100 - category.score}%, 
                                    rgba(255,255,255,0.3) 0%, 
                                    ${category.color}20 30%,
                                    transparent 50%
                                  ),
                                  linear-gradient(90deg,
                                    transparent 0%,
                                    rgba(255,255,255,0.2) 50%,
                                    transparent 100%
                                  )
                                `,
                              }}
                              animate={{
                                transform: [
                                  'translateY(0px) scaleY(1)',
                                  'translateY(-5px) scaleY(1.05)',
                                  'translateY(0px) scaleY(1)',
                                ],
                              }}
                              transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.8,
                              }}
                            />
                            
                            {/* Enhanced surface ripple effect */}
                            <motion.div
                              className="absolute inset-0"
                              style={{
                                background: `
                                  linear-gradient(90deg, 
                                    transparent 0%, 
                                    rgba(255,255,255,0.4) 30%,
                                    ${category.color}40 50%,
                                    rgba(255,255,255,0.4) 70%,
                                    transparent 100%
                                  )
                                `,
                                transform: `translateY(${100 - category.score}%)`,
                                height: '3px',
                                filter: 'blur(1px)',
                              }}
                              animate={{
                                x: ['-100%', '100%'],
                                opacity: [0.3, 0.8, 0.3],
                              }}
                              transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "linear",
                                delay: index * 1.0,
                              }}
                            />
                          </div>

                          {/* Enhanced multiple light reflections */}
                          <div
                            className="absolute top-[18%] left-[22%] w-[30%] h-[30%] rounded-full"
                            style={{
                              background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
                              filter: 'blur(1px)',
                            }}
                          />
                          
                          <div
                            className="absolute top-[12%] right-[28%] w-[18%] h-[40%] rounded-full"
                            style={{
                              background: 'linear-gradient(45deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 80%)',
                              filter: 'blur(2px)',
                            }}
                          />

                          {/* Center content with enhanced glass effect */}
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center drop-shadow-2xl">
                              <motion.div 
                                className="font-bold"
                                style={{ fontSize: `${getPercentageFontSize(category.size)}px` }}
                                animate={{
                                  textShadow: [
                                    `0 0 15px ${category.color}FF`,
                                    `0 0 30px ${category.color}80`,
                                    `0 0 15px ${category.color}FF`,
                                  ],
                                }}
                                transition={{
                                  duration: 2.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                {category.score}%
                              </motion.div>
                              <div 
                                className="opacity-95 font-semibold backdrop-blur-sm"
                                style={{ fontSize: `${getNameFontSize(category.size)}px` }}
                              >
                                {category.name}
                              </div>
                            </div>
                          </div>

                          {/* Enhanced animated rim light */}
                          <motion.div
                            className="absolute inset-0 rounded-full opacity-50"
                            style={{
                              background: `conic-gradient(from 0deg, ${category.color}60, transparent, ${category.color}80, transparent, ${category.color}60)`,
                              mask: 'radial-gradient(circle at center, transparent 86%, black 90%, transparent 94%)',
                            }}
                            animate={{
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 25,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category details panel */}
        <AnimatePresence>
          {selectedCategory && (
            <div className="fixed inset-x-0 top-[80px] bottom-0 flex items-start justify-center z-[100]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={() => {
                  setSelectedCategory(null);
                  setPopupView('main');
                  setSelectedSkill(null);
                }}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-[90vw] max-w-[400px] bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white shadow-2xl border border-white/20 mt-4"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{selectedCategory.name}</h3>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${getSkillLevel(selectedCategory.score).bgColor}`}>
                        {getSkillLevel(selectedCategory.score).level}
                      </div>
                      <div className="text-lg font-medium opacity-90">{selectedCategory.score}%</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setPopupView('main');
                      setSelectedSkill(null);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {popupView === 'main' && (
                  <div>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Proficient Skills</h4>
                        <div className="space-y-2">
                          {proficientSkills.map((skill, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg"
                            >
                              <span className="text-green-400">{skill.name}</span>
                              <TrendingUp size={16} className="text-green-400" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Skills to Improve</h4>
                        <div className="space-y-2">
                          {lackingSkills.map((skill, idx) => (
                            <React.Fragment key={idx}>
                              <div
                                onClick={() => {
                                  if (expandedSkill === skill.name) {
                                    setExpandedSkill(null);
                                    setSelectedSkill(null);
                                  } else {
                                    setExpandedSkill(skill.name);
                                    setSelectedSkill(skill.name);
                                    setPopupView('main');
                                  }
                                }}
                                className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                              >
                                <span className="text-red-400">{skill.name}</span>
                                <AlertCircle size={16} className="text-red-400" />
                              </div>
                              {expandedSkill === skill.name && selectedSkill === skill.name && (
                                <div className="flex gap-3 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPopupView('resources');
                                      setFetchedRecommendations(null);
                                      fetchRecommendations([{ name: selectedSkill, proficient: false }]).then(resources => {
                                        setFetchedRecommendations(resources);
                                      });
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                  >
                                    Learning Resources
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPopupView('strategies');
                                      setFetchedStrategies(null);
                                      fetchStrategies(selectedSkill).then(strategies => {
                                        setFetchedStrategies(strategies);
                                      });
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                  >
                                    Strategies
                                  </button>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {popupView === 'resources' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Learning Resources for {selectedSkill}</h4>
                      <button
                        onClick={() => setPopupView('main')}
                        className="px-3 py-1 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Back
                      </button>
                    </div>
                    {fetchedRecommendations ? (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {fetchedRecommendations.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                          >
                            <div className="text-blue-400 font-medium">{resource.title}</div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Loading resources...
                      </div>
                    )}
                  </div>
                )}

                {popupView === 'strategies' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">Success Strategies for {selectedSkill}</h4>
                      <button
                        onClick={() => setPopupView('main')}
                        className="px-3 py-1 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Back
                      </button>
                    </div>
                    {fetchedStrategies ? (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {fetchedStrategies.map((strategy, idx) => (
                          <a
                            key={idx}
                            href={strategy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors"
                          >
                            <div className="text-purple-400 font-medium">{strategy.title}</div>
                            <div className="text-sm text-purple-300/70 mt-1">From {strategy.platform}</div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Loading strategies...
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </SignedIn>
    </>
  );
};

export default DashboardPage;

