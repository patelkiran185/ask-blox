import { NextResponse } from 'next/server';

interface Strategy {
  title: string;
  url: string;
  platform: string;
}

interface GoogleCustomSearchItem {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleCustomSearchResponse {
  items?: GoogleCustomSearchItem[];
}

export async function POST(request: Request) {
  try {
    const { skill } = await request.json();

    if (!skill || typeof skill !== 'string') {
      return NextResponse.json(
        { message: 'Invalid request body. Expected a skill name.' },
        { status: 400 }
      );
    }

    console.log(`Backend API received request for strategies for skill: ${skill}`);

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      console.error('Google API Key or CSE ID is not set in environment variables.');
      return NextResponse.json(
        { message: 'Server configuration error: API keys missing.' },
        { status: 500 }
      );
    }

    const MAX_SEARCH_RETRIES = 2;
    const INITIAL_SEARCH_RETRY_DELAY = 1000;
    const MAX_STRATEGIES = 10;
    const MAX_LINK_VALIDATION_ATTEMPTS = 7;

    // Search for success stories and strategies from various platforms
    const searchQuery = `${skill} "learning journey" OR "how to learn" OR "career advice" (site:twitter.com OR site:linkedin.com OR site:medium.com OR site:dev.to OR site:hashnode.com OR site:reddit.com/r/learnprogramming OR site:quora.com)`.trim();
    const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(searchQuery)}&num=10`;
    console.log(`Strategies Google Search URL: ${googleSearchUrl}`);

    let googleResponse: Response | null = null;
    let attempt = 0;
    while (attempt <= MAX_SEARCH_RETRIES) {
      try {
        const response = await fetch(googleSearchUrl);
        if (response.ok) {
          googleResponse = response;
          break;
        } else if (response.status === 429) {
          console.warn(`Quota hit for skill ${skill} (Attempt ${attempt + 1}). Retrying after delay.`);
          await new Promise(resolve => setTimeout(resolve, INITIAL_SEARCH_RETRY_DELAY * Math.pow(2, attempt)));
        } else {
          console.error(`Error fetching results for ${skill} from Google CSE: ${response.status} - ${await response.text()}`);
          break;
        }
      } catch (error) {
        console.error(`Network error during Google CSE fetch for ${skill} (Attempt ${attempt + 1}):`, error);
      }
      attempt++;
    }

    if (!googleResponse || !googleResponse.ok) {
      console.error(`Failed to get successful Google CSE response for ${skill} after all retries.`);
      return NextResponse.json(
        { message: 'Failed to fetch strategies' },
        { status: 500 }
      );
    }

    const data: GoogleCustomSearchResponse = await googleResponse.json();
    console.log(`Google CSE results for strategies for "${skill}":`, JSON.stringify(data.items, null, 2));

    if (!data.items || data.items.length === 0) {
      console.log(`No items found for strategies for "${skill}". Returning empty array.`);
      return NextResponse.json([]);
    }

    const validatedStrategies: Strategy[] = [];
    let linksValidatedCount = 0;

    for (const item of data.items) {
      if (linksValidatedCount >= MAX_LINK_VALIDATION_ATTEMPTS) {
        break;
      }

      let isValidLink = false;
      let retryAttempts = 0;
      const maxRetries = 2;
      const timeoutMs = 3000;

      while (!isValidLink && retryAttempts <= maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const linkCheckResponse = await fetch(item.link, {
            method: 'HEAD',
            signal: controller.signal
          });

          if (linkCheckResponse.ok) {
            isValidLink = true;
            console.log(`Strategy link valid: ${item.link}`);
          } else {
            console.warn(`Strategy link validation failed for ${item.link} (Attempt ${retryAttempts + 1}): Status ${linkCheckResponse.status}`);
          }
        } catch (linkError: any) {
          if (linkError.name === 'AbortError') {
            console.warn(`Strategy link validation timed out for ${item.link} (Attempt ${retryAttempts + 1})`);
          } else if (linkError.code === 'ECONNRESET') {
            console.warn(`Strategy link validation ECONNRESET for ${item.link} (Attempt ${retryAttempts + 1})`);
          } else {
            console.warn(`Error validating strategy link ${item.link} (Attempt ${retryAttempts + 1}):`, linkError.message || linkError);
          }
        } finally {
          clearTimeout(timeoutId);
        }

        if (!isValidLink && retryAttempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * (retryAttempts + 1)));
        }
        retryAttempts++;
      }

      linksValidatedCount++;
      if (isValidLink) {
        // Determine the platform from the URL
        let platform = 'Other';
        if (item.link.includes('twitter.com')) platform = 'Twitter';
        else if (item.link.includes('linkedin.com')) platform = 'LinkedIn';
        else if (item.link.includes('medium.com')) platform = 'Medium';
        else if (item.link.includes('dev.to')) platform = 'Dev.to';
        else if (item.link.includes('hashnode.com')) platform = 'Hashnode';

        validatedStrategies.push({
          title: item.title,
          url: item.link,
          platform: platform
        });
      } else {
        console.warn(`Strategy link ${item.link} ultimately failed validation after ${retryAttempts} attempts.`);
      }
    }

    console.log(`Validated strategies for "${skill}":`, JSON.stringify(validatedStrategies, null, 2));
    return NextResponse.json(validatedStrategies.slice(0, MAX_STRATEGIES));

  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { message: 'Error fetching strategies' },
      { status: 500 }
    );
  }
} 