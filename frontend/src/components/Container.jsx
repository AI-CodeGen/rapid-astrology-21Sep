import React from 'react';

// Consistent horizontal padding + max width wrapper
export default function Container({ className = '', children, as: Tag = 'div' }) {
  return <Tag className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</Tag>;
}
