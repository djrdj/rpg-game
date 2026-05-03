// Type declarations for KaPlay v4 extensions and polyfills

import type { KAPLAYCtx } from "kaplay";

declare module "kaplay" {
  interface KAPLAYCtx {
    cursor(style: string): any;
  }
  
  interface GameObj {
    onHover(cb: () => void): void;
    onHoverEnd(cb: () => void): void;
    onClick(cb: () => void): void;
    color(r: number, g: number, b: number): void;
    outline(width: number, color?: [number, number, number]): void;
  }
}
