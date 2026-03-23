'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [activePage, setActivePage] = useState('core');
  const [loaderState, setLoaderState] = useState('visible'); // visible, fading, hidden
  const [isDark, setIsDark] = useState(false);

  // Faster loader sequence
  useEffect(() => {
    const fadeTimer = setTimeout(() => setLoaderState('fading'), 1200);
    const removeTimer = setTimeout(() => setLoaderState('hidden'), 1600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Theme Toggle Effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <main className="min-h-screen w-full font-sans text-black bg-white overflow-hidden">
        {/* Global Theme Toggle */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className="fixed top-6 right-6 z-50 font-mono text-xs opacity-50 hover:opacity-100 transition-opacity duration-300"
      >
        [ {isDark ? 'light' : 'dark'} mode ]
      </button>
      
      {/* 1. LOADER */}
      {loaderState !== 'hidden' && (
        <div 
          className="fixed inset-0 bg-white flex justify-center items-center z-[9999] transition-opacity duration-500 ease-in-out"
          style={{ opacity: loaderState === 'fading' ? 0 : 1 }}
        >
          <div className="w-[100px] h-[2px] bg-grey overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-black animate-[load_1s_ease-in-out_forwards]" />
          </div>
        </div>
      )}

      {/* 2. CORE PAGE */}
      {activePage === 'core' && (
        <section className="relative min-h-screen w-full flex flex-col justify-center items-center text-center animate-[pageIn_0.8s_var(--ease)_forwards] overflow-hidden">
          
          {/* 10x Style Architectural Grid Background */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f2f2f2_1px,transparent_1px),linear-gradient(to_bottom,#f2f2f2_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-80" />
          </div>

          {/* Main Title Typography */}
          <div className="relative z-10 pr-5 mb-10">
            <h1 className="text-[7vw] md:text-[5.5vw] font-black text-grey whitespace-nowrap lowercase leading-none tracking-tight">
              stuffimade(dot)withai
            </h1>
            <h1 className="absolute left-0 top-0 h-full text-black overflow-hidden whitespace-nowrap text-[7vw] md:text-[5.5vw] font-black lowercase leading-none tracking-tight border-r-4 border-transparent animate-[reveal_2s_var(--ease)_forwards_0.2s,blink_0.8s_step-end_infinite_2.5s] w-0">
              stuffimade(dot)withai
            </h1>
          </div>
          
          {/* 10x Style Glassmorphism Nav Pill */}
          <div className="relative z-10 flex gap-8 mt-5 opacity-0 animate-[fadeIn_1s_forwards_2.8s] font-mono text-sm bg-white/60 backdrop-blur-md px-8 py-4 rounded-full border border-grey shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <button onClick={() => setActivePage('manifesto')} className="text-black/40 hover:text-black hover:scale-105 transition-all duration-300">
              /manifesto
            </button>
            <div className="w-[1px] h-4 bg-grey self-center" /> {/* Subtle divider */}
            <button onClick={() => setActivePage('products')} className="text-black/40 hover:text-black hover:scale-105 transition-all duration-300">
              /products
            </button>
          </div>

        </section>
      )}

      {/* 3. MANIFESTO PAGE */}
      {activePage === 'manifesto' && (
        <section className="min-h-screen w-full flex flex-col items-center py-20 px-6 animate-[pageIn_0.6s_ease_forwards]">
          <div className="max-w-[1100px] w-full">
            <nav className="flex gap-5 font-mono text-sm mb-16">
              <button onClick={() => setActivePage('core')} className="text-black/30 hover:text-black transition-colors">/core</button>
              <button className="text-black transition-colors font-bold">/manifesto</button>
              <button onClick={() => setActivePage('products')} className="text-black/30 hover:text-black transition-colors">/products</button>
            </nav>
            
            <h1 className="text-6xl md:text-8xl font-black lowercase tracking-tighter mb-10">manifesto</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
              <div className="group relative aspect-square border border-grey p-10 overflow-hidden flex flex-col justify-between cursor-default">
                <div className="absolute bottom-0 left-0 w-full h-0 bg-black transition-all duration-700 ease-[var(--ease)] group-hover:h-full z-0" />
                <div className="relative z-10 transition-colors duration-700 group-hover:text-white flex flex-col h-full justify-between">
                  <p className="font-mono text-sm opacity-50">01</p>
                  <div>
                    <h2 className="text-3xl font-bold lowercase mb-2">prompt.</h2>
                    <p className="font-mono text-xs">talking to the machine.</p>
                  </div>
                </div>
              </div>

              <div className="group relative aspect-square border border-grey p-10 overflow-hidden flex flex-col justify-between cursor-default">
                <div className="absolute bottom-0 left-0 w-full h-0 bg-black transition-all duration-700 ease-[var(--ease)] group-hover:h-full z-0" />
                <div className="relative z-10 transition-colors duration-700 group-hover:text-white flex flex-col h-full justify-between">
                  <p className="font-mono text-sm opacity-50">02</p>
                  <div>
                    <h2 className="text-3xl font-bold lowercase mb-2">drop.</h2>
                    <p className="font-mono text-xs">deploying the vibe.</p>
                  </div>
                </div>
              </div>

              <div className="group relative aspect-square border border-grey p-10 overflow-hidden flex flex-col justify-between cursor-default">
                <div className="absolute bottom-0 left-0 w-full h-0 bg-black transition-all duration-700 ease-[var(--ease)] group-hover:h-full z-0" />
                <div className="relative z-10 transition-colors duration-700 group-hover:text-white flex flex-col h-full justify-between">
                  <p className="font-mono text-sm opacity-50">03</p>
                  <div>
                    <h2 className="text-3xl font-bold lowercase mb-2">flex.</h2>
                    <p className="font-mono text-xs">showing the world.</p>
                  </div>
                </div>
              </div>

              <div onClick={() => setActivePage('products')} className="group relative aspect-square border border-grey p-10 overflow-hidden flex flex-col justify-between cursor-pointer">
                <div className="absolute bottom-0 left-0 w-full h-0 bg-black transition-all duration-700 ease-[var(--ease)] group-hover:h-full z-0" />
                <div className="relative z-10 transition-colors duration-700 group-hover:text-white flex flex-col h-full justify-between">
                  <p className="font-mono text-sm opacity-50">04</p>
                  <div>
                    <h2 className="text-3xl font-bold lowercase mb-2">sync.</h2>
                    <p className="font-mono text-xs">view active products -{'>'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. PRODUCTS PAGE (Database Setup Mode) */}
      {activePage === 'products' && (
        <section className="min-h-screen w-full flex flex-col items-center justify-center py-20 px-6 animate-[pageIn_0.6s_ease_forwards]">
          <div className="w-full max-w-[800px]">
            <nav className="flex gap-5 font-mono text-sm mb-10 w-full justify-start">
              <button onClick={() => setActivePage('core')} className="text-black/30 hover:text-black transition-colors">/core</button>
              <button onClick={() => setActivePage('manifesto')} className="text-black/30 hover:text-black transition-colors">/manifesto</button>
              <button className="text-black transition-colors font-bold">/products</button>
            </nav>

            {/* The Dithering Terminal */}
            <div className="relative w-full aspect-video border-2 border-black bg-black flex flex-col items-center justify-center overflow-hidden cursor-crosshair">
              
              {/* Scanline / Dither Effect */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay" 
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)' }}
              />
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ backgroundImage: 'repeating-radial-gradient(circle, #fff 1px, transparent 2px)', backgroundSize: '6px 6px' }}
              />

              {/* Robot Eye / Status Indicator */}
              <div className="relative z-10 w-16 h-8 border-2 border-white mb-8 flex items-center justify-center p-1">
                <div className="w-full h-full bg-white animate-pulse" />
              </div>

              {/* Status Text */}
              <h1 className="relative z-10 text-white font-mono text-xl md:text-3xl tracking-widest lowercase flex items-center">
                [configuring database]
                <span className="w-4 md:w-6 h-6 md:h-8 bg-white ml-2 animate-[blink_0.8s_step-end_infinite]" />
              </h1>
              
            </div>
          </div>
        </section>
      )}
    </main>
  );
}