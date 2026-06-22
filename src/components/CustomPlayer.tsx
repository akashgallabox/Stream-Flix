import React, { useRef, useState, useEffect } from "react";
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, 
  Settings, Loader2, FastForward, Square, MonitorPlay
} from "lucide-react";
import { Video } from "../types";
import { getLocalVideoFile } from "../lib/localDb";

interface CustomPlayerProps {
  video: Video;
  onClose: () => void;
}

export default function CustomPlayer({ video, onClose }: CustomPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [localUrl, setLocalUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let activeUrl: string | null = null;

    async function checkLocalFile() {
      try {
        const file = await getLocalVideoFile(video.id);
        if (file && isMounted) {
          activeUrl = URL.createObjectURL(file);
          setLocalUrl(activeUrl);
        } else if (isMounted) {
          setLocalUrl(null);
        }
      } catch (err) {
        console.warn("Could not retrieve local IndexedDB streaming file:", err);
      }
    }

    checkLocalFile();

    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [video.id]);

  const videoSrc = localUrl || (video.isExternal ? `/api/videos/${video.id}/stream` : video.url);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setBufferingState = (buffering: boolean) => {
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }

    if (buffering) {
      // Delay showing the spinner. If we start playing or buffer finishes within 250ms, don't show it!
      bufferTimerRef.current = setTimeout(() => {
        setIsBuffering(true);
      }, 250);
    } else {
      setIsBuffering(false);
    }
  };

  useEffect(() => {
    // Reset status when video source changes
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackSpeed(1);
    
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }
    setIsBuffering(true);

    if (videoRef.current) {
      try {
        videoRef.current.load();
      } catch (err) {
        console.warn("video.load failed", err);
      }
    }
  }, [video]);

  // Keep tracks of mouse activity to hide/show transport bar elegantly
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    };
  }, [isPlaying]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(e => console.log("Play interrupted:", e));
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return; // Skip shortcut keys if in input fields
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipTime(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipTime(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(prev => {
            const next = Math.min(prev + 0.1, 1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          setIsMuted(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(prev => {
            const next = Math.max(prev - 0.1, 0);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen().catch(e => console.log(e));
          } else {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, volume, isMuted]);

  // Format seconds to hh:mm:ss format
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);

    const formattedMins = mins.toString().padStart(2, "0");
    const formattedSecs = secs.toString().padStart(2, "0");

    if (hrs > 0) {
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${mins}:${formattedSecs}`;
  };

  // Skip forwards/backwards
  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + amount, duration));
  };

  // Adjust seeker position on range timeline slide change
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekVal = parseFloat(e.target.value);
    videoRef.current.currentTime = seekVal;
    setCurrentTime(seekVal);
  };

  // Volume bar updates
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volVal = parseFloat(e.target.value);
    setVolume(volVal);
    if (videoRef.current) {
      videoRef.current.volume = volVal;
      videoRef.current.muted = volVal === 0;
    }
    setIsMuted(volVal === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedControls(false);
  };

  // Handle Fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(e => console.warn(e));
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(e => console.warn(e));
      }
      setIsFullscreen(false);
    }
  };

  // Sync state with HTML5 video event handlers
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Standard Pip mode
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PIP not supported by browser", e);
    }
  };

  return (
    <div 
      id="custom-player-root"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative bg-neutral-950 flex flex-col justify-center items-center transition-all duration-300 overflow-hidden ${
        isFullscreen 
          ? "fixed inset-0 z-[9999] w-screen h-screen rounded-none border-none bg-black"
          : isTheaterMode 
            ? "w-full max-w-full aspect-video md:h-[650px] shadow-2xl rounded-lg" 
            : "w-full max-w-5xl rounded-2xl aspect-video shadow-violet-950/20 shadow-2xl border border-neutral-800"
      }`}
    >
      {/* Video stream element */}
      <video
        ref={videoRef}
        src={videoSrc}
        {...{ referrerPolicy: "no-referrer" }}
        preload="auto"
        playsInline
        onPlay={() => {
          setIsPlaying(true);
          setBufferingState(false);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onWaiting={() => setBufferingState(true)}
        onPlaying={() => setBufferingState(false)}
        onLoadStart={() => setBufferingState(true)}
        onCanPlay={() => setBufferingState(false)}
        onCanPlayThrough={() => setBufferingState(false)}
        onSeeked={() => setBufferingState(false)}
        onClick={togglePlay}
        className="w-full h-full object-contain select-none cursor-pointer"
        autoPlay
      />

      {/* Spinner for Buffering state */}
      {isBuffering && (
        <div id="player-buffering-overlay" className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        id="player-control-overlay"
        className={`absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 transition-opacity duration-300 flex flex-col justify-between z-10 p-2 sm:p-5 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top bar header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0 max-w-[65%] sm:max-w-none">
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-indigo-400 uppercase font-mono">Now Playing</span>
            <span className="text-xs sm:text-lg font-bold text-white tracking-tight drop-shadow-md truncate">{video.title}</span>
          </div>
          <button 
            id="player-close-button"
            onClick={onClose}
            className="flex items-center justify-center py-1 px-2.5 sm:py-1.5 sm:px-3 text-[10px] sm:text-xs font-bold rounded-full bg-black/60 hover:bg-indigo-600 text-white transition-all transform hover:scale-105 border border-white/10"
          >
            <span className="font-sans">Exit Playback</span>
          </button>
        </div>

        {/* Center play bounce visual feedback */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none">
          <div className="flex items-center space-x-4 sm:space-x-12">
            <button 
              onClick={(e) => { e.stopPropagation(); skipTime(-10); }} 
              className="p-1.5 sm:p-3 bg-black/55 hover:bg-neutral-900 border border-neutral-800 pointer-events-auto rounded-full hover:scale-105 active:scale-95 text-white/90 transition"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
              className="p-2.5 sm:p-4 bg-indigo-600 hover:bg-indigo-700 pointer-events-auto rounded-full text-white hover:scale-105 active:scale-95 shadow-lg shadow-indigo-950/35 transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-8 sm:h-8 fill-white" /> : <Play className="w-5 h-5 sm:w-8 sm:h-8 fill-white ml-0.5" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); skipTime(10); }} 
              className="p-1.5 sm:p-3 bg-black/55 hover:bg-neutral-900 border border-neutral-800 pointer-events-auto rounded-full hover:scale-105 active:scale-95 text-white/90 transition"
              title="Fast Forward 10s"
            >
              <RotateCw className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Bottom controls panel */}
        <div className="space-y-2 sm:space-y-4">
          {/* Seeker Slide Bar */}
          <div className="group relative flex flex-col pt-1 cursor-pointer">
            <div className="text-[10px] sm:text-xs font-mono text-neutral-400 absolute bottom-full left-1 mb-1 bg-black/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {formatTime(currentTime)}
            </div>
            
            <input
              id="player-timeline-seeker"
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1 bg-neutral-700/60 group-hover:h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all outline-none"
            />
          </div>

          {/* Buttons Controls bottom Row */}
          <div className="flex items-center justify-between gap-1 sm:gap-4">
            {/* Left side actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 min-w-0">
              {/* Play Pause */}
              <button 
                id="player-play-toggle"
                onClick={togglePlay} 
                className="text-white hover:text-indigo-400 transition-colors transform hover:scale-105"
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5.5 sm:h-5.5 fill-current" /> : <Play className="w-4 h-4 sm:w-5.5 sm:h-5.5 fill-current" />}
              </button>

              <button 
                onClick={() => skipTime(-10)} 
                className="text-neutral-300 hover:text-white transition-colors"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              </button>

              <button 
                onClick={() => skipTime(10)} 
                className="text-neutral-300 hover:text-white transition-colors"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Volume sliders */}
              <div className="flex items-center space-x-1.5 group/volume">
                <button 
                  id="player-volume-toggle"
                  onClick={toggleMute} 
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />}
                </button>
                <input
                  id="player-volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden sm:inline-block w-12 md:w-20 lg:w-24 h-1 rounded-lg bg-neutral-600 appearance-none accent-white transition-all cursor-pointer outline-none"
                />
              </div>

              {/* Timestamp text */}
              <div className="text-white text-[9px] sm:text-xs font-mono font-medium opacity-90 select-none truncate">
                {formatTime(currentTime)} <span className="text-neutral-500 font-sans">/</span> {formatTime(duration)}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 relative text-white">
              {/* Playback speed selector */}
              <div className="relative">
                <button
                  id="player-speed"
                  onClick={() => setShowSpeedControls(!showSpeedControls)}
                  className="flex items-center space-x-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-xs rounded-full border border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800 hover:border-neutral-500 transition font-mono"
                  title="Playback Speed"
                >
                  <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin-hover" />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedControls && (
                  <div className="absolute right-0 bottom-full mb-3 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl shadow-black/80 flex flex-col p-1 w-20 sm:w-24 overflow-hidden z-25 animate-fadeIn">
                    <span className="text-[9px] text-neutral-400 font-mono text-center pb-1 border-b border-neutral-800">Speed</span>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedSelect(s)}
                        className={`text-left text-[10px] sm:text-xs px-2 py-1 rounded-md transition font-mono hover:bg-neutral-800 ${
                          playbackSpeed === s ? "text-indigo-400 font-bold bg-neutral-800/50" : "text-neutral-300"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pip Mode */}
              <button 
                onClick={togglePip}
                className="text-neutral-300 hover:text-indigo-400 transition-colors"
                title="Picture-in-Picture"
              >
                <MonitorPlay className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Theater Mode (on desktop) */}
              <button 
                id="player-theater-toggle"
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`hidden md:block transition-colors ${isTheaterMode ? "text-indigo-400" : "text-neutral-300 hover:text-white"}`}
                title={isTheaterMode ? "Standard view" : "Theater view"}
              >
                <Square className={`w-5 h-5 ${isTheaterMode ? "stroke-[2.5]" : ""}`} />
              </button>

              {/* Fullscreen toggle */}
              <button 
                id="player-fullscreen-toggle"
                onClick={toggleFullscreen} 
                className="text-neutral-300 hover:text-white transition-colors transform hover:scale-105"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
