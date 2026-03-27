const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim()) return;
    setIsSubmitting(true);

    try {
      // THE FIX: Silently ensure the user exists in our public database before they comment
      const githubHandle = session.user.user_metadata.user_name || 'hacker';
      await supabase.from('users').upsert({
        id: session.user.id,
        github_handle: githubHandle,
        avatar_url: session.user.user_metadata.avatar_url
      });

      // Now it is 100% safe to insert the comment
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
