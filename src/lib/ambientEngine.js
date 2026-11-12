// Ambient sounds generated live with the Web Audio API. There are no audio files, so
// there's nothing to download, nothing a Content Security Policy or a dead link can
// block, and no licensing to worry about. Every builder works on any BaseAudioContext,
// so the sounds can also be rendered offline for testing.

const NOISE_SECONDS = 4;
const noiseCache = new WeakMap();

// One shared buffer of white noise per audio context. Looping white noise has no
// audible seam, because every sample is independent of the one before it.
function whiteNoise(ctx) {
  let buffer = noiseCache.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, NOISE_SECONDS * ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buffer);
  }
  return buffer;
}

function noise(ctx) {
  const src = ctx.createBufferSource();
  src.buffer = whiteNoise(ctx);
  src.loop = true;
  src.start(0, Math.random() * (NOISE_SECONDS - 0.5));
  return src;
}

function filter(ctx, type, frequency, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = q;
  return f;
}

function gain(ctx, value) {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

function osc(ctx, type, frequency) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = frequency;
  o.start();
  return o;
}

function chain(...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
}

// A short filtered click of noise: a raindrop, a crackle or a pop
function burst(ctx, out, time, { type, freq, q, decay, level }) {
  const src = ctx.createBufferSource();
  src.buffer = whiteNoise(ctx);
  const f = filter(ctx, type, freq, q);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(level, time + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  chain(src, f, env, out);
  src.start(time, Math.random() * (NOISE_SECONDS - 0.5));
  src.stop(time + decay + 0.02);
}

// Random event times at an average rate per second, like real drops or crackles
function* randomTimes(from, until, perSecond) {
  let t = from;
  for (;;) {
    t += -Math.log(1 - Math.random()) / perSecond;
    if (t >= until) return;
    yield t;
  }
}

const BUILDERS = {
  rain(ctx, out) {
    const wash = noise(ctx);
    chain(wash, filter(ctx, "highpass", 500), filter(ctx, "lowpass", 7000), gain(ctx, 0.32), out);
    const body = noise(ctx);
    chain(body, filter(ctx, "lowpass", 900), gain(ctx, 0.5), out);
    return {
      sources: [wash, body],
      schedule(from, until) {
        for (const t of randomTimes(from, until, 14)) {
          burst(ctx, out, t, {
            type: "bandpass",
            freq: 2500 + Math.random() * 3500,
            q: 3,
            decay: 0.012 + Math.random() * 0.02,
            level: 0.05 + Math.random() * 0.12,
          });
        }
      },
    };
  },

  ocean(ctx, out) {
    const water = noise(ctx);
    const lp = filter(ctx, "lowpass", 900, 0.5);
    const swell = gain(ctx, 0.55);
    chain(water, lp, swell, gain(ctx, 1.15), out);

    const foam = noise(ctx);
    const foamLevel = gain(ctx, 0.03);
    chain(foam, filter(ctx, "highpass", 2500), foamLevel, out);

    // Two slow waves at different rates, so the swells never line up the same way twice
    const lfo1 = osc(ctx, "sine", 0.083);
    const lfo2 = osc(ctx, "sine", 0.131);
    [[lfo1, 0.28, 450, 0.025], [lfo2, 0.17, 250, 0.015]].forEach(([lfo, amp, cutoff, spray]) => {
      const a = gain(ctx, amp);
      const c = gain(ctx, cutoff);
      const s = gain(ctx, spray);
      lfo.connect(a); a.connect(swell.gain);
      lfo.connect(c); c.connect(lp.frequency);
      lfo.connect(s); s.connect(foamLevel.gain);
    });
    return { sources: [water, foam, lfo1, lfo2] };
  },

  fire(ctx, out) {
    const roar = noise(ctx);
    chain(roar, filter(ctx, "lowpass", 180), gain(ctx, 2.2), out);
    const hiss = noise(ctx);
    chain(hiss, filter(ctx, "bandpass", 3000, 0.8), gain(ctx, 0.03), out);

    const crackle = (t) =>
      burst(ctx, out, t, {
        type: "highpass",
        freq: 1800 + Math.random() * 2500,
        q: 0.7,
        decay: 0.006 + Math.random() * 0.02,
        level: 0.12 + Math.random() * 0.25,
      });

    return {
      sources: [roar, hiss],
      schedule(from, until) {
        for (const t of randomTimes(from, until, 6)) {
          if (Math.random() < 0.15) {
            // an occasional deeper pop from the wood
            burst(ctx, out, t, {
              type: "bandpass",
              freq: 700 + Math.random() * 900,
              q: 1.5,
              decay: 0.05 + Math.random() * 0.06,
              level: 0.35 + Math.random() * 0.25,
            });
          } else {
            crackle(t);
            // crackles tend to come in little clusters
            if (Math.random() < 0.3) {
              const extra = 2 + Math.floor(Math.random() * 3);
              for (let k = 1; k <= extra; k++) crackle(t + k * (0.015 + Math.random() * 0.03));
            }
          }
        }
      },
    };
  },

  // Brown noise: steady and deep, a common background for concentration
  brown(ctx, out) {
    const src = noise(ctx);
    chain(src, filter(ctx, "lowpass", 320, 0.6), filter(ctx, "lowpass", 900, 0.6), gain(ctx, 1.7), out);
    return { sources: [src] };
  },

  // A soft, slowly breathing Cmaj7 chord
  pad(ctx, out) {
    const lp = filter(ctx, "lowpass", 1100, 0.6);
    chain(lp, gain(ctx, 0.6), out);
    const sources = [];
    [130.81, 196.0, 246.94, 329.63].forEach((freq, i) => {
      [-5, 5].forEach((cents) => {
        const o = osc(ctx, i < 2 ? "triangle" : "sine", freq);
        o.detune.value = cents;
        const level = gain(ctx, 0.12);
        chain(o, level, lp);
        const breath = osc(ctx, "sine", 0.03 + Math.random() * 0.05);
        const depth = gain(ctx, 0.06);
        chain(breath, depth, level.gain);
        sources.push(o, breath);
      });
    });
    const sweep = osc(ctx, "sine", 0.025);
    const sweepDepth = gain(ctx, 500);
    chain(sweep, sweepDepth, lp.frequency);
    sources.push(sweep);
    return { sources };
  },
};

export const SOUND_IDS = Object.keys(BUILDERS);

const FADE_IN = 1.2;
const LOOKAHEAD = 4;

/**
 * Starts a sound and returns a handle with stop().
 * realtime: true schedules random events with a timer as playback goes on. For
 * offline rendering, pass false and call scheduleUntil(seconds) once.
 */
export function startAmbient(ctx, id, destination, { realtime = true } = {}) {
  const build = BUILDERS[id];
  if (!build) throw new Error(`Unknown ambient sound: ${id}`);

  const out = ctx.createGain();
  const now = ctx.currentTime;
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(1, now + FADE_IN);
  out.connect(destination);

  const voice = build(ctx, out);
  let scheduledUntil = now;
  const scheduleUntil = (until) => {
    // If the timer was throttled (a background tab), skip the missed stretch instead
    // of firing a clump of drops or crackles all at once
    const from = Math.max(scheduledUntil, ctx.currentTime);
    if (voice.schedule && until > from) {
      voice.schedule(from, until);
      scheduledUntil = until;
    }
  };

  let timer = null;
  if (realtime) {
    scheduleUntil(now + LOOKAHEAD);
    timer = setInterval(() => scheduleUntil(ctx.currentTime + LOOKAHEAD), 500);
  }

  return {
    scheduleUntil,
    stop(fade = 0.4) {
      clearInterval(timer);
      const t = ctx.currentTime;
      // Hold the level wherever it is (even mid fade-in) and glide to silence from there.
      // Safari can report a stale gain.value, so it's only read where cancelAndHold is missing.
      if (out.gain.cancelAndHoldAtTime) {
        out.gain.cancelAndHoldAtTime(t);
      } else {
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(out.gain.value, t);
      }
      out.gain.setTargetAtTime(0, t, fade / 4);
      voice.sources.forEach((s) => {
        try { s.stop(t + fade + 0.05); } catch { /* already stopped */ }
      });
      setTimeout(() => out.disconnect(), (fade + 0.2) * 1000);
    },
  };
}
