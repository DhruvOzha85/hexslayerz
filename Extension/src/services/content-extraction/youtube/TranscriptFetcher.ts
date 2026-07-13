export class TranscriptFetcher {
  /**
   * Fetches the transcript natively using the active YouTube tab context.
   * This bypasses CORS and anti-bot protections.
   * 
   * @param tabId The ID of the active YouTube tab.
   * @param userLanguage The preferred language code (e.g. 'en')
   * @returns The raw, concatenated transcript text or throws an error if unavailable.
   */
  static async getTranscript(url: string, userLanguage: string = 'en'): Promise<string> {
    const videoIdMatch = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^?&#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      throw new Error("Invalid YouTube video ID.");
    }

    try {
      // Execute from the extension background context to safely override User-Agent
      // Strategy 1: YouTube Android Innertube API
      // This bypasses all web signature requirements and SPA DOM state issues.
      const payload = {
        context: { 
          client: { 
            hl: userLanguage, 
            gl: "US", 
            clientName: "ANDROID", 
            clientVersion: "20.10.38" 
          } 
        },
        videoId: videoId
      };

      // Fetch dynamic API key
      const homeResponse = await fetch("https://www.youtube.com/");
      const homeHtml = await homeResponse.text();
      const apiKeyMatch = homeHtml.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      
      if (apiKeyMatch && apiKeyMatch[1]) {
        const apiKey = apiKeyMatch[1];
        
        const playerResponse = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)"
          }
        });

        if (playerResponse.ok) {
          const playerText = await playerResponse.text();
          if (playerText && playerText.trim().length > 0) {
            const data = JSON.parse(playerText);
            const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            
            if (captionTracks && captionTracks.length > 0) {
              let track = captionTracks.find((t: any) => t.languageCode === userLanguage || t.languageCode.startsWith(userLanguage));
              if (!track) track = captionTracks[0];

              const transcriptUrl = track.baseUrl + "&fmt=json3";
              
              // We must use the same Android User-Agent to fetch the actual transcript
              const apiResponse = await fetch(transcriptUrl, {
                headers: {
                  "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)"
                }
              });
              
              if (apiResponse.ok) {
                const text = await apiResponse.text();
                if (text && text.trim().length > 0) {
                  const tData = JSON.parse(text);
                  if (tData.events) {
                    const textParts: string[] = [];
                    for (const event of tData.events) {
                      if (event.segs) {
                        for (const seg of event.segs) {
                          if (seg.utf8) textParts.push(seg.utf8);
                        }
                      }
                    }
                    if (textParts.length > 0) return textParts.join(" ");
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Android Innertube Strategy failed:", e);
    }

    // Strategy 2: Fallback to tab-injected DOM extraction if API is blocked
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: "MAIN",
          func: async (lang: string) => {
            try {
              const playerResponse = (window as any).ytInitialPlayerResponse;
              if (playerResponse) {
                const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                if (captionTracks && captionTracks.length > 0) {
                  let track = captionTracks.find((t: any) => t.languageCode === lang || t.languageCode.startsWith(lang));
                  if (!track) track = captionTracks[0];

                  const transcriptUrl = track.baseUrl + "&fmt=json3";
                  const apiResponse = await fetch(transcriptUrl);
                  
                  if (apiResponse.ok) {
                    const text = await apiResponse.text();
                    if (text && text.trim().length > 0) {
                      const data = JSON.parse(text);
                      if (data.events) {
                        const textParts: string[] = [];
                        for (const event of data.events) {
                          if (event.segs) {
                            for (const seg of event.segs) {
                              if (seg.utf8) textParts.push(seg.utf8);
                            }
                          }
                        }
                        if (textParts.length > 0) return { result: textParts.join(" ") };
                      }
                    }
                  }
                }
              }
            } catch (err) {
              return { error: err };
            }
            return { error: "Failed DOM extraction" };
          },
          args: [userLanguage]
        });

        if (results && results[0] && results[0].result && results[0].result.result) {
          return results[0].result.result;
        }
      }
    } catch (e) {
      console.warn("Tab DOM Strategy failed:", e);
    }

    throw new Error("Transcript not available for this video.");
  }

  /**
   * Retrieves the video title natively.
   */
  static async getVideoTitle(tabId: number): Promise<string> {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN",
      func: () => {
        const playerResponse = (window as any).ytInitialPlayerResponse;
        return playerResponse?.videoDetails?.title || document.title.replace(" - YouTube", "").trim() || "YouTube Video";
      }
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    return "YouTube Video";
  }
}
