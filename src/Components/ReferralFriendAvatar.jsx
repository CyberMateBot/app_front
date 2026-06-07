import { useState } from 'react';

export default function ReferralFriendAvatar({ name, avatarUrl }) {
    const [imageError, setImageError] = useState(false);
    const initial = name?.trim()?.[0]?.toUpperCase() || '?';
    const showImage = Boolean(avatarUrl) && !imageError;

    return (
        <span
            className={`referral-concept__friend-avatar${showImage ? ' referral-concept__friend-avatar--photo' : ''}`}
        >
            {showImage ? (
                <img
                    src={avatarUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => setImageError(true)}
                />
            ) : (
                initial
            )}
        </span>
    );
}
