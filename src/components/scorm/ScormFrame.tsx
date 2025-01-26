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

    // Set basic sandbox permissions needed for SCORM
    const sandboxPermissions = 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-top-navigation';
    iframe.setAttribute('sandbox', sandboxPermissions);

    const handleLoad = debounce(() => {
      console.log('SCORM content frame loaded:', iframe.src);
      
      try {
        if (iframe.contentWindow) {
          // Try to inject a meta tag to set CSP for the iframe content
          const meta = document.createElement('meta');
          meta.setAttribute('http-equiv', 'Content-Security-Policy');
          meta.setAttribute('content', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';");
          
          if (iframe.contentDocument && iframe.contentDocument.head) {
            iframe.contentDocument.head.appendChild(meta);
          }
          
          console.log('Successfully accessed iframe content window');
        }
      } catch (error) {
        console.error('Error accessing iframe content:', error);
      }
    }, 300);

    iframe.onload = handleLoad;
    iframe.onerror = (event) => {
      console.error('Iframe loading error:', event);
    };

    return () => {
      if (iframe) {
        iframe.onload = null;
        iframe.onerror = null;
      }
    };
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full min-h-[800px] border-0 bg-white"
      title={title}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-top-navigation"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; clipboard-write; fullscreen; microphone; camera; display-capture; web-share"
      loading="eager"
      security="restricted"
    />
  );
}