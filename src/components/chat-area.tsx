import { useState, useEffect, useRef, memo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Smile, Paperclip, FileText, Video, Sticker, Star, Trash2, ArrowLeft, MessageSquare } from "lucide-react"
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
					searchPlaceholder="Search emojis..."
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

const getApiBase = () => {
	const envUrl = import.meta.env.VITE_API_URL
	if (envUrl) return envUrl
	return typeof window !== "undefined" ? `${window.location.origin}/api` : ""
}

const getMediaUrl = (url: string | undefined): string | undefined => {
	if (!url) return undefined
	if (url.startsWith("http://") || url.startsWith("https://")) return url

	const apiBase = getApiBase()
	const parts = url.split("/")
	if (parts.length > 1) {
		const filename = parts.pop()!
		const path = parts.join("/")
		const encodedFilename = encodeURIComponent(filename)
		const fullUrl = `${apiBase}${path}/${encodedFilename}`
		return fullUrl
	}

	return `${apiBase}${url}`
}

const getAvatarUrl = (target: Chat | string): string | undefined => {
	const apiBase = getApiBase()

	if (typeof target !== "string") {
		if (target.avatar && target.avatar.length > 0 && !target.avatar.startsWith("data:")) {
			return target.avatar
		}
		return `${apiBase}/avatar/${encodeURIComponent(target.id)}`
	}

	return `${apiBase}/avatar/${encodeURIComponent(target)}`
}

