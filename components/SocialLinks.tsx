import { Mail } from 'lucide-react';
import type { LandingContent } from '@/lib/landing-content';

export default function SocialLinks({ content }: { content: LandingContent }) {
  return (
    <div className="social-links">
      {content.instagram && (
        <a href={content.instagram} aria-label={`Instagram: ${content.instagram}`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span>{content.instagram.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      {content.tiktok && (
        <a href={content.tiktok} aria-label={`TikTok: ${content.tiktok}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.7 1h-3.4v14.6a3.2 3.2 0 1 1-2.8-3.2V9a6.6 6.6 0 1 0 6.2 6.6V8.2A8.2 8.2 0 0 0 22 10V6.6A5.3 5.3 0 0 1 16.7 1Z" />
          </svg>
          <span>{content.tiktok.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      <a href={`mailto:${content.contactEmail}`} aria-label={`Email: ${content.contactEmail}`}>
        <Mail size={20} aria-hidden="true" />
        <span>{content.contactEmail}</span>
      </a>
    </div>
  );
}
