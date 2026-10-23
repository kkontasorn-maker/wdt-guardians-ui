/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native SQLite binding — only loaded when DATABASE_URL points at a file.
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;

