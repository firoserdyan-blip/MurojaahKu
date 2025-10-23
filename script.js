// script.js (Vanilla JavaScript Murni - DENGAN FITUR HAPUS DATA YANG TEPAT)

// --- A. Hook/Fungsi: Manajemen Local Storage ---
const LOCAL_STORAGE_KEY = 'quranProgressVanilla';

function getProgressData() {
    try {
        const item = localStorage.getItem(LOCAL_STORAGE_KEY);
        return item ? JSON.parse(item) : {};
    } catch (error) {
        console.error("Gagal membaca localStorage:", error);
        return {};
    }
}

function saveProgressData(data) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Gagal menulis ke localStorage:", error);
    }
}

// --- B. Variabel State Global ---
let progressData = getProgressData();
let isModalOpen = false;
let selectedDate = '';
let modalStep = 'JUZ';
let modalSelection = { juz: null, surah: null, catatan: '' };
let isLoading = false;

// --- C. API Mock (Data Dummy) ---
const surahData = [
    { id: 1, juz: 1, name_id: "Al-Fatihah", verses: 7, start_ayah: 1, end_ayah: 7 },
    { id: 2, juz: 1, name_id: "Al-Baqarah", verses: 286, start_ayah: 1, end_ayah: 286 },
    { id: 3, juz: 3, name_id: "Ali 'Imran", verses: 200, start_ayah: 1, end_ayah: 200 },
];

const juzData = [
    { id: 1, surah_start_id: 1, surah_end_id: 2, name: "Juz 1: Alif Lam Mim" },
    { id: 2, surah_start_id: 2, surah_end_id: 2, name: "Juz 2: Sayaqul" },
    { id: 3, surah_start_id: 2, surah_end_id: 3, name: "Juz 3: Tilka-r-Rusul" },
];

const fetchJuzList = () => Promise.resolve(juzData);

const fetchSurahsByJuz = (juzId) => {
    const filteredSurahs = surahData.filter(surah => surah.juz === juzId);
    return Promise.resolve(filteredSurahs);
};

const fetchSurahText = (surahId) => {
    const surah = surahData.find(s => s.id === surahId);
    const dummyText = `
        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ.
        {Teks Ayat 1...}
        {Teks Ayat 2...}
        {Teks Ayat 3...}
        ... ${surah ? surah.name_id : 'Surah'} Ayat ${surah ? surah.verses : ''}.
    `;
    return Promise.resolve(dummyText);
};

// --- D. Fungsi Render (Menggantikan Komponen React) ---

function renderApp() {
    renderCalendar();
    renderModal();
    renderProgressView();
}

// --- Render Kalender ---
function renderCalendar() {
    const root = document.getElementById('calendar-root');
    root.innerHTML = '';
    
    // Asumsi bulan ini memiliki 30 hari untuk kesederhanaan
    const daysInMonth = 30; 
    const today = new Date().toISOString().slice(0, 10);
    
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';

    for (let i = 1; i <= daysInMonth; i++) {
        // Membuat tanggal 'YYYY-MM-DD' untuk bulan saat ini
        const currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), i)
            .toISOString().slice(0, 10);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = i;
        dayDiv.setAttribute('data-date', currentDate);

        // Styling dan data indicator
        if (currentDate === today) {
            dayDiv.classList.add('today');
        }
        if (progressData[currentDate] && progressData[currentDate].length > 0) {
            dayDiv.classList.add('has-data');
            const indicator = document.createElement('span');
            indicator.className = 'indicator';
            indicator.textContent = '✓';
            dayDiv.appendChild(indicator);
        }

        // Event listener (Menggantikan onClick di React)
        dayDiv.addEventListener('click', () => handleDateClick(currentDate));
        
        calendarGrid.appendChild(dayDiv);
    }
    
    root.appendChild(calendarGrid);
}

