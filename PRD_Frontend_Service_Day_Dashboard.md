# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Service Day Dashboard for Corporate Staff Contributions

**Tahap:** Frontend Web Application  
**Versi dokumen:** 1.0  
**Tanggal dokumen:** 11 Oktober 2026  
**Deadline frontend:** 1 Desember 2026  
**Platform utama:** Angular Web Application  
**Status:** Draft untuk acuan implementasi

---

## Kontrol Dokumen

| Item | Keterangan |
|---|---|
| Nama proyek | Service Day Dashboard for Corporate Staff Contributions |
| Pemilik kebutuhan | Tim mahasiswa / kelompok proyek |
| Tujuan dokumen | Menetapkan kebutuhan, batasan, alur pengguna, dan kriteria penerimaan untuk tugas frontend |
| Dasar kebutuhan | Common case study, Use Case 1–6, dan marking rubric Frontend CLO2 yang diberikan dosen |
| Tahap berikutnya | Backend JavaScript/Node.js, database, REST API, email reminder, dan validasi QR check-in |
| Catatan | Kebutuhan yang belum dipastikan oleh dosen ditandai pada bagian “Asumsi dan Pertanyaan Terbuka” |

## 1. Ringkasan Produk

Service Day Dashboard adalah aplikasi web untuk membantu perusahaan mengelola kegiatan Corporate Social Responsibility (CSR) yang diselenggarakan bersama organisasi non-pemerintah atau NGO. Aplikasi menyediakan satu tempat bagi administrator untuk mengelola kegiatan dan memantau partisipasi, serta bagi karyawan untuk mencari kegiatan, mendaftar, mengelola pendaftaran, menerima notifikasi, dan melakukan check-in.

Tahap ini berfokus pada **frontend menggunakan Angular**. Backend dan database sungguhan belum dibuat. Data awal diambil secara asynchronous dari mock JSON melalui Angular service dan Angular HTTP Client. Perubahan pada saat demo dikelola melalui service dan disimpan di `localStorage` agar tetap ada setelah refresh. Desain service harus memungkinkan sumber data tersebut diganti dengan REST API pada tahap backend tanpa perlu menulis ulang seluruh halaman.

## 2. Latar Belakang dan Masalah

Saat ini, pendaftaran kegiatan Service Day dikelola secara manual melalui email dan spreadsheet. Cara ini menyulitkan administrator dalam memeriksa ketersediaan NGO, jumlah slot, data pendaftar, kehadiran, serta komunikasi. Dampak yang ingin dikurangi meliputi overbooking, informasi tidak lengkap, data yang tidak konsisten, dan beban administrasi yang tinggi.

Aplikasi yang diusulkan memberikan visibilitas yang lebih jelas terhadap kegiatan yang disetujui, jumlah slot, status pendaftaran, dan partisipasi karyawan. Untuk tahap frontend, sistem menampilkan dan mensimulasikan alur tersebut menggunakan data lokal; konsistensi lintas pengguna/perangkat akan menjadi tanggung jawab backend pada tahap berikutnya.

## 3. Tujuan Produk

1. Menyediakan dashboard berbeda untuk Administrator dan Employee.
2. Memungkinkan administrator mengelola data NGO dan kegiatan Service Day.
3. Memungkinkan karyawan melihat kegiatan yang disetujui beserta jadwal, lokasi, kapasitas, dan cut-off pendaftaran.
4. Mendemonstrasikan pendaftaran, perubahan, pembatalan, dan pembaruan slot tanpa reload halaman.
5. Menyediakan ringkasan partisipasi, notifikasi in-app, QR Code, alur check-in, dan tampilan laporan dalam bentuk prototipe frontend.
6. Memenuhi marking rubric frontend terkait Angular/MVC, semantic HTML, CSS/Flexbox, responsive layout, asynchronous data handling, NPM packages, dan struktur modular.
7. Menyiapkan arsitektur frontend agar dapat diintegrasikan dengan backend pada tahap kedua.

## 4. Indikator Keberhasilan

- Seluruh enam use case memiliki alur yang dapat didemonstrasikan.
- Semua halaman utama dapat digunakan pada desktop dan perangkat mobile.
- Mock JSON dimuat secara asynchronous melalui Angular service/HTTP Client.
- Operasi tambah, ubah, hapus, pendaftaran, pembatalan, dan check-in memperbarui UI tanpa page reload.
- Kapasitas dan cut-off divalidasi secara konsisten di frontend.
- Perubahan data demo bertahan setelah refresh pada browser yang sama.
- Terdapat struktur model, component, service, feature module, dan shared module yang jelas.
- Loading, empty state, success state, dan error state ditangani secara visual.
- Video demo dan materi user manual dapat menunjukkan alur Employee serta Administrator.

