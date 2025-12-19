import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { isPortListening } from '../../../src/utils/check-port';

describe('check-port', () => {
  describe('isPortListening', () => {
    it('should return true when port is listening', async () => {
      // Create a test server
      const server = createServer();
      await new Promise<void>((resolve) => {
        server.listen(0, () => resolve());
      });

      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;

      try {
        const result = await isPortListening(port);
        expect(result).toBe(true);
      } finally {
        server.close();
      }
    });

    it('should return false when port is not listening', async () => {
      // Use a port that's very unlikely to be in use
      const result = await isPortListening(54321);
      expect(result).toBe(false);
    });

    it('should timeout quickly for non-listening ports', async () => {
      const startTime = Date.now();
      await isPortListening(54322, 'localhost', 500);
      const duration = Date.now() - startTime;

      // Should timeout around 500ms, give it some buffer
      expect(duration).toBeLessThan(1000);
    });

    it('should handle different hosts', async () => {
      const result = await isPortListening(54323, '127.0.0.1');
      expect(result).toBe(false);
    });
  });
});
