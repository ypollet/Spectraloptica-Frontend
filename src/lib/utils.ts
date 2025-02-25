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

