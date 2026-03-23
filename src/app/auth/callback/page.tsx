'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // This function checks the URL for the GitHub auth token
    // and saves the user session into your browser.
    const handleAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error.message);
        router.push('/?error=auth_failed');
        return;
      }

      if (session) {
        // Successfully logged in! Send them back to the main app.
        router.push('/');
      }
    };

    handleAuth();

    // Set up a listener just in case the session takes a second to establish
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500">
      <div className="flex flex-col items-center">
        {/* Brutalist loading square */}
        <div className="w-16 h-16 border-4 border-black dark:border-white animate-[spin_2s_linear_infinite] mb-8 flex items-center justify-center p-2">
          <div className="w-full h-full bg-black dark:bg-white animate-pulse" />
        </div>
        
        <h1 className="font-mono text-xl tracking-widest lowercase flex items-center">
          [authenticating_github]
          <span className="w-3 h-5 bg-black dark:bg-white ml-2 animate-[blink_0.8s_step-end_infinite]" />
        </h1>
      </div>
    </main>
  );
}