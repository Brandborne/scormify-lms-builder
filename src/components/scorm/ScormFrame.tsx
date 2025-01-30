import { useRef, useEffect } from "react";
import { debounce } from "lodash";
import { generateNonce } from "@/lib/utils";

interface ScormFrameProps {
  url: string;
  title: string;
  scormVersion?: string;
}

export function ScormFrame({ url, title, scormVersion }: ScormFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const nonce = generateNonce();

  useEffect(() => {
    // Check content type of the URL
    fetch(url, { method: 'HEAD' })
      .then(response => {
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Disposition:', response.headers.get('content-disposition'));
        console.log('Full response headers:', Object.fromEntries([...response.headers]));
      })
      .catch(error => {
        console.error('Error checking content type:', error);
      });

    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = debounce(() => {
      console.log('SCORM content frame loaded:', iframe.src);
      console.log('SCORM Version:', scormVersion);
      
      try {
        if (iframe.contentWindow) {
          console.log('Successfully accessed iframe content window');
          
          if (iframe.contentDocument?.head) {
            // Remove any existing CSP meta tags
            const existingCspTags = iframe.contentDocument.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
            existingCspTags.forEach(tag => tag.remove());
            
            // Add new CSP meta tag with more permissive policy
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = `
              default-src * 'self' blob: data:;
              style-src * 'self' 'unsafe-inline' 'nonce-${nonce}';
              script-src * 'unsafe-inline' 'unsafe-eval';
              img-src * data: blob:;
              connect-src *;
              frame-src *;
            `.replace(/\s+/g, ' ').trim();
            iframe.contentDocument.head.appendChild(meta);
            
            // Add base target for relative URLs
            const base = document.createElement('base');
            base.target = '_self';
            iframe.contentDocument.head.appendChild(base);

            // Add nonce to all style tags
            const styleTags = iframe.contentDocument.getElementsByTagName('style');
            Array.from(styleTags).forEach(style => {
              style.nonce = nonce;
            });
          }

          // Log SCORM API availability for debugging
          const hasScormDriver = iframe.contentWindow.document.querySelector('script[src*="scormdriver.js"]');
          console.log('ScormDriver script found:', !!hasScormDriver);
          console.log('SCORM API available:', !!iframe.contentWindow.API);
          console.log('SCORM 2004 API available:', !!iframe.contentWindow.API_1484_11);
        }
      } catch (error) {
        console.error('Error accessing iframe content:', error);
      }
    }, 300);

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', (event) => {
      console.error('Iframe loading error:', event);
    });

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', () => {});
    };
  }, [url, nonce, scormVersion]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full min-h-[800px] border-0 bg-white"
      title={title}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-storage-access-by-user-activation allow-presentation"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write; fullscreen; microphone; camera; display-capture; web-share"
      loading="eager"
      referrerPolicy="origin"
    />
  );
}