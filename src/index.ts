import { Env } from './config';
import { fetchAqi } from './aqi/fetcher';
import { getLevelByAqi } from './aqi/levels';
import { checkAndAlert } from './alert/notifier';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
// @ts-ignore - This is injected by Wrangler at build time
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

export default {
  // Cron trigger - 定时检查 AQI 并发送告警
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const result = await checkAndAlert(env);
    console.log(`Scheduled AQI check: ${result}`);
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }

    // Serve static files
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      // If asset not found, serve index.html for SPA routing
      const indexRequest = new Request(`${url.origin}/index.html`, request);
      try {
        return await getAssetFromKV(
          {
            request: indexRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        );
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }
  },
};

async function handleApiRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET /api/aqi?city=beijing
  if (url.pathname === '/api/aqi' && request.method === 'GET') {
    const city = url.searchParams.get('city') || 'beijing';

    try {
      // Check cache first
      const cacheKey = `aqi:${city}`;
      const cached = await env.CACHE.get(cacheKey, 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Fetch fresh data
      const data = await fetchAqi(city, env.AQICN_TOKEN);
      const levelInfo = getLevelByAqi(data.aqi);

      const result = {
        ...data,
        level: levelInfo.level,
        levelLabel: levelInfo.label,
        healthImpact: levelInfo.healthImpact,
        advice: levelInfo.advice,
      };

      // Cache for 10 minutes
      await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }

  // 404 for unknown API routes
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
