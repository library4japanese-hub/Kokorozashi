import axios from 'axios';
import * as cheerio from 'cheerio';
import { addKnowledgeItem } from '../lib/supabase.ts';
import { embedText } from './gemini.ts';

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  metadata: any;
}

export async function crawlMedicalWisdom(targetUrl: string) {
  try {
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, nav, footer, header').remove();

    const title = $('title').text() || $('h1').first().text() || 'Untitled Medical Wisdom';
    
    // Extract meaningful text
    let content = '';
    $('p, h1, h2, h3, h4, h5, h6, li, td, div, section, article').each((_, el) => {
      const text = $(el).text().trim();
      // Lower threshold for individual elements to capture more context
      if (text.length > 15) {
        content += text + '\n\n';
      }
    });

    // Lower total content threshold to be more inclusive of concise but valuable pages
    if (content.length < 50) {
      throw new Error("Insufficient content found at this URL.");
    }

    // Split into chunks for embedding (approx 1000 chars each)
    const chunks = content.match(/[\s\S]{1,1000}/g) || [];
    let savedCount = 0;

    for (const chunk of chunks) {
      const embedding = await embedText(chunk);
      if (embedding) {
        await addKnowledgeItem(chunk, {
          source: targetUrl,
          title: title,
          type: 'ancient_medical_wisdom',
          crawled_at: new Date().toISOString()
        }, embedding);
        savedCount++;
      }
    }

    return { title, savedCount };
  } catch (error: any) {
    console.error(`Crawl Error for ${targetUrl}:`, error.message);
    throw error;
  }
}

export const MEDICAL_SOURCES = [
  "http://wakanmoview.inm.u-toyama.ac.jp/kampo/",
  "https://en.wikipedia.org/wiki/Kampo",
  "https://en.wikipedia.org/wiki/Ishimp%C5%8D",
  "https://en.wikipedia.org/wiki/Traditional_Japanese_medicine",
  "https://www.Tsumura.co.jp/english/kampo/",
  "https://en.wikipedia.org/wiki/Moxibustion"
];
