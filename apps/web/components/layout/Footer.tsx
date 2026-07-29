import React from 'react'
import Link from 'next/link'
import { Home, Mail, ArrowRight } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center space-x-2 text-white">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Home className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">MyNilam</span>
            </Link>
            <p className="text-sm max-w-sm leading-relaxed">
              Find, rent, or buy your next property with ease. A modern real-estate marketplace offering apartments, flats, villas, plots, and roommate listings.
            </p>
            <form className="flex max-w-sm">
              <div className="relative w-full">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-11 pr-12 text-sm text-white focus:outline-none focus:border-indigo-600 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Links Cols */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Explore</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Buy Properties</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Rent Properties</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Roommate Search</Link></li>
              <li><Link href="/settings" className="hover:text-white transition-colors">Premium Listings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Contact Safety</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-900 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} MyNilam. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/" className="hover:text-gray-400">Facebook</Link>
            <Link href="/" className="hover:text-gray-400">Twitter</Link>
            <Link href="/" className="hover:text-gray-400">Instagram</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
