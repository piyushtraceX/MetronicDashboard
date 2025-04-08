import React from 'react';

interface HeadProps {
  title?: string;
  description?: string;
}

export function Head({ title, description }: HeadProps) {
  React.useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }
    
    // Update meta description if provided
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
    }
    
    // Add Font Awesome if it's not already loaded
    if (!document.querySelector('link[href*="fontawesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      fontAwesomeLink.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
      fontAwesomeLink.crossOrigin = 'anonymous';
      fontAwesomeLink.referrerPolicy = 'no-referrer';
      document.head.appendChild(fontAwesomeLink);
    }
    
    // Cleanup function
    return () => {
      // Reset title when component unmounts (optional)
      // document.title = 'EUDR Comply';
    };
  }, [title, description]);
  
  // This component doesn't render anything
  return null;
}