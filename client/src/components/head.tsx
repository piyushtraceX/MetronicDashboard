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
    
    // Cleanup function
    return () => {
      // Reset title when component unmounts (optional)
      // document.title = 'EUDR Comply';
    };
  }, [title, description]);
  
  // This component doesn't render anything
  return null;
}