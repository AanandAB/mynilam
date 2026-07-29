import React, { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { hostelRoomsApi, HostelRoom, HostelBed } from '@repo/shared'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Bed as BedIcon, User, CheckCircle2, AlertCircle, RefreshCw, Layers, Pencil, Trash2 } from 'lucide-react'

interface RoomBedGridProps {
  propertyId: number | string
  onRoomsUpdated?: () => void
}

export function RoomBedGrid({ propertyId, onRoomsUpdated }: RoomBedGridProps) {
  const queryClient = useQueryClient()
  const [rooms, setRooms] = useState<HostelRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Add Room Modal Form State
  const [showAddRoomModal, setShowAddRoomModal] = useState(false)
  const [newRoomNumber, setNewRoomNumber] = useState('')
  const [newFloorNumber, setNewFloorNumber] = useState(1)
  const [newSharingType, setNewSharingType] = useState('2')
  const [newMonthlyRate, setNewMonthlyRate] = useState(8500)
  const [newIsAc, setNewIsAc] = useState(true)
  const [newHasBath, setNewHasBath] = useState(true)
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false)

  // Edit Room Modal State
  const [editingRoom, setEditingRoom] = useState<HostelRoom | null>(null)
  const [editRoomNumber, setEditRoomNumber] = useState('')
  const [editFloorNumber, setEditFloorNumber] = useState(1)
  const [editSharingType, setEditSharingType] = useState('2')
  const [editMonthlyRate, setEditMonthlyRate] = useState<number | ''>(8500)
  const [editIsAc, setEditIsAc] = useState(true)
  const [editHasBath, setEditHasBath] = useState(true)
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false)

  // Delete Room State
  const [deletingRoom, setDeletingRoom] = useState<HostelRoom | null>(null)
  const [isDeletingRoom, setIsDeletingRoom] = useState(false)

  // Bed Edit Modal State
  const [selectedBed, setSelectedBed] = useState<HostelBed | null>(null)
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('')
  const [bedStatusInput, setBedStatusInput] = useState<'Vacant' | 'Occupied' | 'Reserved' | 'Maintenance'>('Vacant')
  const [tenantNameInput, setTenantNameInput] = useState('')
  const [isUpdatingBed, setIsUpdatingBed] = useState(false)

  const fetchRooms = async () => {
    setIsLoading(true)
    try {
      const data = await hostelRoomsApi.getRooms(propertyId)
      setRooms(data)
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to fetch room matrix')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (propertyId) {
      fetchRooms()
    }
  }, [propertyId])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomNumber.trim()) return

    if (!newMonthlyRate || Number(newMonthlyRate) <= 0) {
      setErrorMessage('Please enter a valid positive monthly bed rent amount (e.g. ₹5,000).')
      return
    }

    setIsSubmittingRoom(true)
    setErrorMessage(null)
    try {
      await hostelRoomsApi.createRoom(propertyId, {
        room_number: newRoomNumber.trim(),
        floor_number: newFloorNumber,
        sharing_type: newSharingType,
        monthly_rate: newMonthlyRate,
        is_ac: newIsAc,
        has_attached_bathroom: newHasBath,
      })
      setSuccessMessage(`Room ${newRoomNumber} created successfully!`)
      setShowAddRoomModal(false)
      setNewRoomNumber('')
      fetchRooms()
      queryClient.invalidateQueries({ queryKey: ['hostelConfig'] })
      if (onRoomsUpdated) onRoomsUpdated()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.error?.message || e?.message || 'Failed to create room')
    } finally {
      setIsSubmittingRoom(false)
    }
  }

  const handleOpenEditModal = (room: HostelRoom) => {
    setEditingRoom(room)
    setEditRoomNumber(room.room_number)
    setEditFloorNumber(room.floor_number)
    setEditSharingType(room.sharing_type)
    setEditMonthlyRate(room.monthly_rate || '')
    setEditIsAc(room.is_ac)
    setEditHasBath(room.has_attached_bathroom)
  }

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRoom || !editRoomNumber.trim()) return

    if (!editMonthlyRate || Number(editMonthlyRate) <= 0) {
      setErrorMessage('Please enter a valid positive monthly bed rent amount.')
      return
    }

    setIsUpdatingRoom(true)
    setErrorMessage(null)
    try {
      await hostelRoomsApi.updateRoom(editingRoom.id, {
        room_number: editRoomNumber.trim(),
        floor_number: editFloorNumber,
        sharing_type: editSharingType,
        monthly_rate: Number(editMonthlyRate),
        is_ac: editIsAc,
        has_attached_bathroom: editHasBath,
      })
      setSuccessMessage(`Room ${editRoomNumber} updated successfully!`)
      setEditingRoom(null)
      fetchRooms()
      queryClient.invalidateQueries({ queryKey: ['hostelConfig'] })
      if (onRoomsUpdated) onRoomsUpdated()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.error?.message || e?.message || 'Failed to update room')
    } finally {
      setIsUpdatingRoom(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return
    setIsDeletingRoom(true)
    setErrorMessage(null)
    try {
      await hostelRoomsApi.deleteRoom(deletingRoom.id)
      setSuccessMessage(`Room ${deletingRoom.room_number} deleted successfully!`)
      setDeletingRoom(null)
      fetchRooms()
      queryClient.invalidateQueries({ queryKey: ['hostelConfig'] })
      if (onRoomsUpdated) onRoomsUpdated()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.error?.message || e?.message || 'Failed to delete room')
    } finally {
      setIsDeletingRoom(false)
    }
  }

  const handleBedClick = (bed: HostelBed, roomNum: string) => {
    setSelectedBed(bed)
    setSelectedRoomNumber(roomNum)
    setBedStatusInput(bed.bed_status)
    setTenantNameInput(bed.assigned_tenant?.name || '')
  }

  const handleSaveBedStatus = async () => {
    if (!selectedBed) return
    setIsUpdatingBed(true)
    setErrorMessage(null)

    try {
      await hostelRoomsApi.updateBed(selectedBed.id, {
        bed_status: bedStatusInput,
        tenant_id: bedStatusInput === 'Vacant' ? '' : undefined,
      })
      setSuccessMessage(`Bed status updated to ${bedStatusInput}!`)
      setSelectedBed(null)
      fetchRooms()
      queryClient.invalidateQueries({ queryKey: ['hostelConfig'] })
      if (onRoomsUpdated) onRoomsUpdated()
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to update bed')
    } finally {
      setIsUpdatingBed(false)
    }
  }

  // Summary Metrics
  const roomList = Array.isArray(rooms) ? rooms : []
  const totalRooms = roomList.length
  const totalBeds = roomList.reduce((acc, r) => acc + (r.total_beds || 0), 0)
  const vacantBeds = roomList.reduce((acc, r) => acc + (r.vacant_beds || 0), 0)
  const occupiedBeds = roomList.reduce((acc, r) => acc + (r.occupied_beds || 0), 0)

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BedIcon className="w-5 h-5 text-indigo-500" />
            <span>Room & Bed Occupancy Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage individual rooms, visualize live bed occupancy, and assign tenants directly to bed spaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRooms}
            className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => setShowAddRoomModal(true)}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Room</span>
          </Button>
        </div>
      </div>

      {/* Live Occupancy Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Configured Rooms</span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{totalRooms} Rooms</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Bed Capacity</span>
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalBeds} Beds</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Live Vacant Beds</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{vacantBeds} Vacant</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Occupied Beds</span>
          <p className="text-lg font-black text-sky-600 dark:text-sky-400 mt-1">{occupiedBeds} Occupied</p>
        </div>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-xs border border-slate-200 dark:border-slate-800">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No rooms added yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Start building your hostel layout by adding room numbers (e.g. Room 101) and choosing sharing types. Beds will auto-generate.
          </p>
          <Button onClick={() => setShowAddRoomModal(true)} className="bg-indigo-600 text-white font-bold text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Add First Room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="p-4 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                {/* Room Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                      Room {room.room_number}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Floor {room.floor_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {room.sharing_type === '1' ? 'Single' : room.sharing_type === '2' ? 'Double' : room.sharing_type === '3' ? 'Triple' : room.sharing_type === '4' ? 'Quad' : 'Dorm'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(room)}
                      title="Edit Room Details"
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRoom(room)}
                      title="Delete Room"
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Features badges */}
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {room.is_ac && <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900/50">AC</span>}
                  {room.has_attached_bathroom && <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/50">Attached Bath</span>}
                  {room.monthly_rate && <span className="text-slate-700 dark:text-slate-300 font-extrabold">₹{room.monthly_rate}/mo</span>}
                </div>

                {/* Bed Pills Grid */}
                <div className="pt-2">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Bed Spaces ({room.vacant_beds} / {room.total_beds} Vacant)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {room.beds.map((bed) => {
                      const isVacant = bed.bed_status === 'Vacant'
                      const isOccupied = bed.bed_status === 'Occupied'
                      const isReserved = bed.bed_status === 'Reserved'

                      return (
                        <button
                          key={bed.id}
                          type="button"
                          onClick={() => handleBedClick(bed, room.room_number)}
                          className={`p-2 rounded-xl text-left border transition-all duration-150 hover:scale-[1.02] flex flex-col justify-between ${
                            isVacant
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                              : isOccupied
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-300'
                              : isReserved
                              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">{bed.bed_name}</span>
                            <span className={`w-2 h-2 rounded-full ${
                              isVacant ? 'bg-emerald-500' : isOccupied ? 'bg-indigo-500' : isReserved ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                          </div>
                          <span className="text-[10px] font-extrabold truncate mt-1">
                            {isOccupied && bed.assigned_tenant ? bed.assigned_tenant.name : bed.bed_status}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Add Room & Generate Bed Spaces
            </h3>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Number *</label>
                <Input
                  type="text"
                  placeholder="e.g. 101, 204, G-01"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Level</label>
                  <Input
                    type="number"
                    min="0"
                    value={newFloorNumber}
                    onChange={(e) => setNewFloorNumber(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sharing / Capacity</label>
                  <select
                    value={newSharingType}
                    onChange={(e) => setNewSharingType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="1">1 Share (Single)</option>
                    <option value="2">2 Share (Double)</option>
                    <option value="3">3 Share (Triple)</option>
                    <option value="4">4 Share (Quad)</option>
                    <option value="dorm">6 Share (Dormitory)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Bed Rent (₹) *</label>
                <Input
                  type="number"
                  min="1"
                  step="100"
                  placeholder="e.g. 8500"
                  value={newMonthlyRate || ''}
                  onChange={(e) => setNewMonthlyRate(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsAc}
                    onChange={(e) => setNewIsAc(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Air Conditioned</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newHasBath}
                    onChange={(e) => setNewHasBath(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Attached Bathroom</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddRoomModal(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingRoom}
                  className="bg-indigo-600 text-white font-bold text-xs"
                >
                  {isSubmittingRoom ? 'Creating...' : 'Create Room & Beds'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bed Status Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Room {selectedRoomNumber}</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <BedIcon className="w-4 h-4 text-indigo-500" />
                <span>{selectedBed.bed_name}</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bed Occupancy Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Vacant', 'Occupied', 'Reserved', 'Maintenance'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBedStatusInput(st)}
                      className={`p-2 rounded-xl text-xs font-extrabold border transition-all ${
                        bedStatusInput === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBed.assigned_tenant && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="block text-[10px] font-extrabold uppercase text-slate-400">Assigned Tenant</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{selectedBed.assigned_tenant.name}</span>
                  </p>
                  <span className="text-[10px] text-slate-500 block truncate">{selectedBed.assigned_tenant.email}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedBed(null)}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUpdatingBed}
                onClick={handleSaveBedStatus}
                className="bg-indigo-600 text-white font-bold text-xs"
              >
                {isUpdatingBed ? 'Saving...' : 'Save Status'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Edit Room Details (Room {editingRoom.room_number})
            </h3>

            <form onSubmit={handleUpdateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Number *</label>
                <Input
                  type="text"
                  placeholder="e.g. 101, 204, G-01"
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Level</label>
                  <Input
                    type="number"
                    min="0"
                    value={editFloorNumber}
                    onChange={(e) => setEditFloorNumber(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sharing / Capacity</label>
                  <select
                    value={editSharingType}
                    onChange={(e) => setEditSharingType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="1">1 Share (Single)</option>
                    <option value="2">2 Share (Double)</option>
                    <option value="3">3 Share (Triple)</option>
                    <option value="4">4 Share (Quad)</option>
                    <option value="dorm">6 Share (Dormitory)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Bed Rent (₹) *</label>
                <Input
                  type="number"
                  min="1"
                  step="100"
                  placeholder="e.g. 8500"
                  value={editMonthlyRate || ''}
                  onChange={(e) => setEditMonthlyRate(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsAc}
                    onChange={(e) => setEditIsAc(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Air Conditioned</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editHasBath}
                    onChange={(e) => setEditHasBath(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Attached Bathroom</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRoom(null)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingRoom}
                  className="bg-indigo-600 text-white font-bold text-xs"
                >
                  {isUpdatingRoom ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {deletingRoom && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-base font-extrabold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>Delete Room {deletingRoom.room_number}?</span>
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">Room {deletingRoom.room_number}</strong>? All {deletingRoom.total_beds} bed spaces associated with this room will be permanently removed.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingRoom(null)}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeletingRoom}
                onClick={handleDeleteRoom}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                {isDeletingRoom ? 'Deleting...' : 'Delete Room'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
