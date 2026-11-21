/* Twin Vistas — the three levels and where their differences hide.
   Coordinates live in the same 520x390 scene space the painters draw in;
   x, y is the middle of the changed detail and r the forgiving click radius
   around it. The label is what the toast announces when the difference is
   found, so a find always tells the player what they spotted. */
(function () {
  'use strict';

  window.TwinVistasLevels = [
    {
      name: 'Lantern Bay',
      scene: 'bay',
      seconds: 150,
      hints: 2,
      intro: 'Dusk over the harbour. Five quiet changes between the two pictures.',
      differences: [
        { id: 'lamp', x: 146, y: 108, r: 30, label: 'the lighthouse lamp' },
        { id: 'moon', x: 452, y: 56, r: 32, label: 'the shape of the moon' },
        { id: 'sail', x: 316, y: 290, r: 30, label: 'the sailboat\u2019s sail' },
        { id: 'window', x: 448, y: 234, r: 20, label: 'the cottage window' },
        { id: 'buoy', x: 356, y: 326, r: 20, label: 'the missing buoy' }
      ]
    },
    {
      name: 'Fernwood Hollow',
      scene: 'hollow',
      seconds: 210,
      hints: 2,
      intro: 'An afternoon clearing in the old forest. Seven changes this time.',
      differences: [
        { id: 'owl', x: 168, y: 130, r: 26, label: 'the owl on the branch' },
        { id: 'fireflies', x: 94, y: 80, r: 32, label: 'the drifting glow motes' },
        { id: 'shroom', x: 96, y: 316, r: 28, label: 'the big mushroom\u2019s cap' },
        { id: 'extra-shroom', x: 318, y: 318, r: 22, label: 'the extra mushroom' },
        { id: 'duck', x: 408, y: 320, r: 22, label: 'the duck on the pond' },
        { id: 'tail', x: 464, y: 294, r: 22, label: 'the fox\u2019s tail tip' },
        { id: 'flowers', x: 264, y: 357, r: 28, label: 'the flower patch' }
      ]
    },
    {
      name: 'Clockwork Market',
      scene: 'market',
      seconds: 270,
      hints: 3,
      intro: 'The evening fair under the clock tower. Nine changes — take your time, but not too much.',
      differences: [
        { id: 'clock', x: 260, y: 138, r: 28, label: 'the clock tower\u2019s hands' },
        { id: 'bell', x: 260, y: 184, r: 22, label: 'the tower bell' },
        { id: 'bunting', x: 322, y: 158, r: 22, label: 'a missing bunting flag' },
        { id: 'lantern', x: 260, y: 214, r: 20, label: 'the middle lantern' },
        { id: 'awning', x: 103, y: 226, r: 34, label: 'the stall awning' },
        { id: 'fruit', x: 94, y: 263, r: 28, label: 'the fruit pile' },
        { id: 'balloon', x: 38, y: 154, r: 20, label: 'a balloon\u2019s colour' },
        { id: 'cat', x: 445, y: 236, r: 24, label: 'the market cat' },
        { id: 'crates', x: 493, y: 290, r: 34, label: 'the stack of crates' }
      ]
    }
  ];
})();
