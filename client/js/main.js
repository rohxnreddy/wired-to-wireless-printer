document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const filenameDisplay = document.getElementById('filename');
    const removeBtn = document.getElementById('remove-btn');
    const printBtn = document.getElementById('print-btn');
    const statusMessage = document.getElementById('status-message');
    const barContainer = document.querySelector('.progress-bar-container');
    const bar = document.getElementById('progress-bar');

    let currentFile = null;
    let totalPages = null;

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
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            currentFile = files[0];
            showFilePreview(currentFile);
        }
    }

    const pageSelection = document.getElementById('page-selection');
    const customPagesInput = document.getElementById('custom-pages-input');
    const pagesSettingRow = document.getElementById('pages-setting-row');
    const pagesSettingsContainer = document.querySelector('.print-settings');
    const copiesInput = document.getElementById('copies-input');

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
        pagesSettingRow.classList.remove('hidden');
        pagesSettingsContainer.classList.remove('hidden'); // Show for next file
        copiesInput.value = '1';
 
        hideStatus();
    });
 
    function showFilePreview(file) {
        filenameDisplay.textContent = file.name;
        uploadArea.classList.add('hidden');
        filePreview.classList.remove('hidden');
        printBtn.disabled = false;
        hideStatus();
 
        totalPages = null; // Reset for new file
        pagesSettingRow.classList.remove('hidden');
        pagesSettingsContainer.classList.remove('hidden'); // Default to show
 
        const imagePreview = document.getElementById('image-preview');
        const pdfCanvas = document.getElementById('pdf-canvas');
        const genericPreview = document.getElementById('generic-preview');
 
        imagePreview.classList.add('hidden');
        pdfCanvas.classList.add('hidden');
        genericPreview.classList.add('hidden');
        imagePreview.src = '';
 
        if (file.type.startsWith('image/')) {
            totalPages = 1;
            pagesSettingRow.classList.add('hidden');
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
                    totalPages = pdf.numPages;
                    console.log('Document pages:', totalPages);
 
                    // Hide pages setting if it's a 1-page PDF
                    if (totalPages === 1) {
                        pagesSettingRow.classList.add('hidden');
                    }
 
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
        if (pageSelection.value === 'custom') {
            const pages = customPagesInput.value.trim();
            if (!pages) {
                showStatus('Please enter a page range.', 'error');
                resetPrintBtn(originalContent);
                return;
            }

            // Advanced validation for page range: digits, commas, and dashes only
            const pageRangeRegex = /^[\d\s\-,]+$/;
            if (!pageRangeRegex.test(pages)) {
                showStatus('Invalid page range format. Use numbers, commas, or dashes (e.g. 1-5, 8).', 'error');
                resetPrintBtn(originalContent);
                return;
            }

            // Check if pages are within document range (if totalPages is known)
            if (totalPages !== null) {
                const parts = pages.split(',').map(p => p.trim());
                let outOfRange = false;
                
                for (const part of parts) {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                        if (start > totalPages || end > totalPages || start < 1 || end < 1) {
                            outOfRange = true;
                            break;
                        }
                    } else {
                        const pageNum = parseInt(part);
                        if (pageNum > totalPages || pageNum < 1) {
                            outOfRange = true;
                            break;
                        }
                    }
                }

                if (outOfRange) {
                    showStatus(`Enter a valid range from 1-${totalPages}`, 'error');
                    resetPrintBtn(originalContent);
                    return;
                }
            }
            
            formData.append('pages', pages);
        }

        // Always send copies count
        const copies = parseInt(copiesInput.value, 10);
        formData.append('copies', (copies >= 1 && copies <= 10) ? copies : 1);

        try {
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/upload');

                xhr.upload.addEventListener('loadstart', () => {
                    barContainer.classList.remove('hidden');
                    bar.style.width = '0%';
                });

                xhr.upload.addEventListener('progress', e => {
                    if (e.lengthComputable) {
                        bar.style.width = (e.loaded / e.total * 100) + '%';
                    }
                });

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            reject(result.detail || 'Failed to print file.');
                        } catch (e) {
                            reject('Failed to print file.');
                        }
                    }
                };

                xhr.onerror = () => {
                    reject('Network error occurred. Please try again.');
                };

                xhr.send(formData);
            });

            showStatus('File successfully sent to printer!', 'success');
            // Reset after 3 seconds
            setTimeout(() => {
                removeBtn.click();
            }, 3000);
        } catch (error) {
            showStatus(typeof error === 'string' ? error : 'Network error occurred.', 'error');
        } finally {
            setTimeout(() => {
                barContainer.classList.add('hidden');
                bar.style.width = '0%';
            }, 500);
            resetPrintBtn(originalContent);
        }
    });

    function resetPrintBtn(originalContent) {
        printBtn.classList.remove('loading');
        printBtn.innerHTML = originalContent;
        printBtn.disabled = false;
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message status-${type}`;
        statusMessage.classList.remove('hidden');
    }

    function hideStatus() {
        statusMessage.classList.add('hidden');
    }
});
