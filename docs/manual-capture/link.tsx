import React from 'react';
export default function Link({ href, children, ...props }: any) {
  const address = typeof href === 'string' ? href : href.pathname + (href.query ? '?' + new URLSearchParams(href.query) : '');
  return <a href={address} {...props}>{children}</a>;
}
