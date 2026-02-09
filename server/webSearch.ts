import axios from "axios";

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: "duckduckgo" | "wikipedia";
}

/**
 * Search the web using DuckDuckGo Instant Answer API
 * Free, no API key required
 */
export async function searchDuckDuckGo(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const response = await axios.get("https://api.duckduckgo.com/", {
      params: {
        q: query,
        format: "json",
        no_html: 1,
        skip_disambig: 1,
      },
      timeout: 10000,
    });

    const results: SearchResult[] = [];
    const data = response.data;

    // Add abstract if available
    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL || "",
        source: "duckduckgo",
      });
    }

    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text,
            snippet: topic.Text,
            url: topic.FirstURL,
            source: "duckduckgo",
          });
        }
      }
    }

    return results.slice(0, maxResults);
  } catch (error) {
    console.error("[WebSearch] DuckDuckGo error:", error);
    return [];
  }
}

/**
 * Search Wikipedia for information
 * Free, no API key required
 */
export async function searchWikipedia(query: string, maxResults = 3): Promise<SearchResult[]> {
  try {
    const response = await axios.get("https://en.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        list: "search",
        srsearch: query,
        format: "json",
        srlimit: maxResults,
        srprop: "snippet",
      },
      timeout: 10000,
    });

    const results: SearchResult[] = [];
    const searchResults = response.data?.query?.search || [];

    for (const result of searchResults) {
      results.push({
        title: result.title,
        snippet: result.snippet.replace(/<[^>]*>/g, ""), // Remove HTML tags
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`,
        source: "wikipedia",
      });
    }

    return results;
  } catch (error) {
    console.error("[WebSearch] Wikipedia error:", error);
    return [];
  }
}

/**
 * Combined search using both DuckDuckGo and Wikipedia
 */
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const [duckResults, wikiResults] = await Promise.all([
    searchDuckDuckGo(query, 5),
    searchWikipedia(query, 3),
  ]);

  return [...duckResults, ...wikiResults];
}
