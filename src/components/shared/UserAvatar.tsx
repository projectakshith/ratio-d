import { createAvatar } from '@dicebear/core';
import * as croodles from '@dicebear/croodles';
import { useMemo } from 'react';

export const UserAvatar = ({ seed, className }: { seed: string, className?: string }) => {
  const avatarSvg = useMemo(() => {
    return createAvatar(croodles, {
      seed: seed || 'default',
    }).toString();
  }, [seed]);

  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: avatarSvg }} 
    />
  );
};