'use client';

import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useState } from 'react';

export default function Login() {
  const [isHovering, setIsHovering] = useState(false);

  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback` // We'll build this route next
      }
    });
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center bg-white text-black p-6">
      <div className="max-w-md w-full border border-grey p-10 flex flex-col items-center text-center">
        
        <h1 className="text-3xl font-black lowercase tracking-tighter mb-2">
          stuffimade(dot)withai
        </h1>
        <p className="font-mono text-xs opacity-50 mb-10">
          authorize your github to drop vibes.
        </p>

        {/* Brutalist GitHub Button */}
        <button 
          onClick={handleGitHubLogin}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative w-full border-2 border-black p-4 font-mono text-sm font-bold uppercase overflow-hidden group transition-colors duration-300"
        >
          <div className="absolute inset-0 bg-black w-0 group-hover:w-full transition-all duration-500 ease-[var(--ease)] z-0" />
          <span className={`relative z-10 transition-colors duration-500 ${isHovering ? 'text-white' : 'text-black'}`}>
            [ Connect GitHub ]
          </span>
        </button>

        <Link href="/" className="mt-8 font-mono text-xs text-black/40 hover:text-black transition-colors">
          &lt;- back to core
        </Link>
        
      </div>
    </main>
  );
}