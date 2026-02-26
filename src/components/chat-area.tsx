import { useState, useEffect, useRef, memo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Smile, Paperclip, FileText, Video, Sticker, Star, Trash2 } from "lucide-react"
import { api, type Chat, type Message } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react"
import { useTheme } from "@/components/theme-provider"

interface ChatAreaProps {
	chat: Chat | null
	incomingMessage?: { chatId: string; message: Message } | null
	statusUpdate?: { id: string; status: string } | null
	onBack?: () => void
	className?: string
}

const EmojiPickerComponent = memo(({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) => {
	const { theme } = useTheme()
	const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
	const [rendered, setRendered] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setRendered(true), 200)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className="h-[400px] w-full transform-gpu flex items-center justify-center bg-background">
			{!rendered ? (
				<div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
			) : (
				<EmojiPicker
					onEmojiClick={(emojiData) => onEmojiSelect(emojiData.emoji)}
					theme={isDark ? Theme.DARK : Theme.LIGHT}
					emojiStyle={EmojiStyle.NATIVE}
					lazyLoadEmojis={true}
					width="100%"
					height="100%"
					searchPlaceholder="Cari emoji..."
					previewConfig={{ showPreview: false }}
					skinTonesDisabled
				/>
			)}
		</div>
	)
})

EmojiPickerComponent.displayName = "EmojiPickerComponent"

