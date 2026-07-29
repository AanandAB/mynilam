import React, { useState } from 'react'
import { usePropertyReviews, useCreateReview } from '@/app/hooks/use-reviews'
import { Button } from '@/components/ui/button'
import { Star, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/app/hooks/use-auth'
import { useRouter } from 'next/navigation'

export function ReviewSection({ propertyId }: { propertyId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const { data, isLoading } = usePropertyReviews(propertyId)
  const { mutate: submitReview, isPending, error } = useCreateReview()
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')

  if (isLoading) return <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />

  const reviews = data?.reviews || []
  const summary = data?.rating_summary
  
  const hasReviewed = reviews.some(r => r.reviewer.id === user?.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    
    submitReview({
      property_id: propertyId,
      overall_rating: rating,
      body
    }, {
      onSuccess: () => {
        setShowForm(false)
        setBody('')
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Reviews & Ratings</h3>
        {summary && summary.total_reviews > 0 && (
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-bold">{summary.average_rating.toFixed(1)}</span>
            <span className="text-slate-500">({summary.total_reviews} reviews)</span>
          </div>
        )}
      </div>

      {(!user || (user && user.role !== 'hostel_admin' && !hasReviewed)) && !showForm && (
        <Button onClick={() => {
          if (!user || user.role === 'guest') {
            router.push('/login')
            return
          }
          setShowForm(true)
        }} variant="outline" className="w-full sm:w-auto">
          {(!user || user.role === 'guest') ? 'Login to Write a Review' : 'Write a Review'}
        </Button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">Leave your review</h4>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setRating(star)}>
                <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell us about your experience..."
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
            required
          />
          {error && (
            <p className="text-red-500 text-sm font-semibold">
              {(error as any).response?.data?.error?.message || 'An error occurred while submitting.'}
            </p>
          )}
          <div className="flex space-x-2">
            <Button type="submit" disabled={isPending || !body.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setBody(''); }}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-slate-500 italic">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">{review.reviewer.full_name}</h5>
                    <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{review.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