## 5. Pengguna dan Hak Akses

### 5.1 Administrator

Administrator mengelola kegiatan dan memantau partisipasi. Dalam frontend demo, akun administrator hanya simulasi untuk menunjukkan perbedaan navigasi dan fitur. Sistem ini belum menyediakan keamanan autentikasi produksi.

Kebutuhan utama:
- Melihat ringkasan kegiatan, slot, pendaftaran, dan kehadiran.
- Menambah, melihat, mengubah, menghapus, dan mengatur status kegiatan.
- Melihat daftar peserta serta statistik penggunaan slot.
- Membuat QR Code kegiatan dan melihat hasil check-in.
- Membuat pengumuman dan mengelola simulasi jadwal pengingat.

### 5.2 Employee (Karyawan)

Employee mencari kegiatan, mengelola pendaftaran sendiri, membaca notifikasi, dan melakukan check-in pada kegiatan.

Kebutuhan utama:
- Melihat kegiatan yang disetujui dan tersedia.
- Melihat detail kegiatan, jadwal, lokasi, slot, dan batas pendaftaran.
- Mendaftar, mengganti kegiatan, atau membatalkan pendaftaran sesuai aturan.
- Melihat status pendaftaran dan notifikasi.
- Melakukan alur check-in melalui QR Code atau mode demo/fallback yang disediakan.

## 6. Ruang Lingkup

### 6.1 Termasuk dalam Frontend Tahap 1

- Aplikasi Angular Single Page Application (SPA).
- Navigasi dan tampilan berbasis role Employee/Administrator menggunakan akun demo.
- Data awal mock JSON yang dimuat secara asynchronous.
- Service sebagai lapisan akses data dan logika frontend.
- Penyimpanan perubahan demo menggunakan `localStorage`.
- CRUD kegiatan NGO/Service Day.
- Daftar kegiatan, detail, pencarian/filter sederhana bila sesuai desain, dan status ketersediaan.
- Pendaftaran, perubahan, pembatalan, validasi kapasitas, dan cut-off.
- Dashboard ringkasan dan pemantauan slot.
- Notifikasi in-app dan simulasi pengingat/broadcast.
- Pembuatan QR Code di frontend menggunakan package NPM yang kompatibel; alur scan kamera diimplementasikan jika kompatibilitas dan waktu memungkinkan. Sediakan fallback demo agar proses check-in dapat diuji tanpa kamera.
- Pencatatan check-in demo dan tampilan laporan kehadiran.
- Responsive design, form validation, empty/loading/error states, dan pengujian skenario utama.
- Video demonstrasi dan user manual frontend sesuai instruksi tugas.

### 6.2 Tidak Termasuk dalam Frontend Tahap 1

- Backend/API server sungguhan.
- Database server atau sinkronisasi lintas pengguna/perangkat.
- Autentikasi aman, password hashing, JWT/session server-side, dan otorisasi yang aman.
- Pengiriman email sungguhan atau scheduler yang berjalan saat browser ditutup.
- Jaminan anti-overbooking lintas pengguna. Validasi frontend hanya untuk demonstrasi dan harus ditegakkan ulang oleh backend.
- Integrasi production deployment, monitoring, dan secret management kecuali diminta secara terpisah.

## 7. Use Case dan Kebutuhan Fungsional

Prioritas: **P0 = wajib untuk demo inti**, **P1 = penting dan direncanakan**, **P2 = tambahan bila waktu memungkinkan**.

### UC-01 — Manage NGO Availability (Administrator)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Administrator demo dapat membuka dashboard admin setelah memilih/login menggunakan akun demo. | P0 |
| FR-02 | Administrator dapat melihat daftar NGO dan kegiatan terkait. | P0 |
| FR-03 | Administrator dapat menambah kegiatan dengan nama NGO, deskripsi, jenis layanan, tanggal/waktu, lokasi, kapasitas maksimum, status persetujuan/publikasi, dan cut-off pendaftaran. | P0 |
| FR-04 | Administrator dapat mengubah detail kegiatan yang sudah ada. | P0 |
| FR-05 | Administrator dapat menghapus atau membatalkan kegiatan dengan dialog konfirmasi. | P0 |
| FR-06 | Aktivitas yang belum disetujui/dipublikasikan tidak muncul sebagai kesempatan yang dapat didaftarkan oleh employee. | P0 |
| FR-07 | Perubahan data kegiatan langsung tercermin pada halaman lain tanpa reload. | P0 |

