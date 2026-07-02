import type { NewsItem } from "@/types/content";
import type { PortalNewsCardData } from "@/types/news-grid";

export function newsItemToPortalNewsCard(item: NewsItem): PortalNewsCardData {
  return {
    id: item.id,
    image: item.image,
    category: item.category || undefined,
    date: item.date || undefined,
    title: item.title,
    excerpt: item.excerpt || undefined,
    readTime: item.readTime,
    author: item.author,
    href: item.href,
    featured: item.featured,
    status: item.status,
  };
}

export function newsItemsToPortalNewsCards(items: NewsItem[]): PortalNewsCardData[] {
  return items.map(newsItemToPortalNewsCard);
}
