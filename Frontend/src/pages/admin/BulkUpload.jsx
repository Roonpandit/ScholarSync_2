import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const BulkUpload = () => {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [passwordsGenerated, setPasswordsGenerated] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Reset the file input for subsequent uploads
      const input = e.target;
      input.value = '';  // Reset the input value
      
      // Reset all states
      setPreviewData([]);
      setFile(null);
      setErrors([]);
      
      // Set the new file
      setFile(selectedFile);
      
      // Read and preview the Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Get headers from first row
        const headers = jsonData[0].map(header => header.trim().toLowerCase());
        
        // Validate headers
        const requiredHeaders = ['name', 'email', 'studentcode', 'phone'];
        const isValid = requiredHeaders.every(header => {
          // Check if the header exists in any case variation
          return headers.some(h => h.toLowerCase() === header);
        });

        if (!isValid) {
          toast.error('Invalid file format. Required columns: Name, Email, StudentCode, Phone');
          return;
        }

        // Map headers to lowercase for consistency
        const headerMap = headers.reduce((map, header, index) => {
          map[header.toLowerCase()] = index;
          return map;
        }, {});

        // Convert to array of objects with passwords
        const dataObjects = jsonData.slice(1).map(row => {
          return {
            name: row[headerMap['name']]?.toString()?.trim() || '',
            email: row[headerMap['email']]?.toString()?.trim() || '',
            studentcode: row[headerMap['studentcode']]?.toString()?.trim() || '',
            phone: row[headerMap['phone']]?.toString()?.trim() || ''
          };
        });

        // Format data for preview with passwords and validation
        const formattedData = dataObjects.map(row => ({
          name: row.name,
          email: row.email,
          studentcode: row.studentcode,
          phone: row.phone,
          password: generatePassword(row.name)
        }));

        const previewData = formattedData.map(row => ({
          ...row,
          errors: validateRow(row)
        }));

        // Get all validation errors
        const validationErrors = previewData.map((row, index) => {
          const errors = row.errors;
          if (Object.keys(errors).length > 0) {
            return {
              rowNumber: index + 2, // +2 because we skip header row and index starts from 0
              errors: Object.entries(errors).map(([field, message]) => `${field}: ${message}`)
            };
          }
          return null;
        }).filter(Boolean);

        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.map(({ rowNumber, errors }) => 
            `Row ${rowNumber}: ${errors.join(', ')}`
          );
          
          toast.error(
            `Validation errors found:\n${errorMessages.join('\n')}`,
            {
              position: "top-right",
              autoClose: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );
          setPreviewData([]);
          setFile(null); // Reset the file state
          return;
        }

        setPreviewData(previewData);

        // Validate each row
        const individualValidationErrors = formattedData.map((row, index) => {
          const errors = {};
          
          if (!row.name.trim()) errors.name = 'Name is required';
          if (!row.email.trim()) errors.email = 'Email is required';
          if (!row.email.trim() || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(row.email)) 
            errors.email = 'Invalid email address';
          if (!row.studentcode.trim()) errors.studentcode = 'Student code is required';
          if (!row.phone.trim()) errors.phone = 'Phone number is required';
          if (!row.phone.trim() || !/^[0-9]{10}$/.test(row.phone)) 
            errors.phone = 'Please enter a valid 10-digit phone number';

          return errors;
        });

        // Filter out rows with errors and show them
        const invalidRows = individualValidationErrors.filter(errors => Object.keys(errors).length > 0);
        if (invalidRows.length > 0) {
          toast.error('Some rows have validation errors');
          setPreviewData([]);
          setFile(null); // Reset the file state
          return;
        }

        setPreviewData(dataObjects);
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const validateRow = (row) => {
    const errors = {};
    
    // Get values with default empty string if undefined
    const name = row?.name?.toString() || '';
    const email = row?.email?.toString() || '';
    const studentCode = row?.studentcode?.toString() || '';
    const phone = row?.phone?.toString() || '';
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    if (!email.trim() || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) 
      errors.email = 'Invalid email address';
    if (!studentCode.trim()) errors.studentcode = 'Student code is required';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    if (!phone.trim() || !/^[0-9]{10}$/.test(phone)) 
      errors.phone = 'Please enter a valid 10-digit phone number';

    return errors;
  };

  const generatePassword = (name) => {
    // Extract first name and capitalize first letter
    const firstName = name.split(' ')[0];
    return `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}@123`;
  };

  const formatDataForPreview = (data) => {
    return data.map(row => ({
      name: row.name,
      email: row.email,
      studentCode: row.studentCode,
      phone: row.phone,
      password: generatePassword(row.name),
      errors: validateRow(row)
    }));
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setSuccessCount(0);
      setErrorCount(0);
      setErrors([]);

      // Get only valid students (without errors)
      const validStudents = previewData.filter(row => {
        const errors = row?.errors || {};
        return Object.keys(errors).length === 0;
      });
      
      if (validStudents.length === 0) {
        toast.error('No valid students to upload');
        setUploading(false);
        return;
      }

      // Format data to match backend expectations
      const formattedStudents = validStudents.map(student => ({
        name: student.name,
        email: student.email,
        studentCode: student.studentcode, // Convert from lowercase to camelCase
        phone: student.phone,
        password: student.password
      }));

      // Split students into chunks of 10
      const CHUNK_SIZE = 10;
      const chunks = [];
      for (let i = 0; i < formattedStudents.length; i += CHUNK_SIZE) {
        chunks.push(formattedStudents.slice(i, i + CHUNK_SIZE));
      }

      let totalSuccess = 0;
      let totalErrors = 0;
      const allErrors = [];

      // Upload each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkNumber = i + 1;
        
        try {
          const response = await axios.post('/admin/students/bulk', chunk, {
            headers: {
              'Content-Type': 'application/json',
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(progress);
            }
          });

          if (response.data.success) {
            totalSuccess += response.data.created.count;
            // Get existing (failed) student emails
            const existingEmails = response.data.existing?.emails || [];
            allErrors.push(...existingEmails);
            
            // Show success message for this chunk
            const chunkSuccess = response.data.created.count;
            const chunkExisting = existingEmails.length;
            if (chunkExisting > 0) {
              toast.warning(`Chunk ${chunkNumber}: ${chunkSuccess} students created, ${chunkExisting} students already exist`);
            } else {
              toast.success(`Chunk ${chunkNumber}: ${chunkSuccess} students created`);
            }
          } else {
            // If response is not successful, consider all students in this chunk failed
            totalErrors += chunk.length;
            allErrors.push(...chunk.map(student => student.email));
            toast.error(`Chunk ${chunkNumber}: Failed to create any students in this chunk`);
          }

          // Update progress
          const overallProgress = Math.round((chunkNumber / chunks.length) * 100);
          setUploadProgress(overallProgress);

        } catch (error) {
          console.error(`Error uploading chunk ${chunkNumber}:`, error);
          
          // Handle different types of errors
          const errorMessage = error.response?.data?.message || error.message;
          if (error.response?.data?.existing?.emails) {
            // If we have specific existing students data
            const existingEmails = error.response.data.existing.emails;
            allErrors.push(...existingEmails);
            toast.error(`Chunk ${chunkNumber}: ${existingEmails.length} students already exist`);
          } else {
            // General error
            totalErrors += chunk.length;
            allErrors.push(...chunk.map(student => student.email));
            toast.error(`Chunk ${chunkNumber}: ${errorMessage}`);
          }
        }
      }

      // Show final results
      setSuccessCount(totalSuccess);
      setErrorCount(totalErrors);
      setErrors(allErrors);

      if (totalSuccess > 0) {
        toast.success(`${totalSuccess} students uploaded successfully`);
      }
      if (totalErrors > 0) {
        toast.error(`${totalErrors} students failed to upload`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.response?.data?.message || error.message);
    } finally {
      setUploading(false);
      setPreviewData([]);
      setFile(null);
      setPasswordsGenerated(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['name', 'email', 'studentCode', 'phone'];
    const data = [{
      name: 'John Doe',
      email: 'john@example.com',
      studentCode: 'STD123',
      phone: '9876543210'
    }];

    const csvData = [
      headers,
      ...data.map(row => headers.map(header => row[header]))
    ];

    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Bulk Upload Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
      >
        <File size={16} className="mr-2" />
        Bulk Upload
      </button>

      {/* Bulk Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Upload className="mr-2 text-blue-500" size={20} />
                Bulk Student Upload
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File
                </label>
                <div className="flex items-center border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excelFile"
                  />
                  <label htmlFor="excelFile" className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-gray-700 cursor-pointer">
                    <File size={32} className="mb-2" />
                    <span className="text-sm">Drag and drop Excel file here or click to browse</span>
                    <span className="text-xs text-gray-400">(Only .xlsx files are accepted)</span>
                  </label>
                </div>
              </div>

              {previewData.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">
                      Preview Data ({previewData.length} students)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Password
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((row, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.studentcode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.password}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => {
                        const formattedData = previewData.map(row => ({
                          ...row,
                          password: generatePassword(row.name)
                        }));
                        setPreviewData(formattedData);
                        setPasswordsGenerated(true);
                      }}
                      disabled={passwordsGenerated}
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium 
                        ${passwordsGenerated ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                        text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {passwordsGenerated ? (
                        <span>✓ Passwords Generated</span>
                      ) : (
                        <span>Generate Passwords</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={handleUpload}
                disabled={uploading || previewData.length === 0 || !passwordsGenerated}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${uploading || previewData.length === 0 || !passwordsGenerated 
                    ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Upload Students
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