// --- Render Modal ---
async function renderModal() {
    const root = document.getElementById('modal-root');
    if (!isModalOpen) {
        root.innerHTML = '';
        return;
    }

    let contentHTML = '';
    let currentData = progressData[selectedDate] || [];

    // Tampilan Loading
    if (isLoading) {
        contentHTML = `<p>Memuat data Al-Qur'an...</p>`;
    } 
    // Tampilan Step JUZ
    else if (modalStep === 'JUZ') {
        let juzListHTML = '';
        const list = await fetchJuzList();
        
        list.forEach(juz => {
            juzListHTML += `<button class="juz-item" data-juz-id="${juz.id}" data-juz-name="${juz.name}">${juz.name}</button>`;
        });
        
        contentHTML = `
            <h3>Pilih Juz untuk Muroja'ah</h3>
            <div class="juz-grid">${juzListHTML}</div>
        `;
    } 
    // Tampilan Step SURAH
    else if (modalStep === 'SURAH') {
        let surahListHTML = '';
        const list = await fetchSurahsByJuz(modalSelection.juz.id);

        list.forEach(surah => {
            surahListHTML += `<button class="surah-item" data-surah-id="${surah.id}" data-surah-name="${surah.name_id}">${surah.name_id} (${surah.verses} Ayat)</button>`;
        });

        contentHTML = `
            <h3>Pilih Surah di ${modalSelection.juz.name}</h3>
            <button class="back-button" onclick="setStep('JUZ')">Pilih Juz Lain</button>
            <div class="surah-list">${surahListHTML}</div>
        `;
    } 
    // Tampilan Step REVIEW
    else if (modalStep === 'REVIEW') {
        const surahText = await fetchSurahText(modalSelection.surah.id);
        contentHTML = `
            <h3>Catatan Muroja'ah: ${modalSelection.surah.name_id}</h3>
            <div class="surah-text-display"><pre>${surahText}</pre></div>
            <hr/>
            <div class="catatan-section">
                <h4>Catatan Anda:</h4>
                <textarea id="catatan-input" placeholder="Tulis catatan di sini" rows="5">${modalSelection.catatan}</textarea>
            </div>
        `;
    }

    // Tampilan Progress Lama (di modal)
    let existingProgressHTML = '';
    if (currentData.length > 0) {
        let items = currentData.map(item => 
            `<p>• **${item.surahName}** (Juz ${item.juzId}): ${item.catatan}</p>`
        ).join('');
        existingProgressHTML = `<div class="existing-progress-view"><h4>Progress di ${selectedDate} sebelumnya:</h4>${items}</div>`;
    }

    // --- Kontrol tombol di Modal Footer (Solusi Hapus Data) ---
    let footerContentHTML = '';
    
    // 1. Tombol Save/Back (hanya visible di step REVIEW, diletakkan di sisi kanan)
    if (modalStep === 'REVIEW') {
        footerContentHTML = `
            <div class="review-controls-footer">
                <button class="back-button" onclick="setStep('SURAH')">Pilih Surah Lain</button>
                <button class="save-button" id="save-progress-btn">Simpan Catatan</button>
            </div>
        `;
    }

    // 2. Tombol Hapus (selalu tersedia jika ada data, kecuali saat proses REVIEW)
    const deleteButtonHTML = currentData.length > 0 && modalStep !== 'REVIEW' ? 
        `<button class="delete-button" id="delete-progress-btn">Hapus Semua Data di Tanggal Ini</button>` : '';

    const footerHTML = `
        <div class="modal-footer">
            ${deleteButtonHTML}
            ${footerContentHTML}
        </div>
    `;
    
    // --- Struktur Modal Akhir ---
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content large-modal">
                <header class="modal-header">
                    <h2>${selectedDate}</h2>
                    <button class="close-button" onclick="closeModal()">&times;</button>
                </header>
                <div class="modal-body">
                    ${contentHTML}
                    ${existingProgressHTML}
                </div>
                ${footerHTML} </div>
        </div>
    `;

    root.innerHTML = modalHTML;
    attachModalListeners();
}

// --- Render Progress View di Luar Modal (tetap sama) ---
function renderProgressView() {
    const root = document.getElementById('progress-view-root');
    root.innerHTML = '';
    
    if (isModalOpen || !selectedDate) return;

    const existingProgress = progressData[selectedDate] || [];

    if (existingProgress.length > 0) {
        let items = existingProgress.map(item => 
            `<p>• **${item.surahName}** (Juz ${item.juzId}): ${item.catatan}</p>`
        ).join('');

        const progressDiv = document.createElement('div');
        progressDiv.className = 'existing-progress-view';
        progressDiv.style.marginTop = '30px';
        progressDiv.innerHTML = `<h2>Progress di ${selectedDate}</h2>${items}`;
        
        root.appendChild(progressDiv);
    }
}

// --- E. Event Handlers dan State Updater (tetap sama) ---

function handleDateClick(date) {
    selectedDate = date;
    isModalOpen = true;
    modalStep = 'JUZ';
    modalSelection = { juz: null, surah: null, catatan: '' };
    renderApp();
}

function closeModal() {
    isModalOpen = false;
    selectedDate = '';
    renderApp();
}

function setStep(step) {
    modalStep = step;
    renderModal();
}

function saveProgress() {
    const catatanInput = document.getElementById('catatan-input');
    const catatan = catatanInput ? catatanInput.value : '';

    if (modalSelection.surah) {
        const newData = {
            juzId: modalSelection.juz.id,
            surahId: modalSelection.surah.id,
            surahName: modalSelection.surah.name_id,
            catatan: catatan,
            timestamp: new Date().toISOString()
        };

        const currentData = progressData[selectedDate] ? [...progressData[selectedDate], newData] : [newData];
        progressData = { ...progressData, [selectedDate]: currentData };
        saveProgressData(progressData);
        
        closeModal();
    }
}

function deleteProgress() {
    if (confirm(`Anda yakin ingin menghapus SEMUA data Muroja'ah di tanggal ${selectedDate}? Aksi ini tidak dapat dibatalkan.`)) {
        // Buat objek baru tanpa tanggal yang dipilih
        const { [selectedDate]: _, ...updatedProgressData } = progressData;
        
        progressData = updatedProgressData;
        saveProgressData(progressData);
        
        // Tutup modal dan refresh tampilan
        closeModal();
        alert(`Data Muroja'ah di tanggal ${selectedDate} berhasil dihapus.`);
    }
}


