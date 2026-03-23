'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // CRITICAL NEW IMPORT

export default function Home() {
  const router = useRouter();
  const [activePage, setActivePage] = useState('core');
  const [loaderState, setLoaderState] = useState('visible');
  const [isDark, setIsDark] = useState(false);
  
  // Auth State
  const [session, setSession] = useState<any>(null);

 // Drop Form State (Added isPublic & Image)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropForm, setDropForm] = useState({ title: '', description: '', prompt: '', isPublic: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  // Global Feed State
  const [globalProjects, setGlobalProjects] = useState<any[]>([]);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);

  // Listen for GitHub Login Status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch ONLY PUBLIC Global Projects
  useEffect(() => {
    if (activePage === 'products') {
      setIsFetchingGlobal(true);
      const fetchFeed = async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*, users (github_handle, avatar_url)')
          .eq('is_public', true) // THE PRIVACY FILTER
          .order('created_at', { ascending: false });
        
        if (data) setGlobalProjects(data);
        setIsFetchingGlobal(false);
      };
      fetchFeed();
    }
  }, [activePage]);

  // Initial Loader Sequence
  useEffect(() => {
    const fadeTimer = setTimeout(() => setLoaderState('fading'), 1200);
    const removeTimer = setTimeout(() => setLoaderState('hidden'), 1600);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  // Theme Toggle
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Handlers
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActivePage('core');
  };

  const handleDropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSubmitting(true);

    try {
      const githubHandle = session.user.user_metadata.user_name || 'hacker';

      // 1. Sync User Profile
      await supabase.from('users').upsert({
        id: session.user.id,
        github_handle: githubHandle,
        avatar_url: session.user.user_metadata.avatar_url
      });

      // 2. Attempt Image Upload
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-previews')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          console.error("Storage Error:", uploadError.message);
          // We continue anyway, just without the image
        } else {
          const { data } = supabase.storage.from('project-previews').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }

      // 3. Create the Project
      const { data: project, error: projectError } = await supabase.from('projects').insert({
        user_id: session.user.id,
        title: dropForm.title,
        description: dropForm.description,
        is_public: dropForm.isPublic,
        image_url: imageUrl,
        code_bundle: {} 
      }).select().single();

      if (projectError) throw projectError;

      // 4. Save the Build Log (Prompt)
      if (project && dropForm.prompt) {
        await supabase.from('prompts_history').insert({
          project_id: project.id,
          step_order: 1,
          prompt_text: dropForm.prompt
        });
      }

      // 5. THE SEAMLESS REDIRECT
      setDropForm({ title: '', description: '', prompt: '', isPublic: true });
      setImageFile(null);
      router.push(`/${githubHandle}/${project.id}`);

    } catch (error: any) {
      console.error("Critical Drop Error:", error.message || error);
      alert(`Vibe check failed: ${error.message || 'Check console'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full font-sans text-black bg-white overflow-hidden transition-colors duration-500">
      
      {/* Global Navigation */}
      <div className="fixed top-6 left-6 z-50 flex gap-4 font-mono text-xs">
        {!session ? (
          <button onClick={() => setActivePage('login')} className="opacity-50 hover:opacity-100 transition-opacity duration-300">
            [ login ]
          </button>
        ) : (
          <>
            <Link href={`/${session.user.user_metadata.user_name || 'hacker'}`} className="opacity-100 font-bold hover:text-black/70 transition-colors duration-300">
              [ @{session.user.user_metadata.user_name || 'hacker'} ]
            </Link>
            <button onClick={() => setActivePage('drop')} className="opacity-50 hover:opacity-100 transition-opacity duration-300">
              [ + drop vibe ]
            </button>
            <button onClick={handleSignOut} className="opacity-30 hover:opacity-100 transition-opacity duration-300">
              [ logout ]
            </button>
          </>
        )}
      </div>

      <button onClick={() => setIsDark(!isDark)} className="fixed top-6 right-6 z-50 font-mono text-xs opacity-50 hover:opacity-100 transition-opacity duration-300">
        [ {isDark ? 'light' : 'dark'} mode ]
      </button>

      {/* 1. LOADER */}
      {loaderState !== 'hidden' && (
        <div className="fixed inset-0 bg-white flex justify-center items-center z-[9999] transition-opacity duration-500 ease-in-out" style={{ opacity: loaderState === 'fading' ? 0 : 1 }}>
          <div className="w-[100px] h-[2px] bg-grey overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-black animate-[load_1s_ease-in-out_forwards]" />
          </div>
        </div>
      )}

      {/* 2. CORE PAGE */}
      {activePage === 'core' && (
        <section className="relative min-h-screen w-full flex flex-col justify-center items-center text-center animate-[pageIn_0.8s_var(--ease)_forwards] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grey)_1px,transparent_1px),linear-gradient(to_bottom,var(--grey)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-80" />
          </div>
          <div className="relative z-10 pr-5 mb-10">
            <h1 className="text-[7vw] md:text-[5.5vw] font-black text-grey whitespace-nowrap lowercase leading-none tracking-tight">stuffimade(dot)withai</h1>
            <h1 className="absolute left-0 top-0 h-full text-black overflow-hidden whitespace-nowrap text-[7vw] md:text-[5.5vw] font-black lowercase leading-none tracking-tight border-r-4 border-transparent animate-[reveal_2s_var(--ease)_forwards_0.2s,blink_0.8s_step-end_infinite_2.5s] w-0">stuffimade(dot)withai</h1>
          </div>
          <div className="relative z-10 flex gap-8 mt-5 opacity-0 animate-[fadeIn_1s_forwards_2.8s] font-mono text-sm bg-white/80 backdrop-blur-md px-8 py-4 rounded-full border border-grey shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <button onClick={() => setActivePage('manifesto')} className="text-black/50 hover:text-black hover:scale-105 transition-all duration-300">/manifesto</button>
            <div className="w-[1px] h-4 bg-grey self-center" />
            <button onClick={() => setActivePage('products')} className="text-black/50 hover:text-black hover:scale-105 transition-all duration-300">/products</button>
          </div>
        </section>
      )}

      {/* 3. MANIFESTO PAGE */}
      {activePage === 'manifesto' && (
        <section className="min-h-screen w-full flex flex-col items-center py-20 px-6 animate-[pageIn_0.6s_ease_forwards]">
          <div className="max-w-[1100px] w-full relative z-10">
            <nav className="flex gap-5 font-mono text-sm mb-16">
              <button onClick={() => setActivePage('core')} className="text-black/30 hover:text-black transition-colors">/core</button>
              <button className="text-black transition-colors font-bold">/manifesto</button>
              <button onClick={() => setActivePage('products')} className="text-black/30 hover:text-black transition-colors">/products</button>
            </nav>
            <h1 className="text-6xl md:text-8xl font-black lowercase tracking-tighter mb-10 text-black">manifesto</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
              {['prompt', 'drop', 'flex', 'sync'].map((item, i) => (
                <div key={item} onClick={() => item === 'sync' && setActivePage('products')} className={`group relative aspect-square border border-grey p-10 overflow-hidden flex flex-col justify-between ${item === 'sync' ? 'cursor-pointer' : 'cursor-default'}`}>
                  <div className="absolute bottom-0 left-0 w-full h-0 bg-black transition-all duration-700 ease-[var(--ease)] group-hover:h-full z-0" />
                  <div className="relative z-10 transition-colors duration-700 group-hover:text-white flex flex-col h-full justify-between">
                    <p className="font-mono text-sm opacity-50">0{i + 1}</p>
                    <div>
                      <h2 className="text-3xl font-bold lowercase mb-2">{item}.</h2>
                      <p className="font-mono text-xs">
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
        <section className="min-h-screen w-full flex flex-col items-center py-20 px-6 animate-[pageIn_0.6s_ease_forwards] relative z-10">
          <div className="w-full max-w-[1200px]">
            <nav className="flex gap-5 font-mono text-sm mb-16 w-full justify-start">
              <button onClick={() => setActivePage('core')} className="text-black/30 hover:text-black transition-colors">/core</button>
              <button onClick={() => setActivePage('manifesto')} className="text-black/30 hover:text-black transition-colors">/manifesto</button>
              <button className="text-black transition-colors font-bold">/products</button>
            </nav>

            <div className="mb-12 flex justify-between items-end border-b-2 border-black pb-4">
              <h1 className="text-4xl md:text-6xl font-black lowercase tracking-tighter text-black">global_sync</h1>
              <span className="font-mono text-xs opacity-50 pb-2">[ public_feed ]</span>
            </div>

            {isFetchingGlobal ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-black animate-[spin_1s_linear_infinite] p-1"><div className="w-full h-full bg-black animate-pulse" /></div>
              </div>
            ) : globalProjects.length === 0 ? (
              <div className="font-mono text-sm opacity-50 border border-dashed border-grey p-10 w-full text-center">
                no public projects found in the mainframe.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {globalProjects.map((project) => (
                  <Link href={`/${project.users.github_handle}/${project.id}`} key={project.id}>
                    <div className="group relative border border-black p-8 overflow-hidden flex flex-col justify-between cursor-pointer aspect-square bg-white transition-transform hover:-translate-y-2 duration-300 h-full">
                      <div className="absolute inset-0 bg-black w-0 group-hover:w-full transition-all duration-500 ease-[var(--ease)] z-0" />
                      
                      <div className="relative z-10 transition-colors duration-500 group-hover:text-white h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            {project.users.avatar_url && (
                              <img src={project.users.avatar_url} alt="avatar" className="w-6 h-6 border border-black group-hover:border-white grayscale" />
                            )}
                            <span className="font-mono text-xs opacity-70">@{project.users.github_handle}</span>
                          </div>
                          <h2 className="text-2xl font-bold lowercase mb-2">{project.title}</h2>
                          <p className="font-mono text-xs opacity-70 line-clamp-3 leading-relaxed">
                            {project.description}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-end mt-6">
                          <span className="font-mono text-xs opacity-50">
                            [ {new Date(project.created_at).toLocaleDateString()} ]
                          </span>
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
          </div>
        </section>
      )}

      {/* 5. LOGIN PAGE */}
      {activePage === 'login' && !session && (
        <section className="min-h-screen w-full flex flex-col justify-center items-center p-6 animate-[pageIn_0.6s_ease_forwards]">
          <div className="max-w-md w-full border border-grey p-10 flex flex-col items-center text-center bg-white z-10">
            <h1 className="text-3xl font-black lowercase tracking-tighter mb-2 text-black">stuffimade(dot)withai</h1>
            <p className="font-mono text-xs opacity-50 mb-10 text-black">authorize your github to drop vibes.</p>
            <button onClick={async () => { await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } }); }} className="relative w-full border-2 border-black p-4 font-mono text-sm font-bold uppercase overflow-hidden group transition-colors duration-300">
              <div className="absolute inset-0 bg-black w-0 group-hover:w-full transition-all duration-500 ease-[var(--ease)] z-0" />
              <span className="relative z-10 text-black group-hover:text-white transition-colors duration-500">[ Connect GitHub ]</span>
            </button>
            <button onClick={() => setActivePage('core')} className="mt-8 font-mono text-xs text-black/40 hover:text-black transition-colors">&lt;- back to core</button>
          </div>
        </section>
      )}

      {/* 6. DROP A VIBE PAGE */}
      {activePage === 'drop' && session && (
        <section className="min-h-screen w-full flex flex-col items-center py-20 px-6 animate-[pageIn_0.6s_ease_forwards]">
          <div className="max-w-[800px] w-full relative z-10">
            <nav className="flex gap-5 font-mono text-sm mb-16">
              <button onClick={() => setActivePage('core')} className="text-black/30 hover:text-black transition-colors">/core</button>
              <button className="text-black transition-colors font-bold">/drop</button>
            </nav>

            <h1 className="text-6xl font-black lowercase tracking-tighter mb-10 text-black">drop your vibe</h1>

            <form onSubmit={handleDropSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold text-black/50">project_title</label>
                <input type="text" required placeholder="e.g. LogicDiffusion" value={dropForm.title} onChange={(e) => setDropForm({ ...dropForm, title: e.target.value })} className="w-full bg-transparent border-b-2 border-grey focus:border-black text-2xl font-bold text-black focus:outline-none transition-colors py-2 placeholder:text-black/20" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold text-black/50">short_description</label>
                <input type="text" required placeholder="what does it do?" value={dropForm.description} onChange={(e) => setDropForm({ ...dropForm, description: e.target.value })} className="w-full bg-transparent border-b-2 border-grey focus:border-black text-lg text-black focus:outline-none transition-colors py-2 placeholder:text-black/20" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold text-black/50">initial_prompt</label>
                <textarea required rows={4} placeholder="what did you ask the machine?" value={dropForm.prompt} onChange={(e) => setDropForm({ ...dropForm, prompt: e.target.value })} className="w-full bg-transparent border-2 border-grey focus:border-black text-sm font-mono text-black focus:outline-none transition-colors p-4 resize-none placeholder:text-black/20" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-bold text-black/50">product_screenshot</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-transparent border-2 border-dashed border-grey hover:border-black text-sm font-mono text-black transition-colors p-4 cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-mono file:bg-black file:text-white hover:file:bg-black/80"
                />
              </div>
              {/* THE PRIVACY TOGGLE */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${dropForm.isPublic ? 'border-black bg-black' : 'border-grey bg-transparent'}`}>
                  {dropForm.isPublic && <div className="w-2 h-2 bg-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={dropForm.isPublic} onChange={(e) => setDropForm({ ...dropForm, isPublic: e.target.checked })} />
                <span className="font-mono text-sm opacity-70 group-hover:opacity-100 transition-opacity">make visible to global sync</span>
              </label>

              <button type="submit" disabled={isSubmitting} className="relative mt-4 border-2 border-black p-4 font-mono text-sm font-bold uppercase overflow-hidden group transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="absolute inset-0 bg-black w-0 group-hover:w-full transition-all duration-500 ease-[var(--ease)] z-0" />
                <span className="relative z-10 text-black group-hover:text-white transition-colors duration-500">{isSubmitting ? '[ dropping... ]' : '[ drop it ]'}</span>
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}