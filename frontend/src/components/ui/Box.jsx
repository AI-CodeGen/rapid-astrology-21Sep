import React from 'react';
import clsx from 'clsx';

// Box: page-level section wrapper below fixed header
export function Box({ className = '', children }) {
  return (
    <div
      className={clsx(
        'mt-20 mb-10 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Box;