// Connect to Socket.IO server
const socket = io('http://localhost:5000'); // Change to 'https://adminbackend-axxb.onrender.com' for deployed backend

// Log WebSocket connection status
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  document.getElementById('statusText').textContent = 'Connected to server';
});

// Handle WebSocket errors
socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
  document.getElementById('statusText').textContent = 'Failed to connect to server';
  document.getElementById('uploadStatus').textContent = 'Cannot upload: Server not available';
  document.getElementById('uploadStatus').className = 'status-message error';
  document.getElementById('progressContainer').className = 'progress-container hidden';
});

// Listen for upload progress updates
socket.on('uploadProgress', (data) => {
  console.log('Received progress:', data);
  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('statusText');
  const uploadStatus = document.getElementById('uploadStatus');
  const progressContainer = document.getElementById('progressContainer');

  if (data.progress === -1) {
    progressBar.value = 0;
    statusText.textContent = 'Upload failed';
    uploadStatus.textContent = `Failed: ${data.error || 'Unknown error'}`;
    uploadStatus.className = 'status-message error';
    progressContainer.className = 'progress-container hidden';
  } else {
    progressContainer.className = 'progress-container visible';
    progressBar.value = data.progress;
    statusText.textContent = `Processing: ${data.progress}%`;
    uploadStatus.textContent = data.progress === 100 ? 'Uploaded Successfully!' : 'Processing file...';
    uploadStatus.className = data.progress === 100 ? 'status-message success' : 'status-message';
    if (data.progress === 100) {
      setTimeout(() => {
        progressContainer.className = 'progress-container hidden';
      }, 2000); // Hide progress bar after 2 seconds
    }
  }
});

// Handle Enter key to trigger upload
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    document.getElementById('uploadButton').click();
  }
});

// Handle upload button click
document.getElementById('uploadButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  const uploadButton = document.getElementById('uploadButton');
  const uploadStatus = document.getElementById('uploadStatus');
  const statusText = document.getElementById('statusText');
  const progressBar = document.getElementById('progressBar');
  const progressContainer = document.getElementById('progressContainer');

  // Reset UI
  uploadStatus.textContent = '';
  statusText.textContent = '';
  progressBar.value = 0;
  uploadStatus.className = 'status-message';
  progressContainer.className = 'progress-container hidden';

  // Validate file selection
  if (!fileInput.files || fileInput.files.length === 0) {
    uploadStatus.textContent = 'Please select a file to upload.';
    uploadStatus.className = 'status-message error';
    return;
  }

  const file = fileInput.files[0];
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  // Validate file type
  if (!allowedExtensions.includes(fileExtension)) {
    uploadStatus.textContent = 'Invalid file type. Please upload a CSV or Excel file.';
    uploadStatus.className = 'status-message error';
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    uploadStatus.textContent = 'File is too large. Maximum size is 10MB.';
    uploadStatus.className = 'status-message error';
    return;
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file);

  try {
    uploadButton.disabled = true;
    uploadStatus.textContent = 'Uploading file...';
    uploadStatus.className = 'status-message';
    progressContainer.className = 'progress-container visible';

    const response = await fetch('http://localhost:5000/admin/upload', { // Change to 'https://adminbackend-axxb.onrender.com/admin/upload' for deployed backend
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Upload response:', result);
    fileInput.value = ''; // Clear file input
  } catch (error) {
    console.error('Upload error:', error);
    uploadStatus.textContent = `Failed: ${error.message}`;
    uploadStatus.className = 'status-message error';
    statusText.textContent = 'Upload failed';
    progressBar.value = 0;
    progressContainer.className = 'progress-container hidden';
  } finally {
    uploadButton.disabled = false;
  }
});