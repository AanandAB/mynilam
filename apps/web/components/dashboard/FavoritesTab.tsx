import React from 'react'
import { PropertyCard } from '../properties/PropertyCard'
import { useFavorites, useToggleFavorite } from '@/app/hooks/use-favorites'
import { HeartOff } from 'lucide-react'

export function FavoritesTab() {
  const { data, isLoading } = useFavorites()
  const { mutate: toggleFavorite } = useToggleFavorite()

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const favorites = data || []

  if (favorites.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No favorites yet</h3>
        <p className="text-slate-500 dark:text-slate-400">
          Properties you mark as favorite will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((property) => (
        <div key={property.id} className="relative">
          <PropertyCard property={property} />
          <button
            onClick={() => toggleFavorite(property.id)}
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-red-500 hover:bg-white hover:text-red-600 transition-colors"
            title="Remove from favorites"
          >
            <HeartOff className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
