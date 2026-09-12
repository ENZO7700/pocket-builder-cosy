import { createServerFn } from "@tanstack/react-start";
import { validationHealth } from "@/lib/ai/generate";

// Health check alias endpoint
// Maps /api/health -> /api/validationHealth for Docker healthcheck compatibility
export const getHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    ok: boolean;
    strategy: string;
    browser: 'ok' | 'failed' | 'not_configured';
    static: 'ok';
    browserPoolSize?: number;
    activePages?: number;
    config: {
      enabled: boolean;
      maxRetries: number;
      timeoutMs: number;
      browserPoolSize: number;
      maxHtmlSize: number;
      strategy: string;
    };
  }> => {
    const result = await validationHealth();
    return result;
  }
);
