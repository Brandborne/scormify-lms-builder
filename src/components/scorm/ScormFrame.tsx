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
          meta.content = `default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; frame-src *; style-src * 'unsafe-inline';`;
          iframe.contentDocument.head.insertBefore(meta, iframe.contentDocument.head.firstChild);

          // Add base target for relative URLs
          const base = document.createElement('base');
          base.target = '_self';
          iframe.contentDocument.head.appendChild(base);

          // Pre-inject SCORM API bridge script
          const bridgeScript = document.createElement('script');
          bridgeScript.textContent = `
            if (!window.API && !window.API_1484_11) {
              window.API = window.parent.API;
              window.API_1484_11 = window.parent.API_1484_11;
              console.log('SCORM API bridge initialized:', {
                API: !!window.API,
                API_1484_11: !!window.API_1484_11
              });
            }
          `;
          iframe.contentDocument.head.appendChild(bridgeScript);

          // Enhanced script loading monitoring
          const scriptLoadMonitor = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                if (node instanceof HTMLScriptElement) {
                  const scriptInfo = {
                    src: node.src,
                    type: node.type,
                    async: node.async,
                    defer: node.defer,
                    textContent: node.textContent?.substring(0, 100) + '...'
                  };
                  console.log('Script loaded:', scriptInfo);

                  // Add load/error handlers
                  node.addEventListener('load', () => {
                    console.log('Script loaded successfully:', node.src);
                  });
                  node.addEventListener('error', (error) => {
                    console.error('Script failed to load:', node.src, error);
                  });
                }
              });
            });
          });

          scriptLoadMonitor.observe(iframe.contentDocument, {
            childList: true,
            subtree: true
          });

          // Log document readiness
          console.log('Document readyState:', iframe.contentDocument.readyState);
          iframe.contentDocument.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded event fired');
            const scripts = Array.from(iframe.contentDocument.getElementsByTagName('script'));
            console.log('Scripts found after DOMContentLoaded:', scripts.length);
          });
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
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-storage-access-by-user-activation allow-presentation allow-orientation-lock allow-pointer-lock allow-popups-to-escape-sandbox"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write; fullscreen; microphone; camera; display-capture; web-share"
      loading="eager"
      referrerPolicy="origin"
    />
  );
}