import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Enerfluid Apps",
    short_name: "Enerfluid",
    description: "Plataforma integral de Enerfluid",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      { src: "/enerfluid-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/enerfluid-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/enerfluid-icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/enerfluid-icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
