/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
