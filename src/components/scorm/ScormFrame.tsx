import { useRef } from "react";

interface ScormFrameProps {
  url: string;
  title: string;
}

export function ScormFrame({ url, title }: ScormFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full h-[600px] border-0"
      title={title}
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="no-referrer"
    />
  );
}