### UC-02 — View Service Day Opportunities (Employee)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-08 | Employee dapat melihat daftar kegiatan yang disetujui dan dipublikasikan. | P0 |
| FR-09 | Daftar menampilkan nama NGO, nama/deskripsi kegiatan, jadwal, lokasi, kapasitas, slot tersisa, dan cut-off. | P0 |
| FR-10 | Status kegiatan ditampilkan dengan label yang jelas: Available, Full, Registration Closed, Cancelled, atau Completed sesuai kondisi. | P0 |
| FR-11 | Employee dapat membuka detail suatu kegiatan sebelum mendaftar. | P0 |
| FR-12 | Employee dapat mencari atau memfilter kegiatan berdasarkan atribut yang tersedia jika tercakup dalam desain final. | P1 |

### UC-03 — Register for a Service Day Activity (Employee)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-13 | Employee dapat mendaftar untuk kegiatan yang masih dibuka dan memiliki slot. | P0 |
| FR-14 | Sistem menolak pendaftaran bila kegiatan penuh, tidak disetujui, dibatalkan, atau melewati cut-off. | P0 |
| FR-15 | Sistem mencegah pendaftaran aktif ganda untuk employee yang sama pada kegiatan yang sama. | P0 |
| FR-16 | Setelah pendaftaran berhasil, data pendaftaran dan slot tersisa diperbarui pada seluruh komponen yang menggunakan data tersebut tanpa reload. | P0 |
| FR-17 | Employee dapat melihat pendaftaran aktif dan riwayat/status pendaftaran miliknya. | P0 |
| FR-18 | Employee dapat mengganti kegiatan atau membatalkan pendaftaran sebelum cut-off. | P0 |
| FR-19 | Perubahan kegiatan memvalidasi slot dan cut-off kegiatan tujuan sebelum pendaftaran lama diubah. | P0 |
| FR-20 | Setiap aksi penting menampilkan pesan sukses atau alasan kegagalan yang mudah dipahami. | P0 |

### UC-04 — Monitor Participation and Slot Utilisation (Administrator)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-21 | Dashboard menampilkan jumlah kegiatan, total slot, slot terisi, slot tersisa, jumlah pendaftaran aktif, dan persentase utilisasi. | P0 |
| FR-22 | Persentase utilisasi dihitung dari slot terisi dibagi kapasitas total dikali 100%. | P0 |
| FR-23 | Administrator dapat melihat daftar peserta berdasarkan kegiatan. | P0 |
| FR-24 | Ringkasan diperbarui setelah pendaftaran berubah tanpa reload. | P0 |
| FR-25 | Administrator dapat melihat status check-in dan ringkasan kehadiran. | P1 |

### UC-05 — Send Notifications and Reminders

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-26 | Employee melihat notifikasi dalam aplikasi setelah pendaftaran, perubahan, atau pembatalan yang relevan. | P0 |
| FR-27 | Administrator dapat membuat pengumuman/broadcast yang ditampilkan dalam aplikasi demo. | P1 |
| FR-28 | Administrator dapat mengatur contoh jadwal pengingat seperti H-7, H-3, dan H-1. | P1 |
| FR-29 | Aplikasi dapat menampilkan preview/status simulasi pengingat dan riwayat notifikasi. | P1 |
| FR-30 | UI menjelaskan bahwa notifikasi email dan penjadwalan sungguhan belum aktif di tahap frontend. | P1 |

### UC-06 — Employee Check-In via QR Code

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-31 | Administrator dapat memilih kegiatan dan menghasilkan QR Code demo yang mereferensikan kegiatan atau token demo; QR tidak boleh memuat data pribadi karyawan. | P1 |
| FR-32 | Employee dapat membuka halaman check-in dan menjalankan alur pemindaian QR jika perangkat/browser mendukung. | P1 |
| FR-33 | Tersedia fallback untuk demonstrasi apabila kamera tidak tersedia/diizinkan. | P0 |
| FR-34 | Check-in demo hanya dapat dicatat untuk employee yang mempunyai pendaftaran aktif pada kegiatan terkait. | P0 |
| FR-35 | Sistem menolak check-in ganda untuk pendaftaran yang sama. | P0 |
| FR-36 | Waktu check-in dan status kehadiran diperbarui pada tampilan employee/admin tanpa reload. | P0 |
| FR-37 | Administrator dapat melihat daftar check-in dan ringkasan laporan kehadiran demo. | P1 |

