import { describe, it, expect, beforeEach } from 'vitest';
import { worldPerPixel, distanceForSize } from './projection';
import type { PerspectiveCamera } from 'three';

describe('projection', () => {
  // Nothing to construct and nothing to mock: the maths needs a field of
  // view and a viewport height, so that is all the test supplies.
  const FOV = 70;
  const HEIGHT = 1000; // a round viewport, so the arithmetic is checkable
  const camera = { fov: FOV } as PerspectiveCamera;

  beforeEach(() => {
    window.innerHeight = HEIGHT;
  });

  describe('worldPerPixel', () => {
    it('measures a pixel against the camera frustum at that distance', () => {
      const frustumHeight = 2 * Math.tan((FOV * Math.PI / 180) / 2);
      expect(worldPerPixel(camera, 1)).toBeCloseTo(frustumHeight / HEIGHT, 10);
    });

    it('grows in proportion to distance', () => {
      expect(worldPerPixel(camera, 20)).toBeCloseTo(worldPerPixel(camera, 5) * 4, 10);
    });

    it('makes a pixel cover more world on a shorter viewport', () => {
      const tall = worldPerPixel(camera, 10);
      window.innerHeight = HEIGHT / 2;
      expect(worldPerPixel(camera, 10)).toBeCloseTo(tall * 2, 10);
    });
  });

  describe('distanceForSize', () => {
    it('returns the distance at which the thing does measure that many pixels', () => {
      // The round trip is the whole contract: put something 2 units across
      // at this distance and it covers 90 pixels.
      const distance = distanceForSize(camera, 2, 90);
      expect(2 / worldPerPixel(camera, distance)).toBeCloseTo(90, 6);
    });

    it('puts a bigger thing further away to look the same size', () => {
      expect(distanceForSize(camera, 2, 90)).toBeCloseTo(distanceForSize(camera, 1, 90) * 2, 10);
    });

    it('brings a thing nearer to make it look bigger', () => {
      expect(distanceForSize(camera, 1, 180)).toBeCloseTo(distanceForSize(camera, 1, 90) / 2, 10);
    });
  });
});
