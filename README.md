# 📱 Companion App

Aplikasi Flutter untuk **Companion Mode** - fitur live preview yang menampilkan hasil koding secara real-time pada perangkat mobile.

## ✨ Fitur Utama

- 🔗 **Pairing dengan Kode 6 Karakter** - Hubungkan dengan Web IDE secara mudah
- ⚡ **Real-time Preview** - Lihat hasil koding dalam ~300ms
- 🎨 **Dynamic Widget Rendering** - Render widget Flutter dari JSON
- 🔄 **Auto-reconnect** - Koneksi otomatis pulih jika terputus

## 🏗️ Arsitektur

```
lib/
├── main.dart                    # Entry point & theme
├── screens/
│   ├── pairing_screen.dart      # Input kode pairing
│   └── preview_screen.dart      # Live widget preview
└── services/
    ├── socket_service.dart      # WebSocket connection
    └── widget_renderer.dart     # JSON → Widget converter
```

## 🚀 Cara Menjalankan

### Prasyarat
- Flutter SDK 3.0+
- Android Emulator atau perangkat fisik
- Backend server sudah berjalan di `localhost:3001`

### Langkah-langkah

```bash
# 1. Install dependencies
flutter pub get

# 2. Jalankan di emulator/device
flutter run
```

### Koneksi ke Server

| Platform | Server URL |
|----------|------------|
| Android Emulator | `http://10.0.2.2:3001` (default) |
| iOS Simulator | `http://localhost:3001` |
| Physical Device | `http://<IP_KOMPUTER>:3001` |

> **Tips:** Untuk physical device, pastikan komputer dan HP dalam jaringan WiFi yang sama.

## 📋 Widget yang Didukung

| Widget | Properties |
|--------|-----------|
| `Text` | `data`, `style` (fontSize, fontWeight, color, fontStyle) |
| `Container` | `width`, `height`, `padding`, `margin`, `decoration`, `child` |
| `Center` | `child` |
| `Column` | `mainAxisAlignment`, `crossAxisAlignment`, `children` |
| `Row` | `mainAxisAlignment`, `crossAxisAlignment`, `children` |
| `SizedBox` | `width`, `height`, `child` |
| `Card` | `color`, `elevation`, `child` |
| `Padding` | `padding`, `child` |
| `Icon` | `icon`, `size`, `color` |

## 📝 Contoh JSON Widget

### Text Sederhana
```json
{
  "type": "Text",
  "data": "Hello, World!",
  "style": {
    "fontSize": 24,
    "fontWeight": "bold",
    "color": "#6366F1"
  }
}
```

### Layout Column
```json
{
  "type": "Center",
  "child": {
    "type": "Column",
    "mainAxisAlignment": "center",
    "children": [
      {
        "type": "Icon",
        "icon": "star",
        "size": 48,
        "color": "#F59E0B"
      },
      {
        "type": "SizedBox",
        "height": 16
      },
      {
        "type": "Text",
        "data": "Selamat Datang!",
        "style": {
          "fontSize": 20,
          "fontWeight": "w600"
        }
      }
    ]
  }
}
```

## 🔧 Konfigurasi

### Mengubah Server URL

Edit `lib/services/socket_service.dart`:

```dart
String _serverUrl = 'http://YOUR_SERVER_IP:3001';
```

## 📦 Dependencies

| Package | Fungsi |
|---------|--------|
| `socket_io_client` | WebSocket client untuk real-time sync |
| `provider` | State management |
| `cupertino_icons` | Icon pack |

## 🔄 Alur Kerja

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│   Web IDE   │───▶│ WebSocket    │───▶│ Companion App  │
│  (Desktop)  │    │   Server     │    │    (Mobile)    │
└─────────────┘    └──────────────┘    └────────────────┘
     │                   │                     │
     │ 1. Create Session │                     │
     │──────────────────▶│                     │
     │                   │                     │
     │   Code: ABC123    │                     │
     │◀──────────────────│                     │
     │                   │                     │
     │                   │ 2. Join Session     │
     │                   │◀────────────────────│
     │                   │                     │
     │ 3. Type Code      │                     │
     │──────────────────▶│                     │
     │                   │                     │
     │                   │ 4. Broadcast Code   │
     │                   │────────────────────▶│
     │                   │                     │
     │                   │                     │ 5. Render Widget
     │                   │                     │─────────────────▶
```

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak bisa connect | Pastikan server berjalan dan URL benar |
| Widget tidak muncul | Periksa format JSON valid |
| Connection lost | Tekan tombol Reconnect |

## 📄 Lisensi

Dikembangkan untuk kebutuhan edu-tech platform.

---

**Bagian dari Companion Mode** - Fitur live preview untuk platform pembelajaran mobile development.
