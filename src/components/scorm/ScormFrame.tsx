import { useRef, useEffect } from "react";

interface ScormFrameProps {
  url: string;
  title: string;
}

export function ScormFrame({ url, title }: ScormFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      console.log('Setting up iframe with URL:', url);
      
      iframe.onload = () => {
        console.log('SCORM content frame loaded:', url);
        
        // Try to access iframe content to check if it's loading properly
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log('Successfully accessed iframe document');
            console.log('Content type:', iframeDoc.contentType);
            console.log('Document ready state:', iframeDoc.readyState);
            console.log('Document URL:', iframeDoc.URL);
            console.log('Document location:', iframeDoc.location?.href);
            
            // Check if we can access the SCORM API
            const hasAPI = !!(window.API || window.API_1484_11);
            console.log('SCORM API available:', hasAPI);
            
            // Log the document body content length to verify content loading
            console.log('Document body length:', iframeDoc.body?.innerHTML?.length);
          }
        } catch (error) {
          console.error('Error accessing iframe content:', error);
        }
      };

      // Log any iframe errors
      iframe.onerror = (error) => {
        console.error('Iframe loading error:', error);
      };
    }
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full min-h-[800px] border-0 bg-white"
      title={title}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="origin"
    />
  );
}