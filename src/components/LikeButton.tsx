import React from 'react';
import { Heart } from 'lucide-react';

// Les « j'aime » sont chargés une seule fois pour toute la timeline (useLikesSummary)
interface LikeButtonProps {
  likesCount: number;
  isLiked: boolean;
  loading?: boolean;
  onToggle: () => void | Promise<void>;
  className?: string;
}

export function LikeButton({ likesCount, isLiked, loading = false, onToggle: toggleLike, className = '' }: LikeButtonProps) {

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!loading) {
      await toggleLike();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
        isLiked
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${className}`}
      title={isLiked ? 'Retirer le J\'aime' : 'J\'aime cette étape'}
    >
      <Heart 
        className={`h-4 w-4 transition-all duration-200 ${
          isLiked ? 'fill-current text-red-600' : 'text-gray-600'
        }`}
      />
      <span className="text-sm font-medium">
        {likesCount > 0 ? likesCount : ''}
      </span>
    </button>
  );
}
