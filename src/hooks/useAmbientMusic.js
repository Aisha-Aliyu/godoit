import { useState, useRef, useEffect, useCallback } from "react";
import { startAmbient } from "../lib/ambientEngine";

// Every sound is generated in the browser (see lib/ambientEngine.js). The old tracks
// streamed demo songs from soundhelix.com, which the site's Content Security Policy
// blocks, so nothing played. Generated sounds have nothing to download or block.
export const TRACKS = [
  { id: "rain",  label: "Gentle Rain", emoji: "🌧", color: "#5b7fa6", mood: "calm" },
  { id: "ocean", label: "Ocean Waves", emoji: "🌊", color: "#3f7f8c", mood: "soothing" },
  { id: "fire",  label: "Fireplace",   emoji: "🔥", color: "#c4922d", mood: "cozy" },
  { id: "brown", label: "Deep Focus",  emoji: "🧠", color: "#6b4fa6", mood: "focused" },
  { id: "pad",   label: "Night Drift", emoji: "🌙", color: "#4a5a8a", mood: "dreamy" },
];

const AudioCtx =
  typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;

export const useAmbientMusic = () => {
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0]);
  const [volume,       setVolume]       = useState(0.4);
  const [visualizer,   setVisualizer]   = useState(Array(12).fill(0.1));
  const ctxRef      = useRef(null);
  const masterRef   = useRef(null);
  const soundRef    = useRef(null);
  const volumeRef   = useRef(volume);
  const suspendRef  = useRef(null);
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

  // Volume sync
  useEffect(() => {
    volumeRef.current = volume;
    const ctx = ctxRef.current;
    if (ctx && masterRef.current) {
      masterRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }, [volume]);

  // Stop everything if the app unmounts
  useEffect(() => () => {
    clearTimeout(suspendRef.current);
    soundRef.current?.stop(0.05);
    ctxRef.current?.close().catch(() => {});
  }, []);

  // Browsers only let sound start from a tap, so the audio context is created and
  // resumed here, inside the play handler, before anything asynchronous happens.
  const ensureContext = useCallback(() => {
    if (!AudioCtx) return null;
    if (!ctxRef.current) {
      // iPhones mute web audio when the ring switch is on silent unless the page
      // asks for media playback
      try {
        if (navigator.audioSession) navigator.audioSession.type = "playback";
      } catch { /* not supported */ }
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = volumeRef.current;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state !== "running") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const play = useCallback((track) => {
    const ctx = ensureContext();
    if (!ctx) return;
    clearTimeout(suspendRef.current);

    const next = track || currentTrack;
    if (track && track.id !== currentTrack.id) setCurrentTrack(track);

    soundRef.current?.stop();
    try {
      soundRef.current = startAmbient(ctx, next.id, masterRef.current);
      setIsPlaying(true);
    } catch (e) {
      console.warn("Ambient sound failed:", e.message);
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, [currentTrack, ensureContext]);

  const pause = useCallback(() => {
    soundRef.current?.stop();
    soundRef.current = null;
    setIsPlaying(false);
    // Let the fade finish, then suspend the context to save battery
    clearTimeout(suspendRef.current);
    suspendRef.current = setTimeout(() => {
      if (!soundRef.current) ctxRef.current?.suspend().catch(() => {});
    }, 600);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const switchTrack = useCallback((track) => {
    if (isPlaying) play(track);
    else setCurrentTrack(track);
  }, [isPlaying, play]);

  return {
    isPlaying, currentTrack, volume, setVolume,
    loading: false, visualizer, toggle, switchTrack, play, pause,
  };
};
