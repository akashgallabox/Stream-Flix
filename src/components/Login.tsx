import React, { useState } from "react";
import { motion } from "motion/react";
import { Tv, Lock, User, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Credentials are loaded from .env — never hardcoded in source
  const defaultUsername = import.meta.env.VITE_APP_USERNAME || "";
  const defaultPassword = import.meta.env.VITE_APP_PASSWORD || "";


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all security fields.");
      return;
    }

    setIsLoading(true);

    // Simulate authenticating against local secure registry
    setTimeout(() => {
      if (username === defaultUsername && password === defaultPassword) {
        localStorage.setItem("streamflix_session", "active");
        localStorage.setItem("streamflix_username", username);
        onLoginSuccess();
      } else {
        setError("Invalid username or password. Please verify security parameters.");
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div id="login-screen-wrapper" className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      
      {/* Cinematic Ambient Atmosphere Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Fine-grain visual pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_1px,#050505_1px)] bg-[size:20px_20px] opacity-15 pointer-events-none"></div>

      <motion.div 
        id="login-card-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-[#0d0d0f]/90 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl relative z-10"
      >
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500/40 rounded-br-3xl pointer-events-none"></div>

        {/* Head Branding */}
        <div className="flex flex-col items-center space-y-3 mb-8 select-none text-center">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/20"
          >
            <Tv className="w-8 h-8 text-white stroke-[2]" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              STREAM<span className="text-indigo-500">FLIX</span>
            </h1>
            <span className="block text-[9px] tracking-widest uppercase font-mono text-neutral-400 mt-1">
              SYSTEM CONSOLE AUTHENTICATION
            </span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div 
              id="login-error-banner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start space-x-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </motion.div>
          )}

          {/* Username Input Container */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-mono text-neutral-400 font-bold block">
              Username ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="login-username-input"
                type="text"
                placeholder="Enter workspace username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/5 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:bg-[#121215] transition-all placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Password Input Container */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-widest font-mono text-neutral-400 font-bold block">
                Security Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter console password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/5 text-white rounded-xl py-3 pl-11 pr-11 text-sm focus:outline-none focus:border-indigo-500 focus:bg-[#121215] transition-all placeholder:text-neutral-600"
              />
              <button
                id="toggle-password-visibility"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl py-3 text-xs font-bold font-sans tracking-wide transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 mt-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>AUTHORIZED CONNECTION...</span>
              </>
            ) : (
              <>
                <span>ESTABLISH SECURE LINK</span>
              </>
            )}
          </button>
        </form>

        {/* Security Disclaimers */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-neutral-500 tracking-wide font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400/60" />
            SECURED ACCORDING TO USER DIRECTIVE
          </p>
        </div>
      </motion.div>
    </div>
  );
}
