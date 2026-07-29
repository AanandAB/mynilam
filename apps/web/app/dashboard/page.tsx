'use client'

import React from 'react'
import { useDashboardPageModel } from './DashboardPageModel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Building2, PlusCircle, Trash2, Shield, User, Briefcase, 
  Sparkles, CheckCircle2, AlertCircle, LogOut, ArrowRight, ShieldCheck,
  Compass
} from 'lucide-react'
import Link from 'next/link'
import { HostelFinder } from '@/components/properties/HostelFinder'

export default function DashboardPage() {
  const {
    user,
    isLoading,
    activeTab,
    setActiveTab,
    userProperties,
    unverifiedProperties,
    usersList,
    newEmployeeEmail,
    setNewEmployeeEmail,
    newEmployeeName,
    setNewEmployeeName,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    handleAddEmployee,
    handleDeleteUser,
    handleDeleteProperty,
    handleVerifyProperty,
    logout,
  } = useDashboardPageModel()

  // Hostel Admin Configuration states (persisted to localStorage)
  const [hostelName, setHostelName] = React.useState('Nest')
  const [totalBedSpaces, setTotalBedSpaces] = React.useState(120)
  const [hostelPricing, setHostelPricing] = React.useState<{ share: number | string; price: number }[]>([
  { share: 1, price: 1200 },
  { share: 2, price: 2200 },
  { share: 3, price: 3000 },
  { share: 4, price: 3500 },
]);
const [totalRooms, setTotalRooms] = React.useState(40)
  const [sharings, setSharings] = React.useState(['1', '2', '3'] as string[])
  const [bathroomCount, setBathroomCount] = React.useState(20)
  const [attachedBathrooms, setAttachedBathrooms] = React.useState(true)
  const [wifiEnabled, setWifiEnabled] = React.useState(true)
  const [wifiSpeed, setWifiSpeed] = React.useState('105 Mbps')
  const [hotWater, setHotWater] = React.useState(true)
  const [waterFilter, setWaterFilter] = React.useState(true)
  const [messFood, setMessFood] = React.useState(true)
  const [laundryEnabled, setLaundryEnabled] = React.useState(true)
  const [acAvailable, setAcAvailable] = React.useState(true)
  const [address, setAddress] = React.useState('789 Nest Lane')
  const [city, setCity] = React.useState('Bangalore')
  const [priceMonthly, setPriceMonthly] = React.useState(8500)
  const [genderType, setGenderType] = React.useState('unisex' as 'boys' | 'girls' | 'unisex')

  // Geolocation & vacancy configurations
  const [vacantBeds, setVacantBeds] = React.useState(15)
  const [vacantRooms, setVacantRooms] = React.useState(5)
  const [vacantSharings, setVacantSharings] = React.useState(['2', '3'] as string[])
  const [waterSource, setWaterSource] = React.useState('Municipal Supply & Borewell')

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mock_hostel_admin_config')
      if (saved) {
        try {
          const config = JSON.parse(saved)
          const defaultPricing = [
            { share: 1, price: 1200 },
            { share: 2, price: 2200 },
            { share: 3, price: 3000 },
            { share: 4, price: 3500 },
          ];
          const savedPricing = config.hostelPricing || defaultPricing;
          setHostelPricing(savedPricing);
          setHostelName(config.hostelName || 'Nest');
          setTotalBedSpaces(config.totalBedSpaces || 120);
          setTotalRooms(config.totalRooms || 40);
          setSharings(config.sharings || ['1', '2', '3'])
          setBathroomCount(config.bathroomCount || 20)
          setAttachedBathrooms(config.attachedBathrooms ?? true)
          setWifiEnabled(config.wifiEnabled ?? true)
          setWifiSpeed(config.wifiSpeed || '105 Mbps')
          setHotWater(config.hotWater ?? true)
          setWaterFilter(config.waterFilter ?? true)
          setMessFood(config.messFood ?? true)
          setLaundryEnabled(config.laundryEnabled ?? true)
          setAcAvailable(config.acAvailable ?? true)
          setAddress(config.address || '789 Nest Lane')
          setCity(config.city || 'Bangalore')
          setPriceMonthly(config.priceMonthly || 8500)
          setGenderType(config.genderType || 'unisex')
          setVacantBeds(config.vacantBeds ?? 15)
          setVacantRooms(config.vacantRooms ?? 5)
          setVacantSharings(config.vacantSharings || ['2', '3'])
          setWaterSource(config.waterSource || 'Municipal Supply & Borewell')
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  const handleSaveHostelConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      const config = {
        hostelName,
        totalBedSpaces,
        totalRooms,
        sharings,
        bathroomCount,
        attachedBathrooms,
        wifiEnabled,
        wifiSpeed,
        hotWater,
        waterFilter,
        messFood,
        laundryEnabled,
        acAvailable,
        address,
        city,
        priceMonthly,
        genderType,
        vacantBeds,
        vacantRooms,
        vacantSharings,
        hostelPricing,
        waterSource
      }
      localStorage.setItem('mock_hostel_admin_config', JSON.stringify(config))
      setSuccessMessage('Hostel configuration updated successfully!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400"></div>
      </div>
    )
  }

  if (!user) return null

  // Helper to format currency
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })
  }

  // Filter lists for dashboard display
  const employees = usersList.filter(u => u.role === 'employee')
  const regularUsers = usersList.filter(u => u.role === 'normal' || u.role === 'guest')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 1. Welcoming Hero Banner */}
      <section className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 border border-slate-700/60">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user.role === 'super_admin' ? 'Super Admin Access' : `${user.role} role`}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {user.role === 'hostel_admin' ? `Hi ${hostelName}` : `Welcome, ${user.full_name}`}
            </h1>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed">
              {user.role === 'guest' && 'Explore listed properties. Upgrade your account to post advertisements or configure search filters.'}
              {user.role === 'normal' && 'Create property listings, monitor your responses, and manage your account preferences.'}
              {user.role === 'employee' && 'Review client listings, verify user posts, and maintain the catalog freshness.'}
              {user.role === 'super_admin' && 'System-wide monitoring dashboard: oversee properties, employee registers, and deletion logs.'}
            {/* Existing normal user price overview unchanged */}
{user.role !== 'guest' && user.role !== 'hostel_admin' && (
  <>
    {/* Price Chart for Normal Users */}
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Price Overview</h2>
      <div className="grid grid-cols-4 gap-4">
        {[{share:1, price:1500},{share:2, price:2800},{share:3, price:4000},{share:4, price:5000}].map(item => (
          <div key={item.share} className="flex flex-col items-center">
            <div className="w-12 bg-emerald-200 dark:bg-emerald-600 rounded-t" style={{height: `${(item.price/5000)*100}%`}}></div>
            <span className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.share} Share</span>
            <span className="text-xs text-slate-600 dark:text-slate-400">₹{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  </>
)}




            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 shrink-0">
            {user.role !== 'guest' && user.role !== 'hostel_admin' && (
              <Link href="/post">
                <Button className="font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 border-none text-white">
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Property Ad</span>
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => logout()} className="font-bold border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
          <button className="ml-auto text-xs opacity-75 hover:opacity-100" onClick={() => setSuccessMessage('')}>Dismiss</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
          <button className="ml-auto text-xs opacity-75 hover:opacity-100" onClick={() => setErrorMessage('')}>Dismiss</button>
        </div>
      )}

      {/* 2. Main Section: Navigation Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 space-y-2">
          {user.role !== 'hostel_admin' && (
            <button 
              onClick={() => setActiveTab('my-ads')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2.5 ${activeTab === 'my-ads' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'}`}
            >
              <Building2 className="w-4 h-4" />
              <span>{user.role === 'super_admin' ? 'All Active Ads' : user.role === 'guest' ? 'Browse Properties' : 'My Ad Listings'}</span>
              <span className="ml-auto bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white px-2 py-0.5 rounded-full text-xs font-black">
                {userProperties.length}
              </span>
            </button>
          )}

          {user.role === 'hostel_admin' && (
            <button 
              onClick={() => setActiveTab('hostel-manage')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2.5 ${activeTab === 'hostel-manage' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'}`}
            >
              <Compass className="w-4 h-4" />
              <span>Hostel Management</span>
            </button>
          )}



          {user.role === 'employee' && (
            <button 
              onClick={() => setActiveTab('verify-users')}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2.5 ${activeTab === 'verify-users' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Listings</span>
            </button>
          )}

          {user.role === 'super_admin' && (
            <>
              <button 
                onClick={() => setActiveTab('employees')}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2.5 ${activeTab === 'employees' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Employee Register</span>
                <span className="ml-auto bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white px-2 py-0.5 rounded-full text-xs font-black">
                  {employees.length}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('users-list')}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2.5 ${activeTab === 'users-list' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'}`}
              >
                <User className="w-4 h-4" />
                <span>User Directory</span>
                <span className="ml-auto bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white px-2 py-0.5 rounded-full text-xs font-black">
                  {regularUsers.length}
                </span>
              </button>
            </>
          )}
        </aside>

        {/* Tab Contents */}
        <main className="lg:col-span-3">
          


          {/* TAB 1: Ad Listings */}
          {activeTab === 'my-ads' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {user.role === 'super_admin' ? 'Properties Master Catalog' : user.role === 'guest' ? 'Browse All Advertisements' : 'Active Advertisements'}
                </h2>
                {user.role === 'guest' && (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
                    Read-only Guest View
                  </span>
                )}
              </div>

              {userProperties.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No property ads found</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                    {user.role === 'guest' ? 'There are no listings to browse. Switch user roles to add mock properties.' : 'Create your first advertisement listing by clicking the button above.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userProperties.map((property) => (
                    <Card key={property.id} className="p-5 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col justify-between bg-white dark:bg-slate-900">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                            For {property.listing_type}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${property.is_published ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                            {property.is_published ? 'Published' : 'Pending Verification'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">{property.title}</h4>
                        <p className="text-xs text-slate-400 truncate">{property.address}, {property.city}</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white pt-1">{formatPrice(property.price)}</p>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-4 flex items-center justify-between">
                        <Link href={`/properties/${property.id}`} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                          <span>View listing details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        
                        {(user.role === 'super_admin' || user.id === property.user_id || property.user?.email === user.email) && (
                          <button 
                            onClick={() => handleDeleteProperty(property.id)}
                            className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-xl transition-colors flex items-center gap-1.5"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Employee Verification View (Only Employee) */}
          {activeTab === 'verify-users' && user.role === 'employee' && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Verify Pending Listings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review the user-submitted advertisements below and publish them to verify their content.</p>

              {unverifiedProperties.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">All clean!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">There are no pending listings requiring verification at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unverifiedProperties.map((property: any) => (
                    <Card key={property.id} className="p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900">
                      <div className="space-y-1 truncate max-w-md">
                        <h4 className="font-extrabold text-slate-900 dark:text-white truncate">{property.title}</h4>
                        <p className="text-xs text-slate-500">Submitted by: {property.user?.full_name || 'Normal User'} ({property.user?.email || 'user@example.com'})</p>
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatPrice(property.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleVerifyProperty(property.id)}
                          className="font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                        >
                          Verify & Publish
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Employee Register (Only Super Admin) */}
          {activeTab === 'employees' && user.role === 'super_admin' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Employee Register</h2>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                  Total Staff: {employees.length}
                </span>
              </div>

              {/* Add Employee Form */}
              <Card className="p-5 border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                <form onSubmit={handleAddEmployee} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <Input 
                      label="Employee Name" 
                      placeholder="e.g. Rachel Green" 
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input 
                      label="Email Address" 
                      type="email" 
                      placeholder="e.g. rachel@rentel.com" 
                      value={newEmployeeEmail}
                      onChange={(e) => setNewEmployeeEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button type="submit" className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 border-none text-white py-3">
                      Add Employee
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Staff List */}
              <div className="space-y-3">
                {employees.map((emp) => (
                  <Card key={emp.id} className="p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{emp.full_name}</h4>
                        <p className="text-xs text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteUser(emp.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-bold p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                    >
                      Remove Staff
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: User Directory (Only Super Admin) */}
          {activeTab === 'users-list' && user.role === 'super_admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">User Directory</h2>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full">
                  Total Clients: {regularUsers.length}
                </span>
              </div>

              <div className="space-y-3">
                {regularUsers.map((client) => (
                  <Card key={client.id} className="p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {client.full_name}
                          {client.role === 'guest' && (
                            <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">Guest</span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">{client.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteUser(client.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-bold p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                    >
                      Delete Account
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {/* TAB 5: Hostel Management View (Only Hostel Admin) */}
          {activeTab === 'hostel-manage' && user.role === 'hostel_admin' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-500" />
                  <span>Hostel & PG Management System</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">Configure your PG/Hostel capacity, occupancy rules, bathrooms, and utility facilities for students and professionals.</p>
              </div>

              {/* Statistics Overview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Capacity', value: `${totalBedSpaces} Beds`, desc: 'Beds in spaces', color: 'indigo' },
                  { label: 'Total Rooms', value: `${totalRooms} Rooms`, desc: 'Active rooms', color: 'emerald' },
                  { label: 'Current Vacancy', value: `${vacantBeds} Beds`, desc: `${vacantRooms} vacant rooms`, color: 'sky' },
                  { label: 'Avg Monthly Rent', value: `₹${priceMonthly.toLocaleString()}`, desc: 'Per bed space', color: 'rose' },
                  { label: 'Target Audience', value: genderType === 'unisex' ? 'Co-Living / Unisex' : genderType === 'boys' ? 'Boys Only' : 'Girls Only', desc: 'Gender target', color: 'amber' }
                ].map((stat, idx) => (
                  <Card key={idx} className="p-4 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">{stat.label}</span>
                    <div className="my-2">
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-550 leading-none">{stat.desc}</span>
                  </Card>
                ))}
              </div>

              <form onSubmit={handleSaveHostelConfig} className="space-y-6">
                
                {/* Section A: Core Capacity & Layout */}
                <Card className="p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    1. Capacity & Layout Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hostel / PG Name</label>
                      <input 
                        type="text" 
                        value={hostelName} 
                        onChange={(e) => setHostelName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. Star Elite Living"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gender Target</label>
                      <select 
                        value={genderType} 
                        onChange={(e) => setGenderType(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="unisex">Unisex / Co-Living</option>
                        <option value="boys">Boys Hostel / PG</option>
                        <option value="girls">Girls Hostel / PG</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Bed Spaces</label>
                      <input 
                        type="number" 
                        value={totalBedSpaces} 
                        onChange={(e) => setTotalBedSpaces(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Rooms</label>
                      <input 
                        type="number" 
                        value={totalRooms} 
                        onChange={(e) => setTotalRooms(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Bathrooms</label>
                      <input 
                        type="number" 
                        value={bathroomCount} 
                        onChange={(e) => setBathroomCount(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sharing/Occupancy Options Allowed</span>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { id: '1', label: 'Single Occupancy' },
                        { id: '2', label: 'Double Sharing' },
                        { id: '3', label: 'Triple Sharing' },
                        { id: '4', label: 'Quad Sharing' },
                        { id: 'dorm', label: 'Dormitory Bed Space' }
                      ].map((item) => {
                        const isChecked = sharings.includes(item.id)
                        return (
                          <label key={item.id} className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSharings([...sharings, item.id])
                                } else {
                                  setSharings(sharings.filter(id => id !== item.id))
                                }
                              }}
                              className="h-4.5 w-4.5 rounded-lg text-indigo-600 border-slate-200 dark:border-slate-850"
                            />
                            <span>{item.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center space-x-2.5">
                    <input 
                      type="checkbox" 
                      id="attached_bath"
                      checked={attachedBathrooms}
                      onChange={(e) => setAttachedBathrooms(e.target.checked)}
                      className="h-4.5 w-4.5 rounded-lg text-indigo-600 border-slate-200 dark:border-slate-850"
                    />
                    <label htmlFor="attached_bath" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Are bathrooms attached inside rooms?
                    </label>
                  </div>
                </Card>

                {/* Section B: Amenities & Facilities */}
                <Card className="p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    2. Utilities & Facilities
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3 p-3 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-slate-100 dark:border-slate-800">
                      <input 
                        type="checkbox" 
                        id="wifi_chk"
                        checked={wifiEnabled}
                        onChange={(e) => setWifiEnabled(e.target.checked)}
                        className="h-4.5 w-4.5 mt-0.5 rounded-lg text-indigo-600 border-slate-200 dark:border-slate-850"
                      />
                      <div className="flex-grow space-y-1">
                        <label htmlFor="wifi_chk" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">High Speed WiFi</label>
                        {wifiEnabled && (
                          <input 
                            type="text" 
                            value={wifiSpeed}
                            onChange={(e) => setWifiSpeed(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-lg py-1.5 px-2.5 text-[11px] text-slate-900 dark:text-white focus:outline-none"
                            placeholder="e.g. 100 Mbps"
                          />
                        )}
                      </div>
                    </div>

                    {[
                      { checked: hotWater, setter: setHotWater, id: 'hotwater_chk', label: '24/7 Hot Water Facility' },
                      { checked: waterFilter, setter: setWaterFilter, id: 'waterfilter_chk', label: 'RO Water Purifier Filter' },
                      { checked: messFood, setter: setMessFood, id: 'mess_chk', label: 'Mess / Food Included' },
                      { checked: laundryEnabled, setter: setLaundryEnabled, id: 'laundry_chk', label: 'Laundry Service' },
                      { checked: acAvailable, setter: setAcAvailable, id: 'ac_chk', label: 'Air Conditioning Available' }
                    ].map((facility) => (
                      <div key={facility.id} className="flex items-center space-x-3 p-3 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-slate-100 dark:border-slate-800">
                        <input 
                          type="checkbox" 
                          id={facility.id}
                          checked={facility.checked}
                          onChange={(e) => facility.setter(e.target.checked)}
                          className="h-4.5 w-4.5 rounded-lg text-indigo-600 border-slate-200 dark:border-slate-850"
                        />
                        <label htmlFor={facility.id} className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">{facility.label}</label>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Section C: Location Details */}
                <Card className="p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    3. Location Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="City" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bangalore" required />
                    <Input label="Hostel Address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 789 Nest Lane" required />
                    <Input label="Water Source Details" type="text" value={waterSource} onChange={(e) => setWaterSource(e.target.value)} placeholder="e.g. Borewell & Municipal" required />
                  </div>
                </Card>

                {/* Section C: Pricing Details */}
                <Card className="p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    3. Pricing Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Input label="Avg Rent Price (₹/mo)" type="number" value={priceMonthly} onChange={(e) => setPriceMonthly(Number(e.target.value))} min={500} required />
                  </div>
                  <h4 className="mt-4 mb-2 font-semibold">Sharing Price Chart (Editable)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {sharings.map((shareId) => {
                        const shareLabelMap: Record<string, string> = {
                          '1': 'Single',
                          '2': 'Double',
                          '3': 'Triple',
                          '4': 'Quad',
                          'dorm': 'Dormitory',
                        };
                        const shareLabel = shareLabelMap[shareId] || shareId;
                        const priceObj = hostelPricing.find(p => p.share === (shareId === 'dorm' ? 'dorm' : Number(shareId)));
                        const priceValue = priceObj ? priceObj.price : '';
                        return (
                          <div key={shareId} className="flex flex-col">
                            <Input
                              label={`${shareLabel} Share Price (₹)`}
                              type="number"
                              value={priceValue}
                              onChange={(e) => {
                                const newPrice = Number(e.target.value);
                                setHostelPricing((prev) => {
                                  const existing = prev.find(p => p.share === (shareId === 'dorm' ? 'dorm' : Number(shareId)));
                                  if (existing) {
                                    return prev.map(p => p.share === existing.share ? { ...p, price: newPrice } : p);
                                  }
                                  return [...prev, { share: shareId === 'dorm' ? 'dorm' : Number(shareId), price: newPrice }];
                                });
                              }}
                              min={0}
                              required
                            />
                          </div>
                        );
                      })}
                    </div>
                </Card>

                {/* Section D: Current Vacancy & Availability Status */}
                <Card className="p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    4. Current Vacancy & Availability Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vacant Bed Spaces</label>
                      <input 
                        type="number" 
                        value={vacantBeds} 
                        onChange={(e) => setVacantBeds(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vacant Rooms</label>
                      <input 
                        type="number" 
                        value={vacantRooms} 
                        onChange={(e) => setVacantRooms(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sharing/Occupancy Allowed in Vacant Spaces</span>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { id: '1', label: 'Single Occupancy' },
                        { id: '2', label: 'Double Sharing' },
                        { id: '3', label: 'Triple Sharing' },
                        { id: '4', label: 'Quad Sharing' },
                        { id: 'dorm', label: 'Dormitory Bed' }
                      ].map((item) => {
                        const isChecked = vacantSharings.includes(item.id)
                        return (
                          <label key={item.id} className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setVacantSharings([...vacantSharings, item.id])
                                } else {
                                  setVacantSharings(vacantSharings.filter(id => id !== item.id))
                                }
                              }}
                              className="h-4.5 w-4.5 rounded-lg text-indigo-600 border-slate-200 dark:border-slate-850"
                            />
                            <span>{item.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button type="submit" className="font-bold bg-indigo-650 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Configuration</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          </main>
      </div>

    </div>
  )
}
