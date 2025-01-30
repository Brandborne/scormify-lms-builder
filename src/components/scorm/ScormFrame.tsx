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
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setupIframe = () => {
      console.log('Setting up iframe for SCORM content...');
      
      try {
        if (iframe.contentWindow && iframe.contentDocument?.head) {
          console.log('Successfully accessed iframe content window');
          
          // Remove any existing CSP meta tags
          const existingCspTags = iframe.contentDocument.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
          existingCspTags.forEach(tag => tag.remove());
          
          // Add new CSP meta tag with more permissive policy
          const meta = document.createElement('meta');
          meta.httpEquiv = 'Content-Security-Policy';
          meta.content = `
            default-src * 'self' data: blob:;
            script-src * 'self' 'unsafe-inline' 'unsafe-eval' blob:;
            style-src * 'self' 'unsafe-inline';
            img-src * data: blob:;
            connect-src *;
            frame-src *;
            worker-src * blob:;
          `.replace(/\s+/g, ' ').trim();
          
          iframe.contentDocument.head.insertBefore(meta, iframe.contentDocument.head.firstChild);
          
          // Add base target for relative URLs
          const base = document.createElement('base');
          base.target = '_self';
          iframe.contentDocument.head.appendChild(base);

          // Log SCORM API availability for debugging
          console.log('Document readyState:', iframe.contentDocument.readyState);
          console.log('SCORM API Window object:', {
            API: !!window.API,
            API_1484_11: !!window.API_1484_11
          });
          
          // Check for ScormDriver
          const hasScormDriver = iframe.contentDocument.querySelector('script[src*="scormdriver.js"]');
          console.log('ScormDriver script found:', !!hasScormDriver);
          
          // Log content type information
          console.log('Content-Type meta:', iframe.contentDocument.querySelector('meta[http-equiv="Content-Type"]')?.getAttribute('content'));
        }
      } catch (error) {
        console.error('Error setting up iframe:', error);
      }
    };

    const handleLoad = debounce(() => {
      console.log('SCORM content frame loaded:', iframe.src);
      console.log('SCORM Version:', scormVersion);
      setupIframe();
    }, 300);

    iframe.addEventListener('load', handleLoad);
    setupIframe();

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [url, nonce, scormVersion]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full min-h-[800px] border-0 bg-white"
      title={title}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-storage-access-by-user-activation allow-presentation allow-orientation-lock allow-pointer-lock"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write; fullscreen; microphone; camera; display-capture; web-share"
      loading="eager"
      referrerPolicy="origin"
    />
  );
}