## 8. Inventaris Halaman dan Navigasi

Halaman berikut adalah susunan awal. Beberapa fungsi bisa berupa tab atau sub-view dalam dashboard agar jumlah halaman tetap efisien.

| Route konseptual | Halaman | Pengguna | Isi/aksi utama |
|---|---|---|---|
| `/login` | Demo Login | Semua | Memilih akun demo Employee atau Administrator. |
| `/employee/dashboard` | Employee Dashboard | Employee | Ringkasan pendaftaran, kegiatan direkomendasikan/tersedia, notifikasi terkini. |
| `/employee/activities` | Browse Activities | Employee | Daftar kegiatan yang disetujui, status slot/cut-off, filter/pencarian bila diimplementasikan. |
| `/employee/activities/:id` | Activity Detail | Employee | Detail kegiatan dan aksi register. |
| `/employee/registrations` | My Registrations | Employee | Pendaftaran aktif/riwayat, edit/pindah kegiatan, pembatalan. |
| `/employee/notifications` | My Notifications | Employee | Notifikasi in-app dan status baca. |
| `/employee/check-in` | Employee Check-In | Employee | Scan QR atau fallback demo, status check-in. |
| `/admin/dashboard` | Admin Dashboard | Administrator | KPI slot, pendaftaran, utilisasi dan status kehadiran. |
| `/admin/activities` | Manage Activities | Administrator | Tabel/list kegiatan, filter status, aksi CRUD. |
| `/admin/activities/new` | Create Activity | Administrator | Formulir kegiatan baru. |
| `/admin/activities/:id/edit` | Edit Activity | Administrator | Edit informasi kegiatan. |
| `/admin/participation` | Participation | Administrator | Daftar peserta berdasarkan kegiatan dan statistik. |
| `/admin/notifications` | Notifications & Reminders | Administrator | Broadcast demo, konfigurasi contoh jadwal, riwayat. |
| `/admin/qr` | QR Management | Administrator | Memilih kegiatan, menghasilkan dan menampilkan QR demo. |
| `/admin/attendance` | Attendance Report | Administrator | Daftar check-in, status hadir, waktu kedatangan, ringkasan. |

Navigasi perlu dilindungi oleh role-based route guards di sisi Angular untuk keperluan demo. Ini **bukan** pengganti otorisasi backend pada tahap berikutnya.

## 9. Aturan Bisnis

| ID | Aturan |
|---|---|
| BR-01 | Hanya kegiatan yang disetujui dan dipublikasikan yang tampil sebagai kegiatan yang dapat didaftarkan employee. |
| BR-02 | Slot terisi dihitung dari jumlah registration berstatus aktif/confirmed, bukan nilai angka yang diubah secara manual di berbagai halaman. |
| BR-03 | Slot tersisa = kapasitas maksimum - jumlah pendaftaran aktif; nilainya tidak boleh negatif. |
| BR-04 | Kegiatan penuh tidak menerima pendaftaran baru. |
| BR-05 | Pendaftaran baru hanya dapat dilakukan sebelum cut-off dan bila kegiatan belum dibatalkan/selesai. |
| BR-06 | Edit/pindah kegiatan dan pembatalan hanya tersedia sebelum cut-off sesuai use case. |
| BR-07 | Perubahan ke kegiatan lain harus memvalidasi kapasitas dan cut-off kegiatan tujuan sebelum memperbarui pendaftaran. |
| BR-08 | Satu employee tidak boleh memiliki dua pendaftaran aktif untuk kegiatan yang sama. |
| BR-09 | Pendaftaran yang dibatalkan tidak dihitung sebagai slot terisi. |
| BR-10 | Attendance hanya dicatat jika employee memiliki pendaftaran aktif untuk kegiatan tersebut. |
| BR-11 | Satu pendaftaran hanya boleh mempunyai satu check-in yang berhasil. |
| BR-12 | Statistik dashboard harus dihitung dari sumber data yang sama dengan daftar kegiatan dan pendaftaran. |
| BR-13 | Semua tanggal/waktu dibandingkan dengan zona waktu lokal yang konsisten untuk prototipe; aturan zona waktu resmi perlu dikonfirmasi sebelum backend. |
| BR-14 | Jika administrator menghapus/membatalkan kegiatan yang sudah memiliki pendaftar, UI harus meminta konfirmasi dan menangani status pendaftaran terkait secara konsisten. |

