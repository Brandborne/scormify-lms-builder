import { useRef, useEffect } from "react";

interface ScormFrameProps {
  url: string;
  title: string;
}

export function ScormFrame({ url, title }: ScormFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    console.log('ScormFrame: Component mounted');
    console.log('ScormFrame: Initial URL:', url);
    
    const iframe = iframeRef.current;
    if (iframe) {
      console.log('ScormFrame: Iframe reference obtained');
      
      // Force set sandbox attribute to ensure it's applied
      const sandboxPermissions = 'allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation allow-presentation';
      iframe.setAttribute('sandbox', sandboxPermissions);
      console.log('ScormFrame: Sandbox permissions set:', sandboxPermissions);
      
      iframe.onload = () => {
        console.log('ScormFrame: Iframe loaded');
        console.log('ScormFrame: Current URL:', iframe.src);
        console.log('ScormFrame: Final sandbox permissions:', iframe.getAttribute('sandbox'));
        
        // Try to access iframe content to check if it's loading properly
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log('ScormFrame: Successfully accessed iframe document');
            console.log('ScormFrame: Document ready state:', iframeDoc.readyState);
            console.log('ScormFrame: Document URL:', iframeDoc.URL);
            console.log('ScormFrame: Document location:', iframeDoc.location?.href);
            
            // Check if we can access the SCORM API
            const hasAPI = !!(window.API || window.API_1484_11);
            console.log('ScormFrame: SCORM API available:', hasAPI);
            if (!hasAPI) {
              console.warn('ScormFrame: SCORM API not found on window object');
            }
            
            // Log the document body content length to verify content loading
            const bodyLength = iframeDoc.body?.innerHTML?.length || 0;
            console.log('ScormFrame: Document body length:', bodyLength);
            if (bodyLength === 0) {
              console.warn('ScormFrame: Document body is empty');
            }
          } else {
            console.error('ScormFrame: Could not access iframe document');
          }
        } catch (error) {
          console.error('ScormFrame: Error accessing iframe content:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      };

      // Log any iframe errors
      iframe.onerror = (error) => {
        console.error('ScormFrame: Iframe loading error:', error);
      };
    } else {
      console.error('ScormFrame: No iframe reference available');
    }

    return () => {
      console.log('ScormFrame: Component unmounting');
      if (iframe) {
        console.log('ScormFrame: Cleaning up iframe');
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
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation allow-presentation"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      loading="eager"
    />
  );
}