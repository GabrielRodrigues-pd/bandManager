import axios from 'axios';
import * as cheerio from 'cheerio';

interface ImportedSong {
  title: string;
  artist: string;
  originalKey: string;
  content: string;
}

export class ImportService {
  /**
   * Main entry point to import a song from a URL
   */
  static async fromUrl(url: string): Promise<ImportedSong> {
    if (url.includes('cifraclub.com.br')) {
      return this.fromCifraClub(url);
    }
    
    throw new Error('Unsupported URL. Only Cifra Club is currently supported.');
  }

  /**
   * Scraper for Cifra Club
   */
  private static async fromCifraClub(url: string): Promise<ImportedSong> {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      const title = $('h1.t1').text().trim() || $('h1.title-1').text().trim();
      const artist = $('h2.t3').text().trim() || $('h2.title-2').text().trim();
      
      // The content is usually inside <pre> inside a specifically classed div
      // We want to keep the chords (which are often inside <b> or similar)
      const contentRaw = $('pre').text();
      
      // Key is often in a specific badge or script
      const originalKey = $('#cifra_tom a').text().trim() || 'C';

      if (!title || !contentRaw) {
        throw new Error('Failed to parse song data from Cifra Club.');
      }

      return {
        title,
        artist,
        originalKey,
        content: contentRaw,
      };
    } catch (err) {
      console.error('Scraping error:', err);
      throw new Error('Could not fetch or parse the musical data.');
    }
  }

  /**
   * Parses raw text to try and identify metadata and content
   */
  static fromRawText(text: string): ImportedSong {
    const lines = text.split('\n');
    let title = 'Unknown Title';
    let artist = 'Unknown Artist';
    let originalKey = 'C';
    let startIndex = 0;

    // Very simple heuristic: first line is title, second is artist
    if (lines.length > 2) {
      title = lines[0].trim();
      artist = lines[1].trim();
      startIndex = 2;
    }

    const content = lines.slice(startIndex).join('\n').trim();

    return {
      title,
      artist,
      originalKey,
      content,
    };
  }
}
