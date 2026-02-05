/// <reference types="vite/client" />

// Este projeto é um MVP e usa `process.env` via `define` no vite.config.
// Para evitar erros de tipos em TypeScript, declaramos aqui o mínimo necessário.
declare const process: {
  env: Record<string, any>;
};

// Dependências externas sem tipos neste MVP
declare module '@google/genai';
