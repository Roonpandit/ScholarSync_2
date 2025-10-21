import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Shield, Plus, X, MapPin, Trash2, Globe } from 'lucide-react';
import Loader from '../../components/Loader';
import { formatDateDisplay } from '../../utils/timeUtils';

const IPAddress = () => {
  const [allowedIPs, setAllowedIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ipToDelete, setIpToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestrictionEnabled, setIsRestrictionEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const [formData, setFormData] = useState({
    ipAddress: '',
    locationName: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAllowedIPs();
    fetchIPRestrictionStatus();
  }, []);

  const fetchAllowedIPs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/allowed-ips');
      setAllowedIPs(res.data.data);
    } catch (error) {
      console.error('Error fetching allowed IPs:', error);
      toast.error('Failed to load allowed IP addresses');
    } finally {
      setLoading(false);
    }
  };

  const fetchIPRestrictionStatus = async () => {
    try {
      const res = await axios.get('/admin/ip-restriction-status');
      setIsRestrictionEnabled(res.data.data.isEnabled || false);
    } catch (error) {
      console.error('Error fetching IP restriction status:', error);
    }
  };

  const handleToggleRestriction = async () => {
    try {
      setIsToggling(true);
      const res = await axios.post('/admin/toggle-ip-restriction', {
        isEnabled: !isRestrictionEnabled
      });

      if (res.data.success) {
        setIsRestrictionEnabled(!isRestrictionEnabled);
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error('Error toggling IP restriction:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle IP restriction');
    } finally {
      setIsToggling(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate IP address
    if (!formData.ipAddress.trim()) {
      errors.ipAddress = 'IP address is required';
    } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ipAddress)) {
      errors.ipAddress = 'Invalid IP address format (e.g., 192.168.1.100)';
    } else {
      // Validate IP octets are between 0-255
      const octets = formData.ipAddress.split('.');
      const invalidOctet = octets.some(octet => parseInt(octet) > 255 || parseInt(octet) < 0);
      if (invalidOctet) {
        errors.ipAddress = 'Each IP octet must be between 0-255';
      }
    }

    // Validate location name
    if (!formData.locationName.trim()) {
      errors.locationName = 'Location name is required';
    } else if (formData.locationName.trim().length < 10) {
      errors.locationName = 'Location name must be at least 10 characters long';
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post('/admin/add-ip', formData);

      if (res.data.success) {
        toast.success('IP address added successfully');
        setAllowedIPs([res.data.data, ...allowedIPs]);
        setFormData({
          ipAddress: '',
          locationName: '',
          description: ''
        });
        setShowAddForm(false);
        setErrors({});
      }
    } catch (error) {
      console.error('Error adding IP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add IP address';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (ip) => {
    setIpToDelete(ip);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await axios.delete(`/admin/delete-ip/${ipToDelete._id}`);

      if (res.data.success) {
        toast.success('IP address deleted successfully');
        setAllowedIPs(allowedIPs.filter(ip => ip._id !== ipToDelete._id));
        setDeleteModalOpen(false);
        setIpToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting IP:', error);
      toast.error(error.response?.data?.message || 'Failed to delete IP address');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading IP addresses..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
          <Shield className="mr-2 text-blue-500" size={20} />
          IP Address Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">Control student login access with IP-based restrictions</p>
      </div>

      {/* IP Restriction Toggle Switch */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                IP-Based Login Restriction
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isRestrictionEnabled
                  ? 'Students can only login from configured IP addresses.'
                  : 'IP restrictions are disabled. Students can login from anywhere.'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Teachers and Admins can always login from any location.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isRestrictionEnabled ? 'text-gray-400' : 'text-gray-700'}`}>
              OFF
            </span>
            <button
              onClick={handleToggleRestriction}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                isRestrictionEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRestrictionEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isRestrictionEnabled ? 'text-green-600' : 'text-gray-400'}`}>
              ON
            </span>
          </div>
        </div>
      </div>

      {/* Show IP Management Only When Toggle is ON */}
      {isRestrictionEnabled && (
        <>
          {/* Add IP Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showAddForm
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showAddForm ? (
                <>
                  <X size={16} className="mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add IP Address
                </>
              )}
            </button>
          </div>

          {/* Add IP Form */}
          {showAddForm && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100 transition-all">
          <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Shield className="mr-2 text-blue-500" size={18} />
            Add New IP Address
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IP Address */}
              <div className="flex flex-col">
                <label htmlFor="ipAddress" className="text-sm font-medium text-gray-700 mb-1">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ipAddress"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 192.168.1.100"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.ipAddress && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.ipAddress}</p>
                )}
              </div>

              {/* Location Name */}
              <div className="flex flex-col">
                <label htmlFor="locationName" className="text-sm font-medium text-gray-700 mb-1">
                  Location Name <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs ml-1">(min 10 characters)</span>
                </label>
                <input
                  type="text"
                  id="locationName"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Lab Building A"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.locationName && (
                  <p className="text-red-500 text-xs italic mt-1">{errors.locationName}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {formData.locationName.length}/10 characters
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col">
              <label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Main computer lab on first floor"
                rows="3"
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ ipAddress: '', locationName: '', description: '' });
                  setErrors({});
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors inline-flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Add IP Address
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IP List */}
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-2 z-10">
          <h2 className="font-medium text-gray-700 flex items-center text-sm md:text-base">
            Allowed IP Addresses
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {allowedIPs.length}
            </span>
          </h2>
        </div>

        {allowedIPs.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <Shield className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base md:text-lg mb-2">No IP addresses configured</p>
            <p className="text-gray-400 text-sm">
              Students can currently login from any location. Add IP addresses to restrict access.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop view - Table */}
            <div className="hidden md:block overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allowedIPs.map((ip) => (
                    <tr key={ip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Globe className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-mono font-medium text-gray-900">{ip.ipAddress}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">{ip.locationName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {ip.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateDisplay(ip.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(ip)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 className="w-5 h-5 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile view - Cards */}
            <div className="md:hidden space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
              {allowedIPs.map((ip) => (
                <div key={ip._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-mono font-medium text-gray-900">{ip.ipAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900">{ip.locationName}</span>
                    </div>

                    {ip.description && (
                      <div className="text-sm text-gray-600 ml-6">
                        {ip.description}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 ml-6">
                      Added on {formatDateDisplay(ip.createdAt)}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleDelete(ip)}
                      className="text-red-600 hover:text-red-900 flex items-center text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 md:p-3 rounded-full">
                <Trash2 className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Delete IP Address</h3>
            </div>

            <p className="text-sm md:text-base text-gray-600 mb-2">
              Are you sure you want to delete this IP address?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-700">IP: {ipToDelete?.ipAddress}</p>
              <p className="text-sm text-gray-600">Location: {ipToDelete?.locationName}</p>
            </div>
            <p className="text-sm text-red-600 mb-4">
              Students will no longer be able to login from this IP address.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setIpToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default IPAddress;
