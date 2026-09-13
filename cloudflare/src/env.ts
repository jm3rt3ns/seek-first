export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ANTHROPIC_API_KEY: string;
  APP_ORIGIN: string;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}
