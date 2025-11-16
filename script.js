/*
KODE LENGKAP - Ganti seluruh isi file script.js Anda dengan ini.
Perbaikan ada di dalam fungsi render() untuk menangani data lama.
*/
document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Definisi Elemen ---
    const inputArea = document.getElementById('inputArea');
    const inputNama = document.getElementById('inputNama');
    const inputHarga = document.getElementById('inputHarga');
    const inputTanggal = document.getElementById('inputTanggal');
    const inputPrioritas = document.getElementById('inputPrioritas');
    const tombolTambah = document.getElementById('tombolTambah');
    const daftarPengeluaran = document.getElementById('daftarPengeluaran');
    const pilihBulan = document.getElementById('pilihBulan');
    const statusBulan = document.getElementById('statusBulan');

    // --- Elemen Widget ---
    const totalDisplayWidget = document.getElementById('totalDisplayWidget');
    const avgDisplayWidget = document.getElementById('avgDisplayWidget');
    const maxDisplayWidget = document.getElementById('maxDisplayWidget');
    
    // --- Elemen Rekomendasi ---
    const totalKebutuhanText = document.getElementById('totalKebutuhanText');
    const barKebutuhan = document.getElementById('barKebutuhan');
    const totalKeinginanText = document.getElementById('totalKeinginanText');
    const barKeinginan = document.getElementById('barKeinginan');
    const rekomendasiTeks = document.getElementById('rekomendasiTeks');

    // --- 2. Variabel Status & Helper ---
    
    function getBulanSekarang() {
        const now = new Date();
        const tahun = now.getFullYear();
        const bulan = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${tahun}-${bulan}`;
    }

    function getStorageKey(bulan) { return `pengeluaran_${bulan}`; }

    function formatNamaBulan(bulanStr) {
        const [tahun, bulan] = bulanStr.split('-');
        const date = new Date(tahun, bulan - 1);
        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    
    function getTanggalHariIni() {
        return new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    }

    function formatTanggalDisplay(tanggalStr) {
        const date = new Date(tanggalStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }

    let bulanSekarang = getBulanSekarang();
    let bulanTerpilih = bulanSekarang;
    let dataBulanIni = muatDataDariStorage(getStorageKey(bulanSekarang));

    // --- 3. Fungsi Inti ---

    function muatDataDariStorage(kunci) {
        const dataTersimpan = localStorage.getItem(kunci);
        return dataTersimpan ? JSON.parse(dataTersimpan) : [];
    }

    function simpanDataKeStorage(kunci, data) {
        localStorage.setItem(kunci, JSON.stringify(data));
    }

    /**
     * FUNGSI RENDER UTAMA (Mengupdate seluruh UI)
     */
    function render(data) {
        // Cek jika elemen ada (pencegahan error)
        if (!daftarPengeluaran) return;

        daftarPengeluaran.innerHTML = "";
        let total = 0;
        let maxExpense = { nama: '-', harga: 0 };

        data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        for (const item of data) {
            total += item.harga;
            if (item.harga > maxExpense.harga) maxExpense = item;

            // Render Daftar List
            const formatHarga = `Rp ${item.harga.toLocaleString('id-ID')}`;
            const tanggalDisplay = formatTanggalDisplay(item.tanggal); 
            
            // --- INI PERBAIKANNYA (START) ---
            // Jika data lama tidak punya 'prioritas', set default ke 'lainnya'
            const prioritas = item.prioritas || 'lainnya';
            // --- INI PERBAIKANNYA (END) ---
            
            // Logika Badge Prioritas (sekarang menggunakan variabel 'prioritas' yang aman)
            const prioritasText = prioritas.charAt(0).toUpperCase() + prioritas.slice(1);
            let prioritasClass = 'text-bg-secondary'; // Default 'Lainnya'
            if (prioritas === 'kebutuhan') prioritasClass = 'text-bg-success';
            else if (prioritas === 'keinginan') prioritasClass = 'text-bg-danger';

            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>
                    ${item.nama}
                    <small class="d-block text-muted fw-normal">
                        ${tanggalDisplay}
                        <span class="badge ${prioritasClass} ms-1">${prioritasText}</span>
                    </small>
                </span>
                <div>
                    <span class="fw-bold text-success me-2">${formatHarga}</span>
                    <button class="btn btn-danger btn-sm tombol-hapus" data-id="${item.id}" style="display: ${bulanTerpilih === bulanSekarang ? 'inline-block' : 'none'};">
                        Hapus
                    </button>
                </div>
            `;
            daftarPengeluaran.appendChild(li);
        }
        
        // Kalkulasi Rata-rata
        let daysToDivide = new Date(bulanTerpilih.split('-')[0], bulanTerpilih.split('-')[1], 0).getDate();
        if (bulanTerpilih === bulanSekarang) {
            daysToDivide = new Date().getDate(); // Hari ke-
        }
        const avg = data.length > 0 ? (total / daysToDivide) : 0;

        // 4. Update Widget Ringkasan (cek jika elemen ada)
        if (totalDisplayWidget) totalDisplayWidget.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        if (avgDisplayWidget) avgDisplayWidget.textContent = `Rp ${avg.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
        if (maxDisplayWidget) {
            if (maxExpense.harga > 0) {
                maxDisplayWidget.innerHTML = `${maxExpense.nama} <span class="d-block small fw-normal">Rp ${maxExpense.harga.toLocaleString('id-ID')}</span>`;
            } else {
                maxDisplayWidget.textContent = '-';
            }
        }

        // 5. Generate Analisis & Rekomendasi
        generateAnalysis(data, total);
    }
    
    /**
     * FUNGSI ANALISIS KEBUTUHAN vs KEINGINAN
     */
    function generateAnalysis(data, totalUmum) {
        // Cek jika elemen ada (pencegahan error)
        if (!barKebutuhan) return;

        let totalKebutuhan = 0;
        let totalKeinginan = 0;

        for (const item of data) {
            // Gunakan logika perbaikan yang sama
            const prioritas = item.prioritas || 'lainnya'; 
            if (prioritas === 'kebutuhan') {
                totalKebutuhan += item.harga;
            } else if (prioritas === 'keinginan') {
                totalKeinginan += item.harga;
            }
        }

        if (totalUmum === 0) {
            // Reset ke tampilan default jika tidak ada data
            barKebutuhan.style.width = '0%'; barKebutuhan.textContent = '0%';
            barKeinginan.style.width = '0%'; barKeinginan.textContent = '0%';
            totalKebutuhanText.textContent = 'Rp 0';
            totalKeinginanText.textContent = 'Rp 0';
            rekomendasiTeks.innerHTML = '<p class="alert alert-info">Belum ada data untuk dianalisis.</p>';
            return;
        }

        // Kalkulasi Persentase
        const persenKebutuhan = (totalKebutuhan / totalUmum) * 100;
        const persenKeinginan = (totalKeinginan / totalUmum) * 100;

        // Update Progress Bar
        totalKebutuhanText.textContent = `Rp ${totalKebutuhan.toLocaleString('id-ID')}`;
        barKebutuhan.style.width = `${persenKebutuhan.toFixed(1)}%`;
        barKebutuhan.textContent = `${persenKebutuhan.toFixed(1)}%`;
        
        totalKeinginanText.textContent = `Rp ${totalKeinginan.toLocaleString('id-ID')}`;
        barKeinginan.style.width = `${persenKeinginan.toFixed(1)}%`;
        barKeinginan.textContent = `${persenKeinginan.toFixed(1)}%`;
        
        // Generate Teks Rekomendasi
        let advice = "";
        if (persenKeinginan > 50) {
            advice = `<p class="alert alert-danger"><b>Rekomendasi:</b> Porsi 'Keinginan' Anda (${persenKeinginan.toFixed(0)}%) sangat tinggi! <b>Utamakan kebutuhan</b> dan segera <b>tunda</b> pembelian tidak mendesak.</p>`;
        } else if (persenKeinginan > 30) {
            advice = `<p class="alert alert-warning"><b>Rekomendasi:</b> Pengeluaran 'Keinginan' Anda (${persenKeinginan.toFixed(0)}%) cukup besar. Coba evaluasi kembali dan <b>tunda</b> beberapa item.</p>`;
        } else if (persenKeinginan >= 0) {
            advice = `<p class="alert alert-success"><b>Analisis:</b> Porsi 'Keinginan' Anda (${persenKeinginan.toFixed(0)}%) terkendali. Kerja bagus dalam <b>mengutamakan kebutuhan</b>!</p>`;
        }
        rekomendasiTeks.innerHTML = advice;
    }


    /* --- Fungsi Mengatur Tampilan UI (Disabled/Enabled) --- */
    function aturModeTampilan(bulan) {
        // Cek jika elemen ada sebelum menggunakannya (penjagaan error)
        if (!inputTanggal || !inputArea || !statusBulan) {
            console.error("Elemen UI penting tidak ditemukan!");
            return;
        }

        const [tahun, bulanNum] = bulan.split('-').map(Number);
        const tglAwal = `${tahun}-${String(bulanNum).padStart(2, '0')}-01`;
        const tglTerakhir = new Date(tahun, bulanNum, 0).getDate();
        const tglAkhirStr = `${tahun}-${String(bulanNum).padStart(2, '0')}-${tglTerakhir}`;
        
        inputTanggal.min = tglAwal;
        inputTanggal.max = tglAkhirStr;

        if (bulan === bulanSekarang) {
            inputArea.classList.remove('disabled');
            statusBulan.textContent = `Menampilkan data untuk: ${formatNamaBulan(bulan)}`;
            statusBulan.className = 'alert alert-info text-center small py-2';
            inputTanggal.value = getTanggalHariIni();
        } else {
            inputArea.classList.add('disabled');
            statusBulan.textContent = `Hanya melihat (read-only): ${formatNamaBulan(bulan)}`;
            statusBulan.className = 'alert alert-warning text-center small py-2';
            inputTanggal.value = tglAwal;
        }
        
        const data = muatDataDariStorage(getStorageKey(bulanTerpilih));
        render(data); // Panggil render untuk update tombol hapus & UI lainnya
    }

    /* --- Fungsi Mengisi Dropdown Pilihan Bulan --- */
    function populatePilihanBulan() {
        if (!pilihBulan) return; // Cek jika elemen ada

        pilihBulan.innerHTML = "";
        let semuaBulan = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('pengeluaran_')) {
                semuaBulan.push(key.replace('pengeluaran_', ''));
            }
        }
        if (!semuaBulan.includes(bulanSekarang)) {
            semuaBulan.push(bulanSekarang);
        }
        semuaBulan.sort().reverse();
        for (const bulan of semuaBulan) {
            const option = document.createElement('option');
            option.value = bulan;
            option.textContent = formatNamaBulan(bulan);
            pilihBulan.appendChild(option);
        }
        pilihBulan.value = bulanTerpilih;
    }

    // --- 4. Event Handlers ---

    function handleTambah() {
        const nama = inputNama.value;
        const hargaString = inputHarga.value;
        const tanggal = inputTanggal.value;
        const prioritas = inputPrioritas.value;

        // VALIDASI
        if (nama.trim() === "" || hargaString === "" || parseInt(hargaString) <= 0 || tanggal === "" || !prioritas) {
            alert("Harap isi semua kolom (tanggal, prioritas, nama, harga) dengan benar.");
            return; // Fungsi berhenti di sini jika ada data yang kurang
        }

        const itemBaru = {
            id: Date.now(),
            nama: nama,
            harga: parseInt(hargaString),
            tanggal: tanggal,
            prioritas: prioritas
        };

        dataBulanIni.push(itemBaru);
        simpanDataKeStorage(getStorageKey(bulanSekarang), dataBulanIni);
        render(dataBulanIni); // Panggil render untuk update seluruh dashboard

        inputNama.value = "";
        inputHarga.value = "";
    }

    function handleHapus(event) {
        if (!event.target.classList.contains('tombol-hapus')) {
            return;
        }
        
        if (bulanTerpilih !== bulanSekarang) {
            alert("Anda tidak bisa menghapus data dari bulan-bulan sebelumnya.");
            return;
        }

        const id = parseInt(event.target.dataset.id);
        dataBulanIni = dataBulanIni.filter(item => item.id !== id);
        simpanDataKeStorage(getStorageKey(bulanSekarang), dataBulanIni);
        render(dataBulanIni); 
    }

    function handlePilihBulan() {
        bulanTerpilih = pilihBulan.value;
        const kunciStorage = getStorageKey(bulanTerpilih);
        const data = muatDataDariStorage(kunciStorage);
        
        if (bulanTerpilih === bulanSekarang) {
            dataBulanIni = data; 
        }
        aturModeTampilan(bulanTerpilih);
    }

    // --- 5. Inisialisasi Aplikasi ---
    
    // Melampirkan event listener HANYA jika elemennya ada
    if (tombolTambah) {
        tombolTambah.addEventListener('click', handleTambah);
    } else {
        console.error("Elemen 'tombolTambah' tidak ditemukan!");
    }
    
    if (daftarPengeluaran) {
        daftarPengeluaran.addEventListener('click', handleHapus);
    } else {
        console.error("Elemen 'daftarPengeluaran' tidak ditemukan!");
    }
    
    if (pilihBulan) {
        pilihBulan.addEventListener('change', handlePilihBulan);
    } else {
        console.error("Elemen 'pilihBulan' tidak ditemukan!");
    }

    // Jalankan setup awal
    populatePilihanBulan();
    handlePilihBulan(); 

});