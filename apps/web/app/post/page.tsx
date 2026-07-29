'use client'

import React from 'react'
import { usePostPageModel, type FormListingType } from './PostPageModel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  ArrowRight, ArrowLeft, Home, Building2, Trees, Briefcase, Users, 
  Upload, Sparkles, CheckCircle, HelpCircle, DollarSign, MapPin
} from 'lucide-react'
import type { PropertyType } from '@repo/shared'

export default function PostAdPage() {
  const model = usePostPageModel()
  const { router } = model

  if (model.isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400"></div>
      </div>
    )
  }

  if (!model.user || model.user.role === 'guest' || model.user.role === 'hostel_admin') return null

  // Listing selection options for Step 1
  const listingOptions = [
    {
      id: 'rent' as const,
      title: 'Rent Out',
      description: 'Lease your flat, apartment, villa, or shared room to verified tenants.',
      icon: <Home className="h-6 w-6 text-slate-800 dark:text-slate-100" />,
      color: 'bg-white dark:bg-slate-900 hover:border-indigo-500 border-slate-200 dark:border-slate-800'
    },
    {
      id: 'sale' as const,
      title: 'Sell Property',
      description: 'Sell your plot, commercial unit, or house at the best market rates.',
      icon: <Sparkles className="h-6 w-6 text-slate-800 dark:text-slate-100" />,
      color: 'bg-white dark:bg-slate-900 hover:border-indigo-500 border-slate-200 dark:border-slate-800'
    },
    {
      id: 'roommate' as const,
      title: 'Find Roommate',
      description: 'Search for flatmates to share expenses and split rents.',
      icon: <Users className="h-6 w-6 text-slate-800 dark:text-slate-100" />,
      color: 'bg-white dark:bg-slate-900 hover:border-indigo-500 border-slate-200 dark:border-slate-800'
    }
  ]

  // Dynamic category options based on listing type
  const getCategoryOptions = () => {
    if (model.listingType === 'sale') {
      return [
        { id: 'flat' as const, title: 'Apartment / Flat', icon: <Building2 className="h-5 w-5" /> },
        { id: 'house' as const, title: 'House / Villa', icon: <Home className="h-5 w-5" /> },
        { id: 'plot' as const, title: 'Plot / Land', icon: <Trees className="h-5 w-5" /> },
        { id: 'commercial' as const, title: 'Commercial Unit', icon: <Briefcase className="h-5 w-5" /> }
      ]
    }
    if (model.listingType === 'roommate') {
      return [
        { id: 'roommate' as const, title: 'Shared Room', icon: <Users className="h-5 w-5" /> },
        { id: 'flatshare' as const, title: 'Flat Share', icon: <Building2 className="h-5 w-5" /> }
      ]
    }
    // Default / Rent
    return [
      { id: 'flat' as const, title: 'Apartment / Flat', icon: <Building2 className="h-5 w-5" /> },
      { id: 'house' as const, title: 'House / Villa', icon: <Home className="h-5 w-5" /> },
      { id: 'commercial' as const, title: 'Commercial', icon: <Briefcase className="h-5 w-5" /> },
      { id: 'hostel' as const, title: 'Hostel Space', icon: <Building2 className="h-5 w-5 text-indigo-500" /> },
      { id: 'pg' as const, title: 'PG / Co-Living', icon: <Home className="h-5 w-5 text-indigo-500" /> }
    ]
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 relative">
      <Card className="shadow-xl p-8 sm:p-10 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl dark:bg-slate-900/60 backdrop-blur-xl space-y-8">
        
        {/* Stepper Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/60">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Post Advertisement</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Add listings to search directory instantly</p>
          </div>
          {model.step < 5 && (
            <span className="px-3.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/60 rounded-full text-xs font-bold uppercase tracking-wider">
              Step {model.step} of 4
            </span>
          )}
        </div>

        {/* STEP 1: SELECT LISTING TYPE */}
        {model.step === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white text-center">What type of ad is this?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listingOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    model.setListingType(opt.id)
                    if (opt.id === 'sale') model.setPropertyType('flat')
                    else if (opt.id === 'roommate') model.setPropertyType('roommate')
                  }}
                  className={`cursor-pointer rounded-2xl border p-6 space-y-4 transition-all duration-200 ${opt.color} ${
                    model.listingType === opt.id 
                      ? 'ring-2 ring-indigo-500 border-indigo-500 dark:border-indigo-400 shadow-lg' 
                      : 'hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800/80">{opt.icon}</div>
                    {model.listingType === opt.id && (
                      <span className="w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 ring-2 ring-indigo-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{opt.title}</h4>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{opt.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <Button onClick={() => model.setStep(2)} className="w-full sm:w-auto font-bold bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
                <span>Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT CATEGORY */}
        {model.step === 2 && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white text-center">Select category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {getCategoryOptions().map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => model.setPropertyType(opt.id)}
                  className={`cursor-pointer rounded-2xl border p-5 flex flex-col items-center justify-center space-y-3 text-center transition-all duration-200 ${
                    model.propertyType === opt.id 
                      ? 'bg-slate-900 text-white dark:bg-indigo-600 border-slate-950 dark:border-indigo-500 ring-2 ring-slate-900 dark:ring-indigo-500 shadow-md font-bold' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-all ${model.propertyType === opt.id ? 'bg-white/10 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    {opt.icon}
                  </div>
                  <span className="text-xs font-bold">{opt.title}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <Button variant="outline" onClick={() => model.setStep(1)} className="font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button onClick={() => model.setStep(3)} className="font-bold bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
                <span>Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: DETAILS FORM */}
        {model.step === 3 && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Listing specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                <Input
                  label="Listing Title"
                  placeholder="e.g. Spacious 3 BHK Apartment with Sea View"
                  value={model.title}
                  onChange={(e) => model.setTitle(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the property details, amenities, neighborhood..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
                    value={model.description}
                    onChange={(e) => model.setDescription(e.target.value)}
                  />
                </div>
              </div>

              <Input
                label="Price (INR)"
                type="number"
                placeholder="e.g. 25000"
                value={model.price}
                onChange={(e) => model.setPrice(e.target.value)}
                icon={<DollarSign className="h-4 w-4" />}
              />

              <Input
                label="Area (Sq.ft)"
                type="number"
                placeholder="e.g. 1200"
                value={model.areaSqft}
                onChange={(e) => model.setAreaSqft(e.target.value)}
              />

              {model.propertyType !== 'plot' && model.propertyType !== 'commercial' && model.propertyType !== 'hostel' && model.propertyType !== 'pg' && (
                <>
                  <Input
                    label="Bedrooms"
                    type="number"
                    placeholder="e.g. 3"
                    value={model.bedrooms}
                    onChange={(e) => model.setBedrooms(e.target.value)}
                  />
                  <Input
                    label="Bathrooms"
                    type="number"
                    placeholder="e.g. 2"
                    value={model.bathrooms}
                    onChange={(e) => model.setBathrooms(e.target.value)}
                  />
                  <Input
                    label="Total Rooms"
                    type="number"
                    placeholder="e.g. 5"
                    value={model.totalRooms}
                    onChange={(e) => model.setTotalRooms(e.target.value)}
                  />
                  
                  {model.propertyType === 'house' && (
                    <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-900/35 rounded-xl border border-slate-200 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id="isUpstairs"
                        checked={model.isUpstairs}
                        onChange={(e) => model.setIsUpstairs(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-350 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                      />
                      <label htmlFor="isUpstairs" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Is Upstairs Unit? (House)
                      </label>
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-900/35 rounded-xl border border-slate-200 dark:border-slate-800">
                      <input
                        type="checkbox"
                        id="isFurnished"
                        checked={model.isFurnished}
                        onChange={(e) => {
                          model.setIsFurnished(e.target.checked)
                          if (!e.target.checked) {
                            model.setNumBeds('')
                            model.setFurnitureList([])
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-350 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                      />
                      <label htmlFor="isFurnished" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Is this property Furnished?
                      </label>
                    </div>

                    {model.isFurnished && (
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                        <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Furnishing details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Number of Beds"
                            type="number"
                            placeholder="e.g. 2"
                            value={model.numBeds}
                            onChange={(e) => model.setNumBeds(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Available Furniture</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {['Sofa', 'Dining Table', 'AC', 'TV', 'Refrigerator', 'Washing Machine', 'Microwave', 'Wardrobe', 'Gas Stove', 'Induction Cooker', 'Gas Connection'].map((item) => (
                              <label key={item} className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 shadow-sm">
                                <input
                                  type="checkbox"
                                  checked={model.furnitureList.includes(item)}
                                  onChange={() => {
                                    model.setFurnitureList(prev => 
                                      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
                                    )
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-350 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                                />
                                <span>{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Utilities & Convenience Section */}
                  <div className="md:col-span-2 p-6 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2">Utilities & Conveniences</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Water Source</label>
                        <select
                          value={model.waterSource}
                          onChange={(e) => model.setWaterSource(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        >
                          <option value="municipal">Municipal Connection</option>
                          <option value="borewell">Borewell</option>
                          <option value="tanker">Water Tanker</option>
                          <option value="both">Municipal + Borewell</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Power Backup</label>
                        <select
                          value={model.powerBackup}
                          onChange={(e) => model.setPowerBackup(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4"
                        >
                          <option value="none">No Backup</option>
                          <option value="partial">Partial Backup</option>
                          <option value="full">Full Backup</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reserved Parking</label>
                        <select
                          value={model.parking}
                          onChange={(e) => model.setParking(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4"
                        >
                          <option value="none">No Parking</option>
                          <option value="bike">Two-Wheeler</option>
                          <option value="car-open">Four-Wheeler (Open)</option>
                          <option value="car-covered">Four-Wheeler (Covered)</option>
                        </select>
                      </div>

                      {(model.listingType === 'rent' || model.listingType === 'roommate') && (
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tenant Preference</label>
                          <select
                            value={model.preferredTenant}
                            onChange={(e) => model.setPreferredTenant(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4"
                          >
                            <option value="any">Any (Family / Bachelors)</option>
                            <option value="family">Families Only</option>
                            <option value="bachelors">Bachelors Only</option>
                          </select>
                        </div>
                      )}

                      {(model.listingType === 'roommate' || model.listingType === 'rent') && (
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preferred Gender</label>
                          <select
                            value={model.preferredGender}
                            onChange={(e) => model.setPreferredGender(e.target.value as any)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4"
                          >
                            <option value="any">Any Gender</option>
                            <option value="male">Male Only</option>
                            <option value="female">Female Only</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <input
                        type="checkbox"
                        id="gatedCommunity"
                        checked={model.gatedCommunity}
                        onChange={(e) => model.setGatedCommunity(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-350 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                      />
                      <label htmlFor="gatedCommunity" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Located in a Gated Community / Society?
                      </label>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Security & Safety Features</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'cctv', label: 'CCTV Cameras' },
                          { id: 'guard', label: 'Security Guard' },
                          { id: 'intercom', label: 'Intercom' },
                          { id: 'fire', label: 'Fire Safety' }
                        ].map((feature) => (
                          <label key={feature.id} className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 shadow-sm">
                            <input
                              type="checkbox"
                              checked={model.securityFeatures.includes(feature.id)}
                              onChange={() => {
                                model.setSecurityFeatures(prev => 
                                  prev.includes(feature.id) ? prev.filter(x => x !== feature.id) : [...prev, feature.id]
                                )
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-350 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                            />
                            <span>{feature.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Hostel / PG specifications */}
              {(model.propertyType === 'hostel' || model.propertyType === 'pg') && (
                <div className="md:col-span-2 p-6 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2">Hostel / PG Specifications</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hostel Type / Gender Restriction</label>
                      <select
                        value={model.preferredGender}
                        onChange={(e) => model.setPreferredGender(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                      >
                        <option value="any">Unisex Co-Living (Any Gender)</option>
                        <option value="male">Boys Hostel / PG (Mens)</option>
                        <option value="female">Girls Hostel / PG (Ladies)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room Sharing Capacity</label>
                      <select
                        value={model.sharingOccupancy}
                        onChange={(e) => model.setSharingOccupancy(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                      >
                        <option value="1">Single Occupancy (1 share)</option>
                        <option value="2">Double Occupancy (2 share)</option>
                        <option value="3">Triple Occupancy (3 share)</option>
                        <option value="4">4 Occupancy (4 share)</option>
                        <option value="5">5 Bed Space Sharing</option>
                        <option value="6">6 Bed Space Sharing</option>
                        <option value="dorm">Dormitory Bed Space</option>
                      </select>
                    </div>
                  </div>

                  {/* Amenities checkboxes */}
                  <div className="space-y-3">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Included Hostel Amenities</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { checked: model.foodIncluded, setter: model.setFoodIncluded, label: 'Mess / Food Included' },
                        { checked: model.wifiAvailable, setter: model.setWifiAvailable, label: 'High Speed WiFi' },
                        { checked: model.acAvailable, setter: model.setAcAvailable, label: 'AC Rooms' },
                        { checked: model.laundryAvailable, setter: model.setLaundryAvailable, label: 'Laundry Facility' }
                      ].map((item, i) => (
                        <label key={i} className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 shadow-sm">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setter(e.target.checked)}
                            className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 space-y-4">
                <Input
                  label="Street Address"
                  placeholder="Street name and plot/house details"
                  value={model.address}
                  onChange={(e) => model.setAddress(e.target.value)}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Input label="City" placeholder="Mumbai" value={model.city} onChange={(e) => model.setCity(e.target.value)} />
                  <Input label="State" placeholder="Maharashtra" value={model.state} onChange={(e) => model.setState(e.target.value)} />
                  <Input label="Zip Code" placeholder="400001" value={model.zipCode} onChange={(e) => model.setZipCode(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <Button variant="outline" onClick={() => model.setStep(2)} className="font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button onClick={() => model.setStep(4)} disabled={!model.title || !model.price || !model.address || !model.city} className="font-bold bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
                <span>Continue</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: IMAGES & VIDEOS UPLOAD */}
        {model.step === 4 && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Upload Media Assets</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Drag Zone */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Property Photos</span>
                <div
                  onDragEnter={model.handleDrag}
                  onDragOver={model.handleDrag}
                  onDragLeave={model.handleDrag}
                  onDrop={model.handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 transition-all ${
                    model.dragActive 
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-900/20 scale-[0.99]' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 hover:border-indigo-500'
                  }`}
                >
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Drag & drop photos</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">PNG, JPG, or JPEG (Max 10)</p>
                  </div>
                  
                  <label className="cursor-pointer inline-flex items-center justify-center font-bold text-[10px] px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm">
                    <span>Browse Photos</span>
                    <input
                      type="file"
                      multiple
                      onChange={model.handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Video Drag Zone */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Property Videos</span>
                <div
                  onDragEnter={(e) => {
                    e.preventDefault()
                    model.setVideoDragActive(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    model.setVideoDragActive(true)
                  }}
                  onDragLeave={() => model.setVideoDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    model.setVideoDragActive(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const droppedFiles = Array.from(e.dataTransfer.files)
                      model.setVideos(prev => [...prev, ...droppedFiles])
                    }
                  }}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 transition-all ${
                    model.videoDragActive 
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-900/20 scale-[0.99]' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 hover:border-indigo-550'
                  }`}
                >
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-400">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Drag & drop videos</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">MP4, MOV, or AVI (Max 2)</p>
                  </div>
                  
                  <label className="cursor-pointer inline-flex items-center justify-center font-bold text-[10px] px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm">
                    <span>Browse Videos</span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const selectedFiles = Array.from(e.target.files)
                          model.setVideos(prev => [...prev, ...selectedFiles])
                        }
                      }}
                      accept="video/*"
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Uploaded File Previews */}
            {model.images.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploaded Photos ({model.images.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {model.images.map((file, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-150 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-900">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`upload-${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => model.setImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute right-1.5 top-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/60">
              <Button variant="outline" onClick={() => model.setStep(3)} className="font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button 
                onClick={model.handleAdSubmit} 
                isLoading={model.isPending}
                className="font-bold bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                <span>Publish Listing</span>
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS BLOCK */}
        {model.step === 5 && (
          <div className="text-center py-12 space-y-6 max-w-md mx-auto animate-fade-in">
            <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 animate-bounce">
              <CheckCircle className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Ad Posted Successfully!</h2>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Your property details have been recorded. Once verified by our staff, your ad listing will be visible to everyone on the search page.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                Go to Dashboard
              </Button>
              <Button onClick={() => model.setStep(1)} className="font-bold bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
                Post Another
              </Button>
            </div>
          </div>
        )}

      </Card>
    </div>
  )
}
