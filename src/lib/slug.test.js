import { describe, it, expect, vi } from 'vitest';
import { generateSlug, suggestSlug, checkSlugAvailable } from './slug';

// Mock Firebase per evitare inizializzazioni o dipendenze nel test
vi.mock('../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn()
}));

describe('generateSlug', () => {
  it('dovrebbe gestire correttamente "Panificio Rossi"', () => {
    expect(generateSlug('Panificio Rossi')).toBe('panificio-rossi');
  });

  it('dovrebbe rimuovere gli accenti e sostituire caratteri speciali, es. "Caffè dell\'Angolo"', () => {
    expect(generateSlug("Caffè dell'Angolo")).toBe('caffe-dell-angolo');
  });

  it('dovrebbe collassare spazi multipli, es. "Bar  Tre  Stelle"', () => {
    expect(generateSlug('Bar  Tre  Stelle')).toBe('bar-tre-stelle');
  });

  it('dovrebbe gestire stringa vuota', () => {
    expect(generateSlug('')).toBe('');
  });

  it('dovrebbe gestire input non stringa', () => {
    expect(generateSlug(null)).toBe('');
    expect(generateSlug(undefined)).toBe('');
  });
});

describe('suggestSlug', () => {
  it('dovrebbe ritornare un base-suffix di 4 caratteri', () => {
    const base = 'bar-roma';
    const suggested = suggestSlug(base);
    
    expect(suggested.startsWith('bar-roma-')).toBe(true);
    
    const suffix = suggested.split('-').pop();
    expect(suffix.length).toBe(4);
  });

  it('non dovrebbe contenere caratteri ambigui nel suffisso', () => {
    // Caratteri vietati: 0, 1, O, I, l
    const forbiddenRegex = /[01OIl]/;
    
    for (let i = 0; i < 50; i++) {
      const suggested = suggestSlug('test');
      const suffix = suggested.split('-').pop();
      expect(forbiddenRegex.test(suffix)).toBe(false);
    }
  });
});

describe('checkSlugAvailable', () => {
  it('dovrebbe ritornare false se lo slug è vuoto', async () => {
    const isAvailable = await checkSlugAvailable('');
    expect(isAvailable).toBe(false);
  });
});