**Asumsi aturan yang perlu dikonfirmasi:** apakah seorang employee boleh memilih lebih dari satu kegiatan Service Day. Usulan awal untuk implementasi adalah satu pendaftaran aktif per employee untuk acara Service Day yang sama, tetapi aturan ini tidak dinyatakan secara eksplisit pada case study.

## 10. Model Data Konseptual

Data model dipisahkan sejak awal supaya mudah dipetakan ke schema backend. Nama properti final dapat disesuaikan saat implementasi.

### 10.1 NGO

- `id`: identifier unik.
- `name`: nama organisasi.
- `description`: deskripsi organisasi.
- `contactName` dan `contactEmail`: data kontak demo jika diperlukan.
- `approvalStatus`: `PENDING`, `APPROVED`, atau `REJECTED`.

### 10.2 Activity

- `id`, `ngoId`, `title`, `description`, `serviceType`, `location`.
- `startDateTime`, `endDateTime`, `registrationCutoff`.
- `capacity`.
- `publicationStatus`: misalnya `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`.
- Slot terisi dan slot tersisa lebih baik dihitung dari registrations aktif, bukan dijadikan sumber data terpisah.

### 10.3 User

- `id`, `name`, `email`, `role` (`ADMIN` atau `EMPLOYEE`).
- Akun adalah data demo lokal. Tidak menyimpan password sungguhan.

### 10.4 Registration

- `id`, `employeeId`, `activityId`.
- `status` (`ACTIVE` atau `CANCELLED`).
- `registeredAt`, `updatedAt`, dan alasan pembatalan jika dibutuhkan.

### 10.5 Notification

- `id`, `recipientUserId` atau target broadcast, `title`, `message`, `type`, `createdAt`, `readAt`, `deliveryStatus`.
- Untuk tahap frontend, status pengiriman email tidak boleh diklaim sebagai email sungguhan yang telah terkirim.

### 10.6 Attendance

- `id`, `registrationId`, `activityId`, `employeeId`, `checkedInAt`, `status`.
- Token/isi QR demo hanya mereferensikan kegiatan atau token opaque, bukan informasi pribadi peserta.

## 11. Persyaratan Teknis Frontend

### 11.1 Teknologi

- Angular dan Angular CLI untuk SPA.
- TypeScript untuk component, model, dan service.
- HTML5 semantik untuk template.
- CSS dengan Flexbox dan teknik responsive layout.
- Angular HTTP Client untuk pemuatan mock JSON secara asynchronous.
- RxJS/observable sesuai pola data Angular yang digunakan.
- NPM untuk dependency management.
- Library QR Code dan scanner yang kompatibel dengan versi Angular/browser, jika digunakan.

Versi Angular, Node.js, dan package harus dipilih berdasarkan kompatibilitas lingkungan kuliah saat project dibuat dan dicatat dalam laporan. Jangan mencampur versi package tanpa alasan yang jelas.

### 11.2 Struktur Modular

Untuk menyesuaikan requirement tugas dan rubric, gunakan arsitektur Angular berbasis module kecuali dosen mengizinkan pendekatan standalone secara eksplisit. Susunan konseptual yang diharapkan:

- `CoreModule`: layanan inti, route guards demo, dan utilitas tingkat aplikasi.
- `SharedModule`: komponen, directive, dan pipe yang digunakan ulang.
- `EmployeeModule`: fitur dashboard, daftar kegiatan, pendaftaran, notifikasi, dan check-in employee.
- `AdminModule`: fitur dashboard admin, pengelolaan kegiatan, partisipasi, QR, notifikasi, dan laporan.
- `Models`: tipe data NGO, Activity, User, Registration, Notification, Attendance.
- `Services`: Activity, Registration, Notification, Attendance, dan DemoAuth/data persistence.

Nama dan pengelompokan akhir boleh disesuaikan sepanjang tanggung jawab terpisah, import/export jelas, dan reuse dapat ditunjukkan. Hindari menaruh semua business logic di component.

### 11.3 Pengelolaan Data

- Mock JSON adalah sumber data seed awal dan dimuat menggunakan Angular HTTP Client.
- Semua komponen mengambil/mengubah data melalui service.
- Service mengelola state data setelah perubahan dan menyimpannya ke `localStorage` agar demo bertahan setelah refresh.
- Seed JSON hanya dimuat untuk inisialisasi pertama atau saat penyimpanan lokal belum tersedia; jangan menimpa data hasil demo pada setiap reload.
- Jika data lokal tidak valid, tampilkan penanganan error yang wajar dan sediakan cara reset data demo bila diperlukan.
- Perubahan UI harus terjadi tanpa memuat ulang browser.
- Gunakan loading/error/empty states saat operasi asynchronous.