// --- F. Attach Listener untuk Modal (Event Delegation) ---

function attachModalListeners() {
    const modalContent = document.querySelector('.modal-overlay');
    if (!modalContent) return;

    modalContent.addEventListener('click', async (e) => {
        // Handle Juz Select
        if (e.target.classList.contains('juz-item')) {
            isLoading = true;
            renderModal();
            
            const juz = {
                id: parseInt(e.target.dataset.juzId),
                name: e.target.dataset.juzName
            };
            modalSelection.juz = juz;
            modalStep = 'SURAH';
            
            await fetchSurahsByJuz(juz.id); 
            isLoading = false;
            renderModal();
        }

        // Handle Surah Select
        else if (e.target.classList.contains('surah-item')) {
            isLoading = true;
            renderModal();
            
            const surah = {
                id: parseInt(e.target.dataset.surahId),
                name_id: e.target.dataset.surahName
            };
            modalSelection.surah = surah;
            modalStep = 'REVIEW';
            
            await fetchSurahText(surah.id);
            isLoading = false;
            renderModal();
        }

        // Handle Save Button
        else if (e.target.id === 'save-progress-btn') {
            saveProgress();
        }

        // Handle Delete Button
        else if (e.target.id === 'delete-progress-btn') {
            deleteProgress();
        }
    });
}


// --- G. Initial App Load ---
document.addEventListener('DOMContentLoaded', renderApp);
