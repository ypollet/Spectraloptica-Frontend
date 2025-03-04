import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as math from 'mathjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function degreesToRad(deg: number) {
  return (deg * math.pi) / 180.0;
}

export function radToDegrees(rad: number) {
  return (rad * 180.0) / math.pi;
}

export function componentToHex(c : number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r : number, g : number, b : number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// https://academo.org/demos/wavelength-to-colour-relationship/
export function nmToRGB(wavelength: number) {
  var Gamma = 0.80,
    IntensityMax = 255,
    factor, red, green, blue;
  if ((wavelength >= 380) && (wavelength < 440)) {
    red = -(wavelength - 440) / (440 - 380);
    green = 0.0;
    blue = 1.0;
  } else if ((wavelength >= 440) && (wavelength < 490)) {
    red = 0.0;
    green = (wavelength - 440) / (490 - 440);
    blue = 1.0;
  } else if ((wavelength >= 490) && (wavelength < 510)) {
    red = 0.0;
    green = 1.0;
    blue = -(wavelength - 510) / (510 - 490);
  } else if ((wavelength >= 510) && (wavelength < 580)) {
    red = (wavelength - 510) / (580 - 510);
    green = 1.0;
    blue = 0.0;
  } else if ((wavelength >= 580) && (wavelength < 645)) {
    red = 1.0;
    green = -(wavelength - 645) / (645 - 580);
    blue = 0.0;
  } else if ((wavelength >= 645) && (wavelength < 781)) {
    red = 1.0;
    green = 0.0;
    blue = 0.0;
  } else {
    red = 0.0;
    green = 0.0;
    blue = 0.0;
  };
  // Let the intensity fall off near the vision limits
  if ((wavelength >= 380) && (wavelength < 420)) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if ((wavelength >= 420) && (wavelength < 701)) {
    factor = 1.0;
  } else if ((wavelength >= 701) && (wavelength < 781)) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  } else {
    factor = 0.0;
  };
  if (red !== 0) {
    red = Math.round(IntensityMax * Math.pow(red * factor, Gamma));
  }
  if (green !== 0) {
    green = Math.round(IntensityMax * Math.pow(green * factor, Gamma));
  }
  if (blue !== 0) {
    blue = Math.round(IntensityMax * Math.pow(blue * factor, Gamma));
  }
  return [red, green, blue];
}

export enum Scale {
    px = 1,
    m = 1000,
    dm = 100,
    cm = 10,
    mm = 1,
    µm = 0.001,
    nm = 0.000001,
}


export const ZOOM_MIN = 0.1
export const ZOOM_MAX = 4
export const DOT_RADIUS = 4.5
export const SPACE_TARGET = 0.2

