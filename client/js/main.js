document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const filenameDisplay = document.getElementById('filename');
    const removeBtn = document.getElementById('remove-btn');
    const printBtn = document.getElementById('print-btn');
    const statusMessage = document.getElementById('status-message');

    let currentFile = null;

    // Handle drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        });
    });

    // Handle file drop
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Handle file input selection
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            currentFile = files[0];
            showFilePreview(currentFile);
        }
    }

    function showFilePreview(file) {
        filenameDisplay.textContent = file.name;
        uploadArea.classList.add('hidden');
        filePreview.classList.remove('hidden');
        printBtn.disabled = false;
        hideStatus();

        const imagePreview = document.getElementById('image-preview');
        const pdfCanvas = document.getElementById('pdf-canvas');
        const genericPreview = document.getElementById('generic-preview');

        imagePreview.classList.add('hidden');
        pdfCanvas.classList.add('hidden');
        genericPreview.classList.add('hidden');
        imagePreview.src = '';

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            const fileURL = URL.createObjectURL(file);
            pdfCanvas.classList.remove('hidden');
            
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                const loadingTask = window.pdfjsLib.getDocument(fileURL);
                loadingTask.promise.then(pdf => {
                    return pdf.getPage(1);
                }).then(page => {
                    const viewport = page.getViewport({ scale: 1.0 });
                    const containerHeight = 200; // preview container height in CSS pixels
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    const scale = (containerHeight / viewport.height) * devicePixelRatio;
                    const scaledViewport = page.getViewport({ scale: scale });

                    const context = pdfCanvas.getContext('2d');
                    pdfCanvas.width = scaledViewport.width;
                    pdfCanvas.height = scaledViewport.height;
                    // Set CSS size to keep container dimensions consistent
                    pdfCanvas.style.width = `${scaledViewport.width / devicePixelRatio}px`;
                    pdfCanvas.style.height = `${scaledViewport.height / devicePixelRatio}px`;
                    
                    const renderContext = {
                        canvasContext: context,
                        viewport: scaledViewport
                    };
                    page.render(renderContext);
                }).catch(err => {
                    console.error('Error rendering PDF:', err);
                    pdfCanvas.classList.add('hidden');
                    genericPreview.classList.remove('hidden');
                });
            } else {
                genericPreview.classList.remove('hidden');
            }
        } else {
            genericPreview.classList.remove('hidden');
        }
    }

    const pageSelection = document.getElementById('page-selection');
    const customPagesInput = document.getElementById('custom-pages-input');

    // Handle page selection toggle
    pageSelection.addEventListener('change', () => {
        if (pageSelection.value === 'custom') {
            customPagesInput.classList.remove('hidden');
            customPagesInput.focus();
        } else {
            customPagesInput.classList.add('hidden');
        }
    });

    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        filePreview.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        printBtn.disabled = true;
        
        // Reset print settings
        pageSelection.value = 'all';
        customPagesInput.value = '';
        customPagesInput.classList.add('hidden');
        
        hideStatus();
    });

    printBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // UI changes for printing state
        const originalContent = printBtn.innerHTML;
        printBtn.disabled = true;
        printBtn.classList.add('loading');
        printBtn.innerHTML = `
            <span>Sending to Printer...</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        `;
        hideStatus();

        const formData = new FormData();
        formData.append('file', currentFile);
        
        // Add page range if custom is selected
        if (pageSelection.value === 'custom' && customPagesInput.value.trim()) {
            formData.append('pages', customPagesInput.value.trim());
        }

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showStatus('File successfully sent to printer!', 'success');
                // Reset after 3 seconds
                setTimeout(() => {
                    removeBtn.click();
                }, 3000);
            } else {
                showStatus(result.detail || 'Failed to print file.', 'error');
            }
        } catch (error) {
            showStatus('Network error occurred. Please try again.', 'error');
        } finally {
            // Restore button state
            printBtn.classList.remove('loading');
            printBtn.innerHTML = originalContent;
            printBtn.disabled = false;
        }
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message status-${type}`;
        statusMessage.classList.remove('hidden');
    }

    function hideStatus() {
        statusMessage.classList.add('hidden');
    }
});
