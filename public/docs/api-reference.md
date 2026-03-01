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

---

## Messaging Functions

### `send_text(target, text)`
Sends a plain text message to the target JID.
- **target**: Recipient JID (e.g., `msg.chat_id`).
- **text**: The message content.

### `send_sticker(target, url)`
Fetches an image from a URL and sends it as a sticker.

### `send_media(target, url_or_path, [type], [caption])`
Sends a media file (image, video, document).
- **url_or_path**: Can be a web URL or a local system path (use `storage_path`).
- **type**: `"image"`, `"video"`, or `"document"`.
- **caption**: Optional companion text.

---

## Utility Functions

### `fetch(url, [options])`
Performs an HTTP request to an external API. Returns a table with `status` and `body`.

### `fetch_to_file(url, filename, [options])`
** (New) ** Fetches binary data (like images) and saves it directly to storage.
- **Returns**: Table with `status`, `path` (absolute), and `filename`.
- Useful for handling large files or binary media without loading them into memory.

### `gemini_chat(prompt, [model])`
Sends a prompt to Google Gemini AI.
- **prompt**: Instruction or question text.
- **model**: (Optional) Gemini model name. Default: `"gemini-2.0-flash"`.
- **Returns**: AI's response string.

### `json_decode(json_string)`
Converts a JSON string into a Lua table.

### `json_encode(lua_table)`
Converts a Lua table into a JSON string.

```lua
-- Example: Fetching a random image and sending it
local res = fetch_to_file("https://picsum.photos/400", "temp.jpg")
if res and res.status == 200 then
    send_media(msg.chat_id, res.path, "image", "Here is your image!")
    storage_delete("temp.jpg") -- Clean up
end
```

---

## State Management
Used to store temporary conversation context.

### `set_state(jid, state_name)`
### `get_state(jid)`

---

## Storage and System

### `storage_save(filename, content)`
Saves text to a file in the bot's media folder.

### `storage_get(filename)`
Reads file content.

### `storage_exists(filename)`
Checks if a file exists (returns boolean).

### `storage_delete(filename)`
Deletes a file from storage.

### `storage_path(filename)`
Gets the absolute system path for a file. **Protected against path traversal.**

### `ffmpeg(args_table)`
Executes FFmpeg commands directly.

```lua
-- Example: Convert Video to WebP Sticker
ffmpeg({
    "-i", storage_path("input.mp4"),
    "-vf", "scale=512:512",
    "-y", storage_path("output.webp")
})
```

---

## Example Weather Bot
```lua
-- Regex: ^!weather\s+(.*)
local city = matches[1]
local res = fetch("https://api.weather.com/v1/" .. city)

if res.status == 200 then
    send_text(msg.chat_id, "The weather in " .. city .. " is currently sunny!")
else
    send_text(msg.chat_id, "Failed to retrieve weather data.")
end
```
