# Bot Lua API Documentation

Welcome to the Lua API documentation for Dynamic Triggers. Use the functions below to create interactive and intelligent WhatsApp bots.

## Global Variables
These variables are directly available in your script:

| Variable | Type | Description |
| :--- | :--- | :--- |
| `msg` | `table` | **(New)** Complete message state. Includes `id`, `sender`, `chat_id`, `content`, `timestamp`, `is_group`. |
| `sender` | `string` | WhatsApp ID of the sender (JID). Example: `628xxx@s.whatsapp.net` |
| `content` | `string` | The complete message text sent by the user |
| `matches` | `table` | Regex capture results. `matches[1]` is the first group. |

### The `msg` Table
Provides detailed information about the current message:
- `msg.id`: Unique message ID.
- `msg.sender`: The JID of the person who sent the message.
- `msg.chat_id`: The JID of the chat (can be a Group JID or User JID).
- `msg.content`: The message text.
- `msg.timestamp`: Unix timestamp (seconds).
- `msg.is_group`: Boolean, true if the message is from a group.
- `msg.is_media`: Boolean, true if the message contains an image, video, sticker, or document.
- `msg.type`: The type of media (`"image"`, `"video"`, `"sticker"`, `"document"`, or `"text"`).

---

## Messaging Functions

### `send_text(target, text)`
Sends a plain text message to the target JID.
- **target**: Recipient JID (e.g., `msg.chat_id`).
- **text**: The message content.

### `send_sticker(target, url_or_path)`
Sends a sticker to the target. Supports both web URLs and local paths from `storage_path`.

### `send_media(target, url_or_path, [type], [caption])`
Sends a media file (image, video, document).
- **url_or_path**: Can be a web URL or a local system path.
- **type**: `"image"`, `"video"`, or `"document"`.
- **caption**: Optional companion text.

---

## Utility Functions

### `fetch(url, [options])`
Performs an HTTP request to an external API. Returns a table with `status` and `body`.

### `fetch_to_file(url, filename, [options])`
Fetches binary data (like images) and saves it directly to storage.
- **Returns**: Table with `status`, `path` (absolute), and `filename`.

### `download_media(filename)`
Downloads the media attached to the current message and saves it to storage.
- **filename**: Desired local filename.
- **Returns**: The absolute path to the saved file.

### `get_instagram_url(url)`
Extracts the direct media URL from an Instagram post/reel link.
- **Returns**: Direct URL string.

### `json_decode(json_string)`
Converts a JSON string into a Lua table.

### `json_encode(lua_table)`
Converts a Lua table into a JSON string.

---

## State Management
Used to store temporary conversation context.

### `set_state(jid, state_name)`
Saves a temporary state string for a specific user/chat.

### `get_state(jid)`
Retrieves the currently saved state for a user/chat.

---

## Storage and System

### `storage_save(filename, content)`
Saves text or binary string to a file in the bot's media folder.

### `storage_get(filename)`
Reads file content from storage.

### `storage_exists(filename)`
Checks if a file exists (returns boolean).

### `storage_delete(filename)`
Deletes a file from storage.

### `storage_path(filename)`
Gets the absolute system path for a file. **Protected against path traversal.**

### `ffmpeg(args_table)`
Executes FFmpeg commands directly.

### `ffprobe_json(args_table)`
Executes ffprobe and returns the metadata as a Lua Table.

### `yt_dlp(args_table)`
Executes yt-dlp for downloading from various sites (YouTube, TikTok, Tenor).

### `gallery_dl(args_table)`
Executes gallery-dl for image galleries (Pinterest, Instagram).

### `webpmux(args_table)`
Executes webpmux for manipulating WebP files.

### `whatsapp_exif(pack, author)`
Generates a binary EXIF string for WhatsApp stickers.

---

## Example Weather Bot
```lua
-- Pattern: ^!weather\s+(.*)
local city = matches[1]
-- This is a fictional API for demonstration
local res = fetch("https://api.example.com/weather/" .. city)

if res and res.status == 200 then
    local data = json_decode(res.body)
    send_text(msg.chat_id, "The weather in " .. city .. " is " .. data.current.temp .. "°C")
else
    send_text(msg.chat_id, "Failed to retrieve weather data.")
end
```
