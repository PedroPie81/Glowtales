import express from "express";
import app from "./api/index";
import path from "path";

const PORT = 3000;

// Vite Integration and Host Static files in Production
async function startServer() {
  // Determine if we are running the compiled production bundle.
  // We are in development if 'server.ts' or 'tsx' is active in the execution arguments,
  // even if the host container pre-sets NODE_ENV=production.
  const isProduction = !(
    process.argv.some(arg => arg.includes("server.ts") || arg.includes("tsx")) ||
    (process.argv[1] && process.argv[1].includes("server.ts"))
  );

  if (!isProduction) {
    // Dynamically import Vite only during development to prevent CJS require of ES module crashing the production server.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Explicit SPA fallback for development (e.g. refreshes on /create, /examples)
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import("fs");
        const templatePath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error("Error sending index.html in production routing fallback:", err);
          res.status(500).send("Your GlowTales application is loading, please try refreshing in a moment.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GlowTales server running on port ${PORT} (isProduction: ${isProduction})`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

