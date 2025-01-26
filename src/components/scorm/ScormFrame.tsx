import { useRef, useEffect } from "react";

interface ScormFrameProps {
  url: string;
  title: string;
}

export function ScormFrame({ url, title }: ScormFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    console.log('Setting up iframe with URL:', url);
    
    const iframe = iframeRef.current;
    if (iframe) {
      // Set basic sandbox permissions needed for SCORM
      const sandboxPermissions = 'allow-same-origin allow-scripts allow-forms allow-popups';
      iframe.setAttribute('sandbox', sandboxPermissions);
      console.log('Sandbox permissions set:', sandboxPermissions);
      
      iframe.onload = () => {
        console.log('SCORM content frame loaded:', iframe.src);
        console.log('Final sandbox permissions:', iframe.getAttribute('sandbox'));
        
        try {
          if (iframe.contentWindow) {
            console.log('Successfully accessed iframe content window');
          }
        } catch (error) {
          if (error instanceof DOMException) {
            console.error('Security policy violation:', {
              name: error.name,
              message: error.message,
              code: error.code
            });
          } else {
            console.error('Error accessing iframe content:', error);
          }
        }
      };

      iframe.onerror = (event: Event | string) => {
        if (event instanceof Event) {
          console.error('Iframe loading error:', {
            type: event.type,
            bubbles: event.bubbles,
            cancelable: event.cancelable,
            timeStamp: event.timeStamp
          });
        } else {
          console.error('Iframe loading error:', event);
        }
      };
    }

    return () => {
      if (iframe) {
        console.log('Cleaning up iframe event listeners');
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
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      loading="eager"
      crossOrigin="anonymous"
    />
  );
}