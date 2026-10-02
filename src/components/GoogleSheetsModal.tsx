import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { pushToSupabase } from '../services/supabaseData';
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  ExternalLink,
  X,
  AlertCircle,
  Link,
  Copy,
  Check,
  Code,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
  CloudUpload,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';

const APPS_SCRIPT_CODE = `/**
 * MANAGEMENT SURAT & KEARSIPAN - GOOGLE APPS SCRIPT WEBHOOK DB
 * Versi 3.0: Otomatis Membuat & Mengelola 10 Lembar Sheet Database Lengkap
 * 1. NASKAH MASUK
 * 2. NASKAH KELUAR
 * 3. PEMBERKASAN THREAD (Daftar Arsip Aktif & Log Riwayat)
 * 4. KLASIFIKASI ARSIP (Kode Klasifikasi, Retensi Aktif, Retensi Inaktif, Nasib Akhir)
 * 5. UNIT KERJA (Unit Kerja Pengelola)
 * 6. INSTANSI & WILAYAH (Instansi Terkait & Wilayah Kerja Menginduk)
 * 7. KLASIFIKASI & SUB (Klasifikasi Surat & Sub Klasifikasi)
 * 8. PENGATURAN THREAD (Prefix, Separator, Format, Counter)
 * 9. MASTER DROPDOWN (Jenis Naskah, Status Selesai, Status Kirim)
 * 10. USERS (Akun Pengguna, NIP, Password, Email Google OTP, Hak Akses)
 *
 * Powered by Riswan Anas
 *
 * CARA PEMASANGAN DI GOOGLE SHEET:
 * 1. Buka Google Sheet Anda -> klik menu "Ekstensi" (Extensions) -> "Apps Script"
 * 2. Hapus semua kode default, lalu tempel (Paste) kode di bawah ini.
 * 3. Klik tombol Simpan (Save / ikon Disket).
 * 4. Klik tombol "Terapkan" (Deploy) -> "Deployment baru" (New deployment).
 * 5. Pilih jenis "Aplikasi Web" (Web app):
 *    - Deskripsi: Versi 3.0 (10 Sheet Lengkap Database)
 *    - Jalankan sebagai (Execute as): "Saya" (Me)
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> SANGAT PENTING!
 * 6. Klik "Terapkan", lalu setujui izin akses akun Google Anda.
 * 7. Salin URL Webhook (https://script.google.com/macros/s/.../exec)
 * 8. Tempel URL tersebut ke kolom "Google Apps Script Webhook URL" di aplikasi ini.
 * 9. Klik "✨ Buat Kolom & Sheet Otomatis" untuk membangun ke-10 sheet secara otomatis!
 */

function doPost(e) {
  try {
    var payload = {};
    try {
      if (e && e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
      }
    } catch(err) {}

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. SETUP / INIT SELURUH 10 SHEET DATABASE
    if (payload && (payload.action === "setup" || payload.action === "init")) {
      var setupMsg = setupDatabase();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: setupMsg,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. PULL SELURUH DATA DARI GOOGLE SHEET KE APLIKASI
    if (payload && payload.action === "pull") {
      setupDatabase();
      var pullData = pullAllDataFromSpreadsheet(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: pullData,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. PUSH / SIMPAN DATA KE SPREADSHEET (MENANGANI 10 TABEL)
    // 3.1. NASKAH MASUK
    if (payload.naskahMasuk && Array.isArray(payload.naskahMasuk)) {
      var sheetMasuk = getOrCreateSheet(ss, "NASKAH MASUK");
      var headMasuk = [
        "ID", "Tgl Terima", "Tgl Naskah", "Nomor Naskah", "Perihal", "Jenis Naskah", 
        "Unit Kerja", "Pengirim", "Instansi", "Wilayah Kerja", "Klasifikasi", "Sub Klasifikasi", 
        "Status Penyelesaian", "SLA (Hari)", "File Link Naskah Masuk", "File Link Naskah Dijawab", "Dibuat Oleh (NIP)", "Nama Pembuat", "Timestamp"
      ];
      var rowsMasuk = [headMasuk];
      for (var i = 0; i < payload.naskahMasuk.length; i++) {
        var r = payload.naskahMasuk[i];
        rowsMasuk.push([
          r.id || "", r.tglTerima || "", r.tglNaskah || r.tglTerima || "", r.nomorNaskah || "", r.perihal || "", r.jenisNaskah || "",
          r.unitKerja || "Bagian Umum", r.pengirimNaskah || "", r.instansiTerkait || "", r.wilayahKerja || "", r.klasifikasiUtama || "",
          r.subKlasifikasi || "", r.statusPenyelesaian || "", Number(r.sla) || 0, r.fileLinkNaskahMasuk || "", r.fileLinkNaskahDijawab || "",
          r.createdBy || "", r.createdByName || "", r.createdAt || ""
        ]);
      }
      writeSheetData(sheetMasuk, rowsMasuk);
    }

    // 3.2. NASKAH KELUAR
    if (payload.naskahKeluar && Array.isArray(payload.naskahKeluar)) {
      var sheetKeluar = getOrCreateSheet(ss, "NASKAH KELUAR");
      var headKeluar = [
        "ID", "Tgl Naskah", "Nomor Naskah", "Perihal", "Jenis Naskah", "Unit Kerja",
        "Tujuan", "Instansi", "Wilayah Kerja", "Klasifikasi", "Sub Klasifikasi",
        "Tgl Kirim", "Status Pengiriman", "Bukti Kirim", "File Link Naskah Keluar", "File Link Naskah Dijawab/Masuk", "Catatan", "Dibuat Oleh (NIP)", "Nama Pembuat", "Timestamp"
      ];
      var rowsKeluar = [headKeluar];
      for (var j = 0; j < payload.naskahKeluar.length; j++) {
        var k = payload.naskahKeluar[j];
        rowsKeluar.push([
          k.id || "", k.tglNaskah || "", k.nomorNaskah || "", k.perihal || "", k.jenisNaskah || "", k.unitKerja || "Bagian Umum",
          k.tujuanNaskah || "", k.instansiTerkait || "", k.wilayahKerja || "", k.klasifikasiUtama || "",
          k.subKlasifikasi || "", k.tglKirim || "", k.statusPengiriman || "", k.buktiKirim || "", k.fileLinkNaskahMasuk || "", k.fileLinkNaskahDijawab || "",
          k.catatan || "", k.createdBy || "", k.createdByName || "", k.createdAt || ""
        ]);
      }
      writeSheetData(sheetKeluar, rowsKeluar);
    }

    // 3.3. PEMBERKASAN THREAD
    if (payload.berkasThreadList && Array.isArray(payload.berkasThreadList)) {
      var sheetThread = getOrCreateSheet(ss, "PEMBERKASAN THREAD");
      var headThread = [
        "ID", "Nomor Thread", "Nama Berkas", "Klasifikasi Berkas", "Kode Klasifikasi", "Uraian Kode Arsip", 
        "Uraian / Keterangan Berkas", "Status Berkas", "Unit Kerja", "Lokasi Fisik", 
        "ID Naskah Masuk (Daftar)", "ID Naskah Keluar (Daftar)", "Riwayat Log (JSON)", 
        "Dibuat Oleh (NIP)", "Nama Pembuat", "Tgl Dibuat", "Tgl Diperbarui"
      ];
      var rowsThread = [headThread];
      for (var t = 0; t < payload.berkasThreadList.length; t++) {
        var th = payload.berkasThreadList[t];
        var mIds = Array.isArray(th.naskahMasukIds) ? th.naskahMasukIds.join("; ") : "";
        var kIds = Array.isArray(th.naskahKeluarIds) ? th.naskahKeluarIds.join("; ") : "";
        var histStr = "";
        try {
          histStr = JSON.stringify(th.history || []);
        } catch(errHist) {
          histStr = "[]";
        }
        rowsThread.push([
          th.id || "",
          th.nomorThread || "",
          th.namaBerkas || "",
          th.klasifikasiBerkas || "",
          th.kodeKlasifikasi || "",
          th.namaKlasifikasiArsip || "",
          th.keterangan || th.uraianBerkas || "",
          th.status || th.statusBerkas || "Aktif",
          th.unitKerja || "Sekretariat Utama",
          th.lokasiFisik || "",
          mIds,
          kIds,
          histStr,
          th.createdBy || "",
          th.createdByName || "",
          th.createdAt || "",
          th.updatedAt || ""
        ]);
      }
      writeSheetData(sheetThread, rowsThread);
    }

    // 3.4. KLASIFIKASI ARSIP
    if (payload.klasifikasiArsipList && Array.isArray(payload.klasifikasiArsipList)) {
      var sheetArsip = getOrCreateSheet(ss, "KLASIFIKASI ARSIP");
      var headArsip = [
        "ID", "Kode Klasifikasi", "Nama Klasifikasi", "Retensi Aktif (Tahun)", "Retensi Inaktif (Tahun)", "Nasib Akhir", "Deskripsi", "Tgl Dibuat"
      ];
      var rowsArsip = [headArsip];
      for (var kaIdx = 0; kaIdx < payload.klasifikasiArsipList.length; kaIdx++) {
        var ka = payload.klasifikasiArsipList[kaIdx];
        rowsArsip.push([
          ka.id || "",
          ka.kodeKlasifikasi || "",
          ka.namaKlasifikasi || "",
          Number(ka.retensiAktif) || 0,
          Number(ka.retensiInaktif) || 0,
          ka.nasibAkhir || "Permanen",
          ka.deskripsi || "",
          ka.createdAt || ""
        ]);
      }
      writeSheetData(sheetArsip, rowsArsip);
    }

    // 3.5. UNIT KERJA
    if (payload.unitKerjaList && Array.isArray(payload.unitKerjaList)) {
      var sheetUnit = getOrCreateSheet(ss, "UNIT KERJA");
      var rowsUnit = [["ID", "Nama Unit Kerja Pengelola"]];
      for (var uki = 0; uki < payload.unitKerjaList.length; uki++) {
        var ukName = payload.unitKerjaList[uki];
        rowsUnit.push(["UK-" + (uki + 1), ukName]);
      }
      writeSheetData(sheetUnit, rowsUnit);
    }

    // 3.6. INSTANSI & WILAYAH
    if (payload.instansiWilayah && Array.isArray(payload.instansiWilayah)) {
      var sheetIns = getOrCreateSheet(ss, "INSTANSI & WILAYAH");
      var rowsIns = [["ID", "Instansi Terkait", "Wilayah Kerja Menginduk"]];
      for (var a = 0; a < payload.instansiWilayah.length; a++) {
        var iw = payload.instansiWilayah[a];
        rowsIns.push([iw.id || "", iw.instansi || "", iw.wilayahKerja || ""]);
      }
      writeSheetData(sheetIns, rowsIns);
    }

    // 3.7. KLASIFIKASI & SUB
    if (payload.klasifikasiSub && Array.isArray(payload.klasifikasiSub)) {
      var sheetKlas = getOrCreateSheet(ss, "KLASIFIKASI & SUB");
      var rowsKlas = [["ID", "Klasifikasi Utama", "Sub Klasifikasi (Daftar)"]];
      for (var b = 0; b < payload.klasifikasiSub.length; b++) {
        var ks = payload.klasifikasiSub[b];
        rowsKlas.push([
          ks.id || "", 
          ks.klasifikasiUtama || "", 
          Array.isArray(ks.subKlasifikasiList) ? ks.subKlasifikasiList.join("; ") : ""
        ]);
      }
      writeSheetData(sheetKlas, rowsKlas);
    }

    // 3.8. PENGATURAN THREAD
    if (payload.threadNumberConfig && typeof payload.threadNumberConfig === "object") {
      var sheetCfg = getOrCreateSheet(ss, "PENGATURAN THREAD");
      var headCfg = ["Prefix", "Separator", "Format", "Counter Digits", "Current Counter", "Reset Period", "Last Reset Year", "Last Reset Month"];
      var tc = payload.threadNumberConfig;
      var rowsCfg = [
        headCfg,
        [
          tc.prefix || "TH",
          tc.separator || "-",
          tc.format || "[PREFIX]-[YYYY]-[COUNTER]",
          Number(tc.counterDigits) || 4,
          Number(tc.currentCounter) || 1,
          tc.resetPeriod || "yearly",
          Number(tc.lastResetYear) || new Date().getFullYear(),
          Number(tc.lastResetMonth) || (new Date().getMonth() + 1)
        ]
      ];
      writeSheetData(sheetCfg, rowsCfg);
    }

    // 3.9. MASTER DROPDOWN
    if (payload.jenisNaskahMasuk || payload.jenisNaskahKeluar || payload.statusPenyelesaian || payload.statusKirim) {
      var sheetDrop = getOrCreateSheet(ss, "MASTER DROPDOWN");
      var rowsDrop = [["Kategori Dropdown", "Nilai / Opsi"]];
      if (payload.jenisNaskahMasuk) {
        payload.jenisNaskahMasuk.forEach(function(v) { rowsDrop.push(["Jenis Naskah Masuk", v]); });
      }
      if (payload.jenisNaskahKeluar) {
        payload.jenisNaskahKeluar.forEach(function(v) { rowsDrop.push(["Jenis Naskah Keluar", v]); });
      }
      if (payload.statusPenyelesaian) {
        payload.statusPenyelesaian.forEach(function(v) { rowsDrop.push(["Status Penyelesaian", v]); });
      }
      if (payload.statusKirim) {
        payload.statusKirim.forEach(function(v) { rowsDrop.push(["Status Kirim", v]); });
      }
      writeSheetData(sheetDrop, rowsDrop);
    }

    // 3.10. USERS (AKUN PENGGUNA)
    if (payload.users && Array.isArray(payload.users)) {
      var sheetUsers = getOrCreateSheet(ss, "USERS");
      var rowsUsers = [["ID", "NIP", "Nama Lengkap", "Password", "Email Google (OTP)", "Jenis User", "Unit Kerja", "Role", "Hak Akses"]];
      for (var u = 0; u < payload.users.length; u++) {
        var usr = payload.users[u];
        rowsUsers.push([
          usr.id || "",
          usr.nip || "",
          usr.nama || "",
          usr.password || "",
          usr.email || "",
          usr.jenisUser || "",
          usr.unitKerja || "Bagian Umum",
          usr.role || (String(usr.jenisUser || "").toLowerCase().includes("admin") ? "admin" : "staf"),
          Array.isArray(usr.hakAkses) ? usr.hakAkses.join("; ") : ""
        ]);
      }
      writeSheetData(sheetUsers, rowsUsers);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data Manajemen Surat & Kearsipan berhasil disinkronkan ke 10 Tabel Google Sheets DB",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action;
    if (action === "setup" || action === "init") {
      var msg = setupDatabase();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: msg,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "pull") {
      setupDatabase();
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var dataObj = pullAllDataFromSpreadsheet(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: dataObj,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {}

  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    app: "Management Surat & Pemberkasan Arsip Google Apps Script Webhook DB",
    version: "3.0 (Automatic 10 Sheets Database - Surat & Pemberkasan Arsip)",
    poweredBy: "Riswan Anas"
  })).setMimeType(ContentService.MimeType.JSON);
}

function pullAllDataFromSpreadsheet(ss) {
  var naskahMasuk = readSheetAsObjects(ss, "NASKAH MASUK");
  var naskahKeluar = readSheetAsObjects(ss, "NASKAH KELUAR");
  var berkasThreadList = readSheetAsObjects(ss, "PEMBERKASAN THREAD");
  var klasifikasiArsipList = readSheetAsObjects(ss, "KLASIFIKASI ARSIP");
  var unitKerja = readSheetAsObjects(ss, "UNIT KERJA");
  var instansiWilayah = readSheetAsObjects(ss, "INSTANSI & WILAYAH");
  var klasifikasiSub = readSheetAsObjects(ss, "KLASIFIKASI & SUB");
  var threadConfigList = readSheetAsObjects(ss, "PENGATURAN THREAD");
  var users = readSheetAsObjects(ss, "USERS");

  var threadNumberConfig = undefined;
  if (threadConfigList && threadConfigList.length > 0) {
    threadNumberConfig = threadConfigList[0];
  }

  return {
    naskahMasuk: naskahMasuk,
    naskahKeluar: naskahKeluar,
    berkasThreadList: berkasThreadList,
    klasifikasiArsipList: klasifikasiArsipList,
    threadNumberConfig: threadNumberConfig,
    unitKerjaList: unitKerja.map(function(u) { return u.nama || u.unitKerja || ""; }).filter(Boolean),
    instansiWilayah: instansiWilayah,
    klasifikasiSub: klasifikasiSub,
    users: users
  };
}

function formatCellVal(val) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    var yyyy = val.getFullYear();
    var mm = ("0" + (val.getMonth() + 1)).slice(-2);
    var dd = ("0" + val.getDate()).slice(-2);
    return yyyy + "-" + mm + "-" + dd;
  }
  return String(val || "").trim();
}

function readSheetAsObjects(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var header = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var result = [];

  function getCol(row, colName, fallbackIndex) {
    var idx = header.indexOf(colName.toLowerCase());
    if (idx > -1 && row[idx] !== undefined) return formatCellVal(row[idx]);
    if (fallbackIndex !== undefined && row[fallbackIndex] !== undefined) return formatCellVal(row[fallbackIndex]);
    return "";
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowId = String(row[0] || "").trim();
    var hasAnyContent = row.some(function(cell) { return String(cell || "").trim() !== ""; });
    if (!hasAnyContent) continue;
    if (!rowId) {
      rowId = "MANUAL-" + i + "-" + new Date().getTime();
    }

    if (sheetName === "NASKAH MASUK") {
      result.push({
        id: rowId,
        tglTerima: getCol(row, "tgl terima", 1),
        tglNaskah: getCol(row, "tgl naskah", 2) || getCol(row, "tgl terima", 1),
        nomorNaskah: getCol(row, "nomor naskah", 3),
        perihal: getCol(row, "perihal", 4),
        jenisNaskah: getCol(row, "jenis naskah", 5) || "Surat Biasa",
        unitKerja: getCol(row, "unit kerja", 6) || "Bagian Umum",
        pengirimNaskah: getCol(row, "pengirim", 7) || getCol(row, "pengirim naskah", 7),
        instansiTerkait: getCol(row, "instansi", 8) || getCol(row, "instansi terkait", 8),
        wilayahKerja: getCol(row, "wilayah kerja", 9),
        klasifikasiUtama: getCol(row, "klasifikasi", 10) || getCol(row, "klasifikasi utama", 10),
        subKlasifikasi: getCol(row, "sub klasifikasi", 11),
        statusPenyelesaian: getCol(row, "status penyelesaian", 12) || "Belum Diproses",
        sla: Number(getCol(row, "sla (hari)", 13)) || 3,
        fileLinkNaskahMasuk: getCol(row, "file link naskah masuk", 14),
        fileLinkNaskahDijawab: getCol(row, "file link naskah dijawab", 15),
        createdBy: getCol(row, "dibuat oleh (nip)", 16) || getCol(row, "dibuat oleh nip", 16) || getCol(row, "createdby", 16),
        createdByName: getCol(row, "nama pembuat", 17) || getCol(row, "dibuat oleh", 17) || "Admin Sheet",
        createdAt: getCol(row, "timestamp", 18) || new Date().toISOString()
      });
    } else if (sheetName === "NASKAH KELUAR") {
      result.push({
        id: rowId,
        tglNaskah: getCol(row, "tgl naskah", 1),
        nomorNaskah: getCol(row, "nomor naskah", 2),
        perihal: getCol(row, "perihal", 3),
        jenisNaskah: getCol(row, "jenis naskah", 4) || "Surat Biasa",
        unitKerja: getCol(row, "unit kerja", 5) || "Bagian Umum",
        tujuanNaskah: getCol(row, "tujuan", 6) || getCol(row, "tujuan naskah", 6),
        instansiTerkait: getCol(row, "instansi", 7) || getCol(row, "instansi terkait", 7),
        wilayahKerja: getCol(row, "wilayah kerja", 8),
        klasifikasiUtama: getCol(row, "klasifikasi", 9) || getCol(row, "klasifikasi utama", 9),
        subKlasifikasi: getCol(row, "sub klasifikasi", 10),
        tglKirim: getCol(row, "tgl kirim", 11),
        statusPengiriman: getCol(row, "status pengiriman", 12) || "Belum Terkirim",
        buktiKirim: getCol(row, "bukti kirim", 13),
        fileLinkNaskahMasuk: getCol(row, "file link naskah keluar", 14) || getCol(row, "file link naskah masuk", 14),
        fileLinkNaskahDijawab: getCol(row, "file link naskah dijawab/masuk", 15) || getCol(row, "file link naskah dijawab", 15),
        catatan: getCol(row, "catatan", 16),
        createdBy: getCol(row, "dibuat oleh (nip)", 17) || getCol(row, "createdby", 17),
        createdByName: getCol(row, "nama pembuat", 18) || getCol(row, "dibuat oleh", 18) || "Admin Sheet",
        createdAt: getCol(row, "timestamp", 19) || new Date().toISOString()
      });
    } else if (sheetName === "PEMBERKASAN THREAD") {
      var mIdsRaw = getCol(row, "id naskah masuk (daftar)", 10) || getCol(row, "id naskah masuk", 10);
      var kIdsRaw = getCol(row, "id naskah keluar (daftar)", 11) || getCol(row, "id naskah keluar", 11);
      var mIds = mIdsRaw ? mIdsRaw.split(/[;,]/).map(function(s) { return s.trim(); }).filter(Boolean) : [];
      var kIds = kIdsRaw ? kIdsRaw.split(/[;,]/).map(function(s) { return s.trim(); }).filter(Boolean) : [];
      var rawHist = getCol(row, "riwayat log (json)", 12) || getCol(row, "riwayat log", 12);
      var parsedHist = [];
      if (rawHist) {
        try {
          parsedHist = JSON.parse(rawHist);
        } catch(e) {
          parsedHist = [{
            id: "hist-" + rowId + "-1",
            timestamp: getCol(row, "tgl dibuat", 15) || new Date().toISOString(),
            type: "create",
            actorNip: getCol(row, "dibuat oleh (nip)", 13) || "198901012010011001",
            actorName: getCol(row, "nama pembuat", 14) || "Admin",
            description: "Catatan: " + rawHist
          }];
        }
      }

      result.push({
        id: rowId,
        nomorThread: getCol(row, "nomor thread", 1),
        namaBerkas: getCol(row, "nama berkas", 2),
        klasifikasiBerkas: getCol(row, "klasifikasi berkas", 3),
        kodeKlasifikasi: getCol(row, "kode klasifikasi", 4),
        namaKlasifikasiArsip: getCol(row, "uraian kode arsip", 5) || getCol(row, "uraian klasifikasi", 5),
        keterangan: getCol(row, "uraian / keterangan berkas", 6) || getCol(row, "keterangan", 6),
        uraianBerkas: getCol(row, "uraian / keterangan berkas", 6) || getCol(row, "uraian berkas", 6),
        status: getCol(row, "status berkas", 7) || getCol(row, "status", 7) || "Aktif",
        statusBerkas: getCol(row, "status berkas", 7) || getCol(row, "status", 7) || "Aktif",
        unitKerja: getCol(row, "unit kerja", 8) || "Sekretariat Utama",
        lokasiFisik: getCol(row, "lokasi fisik", 9),
        naskahMasukIds: mIds,
        naskahKeluarIds: kIds,
        history: parsedHist,
        createdBy: getCol(row, "dibuat oleh (nip)", 13) || getCol(row, "createdby", 13),
        createdByName: getCol(row, "nama pembuat", 14) || getCol(row, "dibuat oleh", 14),
        createdAt: getCol(row, "tgl dibuat", 15) || new Date().toISOString(),
        updatedAt: getCol(row, "tgl diperbarui", 16) || new Date().toISOString()
      });
    } else if (sheetName === "KLASIFIKASI ARSIP") {
      result.push({
        id: rowId,
        kodeKlasifikasi: getCol(row, "kode klasifikasi", 1),
        namaKlasifikasi: getCol(row, "nama klasifikasi", 2),
        retensiAktif: Number(getCol(row, "retensi aktif (tahun)", 3)) || 2,
        retensiInaktif: Number(getCol(row, "retensi inaktif (tahun)", 4)) || 5,
        nasibAkhir: getCol(row, "nasib akhir", 5) || "Permanen",
        deskripsi: getCol(row, "deskripsi", 6),
        createdAt: getCol(row, "tgl dibuat", 7) || new Date().toISOString()
      });
    } else if (sheetName === "PENGATURAN THREAD") {
      result.push({
        prefix: getCol(row, "prefix", 0) || "TH",
        separator: getCol(row, "separator", 1) || "-",
        format: getCol(row, "format", 2) || "[PREFIX]-[YYYY]-[COUNTER]",
        counterDigits: Number(getCol(row, "counter digits", 3)) || 4,
        currentCounter: Number(getCol(row, "current counter", 4)) || 1,
        resetPeriod: getCol(row, "reset period", 5) || "yearly",
        lastResetYear: Number(getCol(row, "last reset year", 6)) || new Date().getFullYear(),
        lastResetMonth: Number(getCol(row, "last reset month", 7)) || (new Date().getMonth() + 1)
      });
    } else if (sheetName === "UNIT KERJA") {
      result.push({
        id: rowId,
        unitKerja: getCol(row, "nama unit kerja pengelola", 1) || getCol(row, "unit kerja", 1),
        nama: getCol(row, "nama unit kerja pengelola", 1) || getCol(row, "unit kerja", 1)
      });
    } else if (sheetName === "INSTANSI & WILAYAH") {
      result.push({
        id: rowId,
        instansi: getCol(row, "instansi terkait", 1) || getCol(row, "instansi", 1),
        wilayahKerja: getCol(row, "wilayah kerja menginduk", 2) || getCol(row, "wilayah kerja", 2)
      });
    } else if (sheetName === "KLASIFIKASI & SUB") {
      var subListStr = getCol(row, "sub klasifikasi (daftar)", 2) || getCol(row, "sub klasifikasi", 2);
      result.push({
        id: rowId,
        klasifikasiUtama: getCol(row, "klasifikasi utama", 1) || getCol(row, "klasifikasi", 1),
        subKlasifikasiList: subListStr ? subListStr.split(";").map(function(item) { return item.trim(); }).filter(Boolean) : []
      });
    } else if (sheetName === "USERS") {
      result.push({
        id: rowId,
        nip: getCol(row, "nip", 1),
        nama: getCol(row, "nama lengkap", 2) || getCol(row, "nama", 2),
        password: getCol(row, "password", 3),
        email: getCol(row, "email google (otp)", 4) || getCol(row, "email", 4),
        jenisUser: getCol(row, "jenis user", 5) || "Admin Satker",
        unitKerja: getCol(row, "unit kerja", 6) || "Bagian Umum",
        role: getCol(row, "role", 7) || "admin",
        hakAkses: (getCol(row, "hak akses", 8) || "").split(";").map(function(item) { return item.trim(); }).filter(Boolean)
      });
    }
  }
  return result;
}

/**
 * FUNGSI OTOMATIS: SETUP DATABASE SHEET LENGKAP (10 SHEET)
 * Membuat / memperbarui seluruh 10 lembar database beserta judul kolom secara otomatis!
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. NASKAH MASUK
  var sMasuk = initSheetWithHeader(ss, "NASKAH MASUK", [
    "ID", "Tgl Terima", "Tgl Naskah", "Nomor Naskah", "Perihal", "Jenis Naskah", 
    "Unit Kerja", "Pengirim", "Instansi", "Wilayah Kerja", "Klasifikasi", "Sub Klasifikasi", 
    "Status Penyelesaian", "SLA (Hari)", "File Link Naskah Masuk", "File Link Naskah Dijawab", "Dibuat Oleh (NIP)", "Nama Pembuat", "Timestamp"
  ]);

  // 2. NASKAH KELUAR
  var sKeluar = initSheetWithHeader(ss, "NASKAH KELUAR", [
    "ID", "Tgl Naskah", "Nomor Naskah", "Perihal", "Jenis Naskah", "Unit Kerja",
    "Tujuan", "Instansi", "Wilayah Kerja", "Klasifikasi", "Sub Klasifikasi",
    "Tgl Kirim", "Status Pengiriman", "Bukti Kirim", "File Link Naskah Keluar", "File Link Naskah Dijawab/Masuk", "Catatan", "Dibuat Oleh (NIP)", "Nama Pembuat", "Timestamp"
  ]);

  // 3. PEMBERKASAN THREAD
  var sThread = initSheetWithHeader(ss, "PEMBERKASAN THREAD", [
    "ID", "Nomor Thread", "Nama Berkas", "Klasifikasi Berkas", "Kode Klasifikasi", "Uraian Kode Arsip", 
    "Uraian / Keterangan Berkas", "Status Berkas", "Unit Kerja", "Lokasi Fisik", 
    "ID Naskah Masuk (Daftar)", "ID Naskah Keluar (Daftar)", "Riwayat Log (JSON)", 
    "Dibuat Oleh (NIP)", "Nama Pembuat", "Tgl Dibuat", "Tgl Diperbarui"
  ]);
  if (sThread.getLastRow() === 1) {
    writeSheetData(sThread, [
      [
        "ID", "Nomor Thread", "Nama Berkas", "Klasifikasi Berkas", "Kode Klasifikasi", "Uraian Kode Arsip", 
        "Uraian / Keterangan Berkas", "Status Berkas", "Unit Kerja", "Lokasi Fisik", 
        "ID Naskah Masuk (Daftar)", "ID Naskah Keluar (Daftar)", "Riwayat Log (JSON)", 
        "Dibuat Oleh (NIP)", "Nama Pembuat", "Tgl Dibuat", "Tgl Diperbarui"
      ],
      [
        "th-1", "TH-2026-0001", "Koordinasi Kenaikan Pangkat ASN Jawa Barat Periode Agustus 2026",
        "Mutasi & Promosi", "KP.02.00", "Mutasi, Kepangkatan, dan Jabatan",
        "Pemberkasan terpadu surat permohonan koordinasi dan jawaban resmi",
        "Selesai", "Sekretariat Utama", "Boks Arsip 01 / Rak Kepegawaian A",
        "nm-1", "nk-1", "[]", "198901012010011001", "Riswan Anas",
        new Date().toISOString(), new Date().toISOString()
      ]
    ]);
  }

  // 4. KLASIFIKASI ARSIP
  var sArsip = initSheetWithHeader(ss, "KLASIFIKASI ARSIP", [
    "ID", "Kode Klasifikasi", "Nama Klasifikasi", "Retensi Aktif (Tahun)", "Retensi Inaktif (Tahun)", "Nasib Akhir", "Deskripsi", "Tgl Dibuat"
  ]);
  if (sArsip.getLastRow() === 1) {
    writeSheetData(sArsip, [
      ["ID", "Kode Klasifikasi", "Nama Klasifikasi", "Retensi Aktif (Tahun)", "Retensi Inaktif (Tahun)", "Nasib Akhir", "Deskripsi", "Tgl Dibuat"],
      ["ka-1", "KP.01.00", "Pengadaan dan Rekrutmen Pegawai ASN", 2, 5, "Permanen", "Berkas proses seleksi CASN, formasi jabatan, penetapan NIP", new Date().toISOString()],
      ["ka-2", "KP.02.00", "Mutasi, Kepangkatan, dan Jabatan", 2, 5, "Permanen", "Kenaikan pangkat berkala, mutasi antar instansi, pengangkatan jabatan", new Date().toISOString()],
      ["ka-3", "KP.03.00", "Disiplin, Etika, dan Pengawasan Pegawai", 3, 7, "Permanen", "Pemeriksaan pelanggaran disiplin ASN, hukuman disiplin", new Date().toISOString()],
      ["ka-4", "KP.04.00", "Pensiun dan Pemberhentian Pegawai", 2, 10, "Permanen", "Batas usia pensiun (BUP), pensiun dini, SK pensiun", new Date().toISOString()],
      ["ka-5", "HK.01.00", "Peraturan Perundang-Undangan & Telaah Hukum", 5, 10, "Permanen", "Rancangan Keputusan, telaahan hukum, nota kesepahaman (MoU)", new Date().toISOString()],
      ["ka-6", "OT.01.00", "Organisasi, Tata Laksana, dan Reformasi Birokrasi", 2, 5, "Permanen", "Penataan struktur kelembagaan, analisis beban kerja, SOP", new Date().toISOString()],
      ["ka-7", "KU.01.00", "Perencanaan Anggaran & Keuangan", 2, 10, "Musnah", "Rencana kerja dan anggaran, DIPA, revisi anggaran", new Date().toISOString()],
      ["ka-8", "HM.01.00", "Hubungan Masyarakat, Publikasi, dan Protokol", 1, 3, "Dinilai Kembali", "Siaran pers, peliputan media, website dan keprotokolan", new Date().toISOString()]
    ]);
  }

  // 5. UNIT KERJA
  var ukSheet = initSheetWithHeader(ss, "UNIT KERJA", [
    "ID", "Nama Unit Kerja Pengelola"
  ]);
  if (ukSheet.getLastRow() === 1) {
    writeSheetData(ukSheet, [
      ["ID", "Nama Unit Kerja Pengelola"],
      ["UK-1", "Bagian Umum"],
      ["UK-2", "Bidang Pelayanan & Mutasi"],
      ["UK-3", "Sekretariat Utama"],
      ["UK-4", "Bidang Tata Usaha & Kearsipan"],
      ["UK-5", "Bidang Statistik Sosial"],
      ["UK-6", "Bidang Statistik Produksi"],
      ["UK-7", "Bidang Statistik Distribusi"],
      ["UK-8", "Bidang IPDS"]
    ]);
  }

  // 6. INSTANSI & WILAYAH
  var insSheet = initSheetWithHeader(ss, "INSTANSI & WILAYAH", [
    "ID", "Instansi Terkait", "Wilayah Kerja Menginduk"
  ]);
  if (insSheet.getLastRow() === 1) {
    writeSheetData(insSheet, [
      ["ID", "Instansi Terkait", "Wilayah Kerja Menginduk"],
      ["INS-1", "BPS RI", "Pusat"],
      ["INS-2", "BPS Provinsi", "Wilayah 1"],
      ["INS-3", "BPS Kabupaten/Kota", "Wilayah 2"]
    ]);
  }

  // 7. KLASIFIKASI & SUB
  var klasSheet = initSheetWithHeader(ss, "KLASIFIKASI & SUB", [
    "ID", "Klasifikasi Utama", "Sub Klasifikasi (Daftar)"
  ]);
  if (klasSheet.getLastRow() === 1) {
    writeSheetData(klasSheet, [
      ["ID", "Klasifikasi Utama", "Sub Klasifikasi (Daftar)"],
      ["KLAS-1", "Umum & Kepegawaian", "Cuti; Mutasi; Kenaikan Pangkat; Undangan"],
      ["KLAS-2", "Keuangan & Perlengkapan", "SPPD; Anggaran; Pengadaan Barang; BMN"],
      ["KLAS-3", "Teknis Statistik", "Sensus; Survei; Pengolahan Data; Diseminasi"],
      ["KLAS-4", "Pengaduan Kepegawaian", "Pengaduan Keterlambatan Layanan; Pengaduan Pelanggaran Disiplin Pegawai"]
    ]);
  }

  // 8. PENGATURAN THREAD
  var sCfg = initSheetWithHeader(ss, "PENGATURAN THREAD", [
    "Prefix", "Separator", "Format", "Counter Digits", "Current Counter", "Reset Period", "Last Reset Year", "Last Reset Month"
  ]);
  if (sCfg.getLastRow() === 1) {
    writeSheetData(sCfg, [
      ["Prefix", "Separator", "Format", "Counter Digits", "Current Counter", "Reset Period", "Last Reset Year", "Last Reset Month"],
      ["TH", "-", "[PREFIX]-[YYYY]-[COUNTER]", 4, 3, "yearly", new Date().getFullYear(), new Date().getMonth() + 1]
    ]);
  }

  // 9. MASTER DROPDOWN
  initSheetWithHeader(ss, "MASTER DROPDOWN", [
    "Kategori Dropdown", "Nilai / Opsi"
  ]);

  // 10. USERS (AKUN PENGGUNA)
  var userSheet = initSheetWithHeader(ss, "USERS", [
    "ID", "NIP", "Nama Lengkap", "Password", "Email Google (OTP)", "Jenis User", "Unit Kerja", "Role", "Hak Akses"
  ]);
  if (userSheet.getLastRow() === 1) {
    writeSheetData(userSheet, [
      ["ID", "NIP", "Nama Lengkap", "Password", "Email Google (OTP)", "Jenis User", "Unit Kerja", "Role", "Hak Akses"],
      ["USER-1", "198901012010011001", "Riswan Anas", "riswan123", "suratkerja89@gmail.com", "Admin", "Sekretariat Utama", "admin", "Dashboard; Naskah Masuk; Naskah Keluar; Pemberkasan; Master Data; Laporan; Rekapitulasi; Daftar Arsip Aktif"],
      ["USER-2", "198505152008011002", "Drs. Ahmad Subroto, M.Si", "ahmad123", "", "Admin", "Sekretariat Utama", "admin", "Dashboard; Naskah Masuk; Naskah Keluar; Pemberkasan; Master Data; Laporan; Rekapitulasi; Daftar Arsip Aktif"],
      ["USER-3", "199203102015022003", "Siti Nurhaliza, S.ST", "siti123", "", "Operator", "Bidang Pelayanan & Mutasi", "staf", "Dashboard; Naskah Masuk; Naskah Keluar; Pemberkasan; Laporan; Rekapitulasi; Daftar Arsip Aktif"]
    ]);
  }

  // Hapus Sheet default kosong jika ada sheet lain
  try {
    var def1 = ss.getSheetByName("Sheet1") || ss.getSheetByName("Lembar 1") || ss.getSheetByName("Sheet 1");
    if (def1 && ss.getSheets().length > 1 && def1.getLastRow() <= 1) {
      ss.deleteSheet(def1);
    }
  } catch(e) {}

  return "10 Lembar Database Google Sheets Lengkap (Naskah Masuk, Naskah Keluar, Pemberkasan Thread, Klasifikasi Arsip, Unit Kerja, dsb.) & Judul Kolom berhasil dibuat secara otomatis!";
}

function initSheetWithHeader(ss, sheetName, headerRow) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    writeSheetData(sheet, [headerRow]);
  } else if (sheet.getLastRow() === 0) {
    writeSheetData(sheet, [headerRow]);
  } else {
    // Perbarui baris header agar kolom baru otomatis muncul
    var currentCols = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headerRow.length)).getValues()[0];
    var needsUpdate = false;
    for (var h = 0; h < headerRow.length; h++) {
      if (String(currentCols[h] || "").trim().toLowerCase() !== String(headerRow[h] || "").trim().toLowerCase()) {
        needsUpdate = true;
        break;
      }
    }
    if (needsUpdate) {
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      var headerRange = sheet.getRange(1, 1, 1, headerRow.length);
      headerRange.setBackground("#065f46");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function writeSheetData(sheet, rows) {
  if (rows && rows.length > 0) {
    sheet.clearContents();
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    var headerRange = sheet.getRange(1, 1, 1, rows[0].length);
    headerRange.setBackground("#065f46");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}`;

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ isOpen, onClose }) => {
  const {
    googleSheetConfig,
    setGoogleSheetConfig,
    syncWithGoogleSheets,
    pullFromGoogleSheets,
    naskahMasukList,
    naskahKeluarList,
    berkasThreadList,
    klasifikasiArsipList,
    unitKerjaList,
    jenisNaskahMasuk,
    jenisNaskahKeluar,
    instansiWilayah,
    klasifikasiSub,
    statusPenyelesaian,
    statusKirim,
    users,
    threadNumberConfig,
    showToast
  } = useApp();

  const [sheetUrl, setSheetUrl] = useState(googleSheetConfig.sheetUrlOrId || '');
  const [webhookUrl, setWebhookUrl] = useState(googleSheetConfig.webhookUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);

  const isSpreadsheetUrlInWebhook = webhookUrl.includes('docs.google.com/spreadsheets');
  const isValidWebhookFormat = webhookUrl.startsWith('https://script.google.com/macros/s/') && webhookUrl.includes('/exec');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!webhookUrl) {
      setTestResult({
        status: 'error',
        message: 'Webhook URL belum diisi. Salin Webhook URL dari menu Deploy Google Apps Script.'
      });
      return;
    }

    if (isSpreadsheetUrlInWebhook) {
      setTestResult({
        status: 'error',
        message: 'URL yang dimasukkan adalah link spreadsheet biasa (docs.google.com/spreadsheets), bukan Webhook Script. Masukkan URL Apps Script Web App yang berakhiran /exec.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const getUrl = webhookUrl + (webhookUrl.includes('?') ? '&' : '?') + `action=pull&_t=${Date.now()}`;
      const res = await fetch(getUrl, { method: 'GET', cache: 'no-store' });
      const data = await res.json().catch(() => null);

      if (data && data.status === 'success') {
        setTestResult({
          status: 'success',
          message: 'Koneksi Sukses! Webhook Google Sheet aktif & merespons dengan baik. Sinkronisasi data otomatis berjalan normal.'
        });
        showToast('Koneksi Webhook Google Sheet Sukses & Terverifikasi!', 'success');
      } else if (data && data.status === 'ok') {
        setTestResult({
          status: 'success',
          message: 'Webhook terhubung (Versi Script: ' + (data.version || 'Aktif') + '). Siap menerima sinkronisasi data.'
        });
        showToast('Webhook Google Sheet terhubung!', 'success');
      } else {
        setTestResult({
          status: 'warning',
          message: 'Webhook merespons tetapi data tidak sesuai. Pastikan Anda telah menempelkan script Code.gs versi terbaru dan melakukan Deploy ulang.'
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: 'Koneksi gagal! Kemungkinan penyebab: 1) Saat Deploy, pilihan "Yang memiliki akses / Who has access" belum dipilih "Siapa saja (Anyone)", atau 2) Script belum di-deploy sebagai Web App.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setIsCopied(true);
    showToast('Script Webhook Code.gs (10 Sheet Database Lengkap) berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleSheetConfig((prev) => ({
      ...prev,
      sheetUrlOrId: String(sheetUrl || '').trim(),
      webhookUrl: String(webhookUrl || '').trim(),
      syncEnabled: true
    }));
    showToast('Konfigurasi Google Sheet Database berhasil disimpan!', 'success');
    onClose();
  };

  const handleSetupDB = async () => {
    if (!webhookUrl) {
      showToast('Silakan isi dan simpan Webhook URL terlebih dahulu!', 'error');
      return;
    }
    setIsSettingUp(true);
    try {
      const getUrl = webhookUrl + (webhookUrl.includes('?') ? '&' : '?') + `action=setup&_t=${Date.now()}`;
      const res = await fetch(getUrl, { method: 'GET', cache: 'no-store' });
      const data = await res.json();
      if (data && data.status === 'success') {
        showToast('Berhasil! 10 Lembar Sheet Database & Seluruh Judul Kolom telah otomatis dibuat di Google Spreadsheet Anda!', 'success');
        // Push current data immediately to populate
        await syncWithGoogleSheets();
      } else {
        showToast('Gagal setup otomatis. Pastikan script versi terbaru sudah ditempel (paste) dan di-deploy di Apps Script.', 'error');
      }
    } catch {
      showToast('Koneksi ke Webhook gagal. Pastikan URL benar & deployment memiliki akses Anyone (Siapa saja).', 'error');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSyncSupabaseNow = async () => {
    setIsSupabaseSyncing(true);
    showToast('Sedang memindahkan & menyelaraskan seluruh data ke Supabase PostgreSQL...', 'info');
    const res = await pushToSupabase({
      naskahMasuk: naskahMasukList,
      naskahKeluar: naskahKeluarList,
      berkasThreadList,
      users,
      unitKerjaList,
      klasifikasiArsipList,
      threadNumberConfig
    });
    setIsSupabaseSyncing(false);
    if (res.success) {
      showToast('BERHASIL! Seluruh data dari aplikasi / Google Sheet telah tersimpan di Supabase!', 'success');
    } else {
      showToast(`Gagal menyimpan ke Supabase: ${res.errors.join(' | ')}`, 'error');
    }
  };

  const handlePullDB = async () => {
    setIsPulling(true);
    await pullFromGoogleSheets();
    setIsPulling(false);
  };

  const handlePushDB = async () => {
    setIsSyncing(true);
    await syncWithGoogleSheets();
    setIsSyncing(false);
  };

  const handleExportWorkbook = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Naskah Masuk
      const wsMasuk = XLSX.utils.json_to_sheet(
        naskahMasukList.map((m) => ({
          ID: m.id,
          'Tgl Terima': m.tglTerima,
          'Tgl Naskah': m.tglNaskah,
          'Nomor Naskah': m.nomorNaskah,
          Perihal: m.perihal,
          'Jenis Naskah': m.jenisNaskah,
          'Unit Kerja': m.unitKerja || 'Bagian Umum',
          Pengirim: m.pengirimNaskah,
          Instansi: m.instansiTerkait,
          'Wilayah Kerja': m.wilayahKerja,
          Klasifikasi: m.klasifikasiUtama,
          'Sub Klasifikasi': m.subKlasifikasi,
          'Status Penyelesaian': m.statusPenyelesaian,
          'SLA (Hari)': m.sla,
          'File Link Naskah Masuk': m.fileLinkNaskahMasuk || '',
          'File Link Naskah Dijawab': m.fileLinkNaskahDijawab || '',
          'Dibuat Oleh (NIP)': m.createdBy || '',
          'Nama Pembuat': m.createdByName || '',
          Timestamp: m.createdAt || ''
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsMasuk, 'NASKAH MASUK');

      // Sheet 2: Naskah Keluar
      const wsKeluar = XLSX.utils.json_to_sheet(
        naskahKeluarList.map((k) => ({
          ID: k.id,
          'Tgl Naskah': k.tglNaskah,
          'Nomor Naskah': k.nomorNaskah,
          Perihal: k.perihal,
          'Jenis Naskah': k.jenisNaskah,
          'Unit Kerja': k.unitKerja || 'Bagian Umum',
          Tujuan: k.tujuanNaskah,
          Instansi: k.instansiTerkait,
          'Wilayah Kerja': k.wilayahKerja,
          Klasifikasi: k.klasifikasiUtama,
          'Sub Klasifikasi': k.subKlasifikasi,
          'Tgl Kirim': k.tglKirim || '',
          'Status Pengiriman': k.statusPengiriman || 'Belum Terkirim',
          'Bukti Kirim': k.buktiKirim || '',
          'File Link Naskah Keluar': k.fileLinkNaskahMasuk || '',
          'File Link Naskah Dijawab/Masuk': k.fileLinkNaskahDijawab || '',
          Catatan: k.catatan || '',
          'Dibuat Oleh (NIP)': k.createdBy || '',
          'Nama Pembuat': k.createdByName || '',
          Timestamp: k.createdAt || ''
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsKeluar, 'NASKAH KELUAR');

      // Sheet 3: Pemberkasan Thread
      const wsThread = XLSX.utils.json_to_sheet(
        (berkasThreadList || []).map((th) => ({
          ID: th.id,
          'Nomor Thread': th.nomorThread,
          'Nama Berkas': th.namaBerkas,
          'Klasifikasi Berkas': th.klasifikasiBerkas,
          'Kode Klasifikasi': th.kodeKlasifikasi,
          'Uraian Kode Arsip': th.namaKlasifikasiArsip || '',
          'Uraian / Keterangan Berkas': th.keterangan || th.uraianBerkas || '',
          'Status Berkas': th.status || th.statusBerkas || 'Aktif',
          'Unit Kerja': th.unitKerja || 'Sekretariat Utama',
          'Lokasi Fisik': th.lokasiFisik || '',
          'ID Naskah Masuk (Daftar)': Array.isArray(th.naskahMasukIds) ? th.naskahMasukIds.join('; ') : '',
          'ID Naskah Keluar (Daftar)': Array.isArray(th.naskahKeluarIds) ? th.naskahKeluarIds.join('; ') : '',
          'Riwayat Log (JSON)': JSON.stringify(th.history || []),
          'Dibuat Oleh (NIP)': th.createdBy || '',
          'Nama Pembuat': th.createdByName || '',
          'Tgl Dibuat': th.createdAt || '',
          'Tgl Diperbarui': th.updatedAt || ''
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsThread, 'PEMBERKASAN THREAD');

      // Sheet 4: Klasifikasi Arsip
      const wsArsip = XLSX.utils.json_to_sheet(
        (klasifikasiArsipList || []).map((ka) => ({
          ID: ka.id,
          'Kode Klasifikasi': ka.kodeKlasifikasi,
          'Nama Klasifikasi': ka.namaKlasifikasi,
          'Retensi Aktif (Tahun)': ka.retensiAktif || 0,
          'Retensi Inaktif (Tahun)': ka.retensiInaktif || 0,
          'Nasib Akhir': ka.nasibAkhir || 'Permanen',
          Deskripsi: ka.deskripsi || '',
          'Tgl Dibuat': ka.createdAt || ''
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsArsip, 'KLASIFIKASI ARSIP');

      // Sheet 5: Unit Kerja
      const wsUnitKerja = XLSX.utils.json_to_sheet(
        (unitKerjaList || []).map((uk, idx) => ({
          ID: `UK-${idx + 1}`,
          'Nama Unit Kerja Pengelola': uk
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsUnitKerja, 'UNIT KERJA');

      // Sheet 6: Instansi Wilayah
      const wsInstansi = XLSX.utils.json_to_sheet(
        instansiWilayah.map((iw) => ({
          ID: iw.id,
          'Instansi Terkait': iw.instansi,
          'Wilayah Kerja Menginduk': iw.wilayahKerja
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsInstansi, 'INSTANSI & WILAYAH');

      // Sheet 7: Klasifikasi Sub
      const wsKlas = XLSX.utils.json_to_sheet(
        klasifikasiSub.map((k) => ({
          ID: k.id,
          'Klasifikasi Utama': k.klasifikasiUtama,
          'Sub Klasifikasi (Daftar)': k.subKlasifikasiList.join('; ')
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsKlas, 'KLASIFIKASI & SUB');

      // Sheet 8: Pengaturan Thread
      const wsCfg = XLSX.utils.json_to_sheet([
        {
          Prefix: googleSheetConfig ? 'TH' : 'TH',
          Separator: '-',
          Format: '[PREFIX]-[YYYY]-[COUNTER]',
          'Counter Digits': 4,
          'Current Counter': 1,
          'Reset Period': 'yearly',
          'Last Reset Year': new Date().getFullYear(),
          'Last Reset Month': new Date().getMonth() + 1
        }
      ]);
      XLSX.utils.book_append_sheet(wb, wsCfg, 'PENGATURAN THREAD');

      // Sheet 9: Master Dropdowns
      const wsDropdowns = XLSX.utils.json_to_sheet([
        ...jenisNaskahMasuk.map((j) => ({ 'Kategori Dropdown': 'Jenis Naskah Masuk', 'Nilai / Opsi': j })),
        ...jenisNaskahKeluar.map((j) => ({ 'Kategori Dropdown': 'Jenis Naskah Keluar', 'Nilai / Opsi': j })),
        ...statusPenyelesaian.map((s) => ({ 'Kategori Dropdown': 'Status Penyelesaian', 'Nilai / Opsi': s })),
        ...statusKirim.map((s) => ({ 'Kategori Dropdown': 'Status Kirim', 'Nilai / Opsi': s }))
      ]);
      XLSX.utils.book_append_sheet(wb, wsDropdowns, 'MASTER DROPDOWN');

      // Sheet 10: Users
      const wsUsers = XLSX.utils.json_to_sheet(
        (users || []).map((u) => ({
          ID: u.id,
          NIP: u.nip,
          'Nama Lengkap': u.nama,
          Password: u.password || '',
          'Email Google (OTP)': u.email || '',
          'Jenis User': u.jenisUser,
          'Unit Kerja': u.unitKerja || 'Bagian Umum',
          Role: u.role || 'admin',
          'Hak Akses': Array.isArray(u.hakAkses) ? u.hakAkses.join('; ') : ''
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsUsers, 'USERS');

      XLSX.writeFile(wb, `GoogleSheet_DB_ManagementSurat_10Sheets_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('Export Database Google Sheet 10 Lembar Lengkap (Excel) berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh Excel database', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl lg:max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/50 rounded-xl">
              <FileSpreadsheet className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Sinkronisasi & Pengaturan Database Google Sheets</h2>
              <p className="text-xs sm:text-sm text-emerald-200">
                Penyimpanan Otomatis 10 Sheet Database Lengkap ke Google Spreadsheet Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-2 rounded-xl hover:bg-emerald-600/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1.5">
            <div className="font-bold flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Aplikasi terhubung ke Cloud & siap buat 10 sheet/kolom otomatis</span>
            </div>
            <p>
              Setiap penambahan, pengubahan, atau penghapusan record disinkronisasi ke 10 Sheet Google Sheet (Naskah Masuk, Naskah Keluar, Pemberkasan Thread, Klasifikasi Arsip, Unit Kerja, Instansi & Wilayah, Klasifikasi & Sub, Pengaturan Thread, Master Dropdown, dan Users).
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Link / URL Google Sheet Anda (Opsional)
              </label>
              <div className="relative">
                <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-1.5 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Google Sheet yang terhubung</span>
                </a>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Google Apps Script Webhook URL (Wajib untuk Auto-Sync)
                </label>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !webhookUrl}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : '🔍 Test & Diagnosa Webhook'}</span>
                </button>
              </div>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  isSpreadsheetUrlInWebhook
                    ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                }`}
              />

              {/* Warning jika salah memasukkan Spreadsheet Link di Webhook URL */}
              {isSpreadsheetUrlInWebhook && (
                <div className="mt-2 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Perhatian: Format URL Salah!</span>
                    <p className="mt-0.5 text-rose-800 text-[11px] leading-relaxed">
                      Anda memasukkan tautan Google Sheet biasa (<i>docs.google.com/spreadsheets/...</i>). Google Sheet tidak dapat menyimpan data baru secara otomatis dengan link spreadsheet biasa. Anda <b>wajib menggunakan URL Webhook Apps Script yang berakhiran <code>/exec</code></b> (lihat panduan salin script di bawah).
                    </p>
                  </div>
                </div>
              )}

              {/* Status Test Result */}
              {testResult && (
                <div
                  className={`mt-2 p-3 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in duration-200 ${
                    testResult.status === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : testResult.status === 'warning'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {testResult.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold">
                      {testResult.status === 'success'
                        ? 'Status Koneksi: Terhubung & Aktif'
                        : testResult.status === 'warning'
                        ? 'Status Koneksi: Perhatian'
                        : 'Status Koneksi: Gagal Terhubung'}
                    </span>
                    <p className="mt-0.5">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Terakhir disinkronkan: <span className="font-semibold text-slate-700">{googleSheetConfig.lastSyncedAt ? new Date(googleSheetConfig.lastSyncedAt).toLocaleString('id-ID') : 'Belum'}</span>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </form>

          <hr className="border-slate-200" />

          {/* Troubleshooting Guide Accordion */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="w-full py-2.5 px-3.5 bg-amber-50 hover:bg-amber-100/80 text-amber-950 font-bold rounded-xl text-xs flex items-center justify-between transition-all border border-amber-200"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>❓ Mengapa data di Google Sheet saya masih statis / tidak terupdate otomatis?</span>
              </div>
              {showTroubleshoot ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTroubleshoot && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2.5 animate-in fade-in duration-200">
                <p className="font-bold text-amber-900">4 Langkah Solusi Agar Data Tersimpan Otomatis ke Google Sheet:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-amber-900/90 pl-1">
                  <li>
                    <b>Pastikan Webhook URL terpasang (bukan link spreadsheet)</b>: Webhook URL harus berasal dari Apps Script dan berakhiran <code>/exec</code>.
                  </li>
                  <li>
                    <b>Izin Akses Deployment harus &quot;Siapa saja (Anyone)&quot;</b>: Saat membuat Deployment di Google Apps Script, pada opsi <i>&quot;Yang memiliki akses&quot; (Who has access)</i>, <b>WAJIB memilih &quot;Siapa saja&quot; (Anyone)</b>. Jika memilih &quot;Hanya saya&quot;, Google akan menolak setiap kiriman data baru dari aplikasi.
                  </li>
                  <li>
                    <b>Deploy Ulang (Versi Baru) jika baru mengubah Script</b>: Jika Anda baru saja menempelkan kode script baru, buka menu <i>Deploy → Manage deployments → Edit (ikon pensil) → Version: New version → Deploy</i>.
                  </li>
                  <li>
                    <b>Gunakan tombol &quot;Simpan ke Sheet&quot; atau &quot;Buat Kolom & Sheet Otomatis&quot;</b>: Tombol ini akan langsung mengirimkan seluruh data termutakhir yang ada di sistem saat ini ke Google Spreadsheet Anda secara instan.
                  </li>
                </ol>
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Quick Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Aksi Cepat Google Sheet DB:
              </h3>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium">
                Sistem Otomatis 10 Sheet DB
              </span>
            </div>

            {/* Tombol Setup Otomatis Database Sheet */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Buat / Perbarui Kolom & Sheet Baru Otomatis
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Klik tombol ini untuk secara otomatis membuat 10 Lembar Sheet, menyisipkan semua kolom & <b>Timestamp</b>, dan mengisi seluruh data awal ke Google Spreadsheet Anda!
                </p>
              </div>
              <button
                onClick={handleSetupDB}
                disabled={isSettingUp || !webhookUrl}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                title="Buat 10 Lembar Sheet & Kolom Baru Otomatis di Google Spreadsheet"
              >
                <Database className={`w-4 h-4 ${isSettingUp ? 'animate-bounce' : ''}`} />
                <span>{isSettingUp ? 'Membuat Kolom & Sheet...' : '✨ Buat Kolom & Sheet Otomatis'}</span>
              </button>
            </div>

            {/* Supabase Sync Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  Pindahkan / Salin Data ke Supabase Database
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Klik tombol di samping untuk menyalin seluruh data saat ini (termasuk dari Google Sheet) ke dalam tabel Supabase PostgreSQL secara instan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncSupabaseNow}
                disabled={isSupabaseSyncing}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                title="Pindahkan seluruh data ke Supabase PostgreSQL Database"
              >
                <Database className={`w-4 h-4 ${isSupabaseSyncing ? 'animate-spin' : ''}`} />
                <span>{isSupabaseSyncing ? 'Menyimpan ke Supabase...' : '⚡ Simpan ke Supabase DB'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handlePullDB}
                disabled={isPulling}
                className="py-3 px-3 bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-teal-300 disabled:opacity-60"
                title="Muat ulang seluruh data terbaru dari Google Sheet tanpa menimpa data di sheet"
              >
                <DownloadCloud className={`w-4 h-4 text-teal-700 ${isPulling ? 'animate-bounce' : ''}`} />
                <span>{isPulling ? 'Menarik...' : 'Reload dari Sheet'}</span>
              </button>

              <button
                onClick={handlePushDB}
                disabled={isSyncing}
                className="py-3 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-300 disabled:opacity-60"
                title="Kirim dan simpan data aplikasi saat ini ke Google Sheet"
              >
                <CloudUpload className={`w-4 h-4 text-emerald-700 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{isSyncing ? 'Menyimpan...' : 'Simpan ke Sheet'}</span>
              </button>

              <button
                onClick={handleExportWorkbook}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-emerald-300" />
                <span>Export 10 Sheet Excel</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Google Apps Script Webhook Tutorial & Script */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowScript(!showScript)}
              className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 font-bold rounded-xl text-xs flex items-center justify-between transition-all border border-emerald-200"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-700" />
                <span>Lihat & Salin Script Google Apps Script (Code.gs) Otomatis</span>
              </div>
              {showScript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showScript && (
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-3 text-xs border border-slate-700">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" /> Code.gs (Google Apps Script Versi 3.0)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed space-y-1">
                  <p className="font-bold text-emerald-300">📌 Cara Memasang di Google Sheet:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Buka Google Sheet Anda → klik menu <b>Ekstensi (Extensions)</b> → <b>Apps Script</b>.</li>
                    <li>Hapus semua kode bawaan, lalu <b>Tempel (Paste)</b> kode di bawah ini.</li>
                    <li>Klik <b>Simpan (Save)</b> → klik <b>Terapkan (Deploy)</b> → <b>Deployment baru</b>.</li>
                    <li>Pilih jenis <b>Aplikasi Web (Web app)</b> → Akses: <b>Siapa saja (Anyone)</b>.</li>
                    <li>Salin <b>URL Webhook</b> yang dihasilkan ke kolom Webhook di atas.</li>
                    <li>Klik tombol <b>✨ Buat Kolom & Sheet Otomatis</b> di atas untuk membuat 10 lembar sheet & semua kolom secara instan!</li>
                  </ol>
                </div>

                <pre className="p-3 bg-slate-950 rounded-lg overflow-x-auto max-h-60 font-mono text-[10px] text-emerald-300 border border-slate-800">
                  {APPS_SCRIPT_CODE}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
