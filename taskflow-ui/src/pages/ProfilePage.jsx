import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword } from '../api/users';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Pencil,
  Save,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState({ type: '', text: '' });

  // Change password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
      setFullName(res.data.fullName);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!fullName.trim()) {
      setNameMsg({ type: 'error', text: 'Name cannot be empty' });
      return;
    }
    setSavingName(true);
    setNameMsg({ type: '', text: '' });
    try {
      const res = await updateProfile({ fullName: fullName.trim() });
      setProfile({ ...profile, fullName: res.data.fullName });
      setEditingName(false);
      setNameMsg({ type: 'success', text: 'Name updated successfully!' });

      // Update auth context so sidebar/header reflect new name
      const token = localStorage.getItem('token');
      if (token) {
        login(token, { ...user, fullName: res.data.fullName });
      }

      setTimeout(() => setNameMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setNameMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update name' });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });

    if (passwordForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Avatar + Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl border-4 border-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
              {profile?.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-white">{profile?.fullName}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-600/20 text-blue-400">
                {profile?.role}
              </span>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Full Name - Editable */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <User size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Full Name</p>
                  {editingName ? (
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-medium text-white">{profile?.fullName}</p>
                  )}
                </div>
              </div>

              {editingName ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setFullName(profile?.fullName);
                      setNameMsg({ type: '', text: '' });
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <XCircle size={16} />
                  </button>
                  <button
                    onClick={handleUpdateName}
                    disabled={savingName}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingName ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>

            {/* Name update message */}
            {nameMsg.text && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                nameMsg.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {nameMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {nameMsg.text}
              </div>
            )}

            {/* Email - Read only */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Mail size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-white">{profile?.email}</p>
              </div>
            </div>

            {/* Role - Read only */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-medium text-white">{profile?.role}</p>
              </div>
            </div>

            {/* Member Since - Read only */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Calendar size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Member Since</p>
                <p className="text-sm font-medium text-white">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Lock size={18} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Change Password</h3>
            <p className="text-xs text-slate-500">Update your account password</p>
          </div>
        </div>

        {pwMsg.text && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
            pwMsg.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {pwMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
              >
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                placeholder="Enter new password (min 6 characters)"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingPassword ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Lock size={16} />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;