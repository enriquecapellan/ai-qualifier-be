declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    NODE_ENV: string;
  }
}
