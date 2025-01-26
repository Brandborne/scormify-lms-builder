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
      // Force set sandbox attribute to ensure it's applied
      const sandboxPermissions = 'allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation allow-presentation';
      iframe.setAttribute('sandbox', sandboxPermissions);
      console.log('Sandbox permissions after force set:', sandboxPermissions);
      
      iframe.onload = () => {
        console.log('SCORM content frame loaded:', iframe.src);
        console.log('Final sandbox permissions:', iframe.getAttribute('sandbox'));
        
        // Try to access iframe content with more detailed error handling
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log('Successfully accessed iframe document');
            console.log('Document ready state:', iframeDoc.readyState);
            console.log('Document URL:', iframeDoc.URL);
            
            // Check if document is actually loaded
            if (iframeDoc.readyState === 'complete') {
              console.log('Document fully loaded');
              
              // Check for specific SCORM-related elements
              const scormContent = iframeDoc.querySelector('#scorm_content');
              if (scormContent) {
                console.log('SCORM content container found');
              } else {
                console.warn('No SCORM content container found in document');
              }
              
              // Log body content for debugging
              console.log('Document body exists:', !!iframeDoc.body);
              if (iframeDoc.body) {
                console.log('Body content length:', iframeDoc.body.innerHTML.length);
              }
            } else {
              console.warn('Document not fully loaded, state:', iframeDoc.readyState);
            }
          } else {
            console.error('Could not access iframe document - null reference');
          }
        } catch (error) {
          console.error('Error accessing iframe content:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            type: error instanceof SecurityError ? 'SecurityError' : 'Unknown'
          });
          
          // Additional error context
          if (error instanceof SecurityError) {
            console.error('Security policy violation - check CORS and sandbox settings');
          }
        }
      };

      // Enhanced error handling for iframe loading
      iframe.onerror = (event) => {
        console.error('Iframe loading error:', {
          type: event.type,
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          timeStamp: event.timeStamp
        });
      };
    } else {
      console.error('No iframe reference available');
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
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation allow-presentation"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      loading="eager"
    />
  );
}