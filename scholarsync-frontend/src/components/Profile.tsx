import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Loader from '@/components/Loader';
import { get, put } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import type { User } from '@/types/auth.types';
import type { ApiResponse } from '@/types/common.types';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await get<ApiResponse<User>>(API_ENDPOINTS.ME);

        if (response?.status === 200 && response.data) {
          setProfile(response.data);
        } else {
          throw new Error('Failed to fetch profile data');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again later.');
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    // Check length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Check uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return errors;
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset error
    setPasswordError('');

    // Validate passwords
    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      setPasswordError(validationErrors.join('\n'));
      return;
    }

    // Check if new password is the same as current password
    if (currentPassword === newPassword) {
      setPasswordError('New password cannot be the same as current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    try {
      await put<ApiResponse>(API_ENDPOINTS.UPDATE_PASSWORD, {
        currentPassword,
        newPassword
      });

      toast.success('Password updated successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Error updating password:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
        <div className="w-20 h-1 bg-blue-500"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{profile.name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
            <p className="mt-1 text-lg text-gray-900">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          {profile.role !== 'admin' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Student ID</h3>
              <p className="mt-1 text-lg font-mono text-gray-900">{profile.studentCode}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
            <p className="mt-1 text-lg capitalize text-gray-900">
              {profile.role}
            </p>
          </div>
        </div>
      </div>

      {profile.role !== 'admin' && (
        <div className="mt-8">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Lock className="h-4 w-4 mr-2" />
            {showPasswordForm ? 'Hide Password Update' : 'Update Password'}
          </button>
        </div>
      )}

      {showPasswordForm && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="text-red-600 text-sm">
                {passwordError}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            For security reasons, please contact the administrator if you need to update any of your information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
