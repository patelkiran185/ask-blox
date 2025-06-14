import { NextResponse } from 'next/server';

interface RecommendedResource {
  title: string;
  url: string;
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
    const { lackingSkills } = await request.json();

    if (!Array.isArray(lackingSkills) || lackingSkills.some(s => typeof s !== 'string')) {
      return NextResponse.json(
        { message: 'Invalid request body. Expected an array of lackingSkills names.' },
        { status: 400 }
      );
    }

    console.log(`Backend API received request for lacking skills: ${lackingSkills.join(', ')}`);

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
    const MAX_RECOMMENDATIONS_TOTAL = 10;
    const MAX_LINK_VALIDATION_ATTEMPTS_PER_SKILL = 5;

    const allValidatedLinks: RecommendedResource[] = [];
    const skillToLinksMap = new Map<string, RecommendedResource[]>();

    for (const lackingSkill of lackingSkills) {
      console.log(`Processing lacking skill: ${lackingSkill}`);
      const searchQuery = `learn ${lackingSkill} tutorial guide free online interactive "official documentation" "best practices" (site:youtube.com OR site:medium.com OR site:geeksforgeeks.org) -job -career -buy -pricing -sales -certification -bootcamp`.trim();
      const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(searchQuery)}&num=10`;

      let googleResponse: Response | null = null;
      let attempt = 0;
      while (attempt <= MAX_SEARCH_RETRIES) {
        try {
          const response = await fetch(googleSearchUrl);
          if (response.ok) {
            googleResponse = response;
            break;
          } else if (response.status === 429) {
            console.warn(`Quota hit for skill ${lackingSkill} (Attempt ${attempt + 1}). Retrying after delay.`);
            await new Promise(resolve => setTimeout(resolve, INITIAL_SEARCH_RETRY_DELAY * Math.pow(2, attempt)));
          } else {
            console.error(`Error fetching results for ${lackingSkill} from Google CSE: ${response.status} - ${await response.text()}`);
            break;
          }
        } catch (error) {
          console.error(`Network error during Google CSE fetch for ${lackingSkill} (Attempt ${attempt + 1}):`, error);
        }
        attempt++;
      }

      if (!googleResponse || !googleResponse.ok) {
        console.error(`Failed to get successful Google CSE response for ${lackingSkill} after all retries.`);
        continue;
      }

      const data: GoogleCustomSearchResponse = await googleResponse.json();
      console.log(`Google CSE results for \"${lackingSkill}\":`, data.items?.map(item => item.link));
      
      if (data.items && data.items.length > 0) {
        const currentSkillValidatedLinks: RecommendedResource[] = [];
        let linksValidatedCount = 0;

        for (const item of data.items) {
          if (linksValidatedCount >= MAX_LINK_VALIDATION_ATTEMPTS_PER_SKILL) {
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
                console.log(`Link valid: ${item.link}`);
              } else {
                console.warn(`Link validation failed for ${item.link} (Attempt ${retryAttempts + 1}): Status ${linkCheckResponse.status}`);
              }
            } catch (linkError: any) {
              if (linkError.name === 'AbortError') {
                console.warn(`Link validation timed out for ${item.link} (Attempt ${retryAttempts + 1})`);
              } else if (linkError.code === 'ECONNRESET') {
                console.warn(`Link validation ECONNRESET for ${item.link} (Attempt ${retryAttempts + 1})`);
              } else {
                console.warn(`Error validating link ${item.link} (Attempt ${retryAttempts + 1}):`, linkError.message || linkError);
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
            currentSkillValidatedLinks.push({
              title: item.title,
              url: item.link
            });
          } else {
            console.warn(`Link ${item.link} ultimately failed validation after ${retryAttempts} attempts.`);
          }
        }
        if (currentSkillValidatedLinks.length > 0) {
          skillToLinksMap.set(lackingSkill, currentSkillValidatedLinks);
        }
      }
    }

    const finalRecommendations: RecommendedResource[] = [];
    const addedUrls = new Set<string>();

    // Pass 1: Add one recommendation for each lacking skill (if available)
    for (const lackingSkill of lackingSkills) {
      if (finalRecommendations.length >= MAX_RECOMMENDATIONS_TOTAL) {
        break;
      }
      const links = skillToLinksMap.get(lackingSkill);
      if (links && links.length > 0) {
        const firstLink = links[0];
        if (!addedUrls.has(firstLink.url)) {
          finalRecommendations.push(firstLink);
          addedUrls.add(firstLink.url);
        }
      }
    }

    // Pass 2: Fill remaining spots up to MAX_RECOMMENDATIONS_TOTAL with other validated links
    for (const lackingSkill of lackingSkills) {
      if (finalRecommendations.length >= MAX_RECOMMENDATIONS_TOTAL) {
        break;
      }
      const links = skillToLinksMap.get(lackingSkill);
      if (links) {
        for (let i = 1; i < links.length; i++) {
          if (finalRecommendations.length >= MAX_RECOMMENDATIONS_TOTAL) {
            break;
          }
          const link = links[i];
          if (!addedUrls.has(link.url)) {
            finalRecommendations.push(link);
            addedUrls.add(link.url);
          }
        }
      }
    }

    return NextResponse.json(finalRecommendations);

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { message: 'Error fetching recommendations' },
      { status: 500 }
    );
  }
} 