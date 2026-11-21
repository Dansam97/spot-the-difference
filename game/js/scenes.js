/* Twin Vistas — the three picture painters.
   Every scene is drawn from scratch with canvas shapes: no image files, no
   network. A painter receives the set of difference ids that are "changed"
   in its panel; the original panel is painted with an empty set and the
   changed panel with the level's full set, so the two pictures can never
   drift apart anywhere the level does not intend. */
(function () {
  'use strict';

  /* Deterministic little random generator, so the stars, waves and cobbles
     land in exactly the same place on every load and in both panels. */
  function seededRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function circle(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function ellipse(ctx, x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function rect(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  function triangle(ctx, x1, y1, x2, y2, x3, y3, fill) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function polygon(ctx, points, fill) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function line(ctx, x1, y1, x2, y2, stroke, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function verticalGradient(ctx, W, H, stops) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return g;
  }

  function starField(ctx, seed, count, maxY, colour) {
    var rand = seededRandom(seed);
    for (var i = 0; i < count; i++) {
      var x = rand() * 520;
      var y = rand() * maxY;
      var r = 0.8 + rand() * 1.4;
      ctx.globalAlpha = 0.35 + rand() * 0.6;
      circle(ctx, x, y, r, colour);
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------ */
  /* Level 1 — Lantern Bay: a lighthouse harbour at dusk.                */
  /* ------------------------------------------------------------------ */
  function paintBay(ctx, W, H, diffs) {
    verticalGradient(ctx, W, H, [[0, '#1d2a52'], [0.45, '#4a3a63'], [0.64, '#c96f3f'], [0.66, '#274b6d'], [1, '#142639']]);
    starField(ctx, 7101, 44, 170, '#ffeec2');

    /* The moon: a crescent in the original, a full disc in the changed one. */
    circle(ctx, 452, 56, 27, '#f5ead2');
    circle(ctx, 444, 48, 5, '#e3d3ae');
    circle(ctx, 460, 66, 3.5, '#e3d3ae');
    if (!diffs.has('moon')) {
      circle(ctx, 438, 47, 23, '#232f58');
      circle(ctx, 436, 45, 22, '#26335e');
    }

    /* Headland and shore line. */
    polygon(ctx, [[330, 258], [392, 214], [452, 226], [520, 204], [520, 258]], '#1c2438');
    polygon(ctx, [[0, 258], [60, 236], [130, 250], [210, 258]], '#1c2438');

    /* Sea shimmer: short dashes, denser under the moon. */
    var rand = seededRandom(4242);
    ctx.strokeStyle = 'rgba(214, 232, 244, 0.35)';
    ctx.lineWidth = 2;
    for (var i = 0; i < 42; i++) {
      var wx = rand() * W;
      var wy = 272 + rand() * 104;
      var len = 8 + rand() * 20;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + len, wy);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(245, 234, 210, 0.5)';
    for (var m = 0; m < 7; m++) {
      var mx = 436 + rand() * 30;
      var my = 268 + m * 16;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + 16, my);
      ctx.stroke();
    }

    /* Lighthouse rock and tower. */
    polygon(ctx, [[88, 300], [104, 262], [188, 262], [206, 300]], '#10151f');
    polygon(ctx, [[124, 264], [132, 128], [160, 128], [168, 264]], '#e8e2d2');
    polygon(ctx, [[128.5, 216], [163.5, 216], [161, 190], [131, 190]], '#c8452c');
    polygon(ctx, [[133, 158], [159, 158], [157.5, 136], [134.5, 136]], '#c8452c');
    rect(ctx, 126, 118, 40, 10, '#2c2c34');
    triangle(ctx, 122, 118, 170, 118, 146, 96, '#2c2c34');
    /* The lamp: lit with a beam in the original, dark in the changed one. */
    if (diffs.has('lamp')) {
      rect(ctx, 136, 98, 20, 20, '#3a3f4a');
    } else {
      var glow = ctx.createRadialGradient(146, 108, 2, 146, 108, 60);
      glow.addColorStop(0, 'rgba(255, 205, 92, 0.85)');
      glow.addColorStop(1, 'rgba(255, 205, 92, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(86, 48, 120, 120);
      polygon(ctx, [[156, 102], [330, 74], [330, 128], [156, 114]], 'rgba(255, 214, 110, 0.16)');
      rect(ctx, 136, 98, 20, 20, '#ffcd5c');
      circle(ctx, 146, 108, 5, '#fff3cf');
    }

    /* Two cottages on the right shore. */
    function cottage(x, y, wall, roof) {
      rect(ctx, x, y, 64, 46, wall);
      polygon(ctx, [[x - 6, y], [x + 70, y], [x + 32, y - 24]], roof);
      rect(ctx, x + 44, y - 18, 9, 16, '#5a4632');
      rect(ctx, x + 26, y + 18, 13, 28, '#5a4632');
    }
    cottage(352, 212, '#e6d7bd', '#37455e');
    cottage(432, 216, '#dcb8a4', '#4e3436');
    rect(ctx, 362, 224, 12, 12, '#ffca66'); /* first cottage window: always lit */
    /* Second cottage window: lit in the original, dark in the changed one. */
    rect(ctx, 442, 228, 12, 12, diffs.has('window') ? '#39404e' : '#ffca66');

    /* Sailboat in the middle of the bay. */
    polygon(ctx, [[262, 322], [338, 322], [324, 340], [276, 340]], '#7a4a28');
    rect(ctx, 297, 252, 4, 70, '#5a4632');
    /* The sail: cream in the original, coral in the changed one. */
    var sailColour = diffs.has('sail') ? '#e4572e' : '#f2e7c8';
    triangle(ctx, 303, 256, 303, 318, 336, 318, sailColour);
    triangle(ctx, 295, 262, 295, 318, 272, 318, '#e8dcc0');
    triangle(ctx, 301, 244, 301, 254, 314, 254, '#c8452c');

    /* A small rowboat, bottom left. */
    polygon(ctx, [[38, 344], [104, 344], [92, 358], [50, 358]], '#4e5d3a');
    line(ctx, 58, 336, 84, 350, '#8a6f4d', 3);

    /* The buoy: riding the swell in the original, gone in the changed one. */
    if (!diffs.has('buoy')) {
      polygon(ctx, [[344, 336], [368, 336], [362, 322], [350, 322]], '#d64541');
      rect(ctx, 350, 330, 12, 5, '#f2e7c8');
      rect(ctx, 354, 312, 4, 10, '#8c8c94');
      circle(ctx, 356, 310, 3.5, '#ffca66');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Level 2 — Fernwood Hollow: a forest clearing in the afternoon.     */
  /* ------------------------------------------------------------------ */
  function paintHollow(ctx, W, H, diffs) {
    verticalGradient(ctx, W, H, [[0, '#a8d8ea'], [0.42, '#dff2dc'], [0.46, '#79b657'], [1, '#4e7d33']]);

    /* Sun and drifting glow motes. */
    var sunGlow = ctx.createRadialGradient(66, 54, 4, 66, 54, 74);
    sunGlow.addColorStop(0, 'rgba(255, 240, 170, 0.95)');
    sunGlow.addColorStop(1, 'rgba(255, 240, 170, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, 150, 140);
    circle(ctx, 66, 54, 20, '#ffedb0');
    /* The motes: floating over the clearing in the original only. */
    if (!diffs.has('fireflies')) {
      var motes = [[88, 74], [112, 96], [70, 108], [126, 62], [100, 44], [58, 84]];
      for (var i = 0; i < motes.length; i++) {
        circle(ctx, motes[i][0], motes[i][1], 5, 'rgba(255, 246, 180, 0.35)');
        circle(ctx, motes[i][0], motes[i][1], 2.2, '#fff7ae');
      }
    }

    /* Tree line: layered canopies behind the clearing. */
    function canopyTree(x, baseY, s, tone) {
      rect(ctx, x - 5 * s, baseY - 62 * s, 10 * s, 62 * s, '#6b4a2c');
      circle(ctx, x, baseY - 84 * s, 30 * s, tone);
      circle(ctx, x - 22 * s, baseY - 62 * s, 21 * s, tone);
      circle(ctx, x + 22 * s, baseY - 62 * s, 21 * s, tone);
    }
    canopyTree(38, 210, 1.05, '#3e6b2f');
    canopyTree(120, 196, 0.85, '#4c7d3a');
    canopyTree(300, 192, 0.95, '#3e6b2f');
    canopyTree(392, 200, 0.8, '#578a42');
    canopyTree(486, 208, 1.0, '#4c7d3a');

    /* The great oak on the left, with the owl's branch. */
    polygon(ctx, [[128, 268], [140, 168], [152, 168], [164, 268]], '#5d3f24');
    line(ctx, 148, 196, 196, 168, '#5d3f24', 9);
    line(ctx, 146, 220, 108, 196, '#5d3f24', 7);
    circle(ctx, 146, 138, 52, '#3a6329');
    circle(ctx, 104, 158, 34, '#477636');
    circle(ctx, 190, 156, 34, '#477636');
    circle(ctx, 146, 108, 30, '#527f3d');

    /* The owl: sitting on the branch in the original, flown away in the changed one. */
    if (!diffs.has('owl')) {
      ellipse(ctx, 168, 142, 13, 17, '#8a6844');
      circle(ctx, 168, 126, 11, '#a37f52');
      circle(ctx, 163, 124, 5.5, '#f2e7c8');
      circle(ctx, 173, 124, 5.5, '#f2e7c8');
      circle(ctx, 163, 124, 2.4, '#2b2118');
      circle(ctx, 173, 124, 2.4, '#2b2118');
      triangle(ctx, 168, 130, 165, 127, 171, 127, '#e8a33d');
      triangle(ctx, 157, 118, 152, 108, 162, 114, '#8a6844');
      triangle(ctx, 179, 118, 184, 108, 174, 114, '#8a6844');
    }

    /* Winding path through the clearing. */
    polygon(ctx, [[238, 390], [268, 300], [258, 252], [284, 252], [292, 300], [322, 390]], '#cbb98a');

    /* Mushroom cluster, bottom left. The big cap changes colour. */
    function mushroom(x, y, s, cap) {
      rect(ctx, x - 4 * s, y - 10 * s, 8 * s, 12 * s, '#efe6d0');
      ellipse(ctx, x, y - 12 * s, 15 * s, 8 * s, cap);
      circle(ctx, x - 5 * s, y - 14 * s, 2.2 * s, '#ffffff');
      circle(ctx, x + 4 * s, y - 11 * s, 1.8 * s, '#ffffff');
    }
    mushroom(96, 330, 1.5, diffs.has('shroom') ? '#7d5ba6' : '#d64541');
    mushroom(66, 342, 0.9, '#d64541');
    mushroom(126, 344, 0.75, '#e07b39');
    /* One more mushroom, on the pond side: only in the changed picture. */
    if (diffs.has('extra-shroom')) mushroom(318, 330, 1.0, '#3f7fbf');

    /* The pond, bottom right, with reeds and lily pads. */
    ellipse(ctx, 418, 336, 92, 40, '#7fc4de');
    ellipse(ctx, 418, 332, 92, 38, '#a5d8ec');
    var reedXs = [338, 350, 486, 496];
    for (var r = 0; r < reedXs.length; r++) {
      line(ctx, reedXs[r], 336, reedXs[r] - 4, 300, '#4e7d33', 3);
      ellipse(ctx, reedXs[r] - 4, 296, 4, 9, '#8a6844');
    }
    ellipse(ctx, 388, 344, 13, 5, '#4e9b47');
    ellipse(ctx, 452, 352, 10, 4, '#4e9b47');
    circle(ctx, 452, 348, 4, '#f2a7c3');
    /* The duck: paddling in the original, gone in the changed one. */
    if (!diffs.has('duck')) {
      ellipse(ctx, 408, 322, 15, 9, '#ffffff');
      circle(ctx, 420, 312, 7, '#ffffff');
      triangle(ctx, 426, 312, 433, 314, 426, 316, '#e8a33d');
      circle(ctx, 421, 311, 1.6, '#2b2118');
      ellipse(ctx, 402, 320, 7, 4, '#dfe9ee');
    }

    /* The fox, sitting right of the path. Its tail tip changes colour. */
    ellipse(ctx, 448, 286, 17, 22, '#dd7f33');
    circle(ctx, 448, 258, 13, '#e58e42');
    triangle(ctx, 437, 250, 433, 236, 445, 244, '#e58e42');
    triangle(ctx, 459, 250, 463, 236, 451, 244, '#e58e42');
    circle(ctx, 443, 257, 2.2, '#2b2118');
    circle(ctx, 453, 257, 2.2, '#2b2118');
    ellipse(ctx, 448, 264, 4.5, 3, '#2b2118');
    ellipse(ctx, 448, 292, 10, 12, '#f2e7c8');
    /* Tail curled round its feet. */
    ctx.beginPath();
    ctx.arc(472, 300, 14, Math.PI * 0.1, Math.PI * 1.25);
    ctx.strokeStyle = '#dd7f33';
    ctx.lineWidth = 10;
    ctx.stroke();
    circle(ctx, 461, 290, 6.5, diffs.has('tail') ? '#dd7f33' : '#ffffff');

    /* Flower patch at the path's edge: pink in the original, yellow in the changed one. */
    var flowerColour = diffs.has('flowers') ? '#f2c531' : '#ef7fae';
    var flowers = [[240, 352], [256, 362], [272, 350], [288, 360], [264, 342], [248, 372], [282, 374]];
    for (var f = 0; f < flowers.length; f++) {
      line(ctx, flowers[f][0], flowers[f][1] + 8, flowers[f][0], flowers[f][1], '#4e7d33', 2);
      circle(ctx, flowers[f][0], flowers[f][1], 4.5, flowerColour);
      circle(ctx, flowers[f][0], flowers[f][1], 1.8, '#fff3cf');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Level 3 — Clockwork Market: a street fair at dusk.                 */
  /* ------------------------------------------------------------------ */
  function paintMarket(ctx, W, H, diffs) {
    verticalGradient(ctx, W, H, [[0, '#2e2a55'], [0.5, '#7a4460'], [0.68, '#c96f3f'], [0.7, '#6e5136'], [1, '#54402a']]);
    starField(ctx, 9090, 26, 120, '#ffeec2');
    circle(ctx, 486, 40, 16, '#f5ead2');
    if (true) circle(ctx, 478, 34, 13, '#37315e');

    /* Rooftops behind the street. */
    polygon(ctx, [[0, 250], [0, 150], [60, 118], [118, 150], [118, 250]], '#3a3350');
    polygon(ctx, [[402, 250], [402, 142], [462, 112], [520, 142], [520, 250]], '#413a58');
    rect(ctx, 24, 176, 16, 20, '#ffca66');
    rect(ctx, 452, 170, 16, 20, '#39404e');

    /* The clock tower, centre back. */
    rect(ctx, 230, 108, 60, 142, '#9b8d7a');
    rect(ctx, 230, 108, 60, 10, '#7d7060');
    polygon(ctx, [[222, 108], [298, 108], [260, 62]], '#4e3436');
    circle(ctx, 260, 76, 4, '#ffca66');
    /* Clock face: three o'clock in the original, twenty past six in the changed one. */
    circle(ctx, 260, 138, 25, '#f7f1de');
    ctx.beginPath();
    ctx.arc(260, 138, 25, 0, Math.PI * 2);
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (var t = 0; t < 12; t++) {
      var ang = t * Math.PI / 6;
      var tx = 260 + Math.cos(ang) * 20;
      var ty = 138 + Math.sin(ang) * 20;
      circle(ctx, tx, ty, 1.4, '#4a3520');
    }
    if (diffs.has('clock')) {
      line(ctx, 260, 138, 268, 152, '#2b2118', 3.5);
      line(ctx, 260, 138, 247, 147, '#2b2118', 2.5);
    } else {
      line(ctx, 260, 138, 276, 138, '#2b2118', 3.5);
      line(ctx, 260, 138, 260, 121, '#2b2118', 2.5);
    }
    /* Bell arch under the clock: a gold bell in the original, an empty dark arch in the changed one. */
    polygon(ctx, [[246, 196], [246, 172], [274, 172], [274, 196]], '#3a3350');
    if (!diffs.has('bell')) {
      polygon(ctx, [[252, 190], [254, 178], [266, 178], [268, 190]], '#e8b64c');
      rect(ctx, 248, 188, 24, 4, '#c47b1e');
      circle(ctx, 260, 195, 3, '#c47b1e');
    }
    rect(ctx, 250, 216, 20, 34, '#5a4632');

    /* Cobblestone street. */
    var cob = seededRandom(1313);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (var row = 0; row < 5; row++) {
      for (var col = 0; col < 12; col++) {
        var cx = 22 + col * 44 + (row % 2) * 20 + cob() * 6;
        var cy = 306 + row * 18;
        ellipse(ctx, cx, cy, 17, 5.5, 'rgba(0, 0, 0, 0.10)');
      }
    }

    /* Bunting strung across the street; one flag is missing in the changed one. */
    ctx.beginPath();
    ctx.moveTo(14, 148);
    ctx.quadraticCurveTo(260, 196, 506, 148);
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 2;
    ctx.stroke();
    var flagColours = ['#d64541', '#e8a33d', '#3f7fbf', '#4e9b47', '#7d5ba6', '#ef7fae', '#f2c531'];
    for (var b = 0; b < 7; b++) {
      if (diffs.has('bunting') && b === 4) continue;
      var bx = 66 + b * 64;
      var by = 168 - Math.abs(b - 3) * -4 - (b === 3 ? 10 : 0) + Math.sin(b / 6 * Math.PI) * -6 + 8;
      by = 160 + Math.round(Math.sin((b + 0.5) / 7 * Math.PI) * -12) + (b % 2) * 3;
      triangle(ctx, bx - 11, by, bx + 11, by, bx, by + 20, flagColours[b]);
    }

    /* A string of lanterns below the bunting. */
    ctx.beginPath();
    ctx.moveTo(30, 196);
    ctx.quadraticCurveTo(260, 232, 490, 196);
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    var lanternX = [86, 158, 260, 362, 434];
    for (var l = 0; l < lanternX.length; l++) {
      var lx = lanternX[l];
      var ly = 214 - Math.round(Math.cos((lx - 260) / 260 * Math.PI / 2) * -8) - 4;
      ly = 206 + Math.round(Math.abs(lx - 260) / 260 * 10);
      var isMiddle = l === 2;
      var lit = !(isMiddle && diffs.has('lantern'));
      if (lit) {
        circle(ctx, lx, ly + 8, 13, 'rgba(255, 202, 102, 0.30)');
        ellipse(ctx, lx, ly + 8, 7, 9, '#ffca66');
      } else {
        ellipse(ctx, lx, ly + 8, 7, 9, '#6b6f7a');
      }
      rect(ctx, lx - 3, ly - 3, 6, 4, '#2b2118');
    }

    /* Left stall: striped awning and a pile of fruit. */
    rect(ctx, 36, 238, 6, 62, '#5a4632');
    rect(ctx, 168, 238, 6, 62, '#5a4632');
    var awningA = diffs.has('awning') ? '#2e8f86' : '#c0392b';
    for (var s = 0; s < 6; s++) {
      polygon(ctx, [[28 + s * 25, 238], [53 + s * 25, 238], [47 + s * 25, 214], [34 + s * 25, 214]], s % 2 ? '#f2e7c8' : awningA);
    }
    rect(ctx, 30, 282, 150, 12, '#7a4a28');
    rect(ctx, 36, 294, 138, 22, '#8a5a30');
    /* The fruit: red apples in the original, oranges in the changed one. */
    var fruitColour = diffs.has('fruit') ? '#ef8f2e' : '#d64541';
    var fruitSpots = [[58, 274], [76, 274], [94, 274], [112, 274], [130, 274], [67, 262], [85, 262], [103, 262], [121, 262], [85, 251], [103, 251]];
    for (var f = 0; f < fruitSpots.length; f++) {
      circle(ctx, fruitSpots[f][0], fruitSpots[f][1], 8, fruitColour);
      line(ctx, fruitSpots[f][0], fruitSpots[f][1] - 8, fruitSpots[f][0] + 2, fruitSpots[f][1] - 12, '#4e7d33', 2);
    }

    /* Balloons tied to the left stall post; one changes colour. */
    line(ctx, 44, 238, 62, 176, '#2b2118', 1.4);
    line(ctx, 44, 238, 40, 172, '#2b2118', 1.4);
    line(ctx, 44, 238, 84, 182, '#2b2118', 1.4);
    circle(ctx, 62, 158, 14, '#d64541');
    circle(ctx, 38, 154, 13, diffs.has('balloon') ? '#4e9b47' : '#f2c531');
    circle(ctx, 86, 164, 13, '#7d5ba6');
    circle(ctx, 57, 152, 4, 'rgba(255,255,255,0.5)');
    circle(ctx, 34, 148, 3.4, 'rgba(255,255,255,0.5)');

    /* Right stall: plain awning, sacks and a barrel. */
    rect(ctx, 346, 238, 6, 62, '#5a4632');
    rect(ctx, 478, 238, 6, 62, '#5a4632');
    polygon(ctx, [[338, 238], [492, 238], [480, 212], [350, 212]], '#5b4a8a');
    rect(ctx, 342, 282, 146, 12, '#7a4a28');
    rect(ctx, 348, 294, 134, 22, '#8a5a30');
    ellipse(ctx, 380, 272, 16, 10, '#cbb98a');
    ellipse(ctx, 412, 272, 16, 10, '#bfae82');
    ellipse(ctx, 452, 270, 15, 13, '#7a4a28');
    line(ctx, 437, 262, 467, 262, '#5a3a1e', 3);
    line(ctx, 437, 279, 467, 279, '#5a3a1e', 3);

    /* Crates stacked past the right stall: three in the original, two in the changed one. */
    function crate(x, y) {
      rect(ctx, x, y, 30, 24, '#a4763f');
      ctx.strokeStyle = '#7a4a28';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 30, 24);
      line(ctx, x, y, x + 30, y + 24, '#7a4a28', 1.6);
      line(ctx, x + 30, y, x, y + 24, '#7a4a28', 1.6);
    }
    crate(478, 316);
    crate(478, 290);
    if (!diffs.has('crates')) crate(478, 264);

    /* The market cat, sitting on a low crate by the right stall: gone in the changed one. */
    if (!diffs.has('cat')) {
      rect(ctx, 428, 250, 34, 10, '#8a5a30');
      ellipse(ctx, 445, 240, 11, 9, '#2e2a33');
      circle(ctx, 445, 228, 8, '#2e2a33');
      triangle(ctx, 438, 223, 436, 214, 444, 220, '#2e2a33');
      triangle(ctx, 452, 223, 454, 214, 446, 220, '#2e2a33');
      circle(ctx, 442, 228, 1.5, '#ffca66');
      circle(ctx, 448, 228, 1.5, '#ffca66');
      ctx.beginPath();
      ctx.arc(458, 246, 8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.strokeStyle = '#2e2a33';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  window.TwinVistasScenes = {
    bay: paintBay,
    hollow: paintHollow,
    market: paintMarket
  };
})();
