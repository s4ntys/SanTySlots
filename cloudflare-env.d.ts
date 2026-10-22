declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    IP_HASH_SECRET?: string;
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD_HASH?: string;
    ADMIN_SESSION_SECRET?: string;
  }
}
