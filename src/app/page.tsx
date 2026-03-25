'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [activePage, setActivePage] = useState('core');
  const [loaderState, setLoaderState] = useState('visible');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [session, setSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropForm, setDropForm] = useState({ 
    title: '', description: '', prompt: '', isPublic: true, github_url: '', website_url: '' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [globalProjects, setGlobalProjects] = useState<any[]>([]);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);
  const [feedSort, setFeedSort] = useState<'new' | 'trending'>('new');
  const [searchQuery, setSearchQuery] = useState('');

  // Hydration & Theme Check
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  // Auth Sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Feed
  useEffect(() => {
    if (activePage === 'products') {
      setIsFetchingGlobal(true);
      const fetchFeed = async () => {
        const { data } = await supabase
          .from('projects')
          .select('*, users (github_handle, avatar_url), vibe_checks (user_id)')
          .eq('is_public', true)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });
        
        if (data) setGlobalProjects(data);
        setIsFetchingGlobal(false);
      };
      fetchFeed();
    }
  }, [activePage]);

  // Loader Timer
  useEffect(() => {
    const fadeTimer = setTimeout(() => setLoaderState('fading'), 1200);
    const removeTimer = setTimeout(() => setLoaderState('hidden'), 1600);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  // THE MASTER TOGGLE
  const toggleDarkMode = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActivePage('core');
  };

  const toggleVibeCheck = async (e: React.MouseEvent, projectId: string, currentVibes: any[]) => {
    e.preventDefault(); 
    if (!session) {
      alert("you must be logged in to drop a vibe check.");
      return;
    }

    const userId = session.user.id;
    const hasLiked = currentVibes.some((v) => v.user_id === userId);

    setGlobalProjects((prev) => 
      prev.map((p) => {
        if (p.id === projectId) {
          const newVibes = hasLiked 
            ? p.vibe_checks.filter((v: any) => v.user_id !== userId) 
            : [...p.vibe_checks, { user_id: userId }];
          return { ...p, vibe_checks: newVibes };
        }
        return p;
      })
    );

    if (hasLiked) {
      await supabase.from('vibe_checks').delete().match({ project_id: projectId, user_id: userId });
    } else {
      await supabase.from('vibe_checks').insert({ project_id: projectId, user_id: userId });
    }
  };

  const handleDropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSubmitting(true);

    try {
      const githubHandle = session.user.user_metadata.user_name || 'hacker';

      await supabase.from('users').upsert({
        id: session.user.id,
        github_handle: githubHandle,
        avatar_url: session.user.user_metadata.avatar_url
      });

      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('project-previews').upload(filePath, imageFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('project-previews').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }

      const { data: project, error: projectError } = await supabase.from('projects').insert({
        user_id: session.user.id,
        title: dropForm.title,
        description: dropForm.description,
        is_public: dropForm.isPublic,
        image_url: imageUrl,
        github_url: dropForm.github_url,
        website_url: dropForm.website_url,
        code_bundle: {} 
      }).select().single();

      if (projectError) throw projectError;

      if (project && dropForm.prompt) {
        await supabase.from('prompts_history').insert({
          project_id: project.id,
          step_order: 1,
          prompt_text: dropForm.prompt
        });
      }

      setDropForm({ title: '', description: '', prompt: '', isPublic: true, github_url: '', website_url: '' });
      setImageFile(null);
      router.push(`/${githubHandle}/${project.id}`);

    } catch (error: any) {
      console.error("Critical Drop Error:", error.message || error);
      alert(`Drop failed: ${error.message || 'Check console'}`);
      setIsSubmitting(false);
    }
  };

  const displayedProjects = [...globalProjects]
    .filter((project) => {
      if (!searchQuery) return true; // If search is empty, show everything
      const q = searchQuery.toLowerCase();
      return (
        project.title?.toLowerCase().includes(q) ||
        project.description?.toLowerCase().includes(q) ||
        project.users?.github_handle?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (feedSort === 'trending') {
        const aVibes = a.vibe_checks?.length || 0;
        const bVibes = b.vibe_checks?.length || 0;
        if (bVibes !== aVibes) return bVibes - aVibes;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (!mounted) return null;

  // THE NUCLEAR OPTION: Explicit hex codes mapped to state
  const c = {
    bg: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    muted: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    border: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    card: isDark ? '#111111' : '#ffffff',
    grid: isDark ? '#222222' : '#e5e5e5',
    invertBg: isDark ? '#ffffff' : '#000000',
    invertText: isDark ? '#000000' : '#ffffff',
  };

  return (
    <main 
      className="min-h-screen w-full font-sans transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      
      {/* 1. SOLID HEADER (Fixes the overlapping scrolling issue) */}
      <header 
        className="fixed top-0 left-0 w-full px-6 py-4 z-50 flex justify-between items-center border-b-2 transition-colors duration-500"
        style={{ backgroundColor: c.bg, borderColor: c.border }}
      >
        <div className="flex gap-4 font-mono text-xs">
          {!session ? (
            <button onClick={() => setActivePage('login')} style={{ color: c.muted }} className="hover:opacity-100 transition-opacity">[ login ]</button>
          ) : (
            <>
              <Link href={`/${session.user.user_metadata.user_name || 'hacker'}`} style={{ color: c.text }} className="font-bold hover:opacity-70 transition-opacity">
                [ @{session.user.user_metadata.user_name || 'hacker'} ]
              </Link>
              <button onClick={() => setActivePage('drop')} style={{ color: c.muted }} className="hover:opacity-100 transition-opacity">[ + drop vibe ]</button>
              <button onClick={handleSignOut} style={{ color: c.muted }} className="opacity-60 hover:opacity-100 transition-opacity">[ logout ]</button>
            </>
          )}
        </div>
        <button onClick={toggleDarkMode} style={{ color: c.muted }} className="font-mono text-xs hover:opacity-100 transition-opacity">
          [ {isDark ? 'light' : 'dark'} mode ]
        </button>
      </header>

      {/* BACKGROUND GRID */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-80 transition-all duration-500" 
          style={{ backgroundImage: `linear-gradient(to right, ${c.grid} 1px, transparent 1px), linear-gradient(to bottom, ${c.grid} 1px, transparent 1px)` }}
        />
      </div>

      {/* LOADER */}
      {loaderState !== 'hidden' && (
        <div className="fixed inset-0 flex justify-center items-center z-[9999] transition-opacity duration-500 ease-in-out" style={{ backgroundColor: c.bg, opacity: loaderState === 'fading' ? 0 : 1 }}>
          <div className="w-[100px] h-[2px] overflow-hidden relative" style={{ backgroundColor: c.grid }}>
            <div className="absolute top-0 left-0 h-full animate-[load_1s_ease-in-out_forwards]" style={{ backgroundColor: c.invertBg }} />
          </div>
        </div>
      )}

      {/* 2. CORE PAGE */}
      {activePage === 'core' && (
        <section className="relative min-h-screen w-full flex flex-col justify-center items-center text-center animate-[pageIn_0.8s_var(--ease)_forwards] overflow-hidden pt-20">
          <div className="relative z-10 pr-5 mb-10">
            {/* Cleaned up Hero Text to prevent animation glitches */}
            <h1 className="text-[7vw] md:text-[5.5vw] font-black lowercase leading-none tracking-tight transition-colors duration-500" style={{ color: c.text }}>
              stuffimade(dot)withai
            </h1>
          </div>
          <div className="relative z-10 flex gap-8 mt-5 opacity-0 animate-[fadeIn_1s_forwards_0.5s] font-mono text-sm px-8 py-4 rounded-full border shadow-xl transition-colors duration-500" style={{ backgroundColor: c.card, borderColor: c.border }}>
            <button onClick={() => setActivePage('manifesto')} className="hover:scale-105 transition-all duration-300" style={{ color: c.muted }}>/manifesto</button>
            <div className="w-[1px] h-4 self-center transition-colors duration-500" style={{ backgroundColor: c.border }} />
            <button onClick={() => setActivePage('products')} className="hover:scale-105 transition-all duration-300" style={{ color: c.muted }}>/products</button>
          </div>
        </section>
      )}

      {/* 3. MANIFESTO PAGE */}
      {activePage === 'manifesto' && (
  <section className="min-h-screen w-full flex flex-col items-center pt-32 pb-20 px-6 animate-[pageIn_0.6s_ease_forwards]">
    <div className="max-w-[1100px] w-full relative z-10">
      <nav className="flex gap-5 font-mono text-sm mb-16">
        <button onClick={() => setActivePage('core')} className="hover:opacity-100 transition-colors" style={{ color: c.muted }}>/core</button>
        <button className="font-bold" style={{ color: c.text }}>/manifesto</button>
        <button onClick={() => setActivePage('products')} className="hover:opacity-100 transition-colors" style={{ color: c.muted }}>/products</button>
      </nav>
      <h1 className="text-6xl md:text-8xl font-black lowercase tracking-tighter mb-10" style={{ color: c.text }}>manifesto</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
        {['prompt', 'drop', 'flex', 'sync'].map((item, i) => (
          <div 
            key={item} 
            onClick={() => item === 'sync' && setActivePage('products')} 
            onMouseEnter={() => setHoveredCard(item)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`group relative aspect-square border p-10 overflow-hidden flex flex-col justify-between transition-all duration-500 ${item === 'sync' ? 'cursor-pointer' : 'cursor-default'}`} 
            style={{ 
              backgroundColor: hoveredCard === item ? c.invertBg : c.card, 
              borderColor: c.border 
            }}
          >
            <div 
              className="relative z-10 flex flex-col h-full justify-between transition-colors duration-500" 
              style={{ color: hoveredCard === item ? c.invertText : c.text }}
            >
              <p className="font-mono text-sm opacity-50">0{i + 1}</p>
              <div>
                <h2 className="text-3xl font-bold lowercase mb-2">{item}.</h2>
                <p className="font-mono text-xs opacity-80">
                  {item === 'prompt' && 'talking to the machine.'}
                  {item === 'drop' && 'deploying the vibe.'}
                  {item === 'flex' && 'showing the world.'}
                  {item === 'sync' && 'view active products ->'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)}

      {/* 4. GLOBAL SYNC FEED */}
      {activePage === 'products' && (
  <section className="min-h-screen w-full flex flex-col items-center pt-40 pb-20 px-6 animate-[pageIn_0.6s_ease_forwards] relative z-10">
    <div className="w-full max-w-[1200px]">
      <nav className="flex gap-5 font-mono text-sm mb-16 w-full justify-start">
        <button onClick={() => setActivePage('core')} className="hover:opacity-100 transition-colors" style={{ color: c.muted }}>/core</button>
        <button onClick={() => setActivePage('manifesto')} className="hover:opacity-100 transition-colors" style={{ color: c.muted }}>/manifesto</button>
        <button className="font-bold" style={{ color: c.text }}>/products</button>
      </nav>

      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 pb-4 transition-colors duration-500 gap-6" style={{ borderColor: c.border }}>
        <div>
          <h1 className="text-4xl md:text-6xl font-black lowercase tracking-tighter" style={{ color: c.text }}>global_sync</h1>
          <span className="font-mono text-xs pb-2 block mt-2" style={{ color: c.muted }}>[ public_feed ]</span>
        </div>
        
        <div className="flex gap-4 font-mono text-xs p-1 transition-colors duration-500" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
          <button 
            onClick={() => setFeedSort('new')} 
            className="px-4 py-2 font-bold transition-colors"
            style={{ backgroundColor: feedSort === 'new' ? c.invertBg : 'transparent', color: feedSort === 'new' ? c.invertText : c.text }}
          >
            new
          </button>
          <button 
            onClick={() => setFeedSort('trending')} 
            className="px-4 py-2 font-bold transition-colors"
            style={{ backgroundColor: feedSort === 'trending' ? c.invertBg : 'transparent', color: feedSort === 'trending' ? c.invertText : c.text }}
          >
            trending
          </button>
        </div>
      </div>
      <div className="w-full mb-10">
            <input 
              type="text" 
              placeholder="search projects, descriptions, or @hackers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b-2 py-4 text-xl font-bold focus:outline-none transition-colors duration-500"
              style={{ borderColor: c.border, color: c.text }}
            />
          </div>

      {isFetchingGlobal ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 animate-[spin_1s_linear_infinite] p-1" style={{ borderColor: c.border }}>
            <div className="w-full h-full animate-pulse" style={{ backgroundColor: c.invertBg }} />
          </div>
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="font-mono text-sm border border-dashed p-10 w-full text-center transition-colors duration-500" style={{ color: c.muted, borderColor: c.border }}>
          no public projects found in the mainframe.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {displayedProjects.map((project) => {
            const hasLiked = project.vibe_checks?.some((v: any) => v.user_id === session?.user?.id);
            const vibeCount = project.vibe_checks?.length || 0;

            return (
              <Link href={`/${project.users.github_handle}/${project.id}`} key={project.id}>
                <div 
                  onMouseEnter={() => setHoveredCard(project.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative border p-8 overflow-hidden flex flex-col justify-between cursor-pointer aspect-square transition-all duration-300 h-full" 
                  style={{ 
                    backgroundColor: hoveredCard === project.id ? c.invertBg : c.card, 
                    borderColor: c.border 
                  }}
                >
                  <div 
                    className="relative z-10 h-full flex flex-col justify-between transition-colors duration-500" 
                    style={{ color: hoveredCard === project.id ? c.invertText : c.text }}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        {project.users.avatar_url && (
                          <img 
                            src={project.users.avatar_url} 
                            alt="avatar" 
                            className="w-6 h-6 border grayscale" 
                            style={{ borderColor: hoveredCard === project.id ? c.invertText : c.border }} 
                          />
                        )}
                        <span className="font-mono text-xs opacity-70">@{project.users.github_handle}</span>
                      </div>
                      <h2 className="text-2xl font-bold lowercase mb-2">{project.title}</h2>
                      <p className="font-mono text-xs opacity-70 line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-end mt-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-mono text-xs opacity-50">
                          [ {new Date(project.created_at).toLocaleDateString()} ]
                        </span>
                        <button 
                          onClick={(e) => toggleVibeCheck(e, project.id, project.vibe_checks || [])}
                          className={`font-mono text-xs text-left w-fit z-20 hover:scale-105 transition-transform ${hasLiked ? 'font-bold opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                          [{vibeCount}] {hasLiked ? '♥ vibed' : '♡ vibe check'}
                        </button>
                      </div>
                      <span className="font-mono text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        view -&gt;
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  </section>
)}

      {/* 5. LOGIN PAGE */}
      {activePage === 'login' && !session && (
        <section className="min-h-screen w-full flex flex-col justify-center items-center p-6 pt-32 animate-[pageIn_0.6s_ease_forwards]">
          <div className="max-w-md w-full border p-10 flex flex-col items-center text-center z-10 transition-colors duration-500" style={{ backgroundColor: c.card, borderColor: c.border }}>
            <h1 className="text-3xl font-black lowercase tracking-tighter mb-2" style={{ color: c.text }}>stuffimade(dot)withai</h1>
            <p className="font-mono text-xs mb-10" style={{ color: c.muted }}>authorize your github to drop vibes.</p>
            <button onClick={async () => { await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } }); }} className="w-full border-2 p-4 font-mono text-sm font-bold uppercase transition-colors duration-500 hover:opacity-80" style={{ borderColor: c.text, color: c.text }}>
              [ Connect GitHub ]
            </button>
            <button onClick={() => setActivePage('core')} className="mt-8 font-mono text-xs hover:opacity-100 transition-colors" style={{ color: c.muted }}>&lt;- back to core</button>
          </div>
        </section>
      )}

      {/* 6. DROP A VIBE PAGE */}
      {activePage === 'drop' && session && (
        <section className="min-h-screen w-full flex flex-col items-center pt-32 pb-20 px-6 animate-[pageIn_0.6s_ease_forwards]">
          <div className="max-w-[800px] w-full relative z-10">
            <nav className="flex gap-5 font-mono text-sm mb-16">
              <button onClick={() => setActivePage('core')} className="hover:opacity-100 transition-colors" style={{ color: c.muted }}>/core</button>
              <button className="font-bold" style={{ color: c.text }}>/drop</button>
            </nav>

            <h1 className="text-6xl font-black lowercase tracking-tighter mb-10" style={{ color: c.text }}>drop your vibe</h1>

            <form onSubmit={handleDropSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold" style={{ color: c.muted }}>project_title</label>
                <input type="text" required placeholder="e.g. LogicDiffusion" value={dropForm.title} onChange={(e) => setDropForm({ ...dropForm, title: e.target.value })} className="w-full bg-transparent border-b-2 focus:outline-none transition-colors duration-500 py-2 text-2xl font-bold" style={{ borderColor: c.border, color: c.text }} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold" style={{ color: c.muted }}>short_description</label>
                <input type="text" required placeholder="what does it do?" value={dropForm.description} onChange={(e) => setDropForm({ ...dropForm, description: e.target.value })} className="w-full bg-transparent border-b-2 focus:outline-none transition-colors duration-500 py-2 text-lg" style={{ borderColor: c.border, color: c.text }} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold" style={{ color: c.muted }}>initial_prompt</label>
                <textarea required rows={4} placeholder="what did you ask the machine?" value={dropForm.prompt} onChange={(e) => setDropForm({ ...dropForm, prompt: e.target.value })} className="w-full bg-transparent border-2 focus:outline-none transition-colors duration-500 p-4 resize-none text-sm font-mono" style={{ borderColor: c.border, color: c.text }} />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold" style={{ color: c.muted }}>github_repo (optional)</label>
                <input type="url" placeholder="https://github.com/..." value={dropForm.github_url} onChange={(e) => setDropForm({ ...dropForm, github_url: e.target.value })} className="w-full bg-transparent border-b-2 focus:outline-none transition-colors duration-500 py-2 text-sm font-mono" style={{ borderColor: c.border, color: c.text }} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold" style={{ color: c.muted }}>live_website (optional)</label>
                <input type="url" placeholder="https://..." value={dropForm.website_url} onChange={(e) => setDropForm({ ...dropForm, website_url: e.target.value })} className="w-full bg-transparent border-b-2 focus:outline-none transition-colors duration-500 py-2 text-sm font-mono" style={{ borderColor: c.border, color: c.text }} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold" style={{ color: c.muted }}>product_screenshot</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-transparent border-2 border-dashed p-4 cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-mono transition-colors duration-500 text-sm font-mono"
                  style={{ borderColor: c.border, color: c.text }}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 border-2 flex items-center justify-center transition-colors duration-500" style={{ borderColor: c.text, backgroundColor: dropForm.isPublic ? c.invertBg : 'transparent' }}>
                  {dropForm.isPublic && <div className="w-2 h-2" style={{ backgroundColor: c.invertText }} />}
                </div>
                <input type="checkbox" className="hidden" checked={dropForm.isPublic} onChange={(e) => setDropForm({ ...dropForm, isPublic: e.target.checked })} />
                <span className="font-mono text-sm opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: c.text }}>make visible to global sync</span>
              </label>

              <button type="submit" disabled={isSubmitting} className="w-full border-2 p-4 font-mono text-sm font-bold uppercase transition-colors duration-500 hover:opacity-80 disabled:opacity-50" style={{ borderColor: c.text, color: c.invertText, backgroundColor: c.invertBg }}>
                {isSubmitting ? '[ dropping... ]' : '[ drop it ]'}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* GLOBAL FOOTER */}
      <footer className="fixed bottom-6 right-6 z-50">
        <Link href="/terms" className="font-mono text-[10px] opacity-50 hover:opacity-100 transition-opacity duration-300" style={{ color: c.text }}>
          /rules_of_engagement
        </Link>
      </footer>

    </main>
  );
}