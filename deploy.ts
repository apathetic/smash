import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { serveDir } from "https://deno.land/std@0.220.1/http/file_server.ts";
import { join } from "https://deno.land/std@0.220.1/path/mod.ts";
import { exists } from "https://deno.land/std@0.220.1/fs/exists.ts";

// Get the directory of the current file
const __dirname = new URL(".", import.meta.url).pathname;

// Try different possible output directories for client assets
const possibleClientPaths = [
  join(__dirname, ".output/public"),
  join(__dirname, ".vinxi/build/client"),
  join(__dirname, "dist")
];

// Find the first directory that exists
let clientPath = null;
for (const path of possibleClientPaths) {
  if (await exists(path)) {
    clientPath = path;
    break;
  }
}

if (!clientPath) {
  console.error("Error: Could not find client build output directory.");
  console.error("Make sure to run 'pnpm build' before 'deno task preview'");
  Deno.exit(1);
}

console.log(`Serving static files from: ${clientPath}`);
console.log("Server running at http://localhost:8000");

// This is the entry point for Deno Deploy
serve(async (req) => {
  const url = new URL(req.url);

  // Check if the request is for a static asset
  if (url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/favicon.") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".json") ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".svg")) {
    return serveDir(req, {
      fsRoot: clientPath,
      urlRoot: "",
      showDirListing: false,
      enableCors: true,
    });
  }

  // For all other requests, serve the index.html
  // First check if index.html exists in the client build
  const indexPath = join(clientPath, "index.html");
  if (await exists(indexPath)) {
    const content = await Deno.readTextFile(indexPath);
    return new Response(content, {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  // If no index.html in client build, use our custom one
  const publicIndexPath = join(__dirname, "public", "index.html");
  if (await exists(publicIndexPath)) {
    const content = await Deno.readTextFile(publicIndexPath);
    return new Response(content, {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  // If all else fails, return a 404
  return new Response("Not Found", { status: 404 });
}, { port: 8000 });