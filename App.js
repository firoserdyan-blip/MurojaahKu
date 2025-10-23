// src/App.js (Kode Gabungan untuk Quran Muroja'ah Tracker)

import React, { useState, useEffect, useMemo } from 'react';
import './styles.css'; // Mengimpor CSS untuk tampilan kalender dan modal

// ----------------------------------------------------
// A. HOOK: useLocalStorage (Manajemen Data Lokal)
// ----------------------------------------------------
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Gagal membaca localStorage:", error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Gagal menulis ke localStorage:", error);
    }
  };

  return [storedValue, setValue];
};


// ----------------------------------------------------
// B. SIMULASI API AL-QUR'AN (Ganti dengan Panggilan API Asli saat Deploy)
// ----------------------------------------------------
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

const fetchJuzList = async () => new Promise(resolve => {
  setTimeout(() => resolve(juzData), 300);
});

const fetchSurahsByJuz = async (juzId) => new Promise(resolve => {
  // Hanya ambil surah yang termasuk di juz tersebut (berdasarkan data dummy)
  const filteredSurahs = surahData.filter(surah => surah.juz === juzId);
  setTimeout(() => resolve(filteredSurahs), 300);
});

const fetchSurahText = async (surahId) => new Promise(resolve => {
  const surah = surahData.find(s => s.id === surahId);
  const dummyText = `
    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ.
    {Teks Ayat 1...}
    {Teks Ayat 2...}
    {Teks Ayat 3...}
    ... ${surah ? surah.name_id : 'Surah'} Ayat ${surah ? surah.verses : ''}.
  `;
  setTimeout(() => resolve(dummyText), 300);
});


