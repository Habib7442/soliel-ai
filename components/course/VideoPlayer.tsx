"use client";

interface VideoPlayerProps {
  url: string;
  title?: string;
}

// Helper function to extract YouTube video ID
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper function to extract Vimeo video ID
function getVimeoId(url: string): string | null {
  const pattern = /vimeo\.com\/(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  // Check if it's a YouTube URL
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Check if it's a Vimeo URL
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg">
        <iframe
          className="w-full h-full"
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title={title || "Video"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // For direct video URLs (MP4, etc.)
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg bg-black">
        <video
          className="w-full h-full"
          controls
          preload="metadata"
        >
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback for unknown URL formats
  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center p-6">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Unsupported video format
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-sm"
        >
          Open video in new tab
        </a>
      </div>
    </div>
  );
}
