import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [imagePreview, setImagePreview] = useState(user?.photoURL || null);
  const fileInputRef = useRef(null);

  const initials = (user?.firstName || user?.name || 'User')
    .split(' ')
    .map((n) => n[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // TODO: send `file` or `reader.result` to backend or an auth/profile update function
    // e.g. await updateProfile({ photo: file })
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#f2ede1] shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold border">
                    {initials}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 w-full text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
                >
                  Change Photo
                </button>
              </div>

              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900">{user?.firstName || user?.name || 'User'}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>

                <p className="mt-4 text-sm text-gray-600">
                  Upload a profile image to personalize your account. This preview is local — add a
                  backend upload or profile update call to persist the image.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex space-x-3">
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Save Profile
              </button>
              <button
                onClick={() => {
                  setImagePreview(user?.photoURL || null);
                }}
                className="bg-white border border-gray-300 px-4 py-2 rounded-md text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
