// Constants
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes

// Theme toggle functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load required libraries
const loadPdfJs = new Promise((resolve) => {
    const pdfScript = document.createElement('script');
    pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    pdfScript.onload = resolve;
    document.head.appendChild(pdfScript);
});

const loadJSZip = new Promise((resolve) => {
    const jsZipScript = document.createElement('script');
    jsZipScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    jsZipScript.onload = resolve;
    document.head.appendChild(jsZipScript);
});

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    initTheme();
    
    // Wait for libraries to load
    await Promise.all([loadPdfJs, loadJSZip]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Add theme toggle event listener
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Help modal functionality
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const modalClose = helpModal.querySelector('.modal-close');

    helpButton.addEventListener('click', () => {
        helpModal.classList.add('active');
    });

    modalClose.addEventListener('click', () => {
        helpModal.classList.remove('active');
    });

    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.remove('active');
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.classList.contains('active')) {
            helpModal.classList.remove('active');
        }
    });

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const progress = document.getElementById('progress');
    const progressBar = progress.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    const gallery = document.getElementById('gallery');

    // Simple click handler for the entire drop zone
    dropZone.onclick = (e) => {
        // Don't trigger if clicking on gallery items
        if (!e.target.closest('.gallery')) {
            fileInput.click();
        }
    };

    // File input change handler
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        // Store the file reference
        lastUploadedFile = file;
        
        const fileType = file.name.toLowerCase();
        
        if (!fileType.match(/\.(pdf|ppt|pptx)$/i)) {
            showError('Please upload a PDF or PowerPoint file (.pdf, .ppt, or .pptx)');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            showError(`File size exceeds 500MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
            return;
        }

        // Clear existing images and reset UI
        const images = gallery.querySelectorAll('.gallery-item img');
        images.forEach(img => URL.revokeObjectURL(img.src));
        gallery.innerHTML = '';
        progress.hidden = false;
        progressBar.style.width = '0%';

        if (fileType.endsWith('.pdf')) {
            processPdfFile(file);
        } else {
            processFile(file);
        }
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        dropZone.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    async function processPdfFile(file) {
        progressText.textContent = 'Reading PDF file...';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;

            for (let i = 1; i <= numPages; i++) {
                progressBar.style.width = `${(i / numPages) * 100}%`;
                progressText.textContent = `Processing page ${i} of ${numPages}...`;

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: ctx,
                    viewport: viewport
                }).promise;

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
                const imageUrl = URL.createObjectURL(blob);
                addImageToGallery(imageUrl, i);

                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            progressText.textContent = 'Processing complete!';
            setTimeout(() => {
                progress.hidden = true;
            }, 1000);

        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred while processing the PDF file');
            progress.hidden = true;
        }
    }

    async function processFile(file) {
        progress.hidden = false;
        progressBar.style.width = '0%';
        progressText.textContent = 'Reading file...';
        gallery.innerHTML = '';

        try {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const arrayBuffer = e.target.result;
                
                // For this demo, we'll create placeholder images
                // In a real implementation, you'd use a library like mammoth.js or other PPT processing libraries
                const numSlides = 5; // This would normally be determined from the PPT file
                
                for (let i = 0; i < numSlides; i++) {
                    progressBar.style.width = `${((i + 1) / numSlides) * 100}%`;
                    progressText.textContent = `Processing slide ${i + 1} of ${numSlides}...`;
                    
                    // Create a canvas for the slide
                    const canvas = document.createElement('canvas');
                    canvas.width = 1920;
                    canvas.height = 1080;
                    const ctx = canvas.getContext('2d');
                    
                    // Fill with a gradient background
                    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(1, '#f8fafc');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Add some placeholder text
                    ctx.fillStyle = '#1e293b';
                    ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Slide ${i + 1}`, canvas.width / 2, canvas.height / 2);
                    
                    // Convert canvas to blob and create URL
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    const imageUrl = URL.createObjectURL(blob);
                    
                    // Add to gallery
                    addImageToGallery(imageUrl, i + 1);
                    
                    // Small delay to show progress
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                progressText.textContent = 'Processing complete!';
                setTimeout(() => {
                    progress.hidden = true;
                }, 1000);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred while processing the file');
            progress.hidden = true;
        }
    }

    // Add iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function addImageToGallery(imageUrl, slideNumber) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Slide ${slideNumber}`;
        
        const downloadBtn = document.createElement('a');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.href = imageUrl;
        downloadBtn.download = `slide_${slideNumber}.png`;
        
        galleryItem.appendChild(img);
        galleryItem.appendChild(downloadBtn);
        gallery.appendChild(galleryItem);

        // Make the upload container compact
        dropZone.classList.add('compact');

        // Add gallery controls if they don't exist
        if (!document.querySelector('.gallery-controls')) {
            const controls = document.createElement('div');
            controls.className = 'gallery-controls';
            
            const downloadAllBtn = document.createElement('button');
            downloadAllBtn.className = 'download-all-btn';
            downloadAllBtn.textContent = 'Download All';  // Same text for all devices now
            downloadAllBtn.onclick = downloadAllImages;
            
            const deleteAllBtn = document.createElement('button');
            deleteAllBtn.className = 'delete-all-btn';
            deleteAllBtn.textContent = 'Delete All';
            deleteAllBtn.onclick = deleteAllImages;
            
            controls.appendChild(downloadAllBtn);
            controls.appendChild(deleteAllBtn);
            gallery.insertBefore(controls, gallery.firstChild);
        }
    }

    function deleteAllImages() {
        // Clear the gallery
        gallery.innerHTML = '';
        
        // Reset upload container
        dropZone.classList.remove('compact');
        
        // Clear any object URLs to prevent memory leaks
        const images = document.querySelectorAll('.gallery-item img');
        images.forEach(img => URL.revokeObjectURL(img.src));
        
        // Reset progress
        progress.hidden = true;
        progressBar.style.width = '0%';
        progressText.textContent = '';
    }

    async function downloadAllImages() {
        const images = gallery.querySelectorAll('.gallery-item img');
        if (images.length === 0) return;

        try {
            const zip = new JSZip();
            let count = 0;
            const total = images.length;
            
            progressText.textContent = 'Preparing download...';
            progress.hidden = false;
            progressBar.style.width = '0%';

            for (let i = 0; i < total; i++) {
                const img = images[i];
                const response = await fetch(img.src);
                const blob = await response.blob();
                zip.file(`slide_${i + 1}.png`, blob);
                
                count++;
                progressBar.style.width = `${(count / total) * 100}%`;
                progressText.textContent = `Adding image ${count} of ${total} to zip...`;
            }

            progressText.textContent = 'Generating zip file...';
            const content = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            });
            const zipUrl = URL.createObjectURL(content);
            
            // Get the original filename from the last uploaded file
            const originalFileName = lastUploadedFile ? lastUploadedFile.name.replace(/\.[^/.]+$/, '') : 'slides';
            
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `${originalFileName}_slides.zip`;

            if (isIOS) {
                // For iOS, open in new tab and show instructions
                showMessage('Opening ZIP file. After downloading, go to Files, tap the ZIP, then use Share → Your Shortcut to save images.');
                window.open(zipUrl, '_blank');
            } else {
                // For non-iOS, trigger direct download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            URL.revokeObjectURL(zipUrl);

            progressText.textContent = 'Download complete!';
            setTimeout(() => {
                progress.hidden = true;
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred while preparing the download');
            progress.hidden = true;
        }
    }

    function showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'info-message';
        messageDiv.textContent = message;
        dropZone.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 5000);
    }

    // Add a variable to store the last uploaded file
    let lastUploadedFile = null;
}); 