### 11.4 Batasan Simulasi

- localStorage hanya berlaku pada browser/profil yang sama dan bukan database.
- Data tidak otomatis tersinkronisasi di perangkat atau pengguna yang berbeda.
- Pengamanan role pada frontend hanya untuk demonstrasi.
- Pengingat tidak berjalan secara andal ketika browser ditutup.
- Pengecekan kapasitas di browser tidak menjamin tidak terjadi race condition pada penggunaan multi-user.
- Tahap backend harus mengganti penyimpanan lokal dengan API dan memindahkan validasi otoritatif ke server.

## 12. Persyaratan UI/UX dan Aksesibilitas

- Arah visual profesional, rapi, dan cocok untuk portal CSR perusahaan; hindari dekorasi berlebihan dan emoji yang tidak perlu.
- Gunakan ikon yang konsisten dan dapat dikenali.
- Gunakan navigasi yang berbeda tetapi konsisten untuk admin dan employee.
- Gunakan semantic HTML: heading berurutan, form label, button yang benar, tabel dengan header, dan elemen navigasi yang sesuai.
- Status tidak boleh dibedakan hanya dengan warna; sertakan teks/status label.
- Form harus memiliki validasi inline dan pesan error yang dapat dipahami.
- Tombol destructive seperti delete/cancel memerlukan konfirmasi.
- Desain harus responsif untuk desktop, tablet, dan mobile.
- Pada layar kecil, tabel dapat berubah menjadi layout yang dapat digulir atau list/card tanpa menyebabkan seluruh halaman melebar.
- Setiap halaman data mendukung loading, empty, error, dan success states yang relevan.
- Hindari reload penuh untuk navigasi dan perubahan data normal.

## 13. Persyaratan Non-Fungsional

| ID | Persyaratan |
|---|---|
| NFR-01 Responsif | Halaman utama dapat digunakan pada lebar layar mobile, tablet, dan desktop tanpa konten utama terpotong. |
| NFR-02 Usability | Label, status, aksi utama, dan validasi mudah dipahami oleh pengguna non-teknis. |
| NFR-03 Maintainability | Component fokus pada presentasi/interaksi; akses data dan operasi domain ditempatkan di service. |
| NFR-04 Reusability | Elemen umum seperti status badge, dialog konfirmasi, loading indicator, dan tabel dapat digunakan ulang jika sesuai. |
| NFR-05 Reliability | Kesalahan pemuatan data tidak membuat seluruh aplikasi blank; tampilkan error state dan pilihan retry. |
| NFR-06 Data integrity demo | Jumlah slot, registrasi, dan kehadiran berasal dari sumber data yang konsisten di dalam satu browser. |
| NFR-07 Accessibility | Form punya label; kontrol keyboard dapat digunakan; fokus dan kontras dapat dibaca; pesan status menggunakan teks. |
| NFR-08 Security boundary | Aplikasi tidak menyimpan credential sungguhan atau data pribadi sensitif di localStorage. Jelaskan bahwa login hanya demo. |
| NFR-09 Performance | UI tetap responsif dan tidak menunggu operasi data secara blocking; tampilkan loading bila diperlukan. |
| NFR-10 Backend readiness | Kontrak model dan service dibuat konsisten agar sumber data dapat diganti ke API tahap berikutnya. |

## 14. Acceptance Criteria (Kriteria Penerimaan)

Frontend dinyatakan siap untuk submission ketika kriteria berikut dapat didemonstrasikan:

1. Employee dan Administrator dapat membuka dashboard sesuai role demo.
2. Administrator dapat membuat, mengedit, dan menghapus/membatalkan kegiatan dengan validasi formulir.
3. Employee hanya melihat kegiatan yang disetujui/dipublikasikan.
4. Daftar kegiatan menunjukkan kapasitas, jumlah slot terisi/tersisa, dan cut-off yang benar.
5. Employee dapat mendaftar ketika kegiatan tersedia; pendaftaran ditolak jika penuh atau telah melewati cut-off.
6. Pengubahan dan pembatalan sebelum cut-off memperbarui slot kegiatan yang terdampak.
7. Pendaftaran aktif ganda untuk employee dan kegiatan yang sama ditolak.
8. Dashboard admin menghitung total slot, slot terisi, slot tersisa, dan utilisasi dari data pendaftaran.
9. UI berubah tanpa page reload setelah operasi data penting.
10. Data demo tetap tersedia sesudah browser di-refresh pada browser yang sama.
11. Notifikasi in-app muncul untuk aksi yang relevan; simulasi pengingat/broadcast bisa ditunjukkan jika termasuk fitur final.
12. Alur QR/check-in demo dapat didemonstrasikan; check-in ganda dan peserta tanpa pendaftaran aktif ditolak.
13. Loading, error, empty, dan success states penting ditampilkan dengan baik.
14. Halaman utama diuji pada viewport desktop dan mobile.
15. Struktur project memperlihatkan module/feature module, shared module, model, component, service, serta dependency yang tertata.
16. Tidak ada error console utama yang menghalangi alur demo.
17. Video user-manual memperlihatkan alur Employee dan Administrator serta batasan simulasi secara jujur.

## 15. Skenario Pengujian Minimum

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| TC-01 | Memuat aplikasi pertama kali | Mock JSON berhasil dimuat melalui service; indikator loading ditampilkan jika diperlukan. |
| TC-02 | Membuat kegiatan valid | Kegiatan muncul pada daftar admin dan halaman employee jika statusnya dipublikasikan/disetujui. |
| TC-03 | Membuat kegiatan dengan kapasitas atau tanggal tidak valid | Form menolak data dengan pesan yang jelas. |
| TC-04 | Employee mendaftar ketika tersedia slot | Registration dibuat, slot tersisa berkurang, notifikasi demo tampil. |
| TC-05 | Employee mencoba mendaftar saat penuh | Sistem menolak pendaftaran; slot tidak berubah. |
| TC-06 | Employee mencoba mendaftar setelah cut-off | Sistem menolak pendaftaran dan menjelaskan alasannya. |
| TC-07 | Employee membatalkan sebelum cut-off | Registration berubah menjadi cancelled; slot tersedia kembali. |
| TC-08 | Employee mengganti kegiatan | Kegiatan lama dan baru diperbarui secara konsisten; tidak ada perubahan parsial jika kegiatan baru tidak valid. |
| TC-09 | Refresh browser setelah CRUD/registrasi | Perubahan demo tetap ada di browser yang sama. |
| TC-10 | Mengubah kegiatan di admin | Tampilan data terkait diperbarui tanpa reload. |
| TC-11 | Check-in tanpa registration aktif | Sistem menolak check-in. |
| TC-12 | Check-in dua kali | Check-in kedua ditolak atau diberi status sudah check-in tanpa membuat data duplikat. |
| TC-13 | QR/camera tidak tersedia | Fallback demo memungkinkan alur check-in dipresentasikan. |
| TC-14 | Data JSON gagal dimuat | Error state ditampilkan; aplikasi tidak blank. |
| TC-15 | Membuka halaman pada mobile | Navigasi dan aksi utama tetap dapat digunakan; tidak ada overflow yang merusak halaman. |

## 16. Kaitan dengan Marking Rubric Frontend CLO2

| Area rubric | Cara requirement ini menjawabnya |
|---|---|
| Client/server technologies & MVC — 20 marks | Model data terdefinisi; component/template dan service dipisahkan; aturan bisnis tidak ditumpuk di HTML. |
| Front-end design — 34 marks | Semantic HTML, visual hierarchy, reusable templates, Flexbox, spacing konsisten, dan responsive layout. |
| Asynchronous JavaScript — 23 marks | HTTP Client memuat mock JSON; loading/error states; dynamic updates; slot dan cut-off logic tanpa reload. |
| Modules & packages — 23 marks | NPM, feature modules, shared/core modules, service modules, dependency management, dan reuse. |
| Video submission | Video memperlihatkan alur nyata prototipe dari dua role, bukan hanya slide desain. |

**Catatan submission dari rubric:** keterlambatan dikenai penalti 5 marks per hari dan tidak menyerahkan video dikenai pengurangan 20 marks. Pastikan video user-manual diuji sebelum pengumpulan.

Target implementasi adalah memenuhi indikator kategori Excellent sebisa mungkin. Nilai akhir tetap mengikuti evaluasi dosen.

## 17. Rencana Kerja sampai Deadline Frontend

Jadwal berikut adalah usulan kerja internal dan dapat disesuaikan dengan jadwal kelompok.

