import { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string;
  name?: string;
  /** Sizing + rounding are controlled by the caller, e.g. "w-10 h-10 rounded-full". */
  className?: string;
}

// Shows the profile photo when present, and falls back to a neutral person
// icon when there is no avatar or the image fails to load — so a missing
// picture never renders as a broken-image icon.
export function UserAvatar({ src, name, className = '' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <div className={`inline-flex items-center justify-center overflow-hidden bg-thrift-border text-thrift-text-secondary ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={name ?? ''}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="w-1/2 h-1/2" />
      )}
    </div>
  );
}
