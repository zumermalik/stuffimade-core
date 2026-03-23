'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Use whichever path worked for you previously!
import { supabase } from '../../lib/supabase/client';

export default function UserProfile() {
  const params = useParams();
  const username = params.username as string;

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync initial theme state
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }

    const fetchUserAndVibes = async () => {
      const { data: authData } = await supabase.auth.getSession();
      setSession(authData?.session);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('github_handle', username)
        .single();

      if (userError || !userData) {
        setLoading(false);
        return;
      }

      setProfile(userData);

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (projectsData) setProjects(projectsData);
      setLoading(false);
    };

    fetchUserAndVibes();
  }, [username]);

  // Theme Toggle Effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); 
    const isConfirmed = confirm("Are you sure you want to nuke this vibe from the mainframe?");
    if (!isConfirmed) return;

    await supabase.from('projects').delete().eq('id', projectId);
    setProjects(projects.filter(p => p.id !== projectId)); 
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-white transition-colors duration-500">
        <div className="w-16 h-16 border-4 border-black animate-[spin_2s_linear_infinite] p-2">
          <div className="w-full h-full bg-black animate-pulse" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen w-full flex flex-col justify-center items-center bg-white text-black transition-colors duration-500">
        <h1 className="text-4xl font-black lowercase tracking-tighter mb-4">404_hacker_not_found</h1>
        <Link href="/" className="font-mono text-sm opacity-50 hover:opacity-100 transition-opacity">
          &lt;- back to core
        </Link>
      </main>
    );
  }

  const isOwner = session?.user?.user_metadata?.user_name === username;

  return (
    <main className="min-h-screen w-full font-sans text-black bg-white overflow-hidden transition-colors duration-500">
      
      {/* Background Grid using CSS Variables */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grey)_1px,transparent_1px),linear-gradient(to_bottom,var(--grey)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80" />
      </div>

      {/* Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="font-mono text-xs font-bold opacity-50 hover:opacity-100 transition-opacity duration-300">
          &lt;- core
        </Link>
      </div>

      {/* Dark Mode Toggle */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className="fixed top-6 right-6 z-50 font-mono text-xs opacity-50 hover:opacity-100 transition-opacity duration-300"
      >
        [ {isDark ? 'light' : 'dark'} mode ]
      </button>

      <section className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-24 flex flex-col items-center animate-[pageIn_0.6s_ease_forwards]">
        
        <div className="flex flex-col items-center mb-20 text-center">
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt={profile.github_handle} className="w-24 h-24 mb-6 border-2 border-black grayscale hover:grayscale-0 transition-all duration-500" />
          )}
          <h1 className="text-5xl md:text-7xl font-black lowercase tracking-tighter">
            @{profile.github_handle}
          </h1>
          <p className="font-mono text-sm opacity-50 mt-4">
            [{projects.length} vibes deployed]
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="font-mono text-sm opacity-50 border border-dashed border-grey p-10 w-full text-center">
            no active products found in the mainframe.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {projects.map((project) => (
              <Link href={`/${profile.github_handle}/${project.id}`} key={project.id}>
                <div className="group relative border border-black p-8 overflow-hidden flex flex-col justify-between cursor-pointer aspect-square bg-white transition-transform hover:-translate-y-2 duration-300 h-full">
                  
                  <div className="absolute inset-0 bg-black w-0 group-hover:w-full transition-all duration-500 ease-[var(--ease)] z-0" />
                  
                  <div className="relative z-10 transition-colors duration-500 text-black group-hover:text-white h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold lowercase mb-2 pr-4">{project.title}</h2>
                        {isOwner && (
                          <button 
                            onClick={(e) => handleDelete(e, project.id)}
                            className="font-mono text-xs text-red-500 hover:text-red-700 opacity-50 hover:opacity-100 transition-opacity z-20"
                          >
                            [ delete ]
                          </button>
                        )}
                      </div>
                      <p className="font-mono text-xs opacity-70 line-clamp-3 leading-relaxed mt-2">
                        {project.description}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-end mt-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs opacity-50">
                          [ {new Date(project.created_at).toLocaleDateString()} ]
                        </span>
                        {!project.is_public && (
                          <span className="font-mono text-[10px] opacity-40">_private</span>
                        )}
                      </div>
                      <span className="font-mono text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        view -&gt;
                      </span>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}