'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Lock, 
  UserCheck, 
  FileText, 
  MapPin, 
  ShieldAlert, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/authStore';

const INDIAN_STATES = [
  'ANDHRA PRADESH',
  'ARUNACHAL PRADESH',
  'ASSAM',
  'BIHAR',
  'CHHATTISGARH',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'WEST BENGAL',
  'DELHI',
  'JAMMU AND KASHMIR',
  'LADAKH',
  'PUDUCHERRY'
];

export default function ProfilePage() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch full user profile details
  const { data: profileResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['userFullProfile'],
    queryFn: authApi.getProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const profile = profileResponse?.data?.user;

  // Profile Form States
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [state, setState] = useState('');
  const [twoFactor, setTwoFactor] = useState('2FA OFF');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status alerts
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [pwSuccessMsg, setPwSuccessMsg] = useState<string | null>(null);
  const [pwErrorMsg, setPwErrorMsg] = useState<string | null>(null);

  // Sync state when data is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setShopName(profile.shopName || '');
      setMobile(profile.mobile || '');
      setEmail(profile.email || '');
      setAadhaarNumber(profile.aadhaarNumber || '');
      setPanNumber(profile.panNumber || '');
      setAddress(profile.address || '');
      setPinCode(profile.pinCode || '');
      setState(profile.state || 'MADHYA PRADESH');
    }
  }, [profile]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      setProfileSuccessMsg('Profile updated successfully!');
      setProfileErrorMsg(null);
      queryClient.setQueryData(['userFullProfile'], res);
      // Sync basic auth store details
      setUser(res.data.user);
      
      // Auto-hide alert after 3 seconds
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setProfileErrorMsg(err?.response?.data?.message || 'Failed to update profile details.');
      setProfileSuccessMsg(null);
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setPwSuccessMsg('Password changed successfully!');
      setPwErrorMsg(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-hide alert after 3 seconds
      setTimeout(() => setPwSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setPwErrorMsg(err?.response?.data?.message || 'Failed to change password. Make sure current password is correct.');
      setPwSuccessMsg(null);
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    updateProfileMutation.mutate({
      name,
      shopName,
      mobile,
      email,
      aadhaarNumber,
      panNumber,
      address,
      pinCode,
      state
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg(null);
    setPwSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setPwErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPwErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Loader2 size={20} className="absolute animate-pulse text-[#145BFF]" />
        </div>
        <p className="text-xs text-slate-500 font-bold tracking-wider animate-pulse">
          Retrieving profile credentials...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm text-rose-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-lg font-black text-slate-900 mb-2">Failed to Load Profile</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          We encountered an issue fetching your account profile data. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="w-full py-3 bg-primary-blue hover:bg-secondary-blue text-white font-bold rounded-xl transition-all shadow-md text-xs uppercase"
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account profile details, credentials, and settings.
        </p>
      </div>

      {/* Main Grid side-by-side matching Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* PROFILE Container (Left - 3/5 width on lg) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Blue Header Bar */}
          <div className="bg-[#145BFF] text-white px-5 py-3.5 flex items-center gap-2 shrink-0">
            <User size={16} />
            <h2 className="text-xs font-black uppercase tracking-wider">Profile</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleProfileSubmit} className="p-5 md:p-6 space-y-4">
            
            {/* Alerts */}
            {profileSuccessMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 animate-in fade-in duration-200">
                <CheckCircle2 size={15} className="shrink-0" />
                <p className="text-xs font-bold">{profileSuccessMsg}</p>
              </div>
            )}
            {profileErrorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 animate-in fade-in duration-200">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-normal">{profileErrorMsg}</p>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                  required
                />
              </div>

              {/* Shop Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Mobile Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                  required
                />
              </div>

              {/* Aadhaar Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Aadhaar Number</label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  maxLength={12}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                />
              </div>

              {/* PAN Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">PAN Number</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10 uppercase"
                />
              </div>

            </div>

            {/* Full-width Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
              />
            </div>

            {/* PIN Code & State & 2FA row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* PIN Code */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">PIN Code</label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  maxLength={6}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                />
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* 2FA (Mock option to replicate UI) */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">2FA Authentication</label>
                <select
                  value={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                >
                  <option value="2FA OFF">2FA OFF</option>
                  <option value="2FA ON">2FA ON</option>
                </select>
              </div>

            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-6 py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {updateProfileMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                <span>Submit</span>
              </button>
            </div>

          </form>
        </div>

        {/* Change Password Container (Right - 2/5 width on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-max">
          {/* Blue Header Bar */}
          <div className="bg-[#145BFF] text-white px-5 py-3.5 flex items-center gap-2 shrink-0">
            <Lock size={16} />
            <h2 className="text-xs font-black uppercase tracking-wider">Change Password</h2>
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordSubmit} className="p-5 md:p-6 space-y-4">
            
            {/* Alerts */}
            {pwSuccessMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 animate-in fade-in duration-200">
                <CheckCircle2 size={15} className="shrink-0" />
                <p className="text-xs font-bold">{pwSuccessMsg}</p>
              </div>
            )}
            {pwErrorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 animate-in fade-in duration-200">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-normal">{pwErrorMsg}</p>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
              <input
                type="password"
                placeholder="Enter Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-705 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                required
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
              <input
                type="password"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-705 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Confirm Password</label>
              <input
                type="password"
                placeholder="Enter Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-705 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/10"
                required
              />
            </div>

            {/* Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-6 py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {changePasswordMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                <span>Change Password</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
