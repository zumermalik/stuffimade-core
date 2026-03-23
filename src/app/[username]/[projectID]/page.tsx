'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// NOTE: Because we are one folder deeper now, we have to go up three levels!
// If this throws an error, try: import { supabase } from '@/lib/supabase/client';
import { supabase } from '../../../lib/supabase/client';

export default function ProjectView() {
  const params = useParams();
  const username = params.username as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Global dark mode check
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }

    const fetchProjectDetails = async () => {
      // 1. Fetch the specific project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        setLoading(false);
        return;
      }

      setProject(projectData);

      // 2. Fetch the prompt history for this project
      const { data: promptsData } = await supabase
        .from('prompts_history')
        .select('*')
        .eq('project_id', projectId)
        .order('step_order', { ascending: true });

      if (promptsData) {
        setPrompts(promptsData);
      }

      setLoading(false);
    };

    fetchProjectDetails();
  }, [projectId]);

  if (loading) {
    return (
      <main className="min-h-screen w-full flex justify-center items-center bg-white dark:bg-[#0a0a0a]">
        <div className="w-16 h-16 border-4 border-black dark:border-white animate-[spin_2s_linear_infinite] p-2">
          <div className="w-full h-full bg-black dark:bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen w-full flex flex-col justify-center items-center bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500">
        <h1 className="text-4xl font-black lowercase tracking-tighter mb-4">404_vibe_not_found</h1>
        <Link href={`/${username}`} className="font-mono text-sm opacity-50 hover:opacity-100 transition-opacity">
          &lt;- back to @{username}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full font-sans text-black bg-white dark:bg-[#0a0a0a] dark:text-white overflow-hidden transition-colors duration-500">
      
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grey)_1px,transparent_1px),linear-gradient(to_bottom,var(--grey)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80" />
      </div>

      {/* Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <Link href={`/${username}`} className="font-mono text-xs font-bold opacity-50 hover:opacity-100 transition-opacity duration-300">
          &lt;- @{username}
        </Link>
      </div>

      <section className="relative z-10 w-full max-w-[800px] mx-auto px-6 py-24 animate-[pageIn_0.6s_ease_forwards]">
        
        {/* Project Header */}
        <div className="mb-16 border-b-2 border-black dark:border-white pb-10">
          <h1 className="text-5xl md:text-7xl font-black lowercase tracking-tighter mb-6">
            {project.title}
          </h1>
          <p className="font-mono text-lg opacity-80 leading-relaxed">
            {project.description}
          </p>
          <div className="mt-6 flex gap-4 font-mono text-xs opacity-50">
            <span>[ date: {new Date(project.created_at).toLocaleDateString()} ]</span>
            <span>[ vibe_checks: {project.vibe_checks} ]</span>
          </div>
        </div>

        {/* Prompt History / Build Log */}
        <div>
          <h2 className="text-2xl font-bold lowercase mb-8">build_log</h2>
          
          <div className="flex flex-col gap-8">
            {prompts.map((prompt, index) => (
              <div key={prompt.id} className="border-2 border-black dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] relative group transition-transform hover:-translate-y-1 duration-300">
                
                {/* Terminal Header */}
                <div className="border-b-2 border-black dark:border-[#1a1a1a] px-4 py-2 bg-grey dark:bg-[#111] flex justify-between items-center transition-colors">
                  <span className="font-mono text-xs font-bold">step_0{index + 1}</span>
                  <span className="font-mono text-xs opacity-50">prompt</span>
                </div>
                
                {/* Prompt Content */}
                <div className="p-6">
                  <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {prompt.prompt_text}
                  </p>
                </div>
              </div>
            ))}

            {prompts.length === 0 && (
              <div className="font-mono text-sm opacity-50 border border-dashed border-grey dark:border-[#1a1a1a] p-10 text-center">
                no prompt history found for this product.
              </div>
            )}
          </div>
        </div>

      </section>
    </main>
  );
}