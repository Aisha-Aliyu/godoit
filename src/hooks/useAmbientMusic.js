import { useState, useRef, useEffect, useCallback } from "react";

export const TRACKS = [
  {
    id: "lofi",
    label: "Lo-fi Study",
    emoji: "🎵",
    color: "#c4622d",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    mood: "focused",
  },
  {
    id: "rain",
    label: "Gentle Rain",
    emoji: "🌧",
    color: "#5b7fa6",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    mood: "calm",
  },
  {
    id: "forest",
    label: "Forest Morning",
    emoji: "🌿",
    color: "#4a7c59",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    mood: "peaceful",
  },
  {
    id: "fireplace",
    label: "Fireplace",
    emoji: "🔥",
    color: "#c4922d",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    mood: "cozy",
  },
  {
    id: "deepfocus",
    label: "Deep Focus",
    emoji: "🧠",
    color: "#6b4fa6",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    mood: "intense",
  },
  {
    id: "cafe",
    label: "Café Noise",
    emoji: "☕",
    color: "#8a6245",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    mood: "social",
  },
];

export const useAmbientMusic = () => {
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0]);
  const [volume,       setVolume]       = useState(0.4);
  const [loading,      setLoading]      = useState(false);
  const [visualizer,   setVisualizer]   = useState(Array(12).fill(0.1));
  const audioRef   = useRef(null);
  const vizTimerRef = useRef(null);

  // Animate visualizer bars when playing
  useEffect(() => {
    if (isPlaying) {
      vizTimerRef.current = setInterval(() => {
        setVisualizer(Array(12).fill(0).map(() =>
          Math.random() * 0.7 + 0.15
        ));
      }, 120);
    } else {
      clearInterval(vizTimerRef.current);
      setVisualizer(Array(12).fill(0.08));
    }
    return () => clearInterval(vizTimerRef.current);
  }, [isPlaying]);

  // Init audio element
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audio.preload = "none";
    audioRef.current = audio;

    audio.addEventListener("canplay", () => setLoading(false));
    audio.addEventListener("waiting", () => setLoading(true));
    audio.addEventListener("error", () => setLoading(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

const play = useCallback(async (track) => {
  const audio = audioRef.current;
  if (!audio) return;

  if (track && track.id !== currentTrack.id) {
    setCurrentTrack(track);
    setLoading(true);
    audio.pause();
    audio.src = track.url;
    audio.load();          // ← add this for mobile Safari
    audio.currentTime = 0;
  } else if (!audio.src || audio.src === window.location.href) {
    // guard against empty src resolving to page URL
    audio.src = currentTrack.url;
    audio.load();
  }

  try {
    await audio.play();
    setIsPlaying(true);
  } catch (e) {
    console.warn("Playback blocked:", e.message);
    setIsPlaying(false);
    setLoading(false);
  }
}, [currentTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const switchTrack = useCallback((track) => {
    if (isPlaying) play(track);
    else {
      setCurrentTrack(track);
      if (audioRef.current) {
        audioRef.current.src = "";
      }
    }
  }, [isPlaying, play]);

  return {
    isPlaying, currentTrack, volume, setVolume,
    loading, visualizer, toggle, switchTrack, play, pause,
  };
};
