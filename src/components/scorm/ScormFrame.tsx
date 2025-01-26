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
      // Removed 'allow-presentation' as it's invalid
      const sandboxPermissions = 'allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation';
      iframe.setAttribute('sandbox', sandboxPermissions);
      console.log('Sandbox permissions after force set:', sandboxPermissions);
      
      iframe.onload = () => {
        console.log('SCORM content frame loaded:', iframe.src);
        console.log('Final sandbox permissions:', iframe.getAttribute('sandbox'));
        
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log('Successfully accessed iframe document');
            console.log('Document ready state:', iframeDoc.readyState);
            console.log('Document URL:', iframeDoc.URL);
            
            if (iframeDoc.readyState === 'complete') {
              console.log('Document fully loaded');
              
              const scormContent = iframeDoc.querySelector('#scorm_content');
              if (scormContent) {
                console.log('SCORM content container found');
              } else {
                console.warn('No SCORM content container found in document');
              }
              
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
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            type: error instanceof DOMException ? 'DOMException' : 'Unknown'
          });
          
          if (error instanceof DOMException) {
            console.error('Security policy violation - check CORS and sandbox settings');
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
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      loading="eager"
    />
  );
}