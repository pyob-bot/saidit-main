"use client";

interface LinkEmbedProps {
  url: string;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinkEmbed({ url }: LinkEmbedProps) {
  const youtubeId = extractYouTubeId(url);
  const domain = extractDomain(url);

  if (youtubeId) {
    return (
      <div className="mt-2">
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="absolute inset-0 w-full h-full rounded"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      </div>
    );
  }

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  if (isImage) {
    return (
      <div className="mt-2">
        <img src={url} alt="Embedded content" className="max-h-[512px] object-contain rounded" loading="lazy" />
      </div>
    );
  }

  return (
    <div className="mt-2 border border-[#edeff1] rounded-lg overflow-hidden hover:border-[#898989] transition-colors">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3"
      >
        <div className="w-10 h-10 bg-[#f6f7f8] rounded flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[#1a1a1b] truncate">{domain}</div>
          <div className="text-xs text-[#878a8c] truncate">{url}</div>
        </div>
        <svg className="w-4 h-4 text-[#878a8c] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
