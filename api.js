// ========== API CONFIGURATION ==========
const API_CONFIG = {
    baseUrl: "https://api-faa.my.id/faa/youtube",
    defaultQuery: "Game",
    timeout: 10000
};

// ========== API FUNCTIONS ==========
async function searchYouTube(query) {
    if (!query || query.trim() === "") {
        throw new Error("Query tidak boleh kosong");
    }
    
    const url = `${API_CONFIG.baseUrl}?q=${encodeURIComponent(query)}`;
    console.log("Fetching:", url);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("API Response:", data);
        
        if (!data || !data.result) {
            return [];
        }
        
        return data.result;
    } catch (error) {
        console.error("API Error:", error);
        if (error.name === "AbortError") {
            throw new Error("Request timeout - server terlalu lama merespon");
        }
        throw error;
    }
}

// ========== VIDEO ID EXTRACTOR ==========
function extractVideoId(video) {
    if (!video) return null;
    
    // Priority 1: Langsung dari property
    if (video.videoId) return video.videoId;
    if (video.id) return video.id;
    
    // Priority 2: Dari URL
    const urlPatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /[?&]v=([a-zA-Z0-9_-]{11})/,
        /\/([a-zA-Z0-9_-]{11})(?:\?|$)/
    ];
    
    const urlsToCheck = [video.url, video.link, video.embed_url];
    for (const url of urlsToCheck) {
        if (url && typeof url === "string") {
            for (const pattern of urlPatterns) {
                const match = url.match(pattern);
                if (match && match[1]) return match[1];
            }
        }
    }
    
    // Priority 3: Fallback - cari string 11 karakter
    const str = JSON.stringify(video);
    const fallbackMatch = str.match(/[a-zA-Z0-9_-]{11}/);
    if (fallbackMatch && fallbackMatch[0].length === 11) {
        console.warn("Fallback extracted ID:", fallbackMatch[0]);
        return fallbackMatch[0];
    }
    
    return null;
}

// ========== VIDEO DETECTION ==========
function isShortVideo(video) {
    // Check by duration
    const duration = video.duration || "";
    if (duration) {
        const parts = duration.split(":");
        let totalSeconds = 0;
        if (parts.length === 2) {
            totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 3) {
            totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        if (totalSeconds > 0 && totalSeconds <= 60) return true;
    }
    
    // Check by title hashtag
    if (video.title && video.title.toLowerCase().includes("#shorts")) return true;
    
    return false;
}

// ========== THUMBNAIL GENERATOR ==========
function getThumbnailUrl(video) {
    const videoId = extractVideoId(video);
    if (videoId) {
        return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    }
    return video.thumbnail || video.thumb || "https://via.placeholder.com/480x270?text=No+Thumbnail";
}

// ========== FORMAT NUMBER ==========
function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
}

// ========== ESCAPE HTML ==========
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
