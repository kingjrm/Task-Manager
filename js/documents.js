// Documents Module - Handle document uploads and management

const Documents = {
    state: {
        documents: [],
        currentFilter: 'all',
        userId: null // Will be set from window.currentUser after auth
    },

    // Initialize documents module
    init() {
        if (window.currentUser && window.currentUser.id) {
            this.state.userId = window.currentUser.id;
            console.log('Documents initialized with user ID:', this.state.userId);
        } else {
            console.error('No current user found for documents!');
            this.state.userId = 1; // Fallback
        }
    },

    // Load documents from API
    async loadDocuments(category = 'all') {
        try {
            const url = `api/documents.php?user_id=${this.state.userId}${category !== 'all' ? '&category=' + category : ''}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                this.state.documents = result.data || [];
                this.state.currentFilter = category;
                this.renderDocuments();
            } else {
                console.error('Failed to load documents:', result.message);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    },

    // Upload new document
    async uploadDocument(formData) {
        try {
            console.log('Uploading document...');
            console.log('FormData contents:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
            }
            
            const response = await fetch('api/documents.php', {
                method: 'POST',
                body: formData
            });
            
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response result:', result);
            
            if (result.success) {
                UI.showNotification('Document uploaded successfully!', 'success');
                await this.loadDocuments(this.state.currentFilter);
                return true;
            } else {
                console.error('Upload failed:', result);
                UI.showNotification(result.message || 'Failed to upload document', 'error');
                return false;
            }
        } catch (error) {
            console.error('Upload error:', error);
            UI.showNotification('Error uploading document: ' + error.message, 'error');
            return false;
        }
    },

    // Delete document
    async deleteDocument(documentId) {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`api/documents.php?id=${documentId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                UI.showNotification('Document deleted successfully!', 'success');
                await this.loadDocuments(this.state.currentFilter);
            } else {
                UI.showNotification(result.message || 'Failed to delete document', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            UI.showNotification('Error deleting document', 'error');
        }
    },

    // Render documents list
    renderDocuments() {
        const documentsList = document.getElementById('documentsList');
        if (!documentsList) return;

        documentsList.innerHTML = '';

        if (this.state.documents.length === 0) {
            documentsList.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; margin: 0 auto 16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">No documents uploaded yet</p>
                    <button class="empty-action-btn" onclick="document.getElementById('uploadDocBtn').click()" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">Upload Your First Document</button>
                </div>
            `;
            return;
        }

        this.state.documents.forEach(doc => {
            const docCard = this.createDocumentCard(doc);
            documentsList.appendChild(docCard);
        });
    },

    // Create document card element
    createDocumentCard(doc) {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: all 0.2s; display: flex; flex-direction: column;';
        
        const fileIcon = this.getFileIcon(doc.file_extension);
        const fileSize = this.formatFileSize(doc.file_size);
        const uploadDate = new Date(doc.created_at).toLocaleDateString();
        
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; flex-shrink: 0;">
                    ${fileIcon}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h4 style="font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.name}</h4>
                    <p style="font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 500;">${doc.category}</p>
                </div>
            </div>
            ${doc.description ? `<p style="font-size: 12px; color: var(--text-muted); margin: 0 0 12px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${doc.description}</p>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted); margin-bottom: 16px; padding: 8px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
                <span style="font-weight: 500;">${fileSize}</span>
                <span>${uploadDate}</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="doc-preview-btn" 
                    data-id="${doc.id}" 
                    data-path="${doc.file_path}" 
                    data-name="${doc.name}" 
                    data-extension="${doc.file_extension}" 
                    onclick="if(typeof Documents !== 'undefined') { Documents.previewDocument('${doc.file_path}', '${doc.name}', '${doc.file_extension}'); }"
                    style="flex: 1; padding: 9px 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;" 
                    onmouseover="this.style.opacity='0.85'" 
                    onmouseout="this.style.opacity='1'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Preview
                </button>
                <button class="doc-download-btn" data-id="${doc.id}" data-path="${doc.file_path}" data-name="${doc.file_name}" style="flex: 1; padding: 9px 12px; background: var(--secondary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                    </svg>
                    Download
                </button>
                <button class="doc-delete-btn" data-id="${doc.id}" style="padding: 9px 12px; background: transparent; color: #ef4444; border: 1px solid #ef4444; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; justify-content: center;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;

        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.12)';
            card.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = 'none';
            card.style.transform = 'translateY(0)';
        });

        return card;
    },

    // Get file icon based on extension
    getFileIcon(extension) {
        const icons = {
            'pdf': '📄',
            'doc': '📝',
            'docx': '📝',
            'xls': '📊',
            'xlsx': '📊',
            'ppt': '📊',
            'pptx': '📊',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'txt': '📃'
        };
        return icons[extension?.toLowerCase()] || '📁';
    },

    // Format file size
    formatFileSize(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // Preview document
    previewDocument(filePath, fileName, fileExtension) {
        console.log('previewDocument called with:', { filePath, fileName, fileExtension });
        
        const modal = document.getElementById('previewModal');
        const previewContent = document.getElementById('previewContent');
        const previewTitle = document.getElementById('previewTitle');
        const downloadBtn = document.getElementById('previewDownloadBtn');
        
        console.log('Modal elements found:', { modal, previewContent, previewTitle, downloadBtn });
        
        if (!modal || !previewContent) {
            console.error('Modal or preview content not found!');
            return;
        }
        
        previewTitle.textContent = fileName;
        previewContent.innerHTML = '';
        
        const extension = fileExtension?.toLowerCase();
        
        // Handle different file types
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
            // Image preview
            const img = document.createElement('img');
            img.src = filePath;
            img.alt = fileName;
            img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
            img.onerror = () => {
                previewContent.innerHTML = '<div style="text-align: center; color: var(--text-muted);"><p>Failed to load image</p></div>';
            };
            previewContent.appendChild(img);
        } else if (extension === 'pdf') {
            // PDF preview using iframe
            const iframe = document.createElement('iframe');
            iframe.src = filePath;
            iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
            iframe.onerror = () => {
                previewContent.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;"><p>Cannot preview PDF in browser</p><p style="font-size: 12px; margin-top: 8px;">Please download to view</p></div>';
            };
            previewContent.appendChild(iframe);
        } else if (['txt', 'log', 'md', 'json', 'xml', 'csv'].includes(extension)) {
            // Text file preview
            fetch(filePath)
                .then(response => response.text())
                .then(text => {
                    const pre = document.createElement('pre');
                    pre.style.cssText = 'padding: 20px; margin: 0; white-space: pre-wrap; word-wrap: break-word; color: var(--text); font-family: monospace; font-size: 13px; line-height: 1.6; max-height: 100%; overflow: auto;';
                    pre.textContent = text;
                    previewContent.innerHTML = '';
                    previewContent.appendChild(pre);
                })
                .catch(() => {
                    previewContent.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;"><p>Failed to load file content</p></div>';
                });
        } else {
            // Unsupported file type
            previewContent.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; margin: 0 auto 16px;">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p style="font-size: 16px; margin-bottom: 8px;">Preview not available</p>
                    <p style="font-size: 13px; opacity: 0.7;">This file type (.${extension}) cannot be previewed</p>
                    <p style="font-size: 12px; margin-top: 12px;">Please download the file to view it</p>
                </div>
            `;
        }
        
        // Set up download button
        downloadBtn.onclick = () => {
            window.open(filePath, '_blank');
        };
        
        // Show modal
        console.log('About to show modal, current display:', modal.style.display);
        modal.style.display = 'flex';
        console.log('Modal display set to flex, current display:', modal.style.display);
        console.log('Modal computed style:', window.getComputedStyle(modal).display);
    }
};
