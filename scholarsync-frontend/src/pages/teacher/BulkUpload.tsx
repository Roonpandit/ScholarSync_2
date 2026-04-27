import { useState, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { Upload, X, File, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { post } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';

interface PreviewRow {
  name: string;
  email: string;
  studentcode: string;
  phone: string;
  password?: string;
  errors?: Record<string, string>;
}

interface FormattedStudent {
  name: string;
  email: string;
  studentCode: string;
  phone: string;
  password: string;
}

interface BulkRegisterResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

const BulkUpload = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [passwordsGenerated, setPasswordsGenerated] = useState<boolean>(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
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
      reader.onload = (evt: ProgressEvent<FileReader>) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Get headers from first row
        const headers = (jsonData[0] || []).map((header) => String(header).trim().toLowerCase());

        // Validate headers
        const requiredHeaders = ['name', 'email', 'studentcode', 'phone'];
        const isValid = requiredHeaders.every((header) => {
          return headers.some((h) => h.toLowerCase() === header);
        });

        if (!isValid) {
          toast.error('Invalid file format. Required columns: Name, Email, StudentCode, Phone');
          return;
        }

        // Map headers to lowercase for consistency
        const headerMap: Record<string, number> = headers.reduce((map: Record<string, number>, header: string, index: number) => {
          map[header.toLowerCase()] = index;
          return map;
        }, {});

        // Convert to array of objects with passwords
        const dataObjects: PreviewRow[] = jsonData.slice(1).map((row) => {
          return {
            name: row[headerMap['name']]?.toString()?.trim() || '',
            email: row[headerMap['email']]?.toString()?.trim() || '',
            studentcode: row[headerMap['studentcode']]?.toString()?.trim() || '',
            phone: row[headerMap['phone']]?.toString()?.trim() || '',
          };
        });

        // Format data for preview with passwords and validation
        const formattedData: PreviewRow[] = dataObjects.map((row) => ({
          name: row.name,
          email: row.email,
          studentcode: row.studentcode,
          phone: row.phone,
          password: generatePassword(row.name),
        }));

        const previewDataWithErrors: PreviewRow[] = formattedData.map((row) => ({
          ...row,
          errors: validateRow(row),
        }));

        // Get all validation errors
        const validationErrors = previewDataWithErrors
          .map((row, index) => {
            const rowErrors = row.errors || {};
            if (Object.keys(rowErrors).length > 0) {
              return {
                rowNumber: index + 2, // +2 because we skip header row and index starts from 0
                errors: Object.entries(rowErrors).map(([field, message]) => `${field}: ${message}`),
              };
            }
            return null;
          })
          .filter(Boolean);

        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.map(
            (v) => `Row ${v!.rowNumber}: ${v!.errors.join(', ')}`
          );

          toast.error(`Validation errors found:\n${errorMessages.join('\n')}`, {
            position: 'top-right',
            autoClose: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setPreviewData([]);
          setFile(null); // Reset the file state
          return;
        }

        setPreviewData(previewDataWithErrors);

        // Validate each row
        const individualValidationErrors = formattedData.map((row) => {
          const rowErrors: Record<string, string> = {};

          if (!row.name.trim()) rowErrors.name = 'Name is required';
          if (!row.email.trim()) rowErrors.email = 'Email is required';
          if (!row.email.trim() || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(row.email))
            rowErrors.email = 'Invalid email address';
          if (!row.studentcode.trim()) rowErrors.studentcode = 'Student code is required';
          if (!row.phone.trim()) rowErrors.phone = 'Phone number is required';
          if (!row.phone.trim() || !/^[0-9]{10}$/.test(row.phone))
            rowErrors.phone = 'Please enter a valid 10-digit phone number';

          return rowErrors;
        });

        // Filter out rows with errors and show them
        const invalidRows = individualValidationErrors.filter((rowErrors) => Object.keys(rowErrors).length > 0);
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

  const validateRow = (row: PreviewRow): Record<string, string> => {
    const rowErrors: Record<string, string> = {};

    // Get values with default empty string if undefined
    const name = row?.name?.toString() || '';
    const email = row?.email?.toString() || '';
    const studentCode = row?.studentcode?.toString() || '';
    const phone = row?.phone?.toString() || '';

    if (!name.trim()) rowErrors.name = 'Name is required';
    if (!email.trim()) rowErrors.email = 'Email is required';
    if (!email.trim() || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))
      rowErrors.email = 'Invalid email address';
    if (!studentCode.trim()) rowErrors.studentcode = 'Student code is required';
    if (!phone.trim()) rowErrors.phone = 'Phone number is required';
    if (!phone.trim() || !/^[0-9]{10}$/.test(phone))
      rowErrors.phone = 'Please enter a valid 10-digit phone number';

    return rowErrors;
  };

  const generatePassword = (name: string): string => {
    // Extract first name and capitalize first letter
    const firstName = name.split(' ')[0];
    return `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}@123`;
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setSuccessCount(0);
      setErrorCount(0);
      setErrors([]);

      // Get only valid students (without errors)
      const validStudents = previewData.filter((row) => {
        const rowErrors = row?.errors || {};
        return Object.keys(rowErrors).length === 0;
      });

      if (validStudents.length === 0) {
        toast.error('No valid students to upload');
        setUploading(false);
        return;
      }

      // Format data to match backend expectations
      const formattedStudents: FormattedStudent[] = validStudents.map((student) => ({
        name: student.name,
        email: student.email,
        studentCode: student.studentcode, // Convert from lowercase to camelCase
        phone: student.phone,
        password: student.password || generatePassword(student.name),
      }));

      // Split students into chunks of 10
      const CHUNK_SIZE = 10;
      const chunks: FormattedStudent[][] = [];
      for (let i = 0; i < formattedStudents.length; i += CHUNK_SIZE) {
        chunks.push(formattedStudents.slice(i, i + CHUNK_SIZE));
      }

      let totalSuccess = 0;
      let totalErrors = 0;
      const allErrors: string[] = [];

      // Upload all chunks
      const allResponses: Array<BulkRegisterResponse | { error: unknown }> = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        try {
          const response = await post<BulkRegisterResponse>(API_ENDPOINTS.BULK_REGISTER, chunk, {
            'Content-Type': 'application/json',
          });
          allResponses.push(response);
        } catch (error) {
          allResponses.push({ error });
        }
      }

      // Process all responses at once
      const successResponses = allResponses.filter(
        (r) => !('error' in r) && (r as BulkRegisterResponse).success
      ) as BulkRegisterResponse[];
      const errorResponses = allResponses.filter(
        (r) => 'error' in r || !(r as BulkRegisterResponse).success
      );

      if (successResponses.length > 0) {
        // Show success message from the last successful response
        toast.success(successResponses[successResponses.length - 1].message);
      }

      if (errorResponses.length > 0) {
        // Show error message from the first error
        const firstError = errorResponses[0];
        if ('error' in firstError) {
          const axiosError = firstError.error as { response?: { data?: { message?: string } } };
          toast.error(axiosError?.response?.data?.message || 'Failed to upload students');
        } else {
          toast.error((firstError as BulkRegisterResponse).message || 'Failed to create students');
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
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setPreviewData([]);
      setFile(null);
      setPasswordsGenerated(false);
    }
  };

  const downloadExcelTemplate = () => {
    // Create an array of data with headers
    const data = [
      ['Name', 'Email', 'Phone', 'StudentCode'],
      ['John Doe', 'john@example.com', '9876543210', 'STD123'],
    ];

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Template');

    // Export the file
    XLSX.writeFile(wb, 'student_template.xlsx');
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
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel File</label>
                <div className="flex items-center border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" id="excelFile" />
                  <label
                    htmlFor="excelFile"
                    className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <File size={32} className="mb-2" />
                    <span className="text-sm">Drag and drop Excel file here or click to browse</span>
                    <span className="text-xs text-gray-400">(Only .xlsx files are accepted)</span>
                  </label>
                </div>
              </div>

              {previewData.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Preview Data ({previewData.length} students)</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((row, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.studentcode}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => {
                        const formattedData = previewData.map((row) => ({
                          ...row,
                          password: generatePassword(row.name),
                        }));
                        setPreviewData(formattedData);
                        setPasswordsGenerated(true);
                      }}
                      disabled={passwordsGenerated}
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium
                        ${passwordsGenerated ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                        text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {passwordsGenerated ? <span>Passwords Generated</span> : <span>Generate Passwords</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={downloadExcelTemplate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download size={16} className="mr-2" />
                Download Excel Template
              </button>
              <button
                onClick={handleUpload}
                disabled={previewData.length === 0 || !passwordsGenerated || uploading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                  ${
                    previewData.length === 0 || !passwordsGenerated || uploading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <Upload size={16} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload Students'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
