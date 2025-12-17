import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { text } from 'node:stream/consumers';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getVersion(): string {
  try {
    // Read package.json to get version
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

function displayAsciiLogo(): void {
  // Define the colors for the shadcn primary color in gradient variations.

  const textArt = [
    '  ▌    ▌     ▌  ▗    ▌▘  ',
    '▛▘▛▌▀▌▛▌▛▘▛▌▐ ▛▘▜▘▌▌▛▌▌▛▌',
    '▄▌▌▌█▌▙▌▙▖▌▌▞ ▄▌▐▖▙▌▙▌▌▙▌',
    '            ▘            ',
  ];

  console.log('');

  // Display logo and text side by side
  for (let i = 0; i < Math.max(text.length, textArt.length); i++) {
    let line = '';

    // Add spacing between logo and text
    line += '    ';

    // Add the text part
    if (i < textArt.length) {
      const textLine = textArt[i]!;
      // Apply gradient color to text as well
      const textColor = chalk.white.bold;
      // gradientColors[i] || gradientColors[gradientColors.length - 1]!;
      line += textColor(textLine);
    }

    console.log(line);
  }

  console.log('');
}

export function printBanner(silent: boolean): void {
  if (silent) {
    return;
  }

  const version = getVersion();

  /**
   * This function logs an ASCII art representation of the logo to the console.
   * It uses chalk to apply a blue and purple gradient, similar to the provided image,
   * with a white-filled center.
   */

  // createAsciiCircle(10, 'W', chalk.blue);
  displayAsciiLogo();
  console.log();
  console.log(
    chalk.hex('#7359D1').bold('     Shadcn/studio IDE EXTENSION') +
      chalk.gray(` v${version}`),
  );
  console.log();
  console.log();
}

export function printCompactBanner(silent: boolean): void {
  if (silent) {
    return;
  }

  const version = getVersion();

  console.log();
  console.log(
    chalk.hex('#7359D1').bold('  Shadcn/studio IDE EXTENSION') +
      chalk.gray(` v${version}`),
  );
  console.log();
}