| Periode | Fokus | Hasil yang diharapkan |
|---|---|---|
| 11–18 Oktober 2026 | Finalisasi requirement, aturan bisnis, wireframe, dan setup Angular | PRD disepakati, project berjalan, route awal dan struktur folder tersedia. |
| 19–25 Oktober 2026 | Model data, mock JSON, services, shared/core modules | Data awal bisa dimuat secara asynchronous. |
| 26 Oktober–8 November 2026 | Employee: daftar/detail kegiatan, register, edit/cancel, cut-off | Alur pendaftaran end-to-end berjalan. |
| 9–15 November 2026 | Admin: CRUD kegiatan, dashboard slot dan participation | Admin dapat mengelola kegiatan dan melihat statistik. |
| 16–22 November 2026 | Notifikasi, QR/check-in demo, attendance view | Seluruh use case memiliki jalur demo yang relevan. |
| 23–27 November 2026 | Responsive QA, pengujian business rules, perbaikan bug | Tidak ada bug blocker pada alur utama. |
| 28–30 November 2026 | Final polish, user manual, video, project report dan backup | Artefak submission siap. |
| 1 Desember 2026 | Submission | Frontend dikumpulkan tepat waktu. |

## 18. Persiapan Integrasi Backend

Frontend sebaiknya menggunakan service sebagai batas akses data. Pada tahap pertama, implementasi service menggunakan mock JSON dan localStorage. Pada tahap kedua, metode yang sama dapat diarahkan ke REST API.

Hal yang perlu disiapkan sejak awal:
- Model `NGO`, `Activity`, `User`, `Registration`, `Notification`, dan `Attendance` yang konsisten.
- Operasi service yang jelas: list/detail/create/update/delete kegiatan, registration/cancel/change, notification, QR/check-in, dan attendance.
- UI tidak mengasumsikan bahwa `localStorage` adalah sumber data permanen.
- Bentuk response/error API belum dianggap final; kontrak endpoint diputuskan saat tugas backend dimulai.
- Backend harus mengulangi validasi kapasitas, cut-off, role, dan check-in di server; frontend validation tidak dianggap keamanan.

## 19. Asumsi dan Pertanyaan Terbuka

1. **Multi-activity registration:** Apakah seorang employee boleh mengikuti lebih dari satu kegiatan dalam Service Day yang sama? Usulan awal: satu registration aktif per employee untuk event Service Day yang sama, tetapi perlu dikonfirmasi.
2. **Approval:** Apakah NGO dan kegiatan memerlukan approval terpisah, atau status approval cukup melekat pada kegiatan? Model frontend dapat dimulai dengan approval status yang jelas pada kegiatan.
3. **QR scanning:** Apakah dosen mengharuskan pemindaian kamera sungguhan pada tugas frontend, atau alur scan plus fallback demo dapat diterima? Rubric frontend tidak menyebutnya secara rinci, sedangkan rubric backend menilai QR secara eksplisit.
4. **Data persistence:** Asumsi frontend menggunakan localStorage untuk persistensi demo pada satu browser. Ini tidak menggantikan database.
5. **Notifications:** Email nyata dan timer otomatis berada di tahap backend; frontend hanya menampilkan notification center dan simulasi pengingat.
6. **Authentication:** Login tahap frontend menggunakan akun demo tanpa credential sungguhan. Autentikasi dan role enforcement yang aman berada di backend.
7. **Timezone:** Asumsi semua jadwal mengikuti zona waktu lokal kegiatan. Zona waktu resmi harus dikonfirmasi sebelum backend.
8. **Angular architecture:** Karena rubric meminta feature module/shared module, gunakan pendekatan berbasis Angular modules kecuali dosen secara eksplisit menerima arsitektur standalone.
9. **Deliverables dan penilaian:** Konfirmasi apakah rubric 100 marks dikonversi ke Group Mark 30 marks serta format/ketentuan video dan laporan yang harus dikumpulkan.

## 20. Definisi Selesai (Definition of Done)

Sebuah fitur dianggap selesai ketika:
- Persyaratan dan aturan bisnisnya terpenuhi.
- Tampilan desktop dan mobile layak digunakan.
- Validasi input dan pesan error/sukses tersedia.
- Data dikelola melalui service dan UI berubah tanpa reload.
- Perubahan persist pada `localStorage` sesuai kebutuhan demo.
- Skenario pengujian terkait telah dijalankan.
- Tidak menimbulkan regresi pada fitur yang sudah selesai.
- Batasan simulasi tidak digambarkan sebagai fungsi backend sungguhan.

---

**Akhir dokumen — PRD Frontend v1.0**
