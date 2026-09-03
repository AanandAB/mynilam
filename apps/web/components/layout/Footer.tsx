import React from 'react'
import Link from 'next/link'
import { Home, Mail, ArrowRight } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-[#111b2e] border-t border-border-light dark:border-white/10 mt-auto">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white">
                <Home className="h-[18px] w-[18px]" />
              </div>
              <span className="text-lg font-bold text-navy dark:text-white">
                My<span className="text-brand">Nilam</span>
              </span>
            </Link>
            <p className="text-[13px] text-navy-500 leading-relaxed max-w-xs">
              Find, rent, or buy your next property with ease. A premium marketplace for apartments, PGs, hostels, and co-living spaces.
            </p>
            <div className="relative max-w-xs">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-navy-400 dark:text-slate-500" />
              <input
                type="email"
                placeholder="Your email address"
                className="w-full h-10 pl-10 pr-10 bg-surface-soft dark:bg-white/5 border border-border dark:border-white/10 rounded-xl text-[13px] text-navy dark:text-slate-200 placeholder:text-navy-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand transition-all"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 w-7 h-7 bg-brand hover:bg-brand-dark text-white rounded-lg flex items-center justify-center transition-colors">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[12px] font-bold text-navy dark:text-white uppercase tracking-wider mb-5">Explore</h4>
            <ul className="space-y-3">
              {['Buy Properties', 'Rent Properties', 'Roommate Search', 'Premium Listings'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-[13px] text-navy-500 dark:text-slate-400 hover:text-brand transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[12px] font-bold text-navy dark:text-white uppercase tracking-wider mb-5">Company</h4>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Blog', 'Press'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-[13px] text-navy-500 dark:text-slate-400 hover:text-brand transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[12px] font-bold text-navy dark:text-white uppercase tracking-wider mb-5">Support</h4>
            <ul className="space-y-3">
              {['Help Center', 'Contact Safety', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-[13px] text-navy-500 dark:text-slate-400 hover:text-brand transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border-light mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[12px] text-navy-400">
          <p className="text-navy-400 dark:text-slate-500">&copy; {new Date().getFullYear()} MyNilam. All rights reserved.</p>
          <div className="flex gap-5 mt-3 sm:mt-0">
            {['Facebook', 'Twitter', 'Instagram'].map((s) => (
              <Link key={s} href="/" className="hover:text-brand transition-colors">{s}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