const StickerPicker = memo(({ onStickerSelect }: { onStickerSelect: (sticker: any) => void }) => {
	const [stickers, setStickers] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [rendered, setRendered] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setRendered(true), 200)
		return () => clearTimeout(timer)
	}, [])

	const loadStickers = async () => {
		try {
			setLoading(true)
			const data = await api.getFavorites()
			setStickers(data)
		} catch (err) {
			console.error("Failed to load stickers:", err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (rendered) {
			loadStickers()
		}
	}, [rendered])

	const deleteSticker = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation()
		try {
			await api.deleteFavorite(id)
			toast.success("Sticker removed from favorites")
			loadStickers()
		} catch (err) {
			toast.error("Failed to remove sticker")
		}
	}

	return (
		<div className="h-[300px] w-full overflow-y-auto p-3 scrollbar-none flex items-center justify-center bg-background">
			{!rendered || (loading && stickers.length === 0) ? (
				<div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
			) : stickers.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
					<p className="text-sm">No favorite stickers found</p>
					<p className="text-[10px] text-center px-4">Click on a received sticker in chat to add it to your favorites.</p>
				</div>
			) : (
				<div className="grid grid-cols-4 gap-2 w-full content-start h-full">
					{stickers.map(sticker => (
						<div key={sticker.id} className="relative group/sticker-item">
							<button 
								onClick={() => onStickerSelect(sticker)} 
								className="aspect-square w-full flex items-center justify-center hover:bg-muted rounded-xl transition-all active:scale-95 group relative p-1"
							>
								<img 
									src={getMediaUrl(sticker.mediaUrl)} 
									alt="Sticker" 
									className="max-w-full max-h-full object-contain" 
								/>
							</button>
							<button 
								onClick={(e) => deleteSticker(e, sticker.id)}
								className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover/sticker-item:opacity-100 transition-opacity shadow-sm z-10"
							>
								<Trash2 className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
})

StickerPicker.displayName = "StickerPicker"

// Helper to get full media URL
const getMediaUrl = (url: string | undefined): string | undefined => {
	if (!url) return undefined
	if (url.startsWith("http://") || url.startsWith("https://")) return url

	// URL encode the filename part to handle special characters like @
	const parts = url.split("/")
	if (parts.length > 1) {
		const filename = parts.pop()!
		const path = parts.join("/")
		const encodedFilename = encodeURIComponent(filename)
		const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api"
		const fullUrl = `${API_BASE}${path}/${encodedFilename}`
		return fullUrl
	}

	const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api"
	return `${API_BASE}${url}`
}

// Get avatar URL
const getAvatarUrl = (chat: Chat): string | undefined => {
	if (chat.avatar && chat.avatar.length > 0 && !chat.avatar.startsWith("data:")) {
		return chat.avatar
	}
	if (chat.id.includes("@") || chat.id.match(/^\d+$/)) {
		const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api"
		return `${API_BASE}/avatar/${encodeURIComponent(chat.id)}`
	}
	return undefined
}

export function ChatArea({ chat, incomingMessage, statusUpdate, onBack, className }: ChatAreaProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [inputMessage, setInputMessage] = useState("")
	const [loading, setLoading] = useState(false)
	const [sending, setSending] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const mediaInputRef = useRef<HTMLInputElement>(null)
	const documentInputRef = useRef<HTMLInputElement>(null)
	const processedMessageIds = useRef<Set<string>>(new Set())
	const messageCache = useRef<Map<string, Message[]>>(new Map())
	const scrollCache = useRef<Map<string, number>>(new Map())
	const prevChatId = useRef<string | null>(null)
	const [initialLoad, setInitialLoad] = useState(true)
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [showFavoriteBtn, setShowFavoriteBtn] = useState<string | null>(null)

	// Listen for message status updates
	useEffect(() => {
		if (statusUpdate && chat) {
			setMessages(prev => {
				const updated = prev.map(msg => 
					msg.id === statusUpdate.id 
						? { ...msg, status: statusUpdate.status } 
						: msg
				)
				messageCache.current.set(chat.id, updated)
				return updated
			})
		}
	}, [statusUpdate, chat])

	// Save scroll position before chat changes
	useEffect(() => {
		if (prevChatId.current && scrollRef.current) {
			scrollCache.current.set(prevChatId.current, scrollRef.current.scrollTop)
		}
		
		if (chat) {
			const cached = messageCache.current.get(chat.id)
			if (cached && cached.length > 0) {
				setMessages(cached)
				setInitialLoad(false)
				
				// Restore scroll position after a short delay to allow DOM to update
				requestAnimationFrame(() => {
					if (scrollRef.current) {
						const savedPos = scrollCache.current.get(chat.id)
						if (savedPos !== undefined) {
							scrollRef.current.scrollTop = savedPos
						} else {
							scrollRef.current.scrollTop = scrollRef.current.scrollHeight
						}
					}
				})
			} else {
				setMessages([])
				setLoading(true)
				setInitialLoad(true)
			}
			loadMessages(chat.id)
			processedMessageIds.current = new Set()
			prevChatId.current = chat.id
		} else {
			setMessages([])
			prevChatId.current = null
		}
	}, [chat])

	// Listen for incoming WebSocket messages
	useEffect(() => {
		if (chat && incomingMessage && incomingMessage.chatId === chat.id) {
			const newMsg = incomingMessage.message
			
			// If already processed, ignore
			if (processedMessageIds.current.has(newMsg.id)) {
				return
			}
			
			setMessages(prev => {
				// If this is from "me" and we have a pending message with same content
				// Replace the temporary message with the real one (WhatsApp ID)
				const isMe = newMsg.from === "me"
				let updated = [...prev]
				
				if (isMe) {
					const pendingIndex = prev.findIndex(m => m.from === "me" && m.status === "pending" && m.content === newMsg.content);
					if (pendingIndex !== -1) {
						// Found the pending message, replace it
						updated[pendingIndex] = newMsg;
					} else {
						// Only add if not already in list
						if (!prev.some(m => m.id === newMsg.id)) {
							updated.push(newMsg);
						}
					}
				} else {
					// From others, just add if not already in list
					if (!prev.some(m => m.id === newMsg.id)) {
						updated.push(newMsg);
					}
				}
				
				messageCache.current.set(chat.id, updated)
				return updated
			})
			
			processedMessageIds.current.add(newMsg.id)
			
			// Scroll to bottom for new messages
			requestAnimationFrame(() => {
				if (scrollRef.current) {
					scrollRef.current.scrollTop = scrollRef.current.scrollHeight
				}
			})
		}
	}, [incomingMessage, chat])

	// Initial load or message batch update scroll
	useEffect(() => {
		if (messages.length > 0 && !loading && scrollRef.current) {
			const savedPos = chat ? scrollCache.current.get(chat.id) : undefined
			if (savedPos === undefined) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight
			}
		}
	}, [loading])

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp)
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		})
	}

	const groupMessagesByDate = (messages: Message[]) => {
		const groups: Record<string, Message[]> = {}
		for (const message of messages) {
			const date = new Date(message.timestamp)
			const dateKey = date.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
			})
			if (!groups[dateKey]) groups[dateKey] = []
			groups[dateKey].push(message)
		}
		return groups
	}

	const renderFormattedContent = (content: string) => {
		if (!content) return null

		// Split by newline to handle multiline
		const lines = content.split("\n")
		return lines.map((line, lineIdx) => {
			const elements: (string | React.ReactNode)[] = []

			// Patterns for WhatsApp formatting
			// *bold*, _italic_, ~strikethrough~, ```monospace```, `inline_code`
			const patterns = [
				{ pattern: /```([\s\S]*?)```/g, type: "monospace" },
				{ pattern: /`([^`]+)`/g, type: "monospace" },
				{ pattern: /\*([^*]+)\*/g, type: "bold" },
				{ pattern: /_([^_]+)_/g, type: "italic" },
				{ pattern: /~([^~]+)~/g, type: "strikethrough" },
			]

			const matches: { start: number; end: number; content: string; type: string }[] = []

			// Find all matches for all patterns
			patterns.forEach(({ pattern, type }) => {
				let match
				pattern.lastIndex = 0
				while ((match = pattern.exec(line)) !== null) {
					matches.push({
						start: match.index,
						end: pattern.lastIndex,
						content: match[1],
						type,
					})
				}
			})

			// Sort matches by start index
			matches.sort((a, b) => a.start - b.start)

			// Filter out overlapping matches (first come, first served)
			const filteredMatches: typeof matches = []
			let lastMatchEnd = 0
			matches.forEach(match => {
				if (match.start >= lastMatchEnd) {
					filteredMatches.push(match)
					lastMatchEnd = match.end
				}
			})

			// Build the elements array
			let currentIndex = 0
			filteredMatches.forEach((match, idx) => {
				// Add text before match
				if (match.start > currentIndex) {
					elements.push(line.substring(currentIndex, match.start))
				}

				// Add formatted element
				switch (match.type) {
					case "bold":
						elements.push(<strong key={`${lineIdx}-${idx}`} className="font-bold">{match.content}</strong>)
						break
					case "italic":
						elements.push(<em key={`${lineIdx}-${idx}`} className="italic">{match.content}</em>)
						break
					case "strikethrough":
						elements.push(<del key={`${lineIdx}-${idx}`} className="line-through">{match.content}</del>)
						break
					case "monospace":
						elements.push(<code key={`${lineIdx}-${idx}`} className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded text-[0.9em]">{match.content}</code>)
						break
				}
				currentIndex = match.end
			})

			// Add remaining text
			if (currentIndex < line.length) {
				elements.push(line.substring(currentIndex))
			}

			return (
				<div key={lineIdx} className="min-h-[1.2em]">
					{elements.length > 0 ? elements : " "}
				</div>
			)
		})
	}

	const loadMessages = async (chatId: string) => {
		try {
			const data = await api.getMessages(chatId)
			const messagesData = data || []
			messageCache.current.set(chatId, messagesData)
			setMessages(messagesData)
			setInitialLoad(false)
		} catch (error) {
			console.error("Failed to load messages:", error)
			setMessages([])
		} finally {
			setLoading(false)
		}
	}

	const handleSendMessage = async () => {
		if (!inputMessage.trim() || !chat || sending) return
		const tempId = `temp-${Date.now()}`
		const tempMessage: Message = {
			id: tempId, chatId: chat.id, from: "me", to: chat.id,
			content: inputMessage, timestamp: Date.now(), status: "pending", type: "text",
		}
		setMessages(prev => {
			const updated = [...prev, tempMessage]
			messageCache.current.set(chat.id, updated)
			return updated
		})
		const messageToSend = inputMessage
		setInputMessage("")
		setSending(true)
		try {
			await api.sendMessage(chat.id, messageToSend)
			// WebSocket will broadcast the new_message with the real WhatsApp ID
			// We don't need a full loadMessages here.
		} catch (error) {
			console.error("Failed to send message:", error)
			setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: "failed" } : msg))
		} finally {
			setSending(false)
		}
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, forceType?: "document") => {
		const file = e.target.files?.[0]
		if (!file || !chat || sending) return
		
		setSending(true)
		const tempId = `temp-${Date.now()}`
		
		let mediaType: "image" | "video" | "document" = forceType || "document"
		if (!forceType) {
			if (file.type.startsWith("image/")) mediaType = "image"
			else if (file.type.startsWith("video/")) mediaType = "video"
		}

		// Create temporary message for loading state
		const tempMessage: Message = {
			id: tempId,
			chatId: chat.id,
			from: "me",
			to: chat.id,
			content: `Sending ${mediaType}...`,
			timestamp: Date.now(),
			status: "pending",
			type: mediaType,
		}

		setMessages((prev) => {
			const updated = [...prev, tempMessage]
			messageCache.current.set(chat.id, updated)
			return updated
		})
		
		try {
			await api.sendMedia(chat.id, file, mediaType)
			// Let loadMessages handle the replacement with actual message from DB
			setTimeout(async () => await loadMessages(chat.id), 500)
		} catch (error) {
			console.error("Failed to send media:", error)
			setMessages((prev) => {
				const updated = prev.map((msg) =>
					msg.id === tempId ? { ...msg, status: "failed" } : msg
				)
				messageCache.current.set(chat.id, updated)
				return updated
			})
		} finally {
			setSending(false)
			if (e.target) e.target.value = ""
		}
	}

	const addEmoji = useCallback((emoji: string) => setInputMessage(prev => prev + emoji), [])

	const handleFavoriteSticker = async (messageId: string, mediaUrl: string, isAnimated: boolean) => {
		try {
			await api.favoriteSticker(messageId, mediaUrl, isAnimated)
			toast.success("Sticker added to favorites")
		} catch (err) {
			toast.error("Failed to add sticker to favorites")
		}
	}

	const handleStickerSelect = useCallback(async (sticker: any) => {
		if (!chat || sending) return
		setSending(true)
		try {
			await api.sendSticker(chat.id, sticker.mediaUrl, sticker.isAnimated)
			// Trigger a reload of messages to see the sent sticker
			setTimeout(async () => await loadMessages(chat.id), 500)
		} catch (error) {
			console.error("Failed to send sticker:", error)
			toast.error("Failed to send sticker")
		} finally {
			setSending(false)
		}
	}, [chat, sending])

	if (!chat) return null
	const groupedMessages = groupMessagesByDate(messages)

	return (
		<div className={cn("flex flex-col h-full bg-background overflow-hidden relative", className)}>
			<input 
				type="file" 
				className="hidden" 
				ref={mediaInputRef} 
				accept="image/*,video/*"
				onChange={(e) => handleFileChange(e)} 
			/>
			<input 
				type="file" 
				className="hidden" 
				ref={documentInputRef} 
				onChange={(e) => handleFileChange(e, "document")} 
			/>
			<div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0" />
			
			<header className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-xl z-10 sticky top-0">
				<div className="flex items-center gap-4">
					{onBack && (
						<Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 rounded-full">
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</Button>
					)}
					<div className="relative group">
						<Avatar className="h-11 w-11 ring-2 ring-primary/10 transition-transform group-hover:scale-105">
							<AvatarImage src={getAvatarUrl(chat)} />
							<AvatarFallback className="bg-primary/10 text-primary font-bold">
								{chat.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
					</div>
					<div className="flex flex-col">
						<h3 className="font-bold text-base leading-tight tracking-tight">{chat.name}</h3>
						<div className="flex items-center gap-1.5 mt-0.5">
							<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
							<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Online</p>
						</div>
					</div>
				</div>
			</header>

			<div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 z-10" ref={scrollRef}>
				{initialLoad && loading ? (
					<div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-40">
						<div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
						<p className="text-sm font-medium tracking-tight">Loading secure conversation...</p>
					</div>
				) : (
					<div className="space-y-10">
						{Object.entries(groupedMessages).map(([dateKey, msgs]) => (
							<div key={dateKey} className="space-y-4">
								<div className="flex justify-center sticky top-2 z-20 pointer-events-none">
									<span className="text-[10px] font-bold text-muted-foreground/80 bg-background/60 backdrop-blur-md px-3 py-1 rounded-full border border-border/40 uppercase tracking-widest shadow-sm">
										{dateKey}
									</span>
								</div>
								{msgs.map((message, idx) => {
									const isMe = message.from === "me"
									const isPending = message.status === "pending"
									const isFailed = message.status === "failed"
									const isImage = message.type === "image"
									const isVideo = message.type === "video"
									const isSticker = message.type === "sticker"
									const isDocument = message.type === "document"
									const isMedia = message.mediaUrl && message.mediaUrl.length > 0
									const nextMsg = msgs[idx + 1]
									const isLastInSequence = !nextMsg || nextMsg.from !== message.from

									return (
										<div key={message.id} className={cn(
											"flex w-full group animate-in fade-in slide-in-from-bottom-2 duration-300", 
											isMe ? "justify-end" : "justify-start", 
											isLastInSequence ? "mb-4" : "mb-1"
										)}>
											<div className={cn(
												"max-w-[85%] sm:max-w-[70%] flex flex-col relative", 
												isMe ? "items-end" : "items-start"
											)}>
												{message.isAutomatic && (
													<span className={cn(
														"text-[10px] font-bold mb-1 px-1 uppercase tracking-widest flex items-center gap-1",
														isMe ? "text-indigo-500 dark:text-indigo-400" : "text-blue-500"
													)}>
														<span className={cn("w-1 h-1 rounded-full", isMe ? "bg-indigo-500 dark:bg-indigo-400" : "bg-blue-500")} />
														Bot Response
													</span>
												)}
												
												{isSticker ? (
													<div 
														className="relative group/sticker cursor-pointer"
														onClick={() => setShowFavoriteBtn(showFavoriteBtn === message.id ? null : message.id)}
													>
														<div className="w-[160px] h-[160px] flex items-center justify-center">
															{isMedia ? (
																<img 
																	src={getMediaUrl(message.mediaUrl)} 
																	alt="Sticker" 
																	className="max-w-full max-h-full object-contain" 
																/>
															) : (
																<div className="w-full h-full bg-muted rounded-xl flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest">
																	Sticker
																</div>
															)}
														</div>
														{showFavoriteBtn === message.id && (
															<button 
																onClick={(e) => {
																	e.stopPropagation();
																	handleFavoriteSticker(message.id, message.mediaUrl || "", false);
																}}
																className={cn(
																	"absolute top-0 p-1.5 bg-background/90 backdrop-blur-md rounded-full shadow-lg transition-all animate-in zoom-in-50 z-10",
																	isMe ? "left-0" : "right-0"
																)}
																title="Add to Favorites"
															>
																<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
															</button>
														)}
														<div className={cn(
															"absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-[10px] text-white opacity-0 group-hover/sticker:opacity-100 transition-opacity",
															isMe ? "right-1" : "left-1"
														)}>
															{formatTime(message.timestamp)}
														</div>
													</div>
												) : (
													<div
														className={cn(
															"px-3.5 py-2 rounded-2xl text-[14.5px] relative transition-all duration-200 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]",
															isMe
																? cn(
																	// Me (Standard) - WhatsApp Green
																	"bg-[#dcf8c6] dark:bg-[#005c4b] text-[#303030] dark:text-[#e9edef]",
																	// Me (Automatic) - Purple/Indigo theme
																	message.isAutomatic && "bg-[#e8eaff] dark:bg-[#2e334d]",
																	isLastInSequence ? "rounded-tr-none" : "",
																	isPending && "opacity-70",
																	isFailed && "bg-destructive text-destructive-foreground"
																)
																: cn(
																	// Other - White/Dark Gray
																	"bg-white dark:bg-[#202c33] text-[#303030] dark:text-[#e9edef]",
																	// Bot response from other - Indigo theme
																	message.isAutomatic && "bg-[#eef2ff] dark:bg-[#1e2235] border-l-[3px] border-indigo-500 dark:border-indigo-400",
																	isLastInSequence ? "rounded-tl-none" : ""
																)
														)}
													>
														{isImage && isMedia && (
															<div className="mb-2 -mx-1 -mt-1 rounded-lg overflow-hidden border border-black/5 dark:border-white/5">
																<img src={getMediaUrl(message.mediaUrl)} alt="Image" className="w-full max-w-[320px] h-auto object-cover hover:scale-[1.02] transition-transform duration-500 cursor-zoom-in" />
															</div>
														)}
														{isVideo && isMedia && (
															<div className="mb-2 -mx-1 -mt-1 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-black/10 flex items-center justify-center aspect-video">
																<video src={getMediaUrl(message.mediaUrl)} className="w-full h-auto max-h-[300px]" controls />
															</div>
														)}
														{isDocument && isMedia && (
															<a href={getMediaUrl(message.mediaUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 mb-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
																<div className="w-9 h-9 bg-primary/10 rounded flex items-center justify-center">
																	<FileText className="h-5 w-5 text-primary" />
																</div>
																<div className="flex-1 min-w-0">
																	<p className="text-xs font-bold truncate">Document</p>
																	<p className="text-[10px] opacity-60">PDF • View</p>
																</div>
															</a>
														)}
														{message.content && !["[Image]", "[Video]", "[Sticker]"].includes(message.content) && (
															<div className="break-words leading-relaxed whitespace-pre-wrap">
																{renderFormattedContent(message.content)}
															</div>
														)}
														<div className={cn(
															"flex items-center gap-1 mt-1 justify-end", 
															"text-[10px] font-medium opacity-50 uppercase tracking-tight"
														)}>
															<span>{formatTime(message.timestamp)}</span>
															{isMe && (
																<span className="flex items-center ml-0.5">
																	{isPending ? (
																		<div className="w-2.5 h-2.5 border border-current/30 border-t-current rounded-full animate-spin" />
																	) : isFailed ? "!" : (
																		<div className="flex items-center">
																			{message.status === "sent" ? (
																				// Single Tick
																				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
																					<path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
																				</svg>
																			) : (
																				// Double Tick
																				<div className="relative flex items-center">
																					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(message.status === "read" ? "text-[#53bdeb]" : "text-current opacity-70")}>
																						<path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
																					</svg>
																					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("absolute left-[4px]", message.status === "read" ? "text-[#53bdeb]" : "text-current opacity-70")}>
																						<path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
																					</svg>
																				</div>
																			)}
																		</div>
																	)}
																</span>
															)}
														</div>
													</div>
												)}
											</div>
										</div>
									)
								})}
							</div>
						))}
					</div>
				)}
			</div>

			<footer className="p-4 bg-background/80 backdrop-blur-xl border-t border-border/40 z-10">
				<div className="max-w-4xl mx-auto flex items-end gap-3 px-2">
					<div className="flex items-center mb-1">
						<Popover onOpenChange={setIsEmojiOpen}>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
									<Smile className="h-5 w-5" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[400px] p-0 overflow-hidden shadow-2xl border-border/50 animate-in fade-in zoom-in-95 duration-200 transform-gpu data-[state=closed]:duration-0 data-[state=closed]:animate-none" align="start" side="top">
								{isEmojiOpen && <EmojiPickerComponent onEmojiSelect={addEmoji} />}
							</PopoverContent>
						</Popover>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
									<Sticker className="h-5 w-5" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[400px] p-0 overflow-hidden shadow-2xl border-border/50 animate-in fade-in zoom-in-95 duration-200 transform-gpu" align="start" side="top">
								<StickerPicker onStickerSelect={handleStickerSelect} />
							</PopoverContent>
						</Popover>
						
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
									<Paperclip className="h-5 w-5" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[200px] p-1" align="start" side="top">
								<div className="flex flex-col">
									<button 
										onClick={() => mediaInputRef.current?.click()}
										className="flex items-center gap-3 w-full p-2.5 hover:bg-muted rounded-lg text-sm transition-colors"
									>
										<div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-600">
											<Video className="h-4 w-4" />
										</div>
										<span className="font-medium">Photos & Videos</span>
									</button>
									<button 
										onClick={() => documentInputRef.current?.click()}
										className="flex items-center gap-3 w-full p-2.5 hover:bg-muted rounded-lg text-sm transition-colors"
									>
										<div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
											<FileText className="h-4 w-4" />
										</div>
										<span className="font-medium">Document</span>
									</button>
								</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex-1 relative">
						<Input
							placeholder="Type a message..."
							value={inputMessage}
							onChange={e => setInputMessage(e.target.value)}
							onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
							className="pr-12 min-h-[44px] bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-2xl py-3"
							disabled={sending}
						/>
						<Button size="icon" onClick={handleSendMessage} disabled={!inputMessage.trim() || sending} className={cn("absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl transition-all duration-300", inputMessage.trim() ? "bg-primary text-primary-foreground scale-100 shadow-md" : "bg-transparent text-muted-foreground scale-90")}>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</footer>
		</div>
	)
}
