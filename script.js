document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectedFileText = document.getElementById('selected-file');
    const fileSizeText = document.getElementById('file-size');
    const convertBtn = document.getElementById('convert-btn');
    const downloadSection = document.getElementById('download-section');
    const downloadLink = document.getElementById('download-link');
    const pageSizeSelect = document.getElementById('page-size');

    let selectedFile = null;

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFiles, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelection(files[0]);
    }

    function handleFiles() {
        handleFileSelection(fileInput.files[0]);
    }

    function handleFileSelection(file) {
        if (!file) return;

        // File size check (100 MB limit)
        if (file.size > 100 * 1024 * 1024) {
            alert('Размер файла не должен превышать 100 МБ');
            return;
        }

        selectedFile = file;
        selectedFileText.textContent = `Выбран файл: ${file.name}`;
        fileSizeText.textContent = `Размер: ${(file.size / 1024 / 1024).toFixed(2)} МБ`;
        convertBtn.disabled = false;
    }

    const pageSizes = {
        A1: [1684, 2384],  // в пунктах (1 мм = 2.834 пункта)
        A2: [1190, 1684],
        A3: [842, 1190],
        A4: [595, 842]
    };

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        try {
            const pdfBytes = await convertToPDF(selectedFile);
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = selectedFile.name.replace(/\.[^/.]+$/, "") + '.pdf';
            downloadSection.style.display = 'block';
        } catch (error) {
            console.error('Ошибка конвертации:', error);
            alert('Не удалось конвертировать файл');
        }
    });

    async function convertToPDF(file) {
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();
        
        const selectedSize = pageSizeSelect.value;
        const [width, height] = pageSizes[selectedSize];

        if (file.type.startsWith('image/')) {
            const image = await pdfDoc.embedJpg(await file.arrayBuffer());
            const page = pdfDoc.addPage([width, height]);
            
            // Рассчитываем масштаб для заполнения страницы
            const imageRatio = image.width / image.height;
            const pageRatio = width / height;
            
            let scaleWidth = width;
            let scaleHeight = height;
            
            if (imageRatio > pageRatio) {
                scaleHeight = width / imageRatio;
            } else {
                scaleWidth = height * imageRatio;
            }
            
            page.drawImage(image, {
                x: (width - scaleWidth)/2,
                y: (height - scaleHeight)/2,
                width: scaleWidth,
                height: scaleHeight
            });
        } else {
            const page = pdfDoc.addPage([width, height]);
            page.drawText(`Конвертация файла: ${file.name}`, {
                x: 50,
                y: height - 100,
                size: 15
            });
        }

        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }
});