import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import axios from "axios";
import * as cheerio from "cheerio";
import archiver from "archiver";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { createClient } from "@supabase/supabase-js";
import Stripe from 'stripe';
import { crawlMedicalWisdom } from './src/services/crawlerService.ts';

let stripe: Stripe | null = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing. Please add it to the Settings > Secrets menu.");
  }
  
  if (!key.startsWith('sk_')) {
    throw new Error("Invalid STRIPE_SECRET_KEY format. Stripe secret keys should start with 'sk_test_' or 'sk_live_'. Current key starts with '" + key.substring(0, 3) + "'.");
  }

  if (!stripe) {
    stripe = new Stripe(key, {
      apiVersion: '2023-10-16' as any,
    });
  }
  return stripe;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Supabase Client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn("SERVER WARNING: Supabase URL or Key is missing. Some backend features may fail.");
  }

  const supabase = createClient(
    supabaseUrl || 'https://placeholder-project.supabase.co', 
    supabaseKey || 'placeholder-key'
  );

  // Helper to check if Supabase is configured
  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

  // Seed with initial data if empty (only if Supabase is configured)
  if (isSupabaseConfigured) {
    try {
      const { count, error: countError } = await supabase
        .from("kokorozashi_news")
        .select("*", { count: "exact", head: true });

      if (countError) {
        if (countError.code === 'PGRST116' || countError.message.includes('not found')) {
          console.error("Supabase Error: 'kokorozashi_news' table not found. Please run the SQL in 'supabase_setup.sql' in your Supabase SQL Editor.");
        } else {
          console.error("Supabase Seed Check Error:", countError.message);
        }
      } else if (count === 0) {
        let initialNews = [];
        const newsPath = path.join(process.cwd(), 'src/data/news.json');
        
        if (fs.existsSync(newsPath)) {
          try {
            const fileContent = fs.readFileSync(newsPath, 'utf8');
            initialNews = JSON.parse(fileContent);
          } catch (error) {
            console.error("Failed to read news.json:", error);
          }
        }

        if (initialNews.length === 0) {
          initialNews = [
            {
              title: "桜の開花予想：今年は平年より早い見込み",
              content: "気象庁は今年の桜の開花予想を発表しました。今年は全国的に気温が高い日が多く、平年よりも早く咲くところが多い見込みです。東京では3月20日ごろに開花すると予想されています。公園ではお花見の準備が始まっていますが、マナーを守って楽しむように呼びかけています。",
              source_url: "https://www3.nhk.or.jp/news/easy/k10012345671000/k10012345671000.html",
              difficulty: "N4-N3"
            }
          ];
        }

        const { error: insertError } = await supabase
          .from("kokorozashi_news")
          .insert(initialNews);
        
        if (!insertError) {
          console.log(`Seeded ${initialNews.length} news articles to Supabase.`);
        } else {
          console.error("Failed to seed Supabase:", JSON.stringify(insertError, null, 2));
        }
      }
    } catch (error) {
      console.error("Supabase connection error during seed:", error);
    }
  }

  // Middleware to authenticate and authorize admins
  const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Check if user is admin in profiles table or is the primary owner
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const isOwner = user.email === 'library4japanese@gmail.com';
      if (!isOwner && (!profile || profile?.role !== 'admin')) {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      // Attach user to request for later use if needed
      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(500).json({ error: "Internal server error during authentication" });
    }
  };

  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/admin/ingest-pdf", authenticateAdmin, upload.single("pdf"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    try {
      const data = await pdf(req.file.buffer);
      res.json({ text: data.text });
    } catch (error) {
      console.error("PDF Parse Error:", error);
      res.status(500).json({ error: "Failed to parse PDF" });
    }
  });

  app.post("/api/admin/scrape-jlpt", authenticateAdmin, async (req, res) => {
    const { url, level } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      
      // Remove scripts and styles
      $('script, style').remove();
      
      // Get text content or specific blocks if possible
      // For now, we'll return the whole text and let Gemini parse it on the frontend/service layer
      // or we can try to find common question patterns
      const pageText = $('body').text().replace(/\s+/g, ' ').trim();
      
      res.json({ text: pageText, html: response.data });
    } catch (error) {
      console.error("Scrape Error:", error);
      res.status(500).json({ error: "Failed to scrape URL" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeInstance = getStripe();
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Donation for Kokorozashi',
                description: 'Support the maintenance of AI Sensei and the Kokorozashi platform.',
              },
              unit_amount: 500, // $5.00
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/?donation=success`,
        cancel_url: `${req.headers.origin}/?donation=cancel`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      
      let errorMessage = "An error occurred with the payment system.";
      if (error.type === 'StripeAuthenticationError') {
        errorMessage = "Invalid Stripe API Key. Please check your STRIPE_SECRET_KEY in the Settings > Secrets menu. It should start with 'sk_test_' or 'sk_live_'.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(error.statusCode || 500).json({ error: errorMessage });
    }
  });

  // API Routes
  app.get("/api/news/sync", async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(500).json({ error: "Supabase not configured. Please add SUPABASE_URL and SUPABASE_KEY to Secrets." });
    }

    try {
      const response = await fetch("https://www3.nhk.or.jp/news/easy/top-list.json");
      const topList = await response.json() as any[];
      
      let addedCount = 0;

      // Process top 5 news items
      for (const item of topList.slice(0, 5)) {
        const newsId = item.news_id;
        const sourceUrl = `https://www3.nhk.or.jp/news/easy/${newsId}/${newsId}.html`;
        
        // Check if exists in Supabase
        const { data: existing } = await supabase
          .from("kokorozashi_news")
          .select("id")
          .ilike("source_url", `%${newsId}%`)
          .single();

        if (!existing) {
          // Fetch article content
          const artResponse = await fetch(sourceUrl);
          const html = await artResponse.text();
          
          const bodyMatch = html.match(/<div id="js-article-body"[^>]*>([\s\S]*?)<\/div>/);
          if (bodyMatch) {
            let content = bodyMatch[1]
              .replace(/<rt>.*?<\/rt>/g, '') 
              .replace(/<ruby>|<\/ruby>|<rb>|<\/rb>/g, '') 
              .replace(/<[^>]*>/g, '') 
              .trim();
            
            const { error: insertError } = await supabase
              .from("kokorozashi_news")
              .insert({
                title: item.title,
                content: content,
                difficulty: "N4-N3",
                source_url: sourceUrl
              });

            if (!insertError) addedCount++;
          }
        }
      }
      
      res.json({ success: true, added: addedCount });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Failed to sync news" });
    }
  });

  app.post("/api/admin/crawl-medical", authenticateAdmin, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    try {
      const result = await crawlMedicalWisdom(url);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/export-project", authenticateAdmin, async (req, res) => {
    try {
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      res.attachment('kokorozashi-project-export.zip');

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archiver Warning:', err);
        } else {
          throw err;
        }
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);

      // Directories and files to exclude from the zip
      const ignored = [
        'node_modules/**',
        '.next/**',
        'dist/**',
        '.cache/**',
        'kokorozashi-project-export.zip'
      ];

      archive.glob('**/*', {
        cwd: process.cwd(),
        ignore: ignored,
        dot: true // Include hidden files like .env.example
      });

      await archive.finalize();
    } catch (error) {
      console.error("Export Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate project export." });
      }
    }
  });

  app.get("/api/news", async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(500).json({ error: "Supabase not configured." });
    }

    try {
      const { data, error } = await supabase
        .from("kokorozashi_news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Supabase error fetching news:", error.message || error);
      res.status(500).json({ error: "Failed to fetch news", details: error.message });
    }
  });

  app.post("/api/news", authenticateAdmin, async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(500).json({ error: "Supabase not configured." });
    }

    const { title, content, difficulty, source_url } = req.body;
    try {
      const { data, error } = await supabase
        .from("kokorozashi_news")
        .insert({ title, content, difficulty, source_url })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Supabase error creating news:", error.message || error);
      res.status(500).json({ error: "Failed to create news", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
