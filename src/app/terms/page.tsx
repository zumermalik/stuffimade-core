import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full font-sans bg-white text-black overflow-hidden">
      
      {/* HEADER (No Toggle Button) */}
      <header className="fixed top-0 left-0 w-full px-6 py-4 z-50 flex justify-between items-center bg-white border-b-2 border-black/20">
        <Link href="/" className="font-mono text-xs font-bold opacity-50 hover:opacity-100 transition-opacity duration-300 text-black">
          &lt;- back to core
        </Link>
        {/* The void where the toggle used to be */}
      </header>

      {/* BACKGROUND GRID */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)]" />
      </div>

      {/* CONTENT */}
      <section className="relative z-10 w-full max-w-[800px] mx-auto px-6 pt-32 pb-24 animate-[pageIn_0.6s_ease_forwards]">
        
        <h1 className="text-5xl md:text-7xl font-black lowercase tracking-tighter mb-12 text-black">
          rules_of_engagement
        </h1>

        <div className="flex flex-col gap-10">
          
          <div className="border border-black/20 bg-white p-8">
            <h2 className="text-2xl font-bold lowercase mb-4 text-black">01. the_vibe</h2>
            <p className="font-mono text-sm leading-relaxed opacity-80 text-black">
              we are all builders here. this is a space to ship products, not toxicity. no hate speech, no spam, no illegal content. respect the network.
            </p>
          </div>

          <div className="border border-black/20 bg-white p-8">
            <h2 className="text-2xl font-bold lowercase mb-4 text-black">02. ownership</h2>
            <p className="font-mono text-sm leading-relaxed opacity-80 text-black">
              you own what you drop. by deploying a project or posting a comment to the global sync, you grant the mainframe permission to display your github handle and project details.
            </p>
          </div>

          <div className="border border-black/20 bg-white p-8">
            <h2 className="text-2xl font-bold lowercase mb-4 text-black">03. moderation_&_nukes</h2>
            <p className="font-mono text-sm leading-relaxed opacity-80 text-black">
              we reserve the right to permanently nuke any project, comment, or user from the database without warning if they violate the vibe or compromise the platform. no appeals.
            </p>
          </div>

          <div className="border border-black/20 bg-white p-8">
            <h2 className="text-2xl font-bold lowercase mb-4 text-black">04. liability</h2>
            <p className="font-mono text-sm leading-relaxed opacity-80 text-black">
              this is an open network. we are not responsible if someone else's deployed logic breaks your local machine. engage with active products at your own risk.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}