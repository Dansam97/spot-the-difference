// Twin Vistas — hand-in program for the make.fun spot-the-difference bounty.
//
// The game itself is the static site in game/ (open game/index.html in a
// desktop browser, no server or network needed). This program is only the
// courier: it copies game/ and screenshots/ into the output directory and
// writes dossier.json there with the vendored make.fun library, so the
// dossier is byte for byte the one the scorer rebuilds from the same files.
//
// Run it the way the grader does (output defaults to /output), or locally:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's published caps for this bounty: the dossier text budget, the
// screenshot count and size limits, and the game/ file budget. Anything past
// them is an entry the scorer would refuse, so the dossier is built with the
// same numbers.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn(): void {
  const repoDir = fileURLToPath(new URL('.', import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });

  const shotsDir = join(outDir, 'screenshots');
  mkdirSync(shotsDir, { recursive: true });
  const localShots = join(repoDir, 'screenshots');
  if (existsSync(localShots)) {
    cpSync(localShots, shotsDir, { recursive: true });
  }

  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  // A one-line receipt on stdout: handy in a log, ignored by the scorer.
  const shotCount = readdirSync(shotsDir).length;
  console.log(`Twin Vistas handed in: game/ and ${shotCount} screenshot(s) copied, dossier.json ${dossier.length} bytes.`);
}

handIn();