// ----------------------------------------------------
// C. KOMPONEN: JuzSurahModal (Pop-up Interaktif)
// ----------------------------------------------------
const JuzSurahModal = ({ date, onClose, onSave, existingData }) => {
  const [step, setStep] = useState('JUZ');
  const [juzList, setJuzList] = useState([]);
  const [surahList, setSurahList] = useState([]);
  const [surahText, setSurahText] = useState('');
  
  const [selectedJuz, setSelectedJuz] = useState(null);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadJuz = async () => {
      setIsLoading(true);
      const list = await fetchJuzList();
      setJuzList(list);
      setIsLoading(false);
    };
    loadJuz();
  }, []);

  const handleJuzSelect = async (juz) => {
    setSelectedJuz(juz);
    setStep('SURAH');
    setIsLoading(true);
    const list = await fetchSurahsByJuz(juz.id);
    setSurahList(list);
    setIsLoading(false);
  };
  
  const handleSurahSelect = async (surah) => {
    setSelectedSurah(surah);
    setStep('REVIEW');
    setIsLoading(true);
    const text = await fetchSurahText(surah.id);
    setSurahText(text);
    setIsLoading(false);
  };
  
  const handleSave = () => {
    if (selectedSurah) {
      const progressData = {
        juzId: selectedJuz.id,
        surahId: selectedSurah.id,
        surahName: selectedSurah.name_id,
        catatan: catatan,
        timestamp: new Date().toISOString()
      };
      onSave(date, progressData);
      onClose();
    }
  };

  // --- Render Konten Modal ---
  let content;

  if (isLoading) {
    content = <p>Memuat data Al-Qur'an...</p>;
  } else if (step === 'JUZ') {
    content = (
      <>
        <h3>Pilih Juz untuk Muroja'ah</h3>
        <div className="juz-grid">
          {juzList.map(juz => (
            <button key={juz.id} className="juz-item" onClick={() => handleJuzSelect(juz)}>
              {juz.name}
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'SURAH') {
    content = (
      <>
        <h3>Pilih Surah di {selectedJuz?.name}</h3>
        <button className="back-button" onClick={() => setStep('JUZ')}>Pilih Juz Lain</button>
        <div className="surah-list">
          {surahList.map(surah => (
            <button key={surah.id} className="surah-item" onClick={() => handleSurahSelect(surah)}>
              {surah.name_id} ({surah.verses} Ayat)
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'REVIEW') {
    content = (
      <>
        <h3>Catatan Muroja'ah: {selectedSurah?.name_id}</h3>
        <div className="surah-text-display">
          <pre>{surahText}</pre>
        </div>
        <hr/>
        <div className="catatan-section">
            <h4>Catatan Anda:</h4>
            <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tulis catatan di sini (misalnya: Sudah lancar, Ayat 10-15 diulang, dll.)"
                rows="5"
            ></textarea>
        </div>
        <button className="back-button" onClick={() => setStep('SURAH')}>Pilih Surah Lain</button>
        <button className="save-button" onClick={handleSave}>Simpan Catatan</button>
      </>
    );
  }

  // Tampilan Data Lama (Untuk pengulangan atau review)
  const existingView = existingData.length > 0 && step !== 'REVIEW' ? (
    <div className="existing-progress-view">
        <h4>Progress di {date} sebelumnya:</h4>
        {existingData.map((item, index) => (
            <p key={index}>
                **{item.surahName}** (Juz {item.juzId}): {item.catatan}
            </p>
        ))}
    </div>
  ) : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <header className="modal-header">
            <h2>{date}</h2>
            <button className="close-button" onClick={onClose}>&times;</button>
        </header>
        <div className="modal-body">
          {content}
          {existingView}
        </div>
      </div>
    </div>
  );
};


// ----------------------------------------------------
// D. KOMPONEN: SimpleCalendar (Kalender Sederhana)
// ----------------------------------------------------
const SimpleCalendar = ({ data, onDateClick }) => {
    // Fungsi sederhana untuk mendapatkan tanggal di bulan ini (hanya untuk demonstrasi)
    const daysInMonth = 30; 
    const today = new Date().toISOString().slice(0, 10);
    const hasData = (date) => data[date] && data[date].length > 0;
    
    return (
        <div className="calendar-grid">
            {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                // Membuat tanggal 'YYYY-MM-DD' untuk bulan saat ini
                const currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), day)
                    .toISOString().slice(0, 10);
                
                return (
                    <div 
                        key={day}
                        className={`calendar-day ${hasData(currentDate) ? 'has-data' : ''} ${currentDate === today ? 'today' : ''}`}
                        onClick={() => onDateClick(currentDate)}
                    >
                        {day}
                        {hasData(currentDate) && <span className="indicator">✓</span>}
                    </div>
                );
            })}
        </div>
    );
};


// ----------------------------------------------------
// E. KOMPONEN UTAMA: App
// ----------------------------------------------------
const App = () => {
  // progressData = { "YYYY-MM-DD": [ {data progress}, ... ] }
  const [progressData, setProgressData] = useLocalStorage('quranProgress', {});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };
  
  // Fungsi untuk menyimpan data progress baru ke localStorage
  const handleSaveProgress = (date, newData) => {
    setProgressData(prevData => {
      // Menambahkan data baru ke array yang sudah ada pada tanggal tersebut
      const updatedDateData = prevData[date] ? [...prevData[date], newData] : [newData];
      return { ...prevData, [date]: updatedDateData };
    });
  };
  
  // Ambil data progress yang sudah ada untuk tanggal yang dipilih
  const existingProgress = useMemo(() => progressData[selectedDate] || [], [progressData, selectedDate]);


  return (
    <div className="app-container">
      <h1>📚 Muroja'ah Tracker Lokal</h1>
      <p style={{ color: 'red', fontWeight: 'bold' }}>Perhatian: Data hanya tersimpan di browser perangkat ini (Local Storage).</p>
      
      {/* Component Kalender */}
      <SimpleCalendar 
        data={progressData} 
        onDateClick={handleDateClick} 
      />
      
      {/* Modal Pilihan Juz/Surah/Catatan */}
      {isModalOpen && (
        <JuzSurahModal 
          date={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProgress}
          existingData={existingProgress}
        />
      )}
      
      {/* Tampilkan data lama di luar modal sebagai referensi umum */}
      {existingProgress.length > 0 && !isModalOpen && (
          <div className="existing-progress-view" style={{ marginTop: '30px' }}>
              <h2>Progress di {selectedDate}</h2>
              {existingProgress.map((item, index) => (
                  <p key={index}>
                      **{item.surahName}** (Juz {item.juzId}): {item.catatan}
                  </p>
              ))}
          </div>
      )}
    </div>
  );
};

export default App;
