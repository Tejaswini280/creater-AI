import { TextEncoder, TextDecoder } from 'util';

// Node env polyfills for libraries that expect these globals
// @ts-ignore
if (!(global as any).TextEncoder) (global as any).TextEncoder = TextEncoder as any;
// @ts-ignore
if (!(global as any).TextDecoder) (global as any).TextDecoder = TextDecoder as any;

process.env.NODE_ENV = 'test';
process.env.SKIP_RATE_LIMIT = '1';


