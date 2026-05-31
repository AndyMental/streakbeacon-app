import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  return [
    {
      url: new URL("/", baseUrl).toString(),
      changeFrequency: "daily",
      priority: 1
    }
  ];
}
