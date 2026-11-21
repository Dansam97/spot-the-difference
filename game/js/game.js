/* Twin Vistas — the game itself: state, timing, picking, hints and overlays.
   The two canvases are repainted from the painters on every change; found
   differences get a ring and a tick drawn over both panels, and a hint sends
   a slow pulse around one difference that is still hiding. */
(function () {
  'use strict';

  var W = 520;
  var H = 390;
  var TICK_MS = 100;

  var levels = window.TwinVistasLevels;
  var painters = window.TwinVistasScenes;
  var audio = window.TwinVistasAudio;

  var els = {};
  var state = null;
  var timerId = null;
  var lastTickAt = 0;
  var pulseRaf = 0;

  function $(id) { return document.getElementById(id); }

  function formatTime(totalSeconds) {
    var s = Math.max(0, Math.ceil(totalSeconds));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function newRun() {
    return {
      levelIndex: 0,
      found: new Set(),
      score: 0,
      scoreAtLevelStart: 0,
      hintsLeft: 0,
      timeLeft: 0,
      playing: false,
      frozen: false,
      pulseId: null,
      pulseUntil: 0,
      pulsePhase: null
    };
  }

  function level() { return levels[state.levelIndex]; }

  function startLevel(index, keepScore) {
    state.levelIndex = index;
    state.found = new Set();
    state.hintsLeft = level().hints;
    state.timeLeft = level().seconds;
    state.scoreAtLevelStart = keepScore ? state.score : 0;
    if (!keepScore) state.score = 0;
    state.playing = true;
    state.pulseId = null;
    hideOverlay();
    setToast(level().intro);
    render();
    updateHud();
    startTimer();
  }

  function startTimer() {
    stopTimer();
    lastTickAt = performance.now();
    timerId = setInterval(onTick, TICK_MS);
  }

  function stopTimer() {
    if (timerId !== null) clearInterval(timerId);
    timerId = null;
  }

  function onTick() {
    if (!state.playing || state.frozen) return;
    var now = performance.now();
    var dt = (now - lastTickAt) / 1000;
    lastTickAt = now;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      updateHud();
      onTimeUp();
      return;
    }
    updateHud();
  }

  function onTimeUp() {
    state.playing = false;
    stopTimer();
    audio.lose();
    state.score = state.scoreAtLevelStart;
    showOverlay(
      'Out of light',
      'The ' + level().name + ' pictures keep their last secrets — for now. Your score returns to ' + state.score + '.',
      'Try this level again',
      function () { startLevel(state.levelIndex, true); }
    );
    render();
  }

  function onLevelComplete() {
    state.playing = false;
    stopTimer();
    var bonus = Math.ceil(state.timeLeft);
    state.score += bonus;
    audio.win();
    render();
    updateHud();
    if (state.levelIndex + 1 < levels.length) {
      showOverlay(
        level().name + ' — complete!',
        'Every difference found, with ' + formatTime(state.timeLeft) + ' to spare. Time bonus +' + bonus + '. Score ' + state.score + '.',
        'Next: ' + levels[state.levelIndex + 1].name,
        function () { startLevel(state.levelIndex + 1, true); }
      );
    } else {
      showOverlay(
        'Every vista matched!',
        'You found all ' + totalDifferences() + ' differences across the three pictures. Final score ' + state.score + '.',
        'Play again',
        function () { startLevel(0, false); }
      );
    }
  }

  function totalDifferences() {
    var n = 0;
    for (var i = 0; i < levels.length; i++) n += levels[i].differences.length;
    return n;
  }

  /* The one picking rule, shared by mouse clicks and the self-test: a pick
     lands on the nearest still-hidden difference inside its radius (with a
     floor of 24 scene units, so small details stay clickable). */
  function handlePick(x, y) {
    if (!state.playing) return 'idle';
    var best = null;
    var bestDist = Infinity;
    var diffs = level().differences;
    for (var i = 0; i < diffs.length; i++) {
      var d = diffs[i];
      if (state.found.has(d.id)) continue;
      var dist = Math.hypot(x - d.x, y - d.y);
      if (dist <= Math.max(d.r, 24) && dist < bestDist) {
        best = d;
        bestDist = dist;
      }
    }
    if (best) {
      state.found.add(best.id);
      state.score += 100;
      if (state.pulseId === best.id) state.pulseId = null;
      audio.find();
      setToast('Found: ' + best.label + '.');
      render();
      updateHud();
      if (state.found.size === diffs.length) onLevelComplete();
      return 'found';
    }
    state.score = Math.max(0, state.score - 25);
    state.timeLeft = Math.max(0, state.timeLeft - 5);
    audio.miss();
    setToast('Nothing there — 5 seconds slip away.');
    render();
    updateHud();
    if (state.timeLeft <= 0 && state.playing) onTimeUp();
    return 'miss';
  }

  function useHint() {
    if (!state.playing || state.hintsLeft <= 0) return false;
    var remaining = level().differences.filter(function (d) { return !state.found.has(d.id); });
    if (!remaining.length) return false;
    var pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - 30);
    state.pulseId = pick.id;
    state.pulsePhase = null;
    state.pulseUntil = performance.now() + 1600;
    audio.hint();
    setToast('A hint shimmers around ' + pick.label + '…');
    updateHud();
    runPulse();
    return true;
  }

  function runPulse() {
    if (pulseRaf) return;
    var step = function () {
      render();
      if (state.pulseId && performance.now() < state.pulseUntil) {
        pulseRaf = requestAnimationFrame(step);
      } else {
        pulseRaf = 0;
        state.pulseId = null;
        render();
      }
    };
    pulseRaf = requestAnimationFrame(step);
  }

  function drawMarkers(ctx) {
    var diffs = level().differences;
    for (var i = 0; i < diffs.length; i++) {
      var d = diffs[i];
      if (state.found.has(d.id)) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(232, 163, 61, 0.95)';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 248, 234, 0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        var cx = d.x + d.r * 0.52;
        var cy = d.y - d.r * 0.52;
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#e8a33d';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 4.5, cy);
        ctx.lineTo(cx - 1.2, cy + 3.6);
        ctx.lineTo(cx + 5, cy - 3.8);
        ctx.strokeStyle = '#fff8ea';
        ctx.lineWidth = 2.4;
        ctx.stroke();
      } else if (state.pulseId === d.id) {
        var phase = (state.frozen && typeof state.pulsePhase === 'number')
          ? state.pulsePhase
          : 1 - Math.max(0, state.pulseUntil - performance.now()) / 1600;
        var rr = d.r * (0.8 + phase * 0.9);
        ctx.beginPath();
        ctx.arc(d.x, d.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 214, 110, ' + (0.95 - phase * 0.7) + ')';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
  }

  function render() {
    var paint = painters[level().scene];
    var allIds = new Set(level().differences.map(function (d) { return d.id; }));
    var leftCtx = els.panelLeft.getContext('2d');
    var rightCtx = els.panelRight.getContext('2d');
    paint(leftCtx, W, H, new Set());
    paint(rightCtx, W, H, allIds);
    drawMarkers(leftCtx);
    drawMarkers(rightCtx);
  }

  function updateHud() {
    var total = level().differences.length;
    var foundCount = state.found.size;
    els.hudLevel.textContent = (state.levelIndex + 1) + ' · ' + level().name;
    els.hudFound.textContent = foundCount + ' of ' + total + ' found';
    var remain = total - foundCount;
    els.hudRemain.textContent = remain + ' to go';
    els.hudRemain.classList.toggle('low', remain > 0 && state.timeLeft < 30);
    els.hudScore.textContent = state.score;
    els.hudHints.textContent = state.hintsLeft;
    els.hudTime.textContent = formatTime(state.timeLeft);
    var pct = Math.max(0, Math.min(100, state.timeLeft / level().seconds * 100));
    els.timerBar.style.width = pct + '%';
    els.timerBar.classList.toggle('low', state.timeLeft < 30);
    els.btnHint.disabled = !state.playing || state.hintsLeft <= 0;
  }

  function setToast(text) { els.toast.textContent = text; }

  function showOverlay(title, text, buttonLabel, action) {
    els.ovTitle.textContent = title;
    els.ovText.textContent = text;
    els.ovButton.textContent = buttonLabel;
    els.ovButton.onclick = function () {
      audio.unlock();
      action();
    };
    els.overlay.classList.remove('hidden');
  }

  function hideOverlay() { els.overlay.classList.add('hidden'); }

  function canvasPickHandler(canvas) {
    return function (ev) {
      var rect = canvas.getBoundingClientRect();
      var x = (ev.clientX - rect.left) / rect.width * W;
      var y = (ev.clientY - rect.top) / rect.height * H;
      var result = handlePick(x, y);
      if (result === 'miss') {
        var figure = canvas.closest('.panel');
        figure.classList.remove('shake');
        void figure.offsetWidth;
        figure.classList.add('shake');
      }
    };
  }

  /* Screenshot and self-test hooks, driven by the URL hash. A shot freezes a
     real mid-game state (the same render path as play); the test plays the
     whole game through handlePick, exactly as clicks do. */
  function hashParams() {
    var out = {};
    var raw = location.hash.replace(/^#/, '');
    raw.split('&').forEach(function (pair) {
      if (!pair) return;
      var kv = pair.split('=');
      out[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
    return out;
  }

  function setupShot(params) {
    var index = Math.min(levels.length - 1, Math.max(0, parseInt(params.shot || '1', 10) - 1));
    state.levelIndex = index;
    state.found = new Set((params.found || '').split(',').filter(Boolean));
    state.score = parseInt(params.score || '0', 10);
    state.scoreAtLevelStart = state.score;
    state.hintsLeft = Math.max(0, level().hints - (params.hint === 'used' ? 1 : 0));
    state.timeLeft = params.time ? parseInt(params.time, 10) : level().seconds;
    state.playing = false;
    state.frozen = true;
    if (params.pulse) {
      state.pulseId = params.pulse;
      state.pulsePhase = 0.45;
    }
    if (params.overlay === 'win') {
      state.found = new Set(level().differences.map(function (d) { return d.id; }));
      showOverlay(
        'Every vista matched!',
        'You found all ' + totalDifferences() + ' differences across the three pictures. Final score ' + state.score + '.',
        'Play again',
        function () { startLevel(0, false); }
      );
    } else if (params.overlay === 'level') {
      showOverlay(
        level().name + ' — complete!',
        'Every difference found. Score ' + state.score + '.',
        'Next: ' + levels[Math.min(levels.length - 1, index + 1)].name,
        function () { startLevel(Math.min(levels.length - 1, index + 1), true); }
      );
    } else {
      hideOverlay();
    }
    render();
    updateHud();
  }

  function runSelfTest() {
    var failures = [];
    function expect(cond, message) { if (!cond) failures.push(message); }
    state = newRun();
    for (var li = 0; li < levels.length; li++) {
      startLevel(li, li > 0);
      var diffs = level().differences;
      var before = state.found.size;
      for (var di = 0; di < diffs.length; di++) {
        var res = handlePick(diffs[di].x, diffs[di].y);
        expect(res === 'found', 'level ' + (li + 1) + ' pick ' + diffs[di].id + ' -> ' + res);
      }
      expect(state.found.size === before + diffs.length, 'level ' + (li + 1) + ' all found');
      if (li + 1 < levels.length) {
        expect(state.playing === false, 'level ' + (li + 1) + ' completion stops play');
      }
    }
    expect(!els.overlay.classList.contains('hidden'), 'final overlay shown');
    /* A wrong pick and a hint on a fresh level. */
    startLevel(0, false);
    expect(handlePick(6, 384) === 'miss', 'corner pick is a miss');
    expect(useHint() === true, 'hint fires');
    expect(state.pulseId !== null, 'hint sets a pulse');
    var verdict = failures.length ? 'TEST FAIL: ' + failures.join('; ') : 'TEST PASS';
    $('testResult').textContent = verdict;
    document.title = verdict + ' — Twin Vistas';
  }

  function init() {
    els = {
      panelLeft: $('panelLeft'),
      panelRight: $('panelRight'),
      hudLevel: $('hudLevel'),
      hudFound: $('hudFound'),
      hudRemain: $('hudRemain'),
      hudScore: $('hudScore'),
      hudHints: $('hudHints'),
      hudTime: $('hudTime'),
      timerBar: $('timerBar'),
      toast: $('toast'),
      overlay: $('overlay'),
      ovTitle: $('ovTitle'),
      ovText: $('ovText'),
      ovButton: $('ovButton'),
      btnHint: $('btnHint'),
      btnRestart: $('btnRestart')
    };
    state = newRun();
    els.panelLeft.addEventListener('click', canvasPickHandler(els.panelLeft));
    els.panelRight.addEventListener('click', canvasPickHandler(els.panelRight));
    els.btnHint.addEventListener('click', function () { audio.unlock(); useHint(); });
    els.btnRestart.addEventListener('click', function () { startLevel(state.levelIndex, true); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'h' || ev.key === 'H') { audio.unlock(); useHint(); }
      if (ev.key === 'r' || ev.key === 'R') startLevel(state.levelIndex, true);
      if ((ev.key === 'Enter' || ev.key === ' ') && !els.overlay.classList.contains('hidden')) {
        ev.preventDefault();
        els.ovButton.click();
      }
    });

    var params = hashParams();
    if (params.test !== undefined) {
      runSelfTest();
      return;
    }
    if (params.shot !== undefined) {
      setupShot(params);
      return;
    }
    state.levelIndex = 0;
    state.found = new Set();
    state.hintsLeft = levels[0].hints;
    state.timeLeft = levels[0].seconds;
    render();
    updateHud();
    showOverlay(
      'Twin Vistas',
      'Two pictures, a handful of quiet changes. Click each difference you spot — in either picture — before the light runs out. Three scenes, twenty-one differences, one score.',
      'Start with Lantern Bay',
      function () { startLevel(0, false); }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