const formatTime = (timestamp: number) => {
	return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatDate = (timestamp: number) => {
	const date = new Date(timestamp)
	const today = new Date()
	const yesterday = new Date()
	yesterday.setDate(today.getDate() - 1)

	if (date.toDateString() === today.toDateString()) return "Today"
	if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

	return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
}

const renderFormattedContent = (content: string) => {
	if (!content) return null

	// Replace *bold* with <strong>
	// Replace _italic_ with <em>
	// Replace ~strikethrough~ with <del>
	// Replace `code` with <code>

	const parts = content.split(/(\*.*?\*|_.*?_|~.*?~|`.*?`|\n)/g)

	return parts.map((part, index) => {
		if (part.startsWith("*") && part.endsWith("*")) {
			return <strong key={index}>{part.slice(1, -1)}</strong>
		}
		if (part.startsWith("_") && part.endsWith("_")) {
			return <em key={index}>{part.slice(1, -1)}</em>
		}
		if (part.startsWith("~") && part.endsWith("~")) {
			return <del key={index}>{part.slice(1, -1)}</del>
		}
		if (part.startsWith("`") && part.endsWith("`")) {
			return <code key={index} className="bg-muted px-1 rounded">{part.slice(1, -1)}</code>
		}
		if (part === "\n") {
			return <br key={index} />
		}
		return part
	})
}

export function ChatArea({ chat, incomingMessage, statusUpdate, onBack, className }: ChatAreaProps) {
	const [messages, setMessages] = useState<Message[]>([])
	const [inputMessage, setInputMessage] = useState("")
	const [loading, setLoading] = useState(false)
	const [sending, setSending] = useState(false)
	const [initialLoad, setInitialLoad] = useState(true)
	const [isEmojiOpen, setIsEmojiOpen] = useState(false)
	const [showFavoriteBtn, setShowFavoriteBtn] = useState<string | null>(null)

	const scrollRef = useRef<HTMLDivElement>(null)
	const mediaInputRef = useRef<HTMLInputElement>(null)
	const documentInputRef = useRef<HTMLInputElement>(null)

	const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
		if (scrollRef.current) {
			const { scrollHeight, clientHeight } = scrollRef.current
			scrollRef.current.scrollTo({
				top: scrollHeight - clientHeight,
				behavior
			})
		}
	}, [])

	useEffect(() => {
		if (chat) {
			loadMessages()
		} else {
			setMessages([])
			setInitialLoad(true)
		}
	}, [chat?.id])

	useEffect(() => {
	        if (incomingMessage && chat && incomingMessage.chatId === chat.id) {
	                setMessages(prev => {
	                        // 1. Check if ID already exists
	                        if (prev.some(m => m.id === incomingMessage.message.id)) return prev

	                        // 2. Check if this is a message we're sending (from "me")
	                        // that matches one of our pending messages
	                        if (incomingMessage.message.from === "me") {
	                                // Try to find a pending message with same content or type
	                                const pendingIndex = prev.findIndex(m =>
	                                        m.status === "pending" &&
	                                        m.id.startsWith("temp-") &&
	                                        (
	                                                m.content === incomingMessage.message.content ||
	                                                (m.type === incomingMessage.message.type && ["image", "video", "sticker", "document"].includes(m.type))
	                                        )
	                                )

	                                if (pendingIndex !== -1) {
	                                        // Replace the pending message
	                                        const next = [...prev]
	                                        next[pendingIndex] = incomingMessage.message
	                                        return next
	                                }
	                        }

	                        return [...prev, incomingMessage.message]
	                })
	                setTimeout(() => scrollToBottom(), 100)
	        }
	}, [incomingMessage, chat?.id, scrollToBottom])
	useEffect(() => {
		if (statusUpdate) {
			setMessages(prev =>
				prev.map(m =>
					m.id === statusUpdate.id ? { ...m, status: statusUpdate.status } : m
				)
			)
		}
	}, [statusUpdate])

	const loadMessages = async () => {
		if (!chat) return
		try {
			setLoading(true)
			const data = await api.getMessages(chat.id)
			setMessages(data || [])
			setInitialLoad(false)
			setTimeout(() => scrollToBottom("auto"), 50)
		} catch (error) {
			console.error("Failed to load messages:", error)
			toast.error("Failed to load conversation")
		} finally {
			setLoading(false)
		}
	}

	const handleSendMessage = async () => {
		if (!inputMessage.trim() || !chat || sending) return

		const tempId = "temp-" + Date.now()
		const newMsg: Message = {
			id: tempId,
			chatId: chat.id,
			from: "me",
			to: chat.id,
			content: inputMessage,
			timestamp: Date.now(),
			status: "pending",
			type: "text"
		}

		setMessages(prev => [...prev, newMsg])
		setInputMessage("")
		setTimeout(() => scrollToBottom(), 50)

		try {
			setSending(true)
			const res = await api.sendMessage(chat.id, inputMessage)
			setMessages(prev => {
				// If the message was already added/updated by socket
				if (prev.some(m => m.id === res.id)) {
					return prev.filter(m => m.id !== tempId)
				}
				return prev.map(m => (m.id === tempId ? { ...m, id: res.id, status: "sent" } : m))
			})
		} catch (error) {
			console.error("Failed to send message:", error)
			setMessages(prev =>
				prev.map(m => (m.id === tempId ? { ...m, status: "failed" } : m))
			)
			toast.error("Message failed to send")
		} finally {
			setSending(false)
		}
	}

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "document") => {
		const file = e.target.files?.[0]
		if (!file || !chat) return

		const tempId = "temp-media-" + Date.now()
		const newMsg: Message = {
			id: tempId,
			chatId: chat.id,
			from: "me",
			to: chat.id,
			content: type === "image" ? "[Image]" : type === "video" ? "[Video]" : "[Document]",
			timestamp: Date.now(),
			status: "pending",
			type: type,
			mediaUrl: URL.createObjectURL(file)
		}

		setMessages(prev => [...prev, newMsg])
		setTimeout(() => scrollToBottom(), 50)

		try {
			const res = await api.sendMedia(chat.id, file, type, "")
			setMessages(prev => {
				if (prev.some(m => m.id === res.id)) {
					return prev.filter(m => m.id !== tempId)
				}
				return prev.map(m => (m.id === tempId ? { ...m, id: res.id, status: "sent" } : m))
			})
		} catch (error) {
			console.error("Failed to send media:", error)
			setMessages(prev =>
				prev.map(m => (m.id === tempId ? { ...m, status: "failed" } : m))
			)
			toast.error("Failed to send file")
		} finally {
			if (e.target) e.target.value = ""
		}
	}

	const handleStickerSelect = async (sticker: any) => {
		if (!chat) return

		const tempId = "temp-sticker-" + Date.now()
		const newMsg: Message = {
			id: tempId,
			chatId: chat.id,
			from: "me",
			to: chat.id,
			content: "[Sticker]",
			timestamp: Date.now(),
			status: "pending",
			type: "sticker",
			mediaUrl: sticker.mediaUrl
		}

		setMessages(prev => [...prev, newMsg])
		setTimeout(() => scrollToBottom(), 50)

		try {
			const res = await api.sendSticker(chat.id, sticker.mediaUrl, sticker.isAnimated)
			setMessages(prev => {
				if (prev.some(m => m.id === res.id)) {
					return prev.filter(m => m.id !== tempId)
				}
				return prev.map(m => (m.id === tempId ? { ...m, id: res.id, status: "sent" } : m))
			})
		} catch (error) {
			console.error("Failed to send sticker:", error)
			setMessages(prev =>
				prev.map(m => (m.id === tempId ? { ...m, status: "failed" } : m))
			)
		}
	}

	const handleFavoriteSticker = async (msgId: string, mediaUrl: string, isAnimated: boolean) => {
		try {
			await api.favoriteSticker(msgId, mediaUrl, isAnimated)
			toast.success("Sticker added to favorites")
			setShowFavoriteBtn(null)
		} catch (err) {
			toast.error("Failed to favorite sticker")
		}
	}

	const addEmoji = (emoji: string) => {
		setInputMessage(prev => prev + emoji)
	}

	if (!chat) {
		return (
			<div className={cn("flex-1 flex flex-col items-center justify-center bg-muted/10", className)}>
				<div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6">
					<MessageSquare className="h-10 w-10 text-primary/40" />
				</div>
				<h2 className="text-xl font-bold tracking-tight">Select a conversation</h2>
				<p className="text-muted-foreground text-sm mt-1">Pick a chat from the sidebar to start messaging.</p>
			</div>
		)
	}

	const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
		const date = formatDate(message.timestamp)
		if (!groups[date]) groups[date] = []
		groups[date].push(message)
		return groups
	}, {})

	return (
		<div className={cn("flex-1 flex flex-col bg-background relative overflow-hidden", className)}>
			{/* Header */}
			<header className="h-16 flex items-center justify-between px-4 border-b border-border/40 bg-background/80 backdrop-blur-xl z-20 sticky top-0">
				<div className="flex items-center gap-3">
					{onBack && (
						<Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 rounded-full">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					)}
					<div className="relative">
						<Avatar className="h-10 w-10 border-2 border-background shadow-sm">
							<AvatarImage src={getAvatarUrl(chat)} />
							<AvatarFallback className="bg-primary/10 text-primary font-bold">
								{chat.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>
					<div className="flex flex-col">
						<h3 className="font-bold text-base leading-tight tracking-tight">{chat.name}</h3>
						<p className="text-[11px] font-medium text-muted-foreground truncate max-w-[180px] md:max-w-[250px]">
							{chat.id}
						</p>
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
									const prevMsg = msgs[idx - 1]
									const isLastInSequence = !nextMsg || nextMsg.from !== message.from
									const isFirstInSequence = !prevMsg || prevMsg.from !== message.from
									const showSenderInfo = !isMe && chat?.isGroup && isFirstInSequence

									return (
										<div key={message.id} className={cn(
											"flex w-full group animate-in fade-in slide-in-from-bottom-2 duration-300",
											isMe ? "justify-end" : "justify-start",
											isLastInSequence ? "mb-4" : "mb-1"
										)}>
											<div className={cn(
												"max-w-[85%] sm:max-w-[70%] flex relative gap-3",
												isMe ? "flex-row-reverse" : "flex-row"
											)}>
												{/* Sender Avatar for Groups - aligned to top */}
												{!isMe && chat?.isGroup && (
													<div className="w-8 flex-shrink-0 mt-0">
														{isFirstInSequence && (
															<Avatar className="h-8 w-8 border-2 border-background shadow-sm">
																<AvatarImage src={getAvatarUrl(message.from)} />
																<AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
																	{message.senderName?.charAt(0).toUpperCase() || "?"}
																</AvatarFallback>
															</Avatar>
														)}
													</div>
												)}

												<div className={cn(
													"flex flex-col",
													isMe ? "items-end" : "items-start"
												)}>
													{/* Sender Name for Groups */}
													{showSenderInfo && (
														<span className="text-[11px] font-bold mb-1 ml-1 text-primary/80">
															{message.senderName || message.from.split("@")[0]}
														</span>
													)}

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
																		"bg-[#dcf8c6] dark:bg-[#005c4b] text-[#303030] dark:text-[#e9edef]",
																		message.isAutomatic && "bg-[#e8eaff] dark:bg-[#2e334d]",
																		isLastInSequence ? "rounded-tr-none" : "",
																		isPending && "opacity-70",
																		isFailed && "bg-destructive text-destructive-foreground"
																	)
																	: cn(
																		"bg-white dark:bg-[#202c33] text-[#303030] dark:text-[#e9edef]",
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
																					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
																						<path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
																					</svg>
																				) : (
																					<div className="relative flex items-center">
																						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(message.status === "read" ? "text-[#53bdeb]" : "text-current opacity-70")}>
																							<path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
																						</svg>
																						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("absolute left-[4px]", message.status === "read" ? "text-[#53bdeb]" : "text-current opacity-70")}>
																							<path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

			{/* Hidden inputs for file uploads */}
			<input
				type="file"
				ref={mediaInputRef}
				onChange={e => handleFileUpload(e, "image")}
				accept="image/*,video/*"
				className="hidden"
			/>
			<input
				type="file"
				ref={documentInputRef}
				onChange={e => handleFileUpload(e, "document")}
				accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
				className="hidden"
			/>
		</div>
	)
}
