import { createProxyMiddleware } from 'http-proxy-middleware';
import type { IncomingMessage } from 'node:http';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: vi.fn(),
}));

vi.mock('../../../src/config', () => ({
  configResolver: {
    getConfig: vi.fn(),
  },
}));

describe('proxy', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('pathFilter', () => {
    let pathFilter: (pathname: string, req: IncomingMessage) => boolean;

    beforeEach(async () => {
      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      pathFilter = callArgs!.pathFilter as (
        pathname: string,
        req: IncomingMessage,
      ) => boolean;
    });

    it('should not proxy requests to /stagewise-toolbar-app', () => {
      const req = { headers: {} } as unknown as IncomingMessage;
      const result = pathFilter('/stagewise-toolbar-app/index.html', req);
      expect(result).toBe(false);
    });

    it('should not proxy requests with sec-fetch-dest: document', () => {
      const req = {
        headers: { 'sec-fetch-dest': 'document' },
      } as unknown as IncomingMessage;
      const result = pathFilter('/any-path', req);
      expect(result).toBe(false);
    });

    it('should proxy regular API requests', () => {
      const req = {
        headers: { 'sec-fetch-dest': 'empty' },
      } as unknown as IncomingMessage;
      const result = pathFilter('/api/data', req);
      expect(result).toBe(true);
    });

    it('should proxy requests without sec-fetch-dest header', () => {
      const req = { headers: {} } as unknown as IncomingMessage;
      const result = pathFilter('/api/data', req);
      expect(result).toBe(true);
    });

    it('should proxy WebSocket requests', () => {
      const req = {
        headers: {
          upgrade: 'websocket',
          connection: 'Upgrade',
        },
      } as unknown as IncomingMessage;
      const result = pathFilter('/ws', req);
      expect(result).toBe(true);
    });
  });

  describe('target function', () => {
    it('should return correct target URL based on config', async () => {
      const { configResolver } = await import('../../../src/config');
      vi.mocked(configResolver.getConfig).mockReturnValue({
        port: 3100,
        appPort: 3000,
        dir: '/test',
        silent: false,
        verbose: false,
        bridgeMode: false,
        autoPlugins: false,
        plugins: [],
        token: undefined,
      } as any);

      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      const targetFn = callArgs!.router as () => string;

      const result = targetFn();
      expect(result).toBe('http://localhost:3000');
    });

    it('should update target URL when config changes', async () => {
      const { configResolver } = await import('../../../src/config');

      // Initial config
      vi.mocked(configResolver.getConfig).mockReturnValue({
        port: 3100,
        appPort: 3000,
        dir: '/test',
        silent: false,
        verbose: false,
        bridgeMode: false,
        autoPlugins: false,
        plugins: [],
        token: undefined,
      } as any);

      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      const targetFn = callArgs!.router as () => string;

      expect(targetFn()).toBe('http://localhost:3000');

      // Change config
      vi.mocked(configResolver.getConfig).mockReturnValue({
        port: 3100,
        appPort: 4000,
        dir: '/test',
        silent: false,
        verbose: false,
        bridgeMode: false,
        autoPlugins: false,
        plugins: [],
        token: undefined,
      } as any);

      expect(targetFn()).toBe('http://localhost:4000');
    });
  });

  describe('proxy options', () => {
    it('should disable WebSocket proxying (handled manually)', async () => {
      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs!.ws).toBe(false);
    });

    it('should enable changeOrigin', async () => {
      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs!.changeOrigin).toBe(true);
    });

    it('should configure cookie domain rewrite', async () => {
      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs!.cookieDomainRewrite).toEqual({ '*': '' });
    });

    it('should enable auto rewrite', async () => {
      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs!.autoRewrite).toBe(true);
    });

    it('should preserve header key case', async () => {
      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs!.preserveHeaderKeyCase).toBe(true);
    });

    it('should enable X-Forwarded headers', async () => {
      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs!.xfwd).toBe(true);
    });
  });

  describe('error handler', () => {
    let errorHandler: (err: Error, req: any, res: any) => void;

    beforeEach(async () => {
      const { configResolver } = await import('../../../src/config');
      vi.mocked(configResolver.getConfig).mockReturnValue({
        port: 3100,
        appPort: 3000,
        dir: '/test',
        silent: false,
        verbose: false,
        bridgeMode: false,
        autoPlugins: false,
        plugins: [],
        token: undefined,
      } as any);

      await import('../../../src/server/proxy');
      const callArgs = vi.mocked(createProxyMiddleware).mock.calls[0]?.[0];
      expect(callArgs?.on?.error).toBeDefined();
      errorHandler = callArgs!.on!.error as any;
    });

    it('should handle error when response has writeHead method', () => {
      const err = new Error('socket hang up');
      const req = {} as any;
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      } as any;

      errorHandler(err, req, res);

      expect(res.writeHead).toHaveBeenCalledWith(503, {
        'Content-Type': 'text/html',
      });
      expect(res.end).toHaveBeenCalled();
    });

    it('should not crash when response lacks writeHead method', () => {
      const err = new Error('socket hang up');
      const req = {} as any;
      const res = {} as any; // No writeHead method

      // Should not throw
      expect(() => errorHandler(err, req, res)).not.toThrow();
    });

    it('should not write when headers already sent', () => {
      const err = new Error('socket hang up');
      const req = {} as any;
      const res = {
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: true, // Headers already sent
      } as any;

      errorHandler(err, req, res);

      expect(res.writeHead).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
    });

    it('should handle null/undefined response gracefully', () => {
      const err = new Error('socket hang up');
      const req = {} as any;

      // Should not throw with null or undefined response
      expect(() => errorHandler(err, req, null as any)).not.toThrow();
      expect(() => errorHandler(err, req, undefined as any)).not.toThrow();
    });
  });});