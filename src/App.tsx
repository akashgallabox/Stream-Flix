import React, { useEffect, useState } from "react";
import { 
  Tv, Film, Search, ArrowLeft, Heart, Sparkles, LogOut, Info, AlertCircle, Play, 
  Settings, Layers, TrendingUp, Compass, PlusCircle
} from "lucide-react";
import { Video } from "./types";
import VideoLibrary from "./components/VideoLibrary";
import UploadPanel from "./components/UploadPanel";
import CustomPlayer from "./components/CustomPlayer";
import Login from "./components/Login";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'home' | 'upload'>('home');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'info', text: string } | null>(null);

  // Load videos from backend Express API on launch
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/videos");
      if (!response.ok) {
        throw new Error("Failed retrieving stored movies configuration from backend.");
      }
      const data = await response.json();
      setVideos(data);
      setErrorText("");
    } catch (e: any) {
      console.error(e);
      setErrorText("Could not communicate with the stream catalog database server. Please verify connections.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if session token exists
    try {
      const session = localStorage.getItem("streamflix_session");
      if (session === "active") {
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }

    fetchVideos();
    
    // Load local watchlist favorites from client localStorage
    try {
      const stored = localStorage.getItem("watchlist_favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleToggleFavorite = (id: string) => {
    let updatedFavorites: string[] = [];
    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter(favId => favId !== id);
      showNotification('info', "Removed from watchlist");
    } else {
      updatedFavorites = [...favorites, id];
      showNotification('success', "Added to watchlist!");
    }
    setFavorites(updatedFavorites);
    localStorage.setItem("watchlist_favorites", JSON.stringify(updatedFavorites));
  };

  const showNotification = (type: 'success' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Video completion callback from UploadPanel
  const handleUploadSuccess = (newVideo: Video) => {
    setVideos(prev => [newVideo, ...prev]);
    showNotification('success', `Success! "${newVideo.title}" has been integrated of high-speed range seek.`);
    setActiveTab('home');
    
    // Auto launch newly uploaded video directly! Awesome Netflix-style flow!
    setActiveVideo(newVideo);
  };

  // Delete registered video file
  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this video file from the streaming server?")) {
      return;
    }

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Could not delete file metadata representation.");
      }

      setVideos(prev => prev.filter(v => v.id !== id));
      setFavorites(prev => prev.filter(favId => favId !== id));
      showNotification('info', "Media file deleted from disk.");
      
      if (activeVideo?.id === id) {
        setActiveVideo(null);
      }
    } catch (e: any) {
      alert("Failed deleting media file from backend: " + e.message);
    }
  };

  // Filter videos based on search search query
  const filteredVideos = videos.filter(video => {
    const titleMatch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = video.category.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || descMatch || catMatch;
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center font-mono text-xs text-indigo-500 space-y-3">
        <Tv className="w-10 h-10 text-indigo-500 animate-pulse" />
        <span>AUTHENTICATING SECURE TERMINAL...</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Login 
        onLoginSuccess={() => { 
          setIsLoggedIn(true); 
          showNotification('success', "Security cleared. Authorized Console Link Established!"); 
        }} 
      />
    );
  }

  return (
    <div id="main-application-frame" className="min-h-screen bg-[#050505] text-white font-sans flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* Immersive Background Atmosphere Glows */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Notifications floating block */}
      {notification && (
        <div 
          id="custom-toast" 
          className="fixed bottom-16 right-6 z-50 flex items-center space-x-2 px-5 py-3 rounded-2xl shadow-3xl border bg-neutral-950/95 border-indigo-500/30 text-white shadow-indigo-950/30 animate-slideUp"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Main header block */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/5 px-4 md:px-10 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Tv className="w-5.5 h-5.5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight uppercase font-sans">
                STREAM<span className="text-indigo-500">FLIX</span>
              </span>
              <span className="block text-[8px] tracking-wider uppercase font-mono text-white/40">CORE CONSOLE // STORAGE</span>
            </div>
          </div>

          {/* Search bar helper */}
          {activeTab === 'home' && !activeVideo && (
            <div className="relative flex-grow max-w-md mx-0 md:mx-6">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="header-search-bar"
                type="text"
                placeholder="Search movies, genres, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 text-white rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 hover:bg-white/10 transition-all placeholder:text-white/40"
              />
            </div>
          )}

          {/* Tab Navigation triggers */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setActiveTab('home'); setActiveVideo(null); }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'home' 
                  ? "bg-white/5 text-white border border-white/10" 
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Browse Catalog</span>
            </button>
            <button
              id="nav-to-upload"
              onClick={() => { setActiveTab('upload'); setActiveVideo(null); }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'upload' 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "text-indigo-400 hover:text-indigo-300 font-extrabold bg-indigo-950/10 border border-indigo-500/10"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Media / Upload</span>
            </button>
            <button
              id="user-logout-btn"
              onClick={() => {
                localStorage.removeItem("streamflix_session");
                localStorage.removeItem("streamflix_username");
                setIsLoggedIn(false);
                showNotification('info', "Signed out successfully from local registry console");
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-neutral-900 border border-red-500/10 hover:border-red-500/20 transition-all active:scale-[0.97]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Primary content node */}
      <main className="flex-grow py-8 px-4 md:px-10 max-w-7xl w-full mx-auto space-y-8 z-10 relative">
        
        {/* Error reporting dialog */}
        {errorText && (
          <div className="flex items-center space-x-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-semibold">{errorText}</div>
          </div>
        )}

        {/* 1. Video Player Section (Active playing overrides other screens) */}
        {activeVideo && (
          <div id="player-focused-container" className="flex flex-col items-center justify-center space-y-4 animate-fadeIn">
            <button 
              id="back-to-catalog"
              onClick={() => setActiveVideo(null)}
              className="flex items-center space-x-2 text-xs font-bold text-neutral-400 hover:text-white self-start transition-colors px-1 py-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Browse Catalog</span>
            </button>
            
            <CustomPlayer 
              video={activeVideo} 
              onClose={() => setActiveVideo(null)} 
            />

            {/* Immersive details under the active player */}
            <div className="w-full max-w-5xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white">{activeVideo.title}</h2>
                  <div className="flex items-center space-x-3 text-xs font-mono text-neutral-400 mt-1">
                    <span className="text-indigo-400 font-bold">{activeVideo.rating}</span>
                    <span>{activeVideo.year}</span>
                    <span className="bg-white/10 px-1.5 py-0.2 rounded text-[10px] text-white font-bold">{activeVideo.maturityRating}</span>
                    <span>{activeVideo.durationStr}</span>
                    {!activeVideo.isExternal && (
                      <span className="bg-[#050505] border border-white/5 text-[9px] uppercase font-bold text-indigo-400 px-1 py-0.2 rounded">Uploader Storage</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleFavorite(activeVideo.id)}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      favorites.includes(activeVideo.id)
                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        : "border-white/10 hover:border-white/20 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Heart className={`w-4.5 h-4.5 ${favorites.includes(activeVideo.id) ? "fill-indigo-500 text-indigo-500" : ""}`} />
                    <span>{favorites.includes(activeVideo.id) ? "In Watchlist" : "Add to List"}</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">{activeVideo.description}</p>
            </div>
          </div>
        )}

        {/* 2. Main Library Catalog Frame */}
        {!activeVideo && activeTab === 'home' && (
          <>
            {isLoading ? (
              <div id="catalog-loader" className="flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                <Tv className="w-12 h-12 text-indigo-500 animate-pulse" />
                <span className="text-sm text-neutral-400 font-mono tracking-wider">Syncing movie servers...</span>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 min-h-[400px] border border-dashed border-white/10 rounded-3xl p-10 text-center bg-neutral-950/40 select-none">
                <Film className="w-12 h-12 text-neutral-700" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">No video matches found</h3>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    We couldn't locate any movies matching "{searchQuery}". Try searching for Action, Sci-Fi, or clear the search.
                  </p>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs rounded-xl font-bold transition"
                  >
                    Clear Filter Search
                  </button>
                )}
              </div>
            ) : (
              <VideoLibrary 
                videos={filteredVideos} 
                favorites={favorites}
                onPlay={(v) => setActiveVideo(v)} 
                onDelete={handleDeleteVideo}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </>
        )}

        {/* 3. Upload panel view */}
        {!activeVideo && activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
              <PlusCircle className="w-6 h-6 text-indigo-500" />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white">Transmission Deck</h2>
                <p className="text-xs text-neutral-400">Initialize direct high-speed multi-chunk pipelines of movie files.</p>
              </div>
            </div>
            <UploadPanel onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

      </main>

      {/* Bottom Immersive Usage State Bar (Aesthetic high-fidelity updates) */}
      <footer className="bg-black/40 backdrop-blur-md border-t border-white/5 py-6 text-xs text-white/40 tracking-wider">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Remote Server: US-West-Ingress</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-white/10"></div>
            <div>
              Storage: <span className="text-white font-semibold">
                {videos.length ? (videos.reduce((acc, curr) => acc + (curr.size || 0), 0) / (1024 * 1024 * 1024)).toFixed(2) : "0.78"} GB
              </span> / 50 GB Used
            </div>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Support Helpline</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
