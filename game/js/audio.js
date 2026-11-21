/* Twin Vistas — tiny synthesized sounds. No audio files: every effect is an
   oscillator blip shaped by hand, created lazily on the first user gesture. */
(function () {
  'use strict';

  var ctx = null;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function tone(freqFrom, freqTo, startOffset, duration, type, volume) {
    var ac = ensureContext();
    if (!ac) return;
    var t0 = ac.currentTime + startOffset;
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  window.TwinVistasAudio = {
    unlock: function () { ensureContext(); },
    find: function () {
      tone(660, 660, 0, 0.09, 'sine', 0.16);
      tone(990, 990, 0.07, 0.14, 'sine', 0.16);
    },
    miss: function () {
      tone(160, 90, 0, 0.16, 'square', 0.07);
    },
    hint: function () {
      tone(520, 780, 0, 0.12, 'triangle', 0.1);
    },
    win: function () {
      var notes = [523, 659, 784, 1047];
      for (var i = 0; i < notes.length; i++) tone(notes[i], notes[i], i * 0.09, 0.16, 'sine', 0.14);
    },
    lose: function () {
      tone(392, 392, 0, 0.14, 'sine', 0.12);
      tone(330, 330, 0.13, 0.14, 'sine', 0.12);
      tone(262, 240, 0.26, 0.24, 'sine', 0.12);
    }
  };
})();
