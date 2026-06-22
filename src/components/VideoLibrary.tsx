import React from "react";
import { Play, Info, Trash2, Heart, Film, Globe, Clock, Sparkles } from "lucide-react";
import { Video } from "../types";

interface VideoLibraryProps {
  videos: Video[];
  favorites: string[];
  onPlay: (video: Video) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function VideoLibrary({ 
  videos, 
  favorites, 
  onPlay, 
  onDelete, 
  onToggleFavorite 
}: VideoLibraryProps) {
  
  // Choose first video (or Sintel) as Hero Featured Video
  const featuredVideo = videos.find(v => v.id.includes("sintel")) || videos[0];

  // Group videos into row categories
  const recentUploads = videos.filter(v => !v.id.startsWith("seed-"));
  const sciFiDrama = videos.filter(v => v.category === "Sci-Fi" || v.category === "Drama");
  const actionComedy = videos.filter(v => v.category === "Action" || v.category === "Comedy");
  const favoriteVideos = videos.filter(v => favorites.includes(v.id));

  // Dynamic aesthetic fallback banners for dynamic uploads:
  const getThumbnail = (video: Video, index: number) => {
    if (video.thumbnailUrl && video.thumbnailUrl.startsWith("http")) {
      return video.thumbnailUrl;
    }
    // High-fidelity Unsplash cinema queries
    const assets = [
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop", // Theater
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop", // Cinema seats
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop", // Clapper board
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600&auto=format&fit=crop", // Nebula tech
      "https://images.unsplash.com/photo-1542204172-e70528091f50?q=80&w=600&auto=format&fit=crop"  // SciFi corridor
    ];
    return assets[index % assets.length];
  };

  return (
    <div id="video-library-root" className="space-y-12">
      
      {/* 1. Cinematic Featured Hero Banner */}
      {featuredVideo && (
        <div 
          id="hero-featured-banner"
          className="relative min-h-[480px] lg:h-[550px] w-full rounded-3xl overflow-hidden flex flex-col justify-end p-6 md:p-12 border border-white/10 shadow-3xl bg-cover bg-center transition-all duration-500"
          style={{ backgroundImage: `linear-gradient(to top, rgba(5, 5, 5, 1) 0%, rgba(5, 5, 5, 0.45) 50%, rgba(5, 5, 5, 0.1) 100%), url(${getThumbnail(featuredVideo, 0)})` }}
        >
          {/* Subtle top shadow flare */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

          {/* Hero Meta Details */}
          <div className="max-w-3xl space-y-4 md:space-y-5 z-10 select-none">
            
            {/* Featured Match tag */}
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-2.5 py-1 rounded shadow-[0_0_15px_rgba(99,102,241,0.5)] tracking-widest text-[9px] uppercase">FEATURED STREAM</span>
              <span className="text-indigo-400 font-bold">{featuredVideo.rating}</span>
              <span className="text-white/60 font-medium">{featuredVideo.year}</span>
              <span className="border border-white/10 text-white/60 px-1 py-0.2 text-[10px] rounded font-bold">{featuredVideo.maturityRating}</span>
              <span className="text-white/60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {featuredVideo.durationStr}
              </span>
            </div>

            {/* Giant Title */}
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-tight uppercase font-sans">
              {featuredVideo.title}
            </h1>

            {/* Synopsis Description */}
            <p className="text-sm md:text-base text-white/75 leading-relaxed drop-shadow max-w-2xl line-clamp-3">
              {featuredVideo.description}
            </p>

            {/* Bottom Actions Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="hero-play-button"
                onClick={() => onPlay(featuredVideo)}
                className="flex items-center space-x-2.5 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm uppercase rounded-xl hover:opacity-95 transition-all transform active:scale-97 shadow-xl shadow-indigo-600/30 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Play Now</span>
              </button>

              <button
                id="hero-fav-toggle"
                onClick={() => onToggleFavorite(featuredVideo.id)}
                className={`p-3.5 rounded-xl border transition-all ${
                  favorites.includes(featuredVideo.id) 
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" 
                    : "bg-white/5 border-white/10 hover:border-white/30 text-white"
                }`}
                title="Add to List"
              >
                <Heart className={`w-5 h-5 ${favorites.includes(featuredVideo.id) ? "fill-indigo-500 text-indigo-500" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Scrollable Rows Grid layout */}
      <div className="space-y-12">
        
        {/* Row A: User Uploads */}
        {recentUploads.length > 0 && (
          <div id="row-user-uploads" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Film className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Your Media Library</h2>
              <span className="text-xs font-mono bg-white/5 px-2 py-0.5 border border-white/5 rounded text-white/60 font-bold">
                {recentUploads.length}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentUploads.map((video, idx) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isFav={favorites.includes(video.id)}
                  onPlay={onPlay} 
                  onDelete={onDelete}
                  onToggleFav={onToggleFavorite}
                  imgUrl={getThumbnail(video, idx + 10)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Row B: Favorites List */}
        {favoriteVideos.length > 0 && (
          <div id="row-user-favorites" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-indigo-500 fill-indigo-500" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Watchlist Favorites</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favoriteVideos.map((video, idx) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isFav={true}
                  onPlay={onPlay} 
                  onDelete={onDelete}
                  onToggleFav={onToggleFavorite}
                  imgUrl={getThumbnail(video, idx + 20)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Row C: Cinematic Sci-Fi & Dramas */}
        {sciFiDrama.length > 0 && (
          <div id="row-scifi-classics" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Sci-Fi & Drama Masterpieces</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sciFiDrama.map((video, idx) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isFav={favorites.includes(video.id)}
                  onPlay={onPlay} 
                  onDelete={onDelete}
                  onToggleFav={onToggleFavorite}
                  imgUrl={getThumbnail(video, idx + 30)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Row D: Comedy & Actions */}
        {actionComedy.length > 0 && (
          <div id="row-action-blockbusters" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Action & Comedy Blockbusters</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {actionComedy.map((video, idx) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isFav={favorites.includes(video.id)}
                  onPlay={onPlay} 
                  onDelete={onDelete}
                  onToggleFav={onToggleFavorite}
                  imgUrl={getThumbnail(video, idx + 40)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom internal card element for granular card event handlers
interface VideoCardProps {
  key?: string;
  video: Video;
  isFav: boolean;
  imgUrl: string;
  onPlay: (v: Video) => void;
  onDelete: (id: string) => void;
  onToggleFav: (id: string) => void;
}

function VideoCard({ video, isFav, imgUrl, onPlay, onDelete, onToggleFav }: VideoCardProps) {
  const isDeletedEnabled = !video.id.startsWith("seed-");
  return (
    <div 
      className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 transition-all duration-300 hover:scale-102 hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-950/20 relative cursor-pointer flex flex-col justify-between"
      onClick={() => onPlay(video)}
    >
      {/* Poster area */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
        <img 
          src={imgUrl} 
          alt={video.title} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
        />

        {/* Dynamic metadata overlay on top of poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
            <span>{video.year}</span>
            <span>{video.maturityRating}</span>
          </div>
        </div>

        {/* Floating Play hover glyph */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/35">
          <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.6)] rounded-full text-white transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* External URL badge indicator */}
        {video.isExternal && (
          <span className="absolute top-2 left-2 bg-black/60 border border-white/5 text-indigo-400 font-mono font-bold text-[9px] uppercase px-1.5 py-0.5 rounded tracking-widest flex items-center gap-1 z-10">
            <Globe className="w-2.5 h-2.5" /> External
          </span>
        )}
      </div>

      {/* Narrative details */}
      <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-extrabold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
              {video.title}
            </h3>
            <span className="text-[10px] font-bold text-indigo-400 whitespace-nowrap">{video.rating}</span>
          </div>
          <p className="text-xs text-white/60 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {video.description}
          </p>
        </div>

        {/* Action controllers footer row */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-white/40">
          <div className="flex items-center space-x-2 text-[10px] font-mono">
            <span className="font-bold text-white/85 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">{video.category}</span>
            <span>{video.durationStr}</span>
          </div>

          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
            {/* Heart trigger */}
            <button
              onClick={() => onToggleFav(video.id)}
              className={`p-1.5 rounded-lg border hover:scale-110 transition ${
                isFav 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                  : "border-white/5 hover:border-white/25 text-neutral-400 hover:text-white"
              }`}
              title="Add to watchlist"
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-indigo-500 text-indigo-500" : ""}`} />
            </button>

            {/* Trash option for non-seeding videos */}
            {isDeletedEnabled && (
              <button
                onClick={() => onDelete(video.id)}
                className="p-1.5 rounded-lg border border-white/5 hover:border-indigo-500/20 text-neutral-400 hover:text-indigo-400 transition hover:scale-110"
                title="Remove video"
              >
                {/* Trash icon placeholder */}
                <span className="text-[11px] font-bold uppercase hover:text-indigo-400">DEL</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
