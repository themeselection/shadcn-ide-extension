import { createConnection } from 'node:net';

/**
 * Check if a port is listening (has something running on it)
 * @param port - The port number to check
 * @param host - The host to check (default: 'localhost')
 * @param timeout - Timeout in milliseconds (default: 1000)
 * @returns Promise that resolves to true if port is listening, false otherwise
 */
export async function isPortListening(
  port: number,
  host = 'localhost',
  timeout = 1000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host }, () => {
      socket.end();
      resolve(true);
    });

    socket.setTimeout(timeout);

    socket.on('error', () => {
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}
