import { useEffect } from 'react';

const SITE_NAME = 'Yellow Pages Pakistan';
const DEFAULT_DOMAIN = (import.meta.env && import.meta.env.VITE_SITE_URL) || 'https://yellowpagespakistan.goshbuzz.com';

export default function SeoHead({
  title,
  description,
  canonicalPath = '',
  schema = null,
  ogType = 'website',
  ogImage = '/og-image.jpg',
}) {
  useEffect(() => {
    // 1. Document Title
    const fullTitle = /Yellow Pages|YP PK/.test(title) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // 2. Canonical URL — always the primary domain, never the host the visitor happens to be on
    const baseUrl = DEFAULT_DOMAIN;
    const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`;

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // 3. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 4. OpenGraph tags
    const ogTags = {
      'og:title': fullTitle,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:type': ogType,
      'og:image': ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`,
      'og:site_name': SITE_NAME,
      'twitter:title': fullTitle,
      'twitter:description': description,
      'twitter:image': ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`,
      'twitter:card': 'summary_large_image',
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      const isTwitter = property.startsWith('twitter:');
      const attr = isTwitter ? 'name' : 'property';
      let tag = document.querySelector(`meta[${attr}="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // 5. Injected JSON-LD Schema
    let scriptTag = document.getElementById('dynamic-page-schema');
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-page-schema';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      const schemaArray = Array.isArray(schema) ? schema : [schema];
      scriptTag.text = JSON.stringify(schemaArray.length === 1 ? schemaArray[0] : schemaArray);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, canonicalPath, schema, ogType, ogImage]);

  return null;
}
