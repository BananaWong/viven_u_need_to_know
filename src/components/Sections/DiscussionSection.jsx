import React, { useState, useEffect, useCallback } from 'react';
import { Label, RevealOnScroll, Button } from '../Common/UI';
import Icons from '../Icons';
import { supabase } from '../../lib/supabase';
import { INITIAL_DISCUSSION_POSTS } from '../../constants/data.jsx';

const DiscussionSection = () => {
  const [newPost, setNewPost] = useState('');
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('viven_user_name') || '');
  const [authorLocation, setAuthorLocation] = useState(() => localStorage.getItem('viven_user_location') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myLikes, setMyLikes] = useState(() => JSON.parse(localStorage.getItem('viven_my_likes') || '[]'));

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mod') === 'viven_marketing') {
      setIsAdmin(true);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setPosts(INITIAL_DISCUSSION_POSTS);
      } else {
        const processed = data.map(p => ({
          ...p,
          liked: myLikes.includes(p.id)
        }));
        setPosts(processed);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      setPosts(INITIAL_DISCUSSION_POSTS);
    } finally {
      setIsLoading(false);
    }
  }, [myLikes]);

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts, myLikes, isAdmin]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contribution?')) return;
    await supabase.from('posts').delete().eq('id', id);
  };

  const handleDetectLocation = async () => {
    if (authorLocation || isLocating) return;
    setIsLocating(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.city && data.region_code) {
        const locString = `${data.city}, ${data.region_code}`;
        setAuthorLocation(locString);
        localStorage.setItem('viven_user_location', locString);
      }
    } catch (err) {
      console.warn('Location detection failed:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleLike = async (id, currentLikes, isLiked) => {
    const newLikedStatus = !isLiked;
    const newLikesCount = newLikedStatus ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    let updatedLikes = [...myLikes];
    if (newLikedStatus) updatedLikes.push(id);
    else updatedLikes = updatedLikes.filter(item => item !== id);
    setMyLikes(updatedLikes);
    localStorage.setItem('viven_my_likes', JSON.stringify(updatedLikes));
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: newLikedStatus, likes: newLikesCount } : p));
    await supabase.from('posts').update({ likes: newLikesCount }).eq('id', id);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newPost.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    if (authorName.trim()) localStorage.setItem('viven_user_name', authorName.trim());
    if (authorLocation.trim()) localStorage.setItem('viven_user_location', authorLocation.trim());

    const finalName = authorName.trim() || 'Guest Contributor';
    const finalLocation = authorLocation.trim() || 'Global Citizen';
    
    // 关键修复：发送数据对象
    const newEntry = {
      author: finalName,
      location: finalLocation,
      avatar: finalName.charAt(0).toUpperCase(),
      text: newPost.trim(),
      likes: 0,
      is_approved: true
    };

    try {
      const { data, error } = await supabase.from('posts').insert([newEntry]).select();
      
      if (error) {
        console.error('Supabase Insert Error:', error);
        // 如果是因为缺少 is_approved 列导致的 400，尝试不带该列发送一次
        if (error.code === '42703' || error.message.includes('is_approved')) {
          const fallbackEntry = { ...newEntry };
          delete fallbackEntry.is_approved;
          const { data: d2, error: e2 } = await supabase.from('posts').insert([fallbackEntry]).select();
          if (e2) throw e2;
          if (d2) {
            setNewPost('');
            setShowSuccess(true);
          }
        } else {
          throw error;
        }
      } else if (data) {
        setNewPost('');
        setShowSuccess(true);
      }
    } catch (err) {
      console.error('Final Submission Error:', err);
      alert('Post failed. Please ensure your database table is correctly configured.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <section id="discussion" className="py-24 md:py-32 bg-white border-t border-stone-100">
      <RevealOnScroll>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto">

          {isAdmin && (
            <div className="mb-8 bg-[#1C1917] text-[#f2663b] p-4 rounded-2xl border border-[#f2663b]/30 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#f2663b] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Management Mode</span>
              </div>
              <button onClick={() => window.location.href = window.location.pathname} className="text-[9px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors">Exit</button>
            </div>
          )}

          <div className="mb-12 text-center">
            <Label className="text-[#f2663b] flex items-center justify-center gap-2">
              <Icons.Heart className="w-3 h-3" /> Community · Live Discussion ({posts.length})
            </Label>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tighter text-[#2A2422] mb-4 md:mb-6 leading-[1.05]">
              Real talk from real people.
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="bg-stone-50 rounded-3xl p-5 md:p-6 mb-8 md:mb-10 border border-stone-100 relative overflow-hidden shadow-sm">
            {showSuccess && (
              <div className="absolute inset-0 bg-emerald-50/95 backdrop-blur-sm z-20 flex items-center justify-center animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase tracking-widest text-[10px]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Icons.Check className="w-3.5 h-3.5" strokeWidth={3} /></div>
                  Posted Successfully
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-stone-200/60 pb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 shrink-0">
                    {authorName.trim() ? authorName.charAt(0).toUpperCase() : <Icons.Location className="w-3 h-3" />}
                  </div>
                  <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Your Name" className="flex-1 bg-transparent text-sm font-semibold text-[#2A2422] outline-none placeholder:text-stone-400" />
                </div>
                <div className="hidden sm:block w-px h-4 bg-stone-300"></div>
                <div className="flex items-center gap-2 flex-1 sm:pl-2 relative group cursor-pointer" onClick={handleDetectLocation}>
                  {isLocating ? <Icons.Spinner className="w-3 h-3 text-[#f2663b] animate-spin shrink-0" /> : <Icons.MapPin className={`w-3 h-3 transition-colors shrink-0 ${authorLocation ? 'text-[#f2663b]' : 'text-stone-400 group-hover:text-stone-600'}`} />}
                  <input type="text" value={authorLocation} onChange={e => setAuthorLocation(e.target.value)} placeholder="Locate Me" className="flex-1 bg-transparent text-[13px] text-[#2A2422] outline-none placeholder:text-stone-400 cursor-pointer" />
                </div>
              </div>
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} onKeyDown={e => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && handleSubmit()} placeholder="Share your experience..." className="w-full bg-transparent text-sm text-[#2A2422] placeholder-stone-400 outline-none h-24 leading-relaxed" />
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-200">
              <span className="text-[9px] text-stone-400 font-mono uppercase tracking-widest">Real-time sync active</span>
              <Button variant="primary" type="submit" disabled={isSubmitting || !newPost.trim()} className="h-9 px-6 text-[10px]">
                {isSubmitting ? <Icons.Spinner className="w-3 h-3 animate-spin" /> : 'Post to Community'}
              </Button>
            </div>
          </form>

          {/* Posts List */}
          {isLoading && posts.length === 0 ? (
            <div className="py-20 text-center text-stone-300"><Icons.Spinner className="w-8 h-8 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-4">
              {posts.slice(0, visibleCount).map((post, idx) => (
                <div key={post.id || idx} className={`relative bg-[#FAFAF9] rounded-2xl p-5 md:p-6 border border-stone-100 hover:border-stone-200 transition-all duration-300`}>
                  
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <button onClick={() => handleDelete(post.id)} className="p-2 rounded-full bg-white border border-stone-200 text-stone-400 hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all shadow-sm">
                        <Icons.Close className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold ${post.author === 'Guest Contributor' ? 'bg-stone-400' : 'bg-[#2A2422]'}`}>{post.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2">
                        <span className="text-[14px] font-bold tracking-tight text-[#2A2422]">{post.author}</span>
                        <span className="text-[9px] text-stone-300">/</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest text-[#f2663b]`}>{post.location}</span>
                        <span className="text-[10px] text-stone-400 font-mono ml-auto mr-8 md:mr-0">
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Archive'}
                        </span>
                      </div>
                      <p className="text-[14px] text-stone-600 font-normal leading-relaxed pr-10 md:pr-0">{post.text}</p>
                      <button onClick={() => handleLike(post.id, post.likes, post.liked)}
                        className={`flex items-center gap-1.5 mt-4 text-[10px] font-bold uppercase tracking-widest transition-all ${post.liked ? 'text-[#f2663b] scale-110' : 'text-stone-300 hover:text-stone-400'}`}>
                        <Icons.Heart className={`w-3 h-3 ${post.liked ? 'fill-current' : ''}`} />{post.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {visibleCount < posts.length && (
            <div className="mt-12 text-center">
              <button onClick={() => setVisibleCount(prev => prev + 6)} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-[#f2663b] transition-colors">
                Load more results ({posts.length - visibleCount}) →
              </button>
            </div>
          )}
        </div>
      </div>
      </RevealOnScroll>
    </section>
  );
};

export default DiscussionSection;
