// ========== GLOBAL VARIABLES ==========
let allVideos = [];
let regularVideos = [];
let shortsVideos = [];
let currentTab = "videos";
let currentQuery = "Game";

// Voice recognition
let recognition = null;
let isListening = false;

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
    // Hide loading screen after 1 second
    setTimeout(() => {
        const loadingScreen = document.getElementById("loadingScreen");
        loadingScreen.classList.add("hide");
        setTimeout(() => {
            loadingScreen.style.display = "none";
            document.getElementById("mainContent").classList.add("show");
        }, 400);
    }, 1000);
    
    // Initialize components
    initSpeechRecognition();
    renderChips();
    searchWithQuery("Game");
    
    // Event listeners
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchVideos();
    });
    
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeNormalPlayer();
    });
});

// ========== VOICE SEARCH ==========
function initSpeechRecognition() {
    if ("webkitSpeechRecognition" in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = "id-ID";
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            isListening = true;
            document.getElementById("voiceBtn").classList.add("listening");
            showToast("🎤 Dengarkan...");
        };
        
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById("searchInput").value = text;
            showToast(`✅ "${text}"`);
            setTimeout(() => searchVideos(), 200);
        };
        
        recognition.onerror = (event) => {
            let msg = "❌ Coba lagi";
            if (event.error === "not-allowed") msg = "❌ Izinkan mic dulu";
            showToast(msg);
            stopListening();
        };
        
        recognition.onend = () => stopListening();
    } else {
        console.warn("Speech recognition not supported");
    }
}

function startVoiceSearch() {
    if (!recognition) {
        initSpeechRecognition();
    }
    if (recognition && !isListening) {
        try {
            recognition.start();
        } catch (e) {
            console.error("Voice start error:", e);
        }
    }
}

function stopListening() {
    isListening = false;
    const voiceBtn = document.getElementById("voiceBtn");
    if (voiceBtn) voiceBtn.classList.remove("listening");
}

function showToast(message) {
    const existingToast = document.querySelector(".voice-toast");
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement("div");
    toast.className = "voice-toast";
    toast.innerHTML = `<i class="fas fa-microphone"></i>${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 1500);
}

// ========== UI COMPONENTS ==========
const chips = ["Semua", "Game", "Music", "Coding", "Vlog", "Movie", "Sport"];

function renderChips() {
    const container = document.getElementById("chipsContainer");
    if (!container) return;
    
    container.innerHTML = chips.map(chip => `
        <div class="chip ${chip === "Semua" ? "active" : ""}" onclick="searchWithQuery('${chip === "Semua" ? "Game" : chip}')">
            ${chip}
        </div>
    `).join("");
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab UI
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.nav-tab[data-tab="${tab}"]`).classList.add("active");
    
    // Update sidebar
    document.querySelectorAll(".sidebar-item").forEach((item, i) => {
        item.classList.remove("active");
        if ((i === 0 && tab === "videos") || (i === 1 && tab === "shorts")) {
            item.classList.add("active");
        }
    });
    
    // Display content
    if (tab === "videos") {
        displayRegularVideos();
    } else {
        displayShortsVideos();
    }
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

