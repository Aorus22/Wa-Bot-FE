# Bot Lua API Documentation

Selamat datang di dokumentasi API Lua untuk Dynamic Triggers. Gunakan fungsi-fungsi di bawah ini untuk membuat bot WhatsApp yang interaktif dan cerdas.

## Global Variables
Variabel ini tersedia langsung dalam script Anda:

| Variable | Type | Description |
| :--- | :--- | :--- |
| `sender` | `string` | ID WhatsApp pengirim (JID). Contoh: `628xxx@s.whatsapp.net` |
| `content` | `string` | Isi pesan lengkap yang dikirim user |
| `matches` | `table` | Tabel hasil tangkapan Regex. `matches[1]` adalah grup pertama. |

---

## Messaging Functions

### `send_text(target, text)`
Mengirim pesan teks biasa ke target JID.
- **target**: JID penerima.
- **text**: Pesan yang ingin dikirim.

### `send_sticker(target, url)`
Mengambil gambar dari URL dan mengirimnya sebagai sticker.

### `send_media(target, url, [type], [caption])`
Mengirim file media (gambar, video, dokumen).
- **type**: `"image"`, `"video"`, atau `"document"`.
- **caption**: Teks pendamping (opsional).

---

## Utility Functions

### `fetch(url, [options])`
Melakukan HTTP request ke API eksternal.

### `gemini_chat(prompt, [model])`
Mengirim prompt ke Google Gemini AI.
- **prompt**: Teks pertanyaan atau instruksi.
- **model**: (Optional) Nama model Gemini. Default: `"gemini-2.0-flash"`.
- **Returns**: String jawaban dari AI (atau nil + error jika gagal).

### `json_decode(json_string)`
Mengubah string JSON menjadi Lua table.
- **Returns**: Table (atau nil + error jika gagal).

### `json_encode(lua_table)`
Mengubah Lua table menjadi string JSON.
- **Returns**: String (atau nil + error jika gagal).

```lua
local res = fetch("https://api.example.com/data", {
    method = "POST",
    headers = { ["Content-Type"] = "application/json" },
    body = '{"key": "value"}'
})

if res.status == 200 then
    print("Response: " .. res.body)
end
```

---

## State Management
Digunakan untuk menyimpan konteks percakapan sementara agar bot tahu user sedang di tahap apa.

### `set_state(jid, state_name)`
### `get_state(jid)`

---

## Storage and System

### `storage_save(filename, content)`
Menyimpan teks ke dalam file di folder media bot.

### `storage_get(filename)`
Membaca isi file.

### `storage_exists(filename)`
Mengecek keberadaan file. Returns boolean.

### `storage_path(filename)`
Mendapatkan absolute system path untuk file tersebut. Sangat berguna untuk argumen FFmpeg.

### `ffmpeg(args_table)`
Menjalankan perintah FFmpeg secara langsung.

```lua
-- Contoh Convert Video ke Sticker WebP
ffmpeg({
    "-i", storage_path("input.mp4"),
    "-vf", "scale=512:512",
    "-y", storage_path("output.webp")
})
```

---

## Example Weather Bot
```lua
-- Regex: ^!cuaca\s+(.*)
local city = matches[1]
local res = fetch("https://api.weather.com/v1/" .. city)

if res.status == 200 then
    send_text(sender, "Cuaca di " .. city .. " saat ini sangat cerah!")
else
    send_text(sender, "Gagal mengambil data cuaca.")
end
```
