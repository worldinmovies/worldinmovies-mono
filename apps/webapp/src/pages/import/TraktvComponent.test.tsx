import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  base64URLEncode,
  sha256,
  generateCodeChallenge,
} from '@/lib/pkce';

describe('PKCE helpers', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a 43-character base64url string', async () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBe(43);
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique verifiers each time', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });
  });

  describe('base64URLEncode', () => {
    it('should encode to base64url format', async () => {
      const input = new TextEncoder().encode('test');
      const encoded = base64URLEncode(input);
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(encoded).not.includes('+');
      expect(encoded).not.includes('/');
      expect(encoded).not.includes('=');
    });

    it('should produce consistent encoding', async () => {
      const input = new TextEncoder().encode('hello world');
      const e1 = base64URLEncode(input);
      const e2 = base64URLEncode(input);
      expect(e1).toBe(e2);
    });
  });

  describe('sha256', () => {
    it('should hash input consistently', async () => {
      const h1 = await sha256('test');
      const h2 = await sha256('test');
      expect(h1).toEqual(h2);
      expect(h1.length).toBe(32); // SHA-256 produces 32 bytes
    });

    it('should produce different hashes for different inputs', async () => {
      const h1 = await sha256('test');
      const h2 = await sha256('different');
      expect(h1).not.toEqual(h2);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a valid code challenge', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge.length).toBeGreaterThanOrEqual(43);
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should produce unique challenges for unique verifiers', async () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      const c1 = await generateCodeChallenge(v1);
      const c2 = await generateCodeChallenge(v2);
      expect(c1).not.toBe(c2);
    });

    it('should be deterministic for same verifier', async () => {
      const verifier = 'test-verifier-12345';
      const c1 = await generateCodeChallenge(verifier);
      const c2 = await generateCodeChallenge(verifier);
      expect(c1).toBe(c2);
    });
  });

  describe('PKCE flow', () => {
    it('should have valid verifier-challenge relationship', async () => {
      // This test verifies the PKCE flow is correctly implemented
      // The verifier can be used to derive the challenge via SHA-256
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // Verify challenge is derived from verifier via SHA-256
      const encoder = new TextEncoder();
      const hashed = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
      const expectedChallenge = btoa(String.fromCharCode(...new Uint8Array(hashed)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      expect(challenge).toBe(expectedChallenge);
    });
  });
});
