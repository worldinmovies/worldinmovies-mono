import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogType?: 'website' | 'article' | 'profile' | 'video';
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
}

export const useSEO = ({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage,
  canonicalUrl,
  structuredData,
}: SEOConfig) => {
  useEffect(() => {
    // No-op when there is nothing to set yet (e.g. data still loading).
    if (!title) {
      return;
    }

    // Update title
    document.title = `${title} | World in Movies`;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Update keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // Update Open Graph tags
    const ogTags = {
      'og:type': ogType,
      'og:title': title,
      'og:description': description,
      ...(ogImage ? { 'og:image': ogImage } : {}),
      'og:site_name': 'World in Movies',
      'og:locale': 'en_US',
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let ogMeta = document.querySelector(`meta[property="${property}"]`);
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', property);
        document.head.appendChild(ogMeta);
      }
      ogMeta.setAttribute('content', content);
    });

    // Update Twitter Card tags
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let twitterMeta = document.querySelector(`meta[name="${name}"]`);
      if (!twitterMeta) {
        twitterMeta = document.createElement('meta');
        twitterMeta.setAttribute('name', name);
        document.head.appendChild(twitterMeta);
      }
      twitterMeta.setAttribute('content', content);
    });

    // Update canonical URL
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // Add structured data (JSON-LD)
    if (structuredData) {
      let scriptTag = document.getElementById('structured-data');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('id', 'structured-data');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function
    return () => {
      // Reset to defaults when component unmounts
      document.title = 'World in Movies - Discover International Cinema Masterpieces';
      const defaultMetaDesc = document.querySelector('meta[name="description"]');
      if (defaultMetaDesc) {
        defaultMetaDesc.setAttribute('content', 'Explore and track the finest international films from around the globe.');
      }
      // Remove injected JSON-LD script so stale structured data doesn't persist
      const scriptTag = document.getElementById('structured-data');
      if (scriptTag) {
        scriptTag.remove();
      }
    };
  }, [title, description, keywords, ogType, ogImage, canonicalUrl, structuredData]);
};
