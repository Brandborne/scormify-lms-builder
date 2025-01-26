import { useRef, useEffect } from "react";
import { debounce } from "lodash";

interface ScormFrameProps {
  url: string;
  title: string;
}

export function ScormFrame({ url, title }: ScormFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = debounce(() => {
      console.log('SCORM content frame loaded:', iframe.src);
      
      try {
        if (iframe.contentWindow) {
          console.log('Successfully accessed iframe content window');
          
          // Add CSP meta tag to allow inline styles and scripts
          try {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline';";
            
            if (iframe.contentDocument?.head) {
              iframe.contentDocument.head.appendChild(meta);
              
              // Also add base target to handle relative URLs
              const base = document.createElement('base');
              base.target = '_self';
              iframe.contentDocument.head.appendChild(base);
            }

            const hasScormDriver = iframe.contentWindow.document.querySelector('script[src*="scormdriver.js"]');
            console.log('ScormDriver script found:', !!hasScormDriver);
            
            console.log('SCORM API available:', !!iframe.contentWindow.API);
            console.log('SCORM 2004 API available:', !!iframe.contentWindow.API_1484_11);
          } catch (contentError) {
            console.error('Error accessing iframe content:', {
              name: contentError.name,
              message: contentError.message,
              stack: contentError.stack
            });
          }
        }
      } catch (error) {
        console.error('Error accessing iframe content:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
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
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full min-h-[800px] border-0 bg-white"
      title={title}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write; fullscreen; microphone; camera; display-capture; web-share"
      loading="eager"
    />
  );
}