// ========== VIDEO PLAYER ==========
function playNormalVideo(video) {
    const videoId = extractVideoId(video);
    console.log("Playing video ID:", videoId);
    
    if (videoId && videoId.length === 11) {
        const iframe = document.getElementById("normalIframe");
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=1&playsinline=1&enablejsapi=1`;
        iframe.src = embedUrl;
        
        document.getElementById("normalTitle").innerText = video.title || "No Title";
        document.getElementById("normalChannel").innerHTML = video.channel || video.author || "Channel";
        document.getElementById("normalPlayer").classList.add("active");
        document.body.style.overflow = "hidden";
    } else {
        alert("Tidak bisa memutar video. Video ID tidak ditemukan.");
        console.log("Video data:", video);
    }
}

function closeNormalPlayer() {
    const iframe = document.getElementById("normalIframe");
    if (iframe) iframe.src = "";
    document.getElementById("normalPlayer").classList.remove("active");
    document.body.style.overflow = "";
}

// ========== SHORTS FEED (TIKTOK STYLE) ==========
function openShortsFeed(startIndex = 0) {
    if (!shortsVideos.length) return;
    
    const feedDiv = document.createElement("div");
    feedDiv.className = "shorts-feed active";
    
    shortsVideos.forEach((video, idx) => {
        const videoId = extractVideoId(video);
        const item = document.createElement("div");
        item.className = "feed-item";
        item.innerHTML = `
            <div class="feed-player">
                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=${idx === startIndex ? 1 : 0}&rel=0&controls=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
            </div>
            <div class="feed-info">
                <div class="feed-title">${escapeHtml(video.title || "No Title")}</div>
                <div class="feed-channel">${escapeHtml(video.channel || video.author || "Channel")}</div>
                <div class="feed-stats">👁️ ${formatNumber(video.views || Math.floor(Math.random() * 100000))}</div>
            </div>
            <div class="feed-actions">
                <div class="feed-action"><i class="far fa-heart"></i><span>0</span></div>
                <div class="feed-action"><i class="far fa-comment"></i><span>0</span></div>
            </div>
        `;
        feedDiv.appendChild(item);
    });
    
    const closeBtn = document.createElement("div");
    closeBtn.className = "close-feed";
    closeBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
    closeBtn.onclick = () => {
        document.body.removeChild(feedDiv);
        document.body.removeChild(closeBtn);
        document.body.style.overflow = "";
    };
    
    document.body.appendChild(feedDiv);
    document.body.appendChild(closeBtn);
    document.body.style.overflow = "hidden";
    
    // Scroll to selected index
    setTimeout(() => {
        if (feedDiv.children[startIndex]) {
            feedDiv.children[startIndex].scrollIntoView({ behavior: "smooth" });
        }
    }, 100);
    
    // Autoplay/pause on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const iframe = entry.target.querySelector("iframe");
            if (iframe) {
                const src = iframe.src;
                if (entry.isIntersecting) {
                    iframe.src = src.replace("autoplay=0", "autoplay=1");
                } else {
                    iframe.src = src.replace("autoplay=1", "autoplay=0");
                }
            }
        });
    }, { threshold: 0.5 });
    
    Array.from(feedDiv.children).forEach(item => observer.observe(item));
}

// ========== SEARCH & DISPLAY ==========
async function searchWithQuery(query) {
    if (!query) return;
    currentQuery = query;
    
    // Update active chip
    document.querySelectorAll(".chip").forEach(chip => {
        chip.classList.remove("active");
        if (chip.innerText === query || (query === "Game" && chip.innerText === "Semua")) {
            chip.classList.add("active");
        }
    });
    
    // Show loading
    const contentArea = document.getElementById("contentArea");
    contentArea.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Loading...</div>';
    
    try {
        const results = await searchYouTube(query);
        
        if (results && results.length > 0) {
            allVideos = results;
            regularVideos = allVideos.filter(v => !isShortVideo(v));
            shortsVideos = allVideos.filter(v => isShortVideo(v));
            
            console.log(`Total: ${allVideos.length}, Regular: ${regularVideos.length}, Shorts: ${shortsVideos.length}`);
            
            if (currentTab === "videos") {
                displayRegularVideos();
            } else {
                displayShortsVideos();
            }
        } else {
            contentArea.innerHTML = '<div class="loading-state">😢 Tidak ada video ditemukan</div>';
        }
    } catch (error) {
        console.error("Search error:", error);
        contentArea.innerHTML = `<div class="loading-state">⚠️ Error: ${error.message}</div>`;
    }
}

function searchVideos() {
    const query = document.getElementById("searchInput").value;
    if (query.trim()) {
        searchWithQuery(query);
    }
}

function displayRegularVideos() {
    const container = document.getElementById("contentArea");
    
    if (!regularVideos.length) {
        container.innerHTML = '<div class="loading-state">📺 Tidak ada video biasa</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="section-header"><span>📹 Video</span></div>
        <div class="video-grid" id="videoGrid"></div>
    `;
    
    const grid = document.getElementById("videoGrid");
    
    regularVideos.forEach(video => {
        const card = document.createElement("div");
        card.className = "video-card";
        card.onclick = () => playNormalVideo(video);
        card.innerHTML = `
            <div class="thumbnail-container">
                <img class="thumbnail" src="${getThumbnailUrl(video)}" loading="lazy" onerror="this.src='https://via.placeholder.com/480x270'">
                <span class="duration">${video.duration || "0:00"}</span>
            </div>
            <div class="video-details">
                <div class="channel-avatar"><i class="fas fa-user"></i></div>
                <div class="video-info">
                    <div class="video-title">${escapeHtml(video.title || "No Title")}</div>
                    <div class="channel-name">${escapeHtml(video.channel || video.author || "Channel")}</div>
                    <div class="metadata">👁️ ${formatNumber(video.views || Math.floor(Math.random() * 500000))}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function displayShortsVideos() {
    const container = document.getElementById("contentArea");
    
    if (!shortsVideos.length) {
        container.innerHTML = '<div class="loading-state">🔥 Tidak ada Shorts</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="section-header">
            <span>🔥 Shorts</span>
            <div class="open-feed-btn" onclick="openShortsFeed(0)"><i class="fas fa-arrow-right"></i> Scroll</div>
        </div>
        <div class="shorts-grid" id="shortsGrid"></div>
    `;
    
    const grid = document.getElementById("shortsGrid");
    
    shortsVideos.forEach((video, idx) => {
        const card = document.createElement("div");
        card.className = "shorts-card";
        card.onclick = () => openShortsFeed(idx);
        card.innerHTML = `
            <div class="shorts-thumbnail">
                <img src="${getThumbnailUrl(video)}" loading="lazy" onerror="this.src='https://via.placeholder.com/360x640'">
                <div class="shorts-badge"><i class="fas fa-fire"></i> #Shorts</div>
            </div>
            <div class="shorts-title">${escapeHtml(video.title || "No Title")}</div>
            <div class="shorts-stats">👁️ ${formatNumber(video.views || Math.floor(Math.random() * 100000))}</div>
        `;
        grid.appendChild(card);
    });
}

// ========== PWA INSTALL ==========
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById("installBtn");
    installBtn.style.display = "flex";
    installBtn.onclick = () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            installBtn.style.display = "none";
        });
    };
});
