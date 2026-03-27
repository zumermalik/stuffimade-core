'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase/client';

const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

export default function ProjectView() {
  const params = useParams();
  const pathname = usePathname();

  // BULLETPROOF ROUTING: Explicitly checking for capital 'D' in projectID to match your folder
  const pathParts = pathname.split('/').filter(Boolean);
  const username = (params?.username as string) || pathParts[0] || '';
  const projectId = (params?.projectID as string) || (params?.projectId as string) || pathParts[1] || '';

  const [session, setSession] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDetails = async () => {
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*, users (github_handle, avatar_url), vibe_checks (user_id)')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*, users (github_handle, avatar_url)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (!commentsError && commentsData) {
          setComments(commentsData);
        }

      } catch (err: any) {
        console.error("Fetch Error:", err);
        setErrorMsg(err.message || "Failed to load vibe.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim()) return;
    setIsSubmitting(true);

    try {
      const githubHandle = session.user.user_metadata.user_name || 'hacker';
      await supabase.from('users').upsert({
        id: session.user.id,
        github_handle: githubHandle,
        avatar_url: session.user.user_metadata.avatar_url
      });

      const { data, error } = await supabase
        .from('comments')
        .insert({
          project_id: projectId,
          user_id: session.user.id,
          content: newComment.trim()
        })
        .select('*, users (github_handle, avatar_url)')
        .single();

      if (error) throw error;

      setComments([data, ...comments]);
      setNewComment('');
    } catch (err: any) {
      alert(`Failed to drop comment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmDelete = confirm("Nuke this comment permanently?");
    if (!confirmDelete) return;

    try {
      await supabase.from('comments').delete().eq('id', commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  if (!mounted) return null;

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

  if (loading) {
    return (
      <main className="min-h-screen w-full flex justify-center items-center transition-colors duration-500" style={{ backgroundColor: c.bg }}>
        <div className="w-16 h-16 border-4 animate-[spin_2s_linear_infinite] p-2" style={{ borderColor: c.border }}>
          <div className="w-full h-full animate-pulse" style={{ backgroundColor: c.invertBg }} />
        </div>
      </main>
    );
  }

  if (!project || errorMsg) {
    return (
      <main className="min-h-screen w-full flex flex-col justify-center items-center transition-colors duration-500" style={{ backgroundColor: c.bg, color: c.text }}>
        <h1 className="text-4xl font-black lowercase tracking-tighter mb-4">404_vibe_not_found</h1>
        <p className="font-mono text-xs mb-8" style={{ color: c.muted }}>{errorMsg}</p>
        <Link href={`/${username}`} className="font-mono text-sm hover:opacity-100 transition-opacity" style={{ color: c.muted }}>
          &lt;- back to @{username}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full font-sans transition-colors duration-500 overflow-x-hidden flex flex-col items-center p-6 relative" style={{ backgroundColor: c.bg, color: c.text }}>
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80 transition-all duration-500" 
          style={{ backgroundImage: `linear-gradient(to right, ${c.grid} 1px, transparent 1px), linear-gradient(to bottom, ${c.grid} 1px, transparent 1px)` }}
        />
      </div>

      <header className="fixed top-0 left-0 w-full px-6 py-4 z-50 flex justify-between items-center border-b-2 transition-colors duration-500" style={{ backgroundColor: c.bg, borderColor: c.border }}>
        <Link href={`/${username}`} className="font-mono text-xs font-bold opacity-50 hover:opacity-100 transition-opacity duration-300" style={{ color: c.text }}>
          &lt;- @{username}
        </Link>
        <button onClick={toggleDarkMode} style={{ color: c.muted }} className="font-mono text-xs hover:opacity-100 transition-opacity">
          [ {isDark ? 'light' : 'dark'} mode ]
        </button>
      </header>

      {/* THE GLOWING PROJECT CARD */}
      <div className="relative z-10 w-full max-w-2xl mt-24 mb-16 animate-[pageIn_0.8s_ease_forwards]">
        <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-br from-[#ff00a0] via-black to-[#00f0ff] opacity-80 blur-sm" />
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#ff00a0] via-[#111] to-[#00f0ff]" />
        <div className="absolute inset-0 rounded-[32px] opacity-20 mix-blend-overlay" style={{ backgroundImage: noiseBg }} />

        <div className="relative w-full h-full rounded-[30px] p-10 md:p-16 border border-white/10 flex flex-col items-center text-center shadow-2xl m-[2px]" style={{ backgroundColor: isDark ? 'rgba(10,10,10,0.9)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
          
          <div className="flex items-center gap-4 mb-8">
            {project.users?.avatar_url && (
              <img src={project.users.avatar_url} alt="creator" className="w-12 h-12 border-2 grayscale" style={{ borderColor: c.border }} />
            )}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-80" style={{ color: c.text }}>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-black lowercase tracking-tighter mb-4" style={{ color: c.text }}>
            {project.title}
          </h1>
          
          <p className="font-mono text-sm md:text-base opacity-70 leading-relaxed mb-10 max-w-md" style={{ color: c.text }}>
            {project.description}
          </p>

          <div className="flex flex-wrap justify-center gap-4 w-full">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noreferrer" className="flex-1 min-w-[140px] border py-3 px-4 font-mono text-xs font-bold transition-all hover:scale-105" style={{ borderColor: c.border, color: c.text }}>
                [ github_repo ]
              </a>
            )}
            {project.website_url && (
              <a href={project.website_url} target="_blank" rel="noreferrer" className="flex-1 min-w-[140px] border py-3 px-4 font-mono text-xs font-bold transition-all hover:scale-105" style={{ borderColor: c.border, color: c.text }}>
                [ live_website ]
              </a>
            )}
          </div>
        </div>
      </div>

      {/* THE COMMENTS SECTION */}
      <section className="relative z-10 w-full max-w-2xl animate-[pageIn_1s_ease_forwards]">
        <div className="border-b-2 pb-4 mb-8" style={{ borderColor: c.border }}>
          <h2 className="text-2xl font-bold lowercase" style={{ color: c.text }}>terminal_logs [{comments.length}]</h2>
        </div>

        {session ? (
          <form onSubmit={handleCommentSubmit} className="mb-12 flex flex-col gap-4">
            <textarea 
              required 
              rows={3} 
              placeholder="drop your thoughts..." 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              className="w-full bg-transparent border-2 p-4 font-mono text-sm resize-none focus:outline-none transition-colors"
              style={{ borderColor: c.border, color: c.text }}
            />
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="self-end border-2 px-6 py-2 font-mono text-xs font-bold uppercase transition-all hover:scale-105 disabled:opacity-50"
              style={{ borderColor: c.text, color: c.invertText, backgroundColor: c.invertBg }}
            >
              {isSubmitting ? '[ dropping... ]' : '[ drop comment ]'}
            </button>
          </form>
        ) : (
          <div className="mb-12 border border-dashed p-6 text-center font-mono text-xs" style={{ borderColor: c.border, color: c.muted }}>
            [ authorize github to leave a log ]
          </div>
        )}

        <div className="flex flex-col gap-6 mb-20">
          {comments.map((comment) => (
            <div key={comment.id} className="border p-6 flex flex-col gap-4 transition-colors" style={{ backgroundColor: c.card, borderColor: c.border }}>
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {comment.users?.avatar_url && (
                    <img src={comment.users.avatar_url} alt="avatar" className="w-6 h-6 border grayscale" style={{ borderColor: c.border }} />
                  )}
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold" style={{ color: c.text }}>@{comment.users?.github_handle}</span>
                    <span className="font-mono text-[10px]" style={{ color: c.muted }}>{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                </div>
                
                {session?.user?.id === comment.user_id && (
                  <button onClick={() => handleDeleteComment(comment.id)} className="font-mono text-[10px] hover:text-red-500 transition-colors" style={{ color: c.muted }}>
                    [ nuke ]
                  </button>
                )}
              </div>

              <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap" style={{ color: c.text }}>
                {comment.content}
              </p>

            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
