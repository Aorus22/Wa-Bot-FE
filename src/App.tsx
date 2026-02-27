import { useState, useEffect, useRef, useCallback } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { NavigationSidebar, type NavItem } from "@/components/navigation-sidebar"
import { BotManagementView } from "@/components/bot-management-view"
import { TriggerEditorView } from "@/components/trigger-editor-view"
import { DocumentationView } from "@/components/documentation-view"
import { ChatArea } from "@/components/chat-area"
import { useWebSocket, type WSMessage } from "@/hooks/use-websocket"
import { api, type Chat, type Message, type Trigger } from "@/lib/api"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { LoginView } from "@/components/login-view"
import { Loader2, AlertCircle, MessageSquare, Bot, FileText } from "lucide-react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function App() {
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
	const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)
	const [showSidebar, setShowSidebar] = useState(true)
	const [incomingMessage, setIncomingMessage] = useState<{ chatId: string; message: Message } | null>(null)
	const [chatUpdate, setChatUpdate] = useState<{ chatId: string; lastMsg: string; lastTime: number; msgId: string; senderName?: string; chatName?: string; chatAvatar?: string } | null>(null)
	const [statusUpdate, setStatusUpdate] = useState<{ id: string; status: string } | null>(null)
	const [activeNavItem, setActiveNavItem] = useState<NavItem>("chat")
	const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null)
	const processedMsgIds = useRef<Set<string>>(new Set())

	const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
	const [qrCode, setQrCode] = useState<string | null>(null)
	const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

	// Handle WebSocket messages via callback to avoid cascading renders
	const handleWSMessage = useCallback((message: WSMessage) => {
		console.log("Received WS message:", message)

		switch (message.type) {
			case "qr_code":
				if (message.payload && message.payload.code) {
					setQrCode(message.payload.code)
					setIsLoggedIn(false)
				}
				break
			case "auth_success":
				setIsLoggedIn(true)
				setQrCode(null)
				break
			case "new_message": {
				const payload = message.payload
				console.log("New message payload:", payload)

				// Skip if already processed this message
				if (processedMsgIds.current.has(payload.id)) {
					console.log("Message already processed, skipping")
					break
				}
				processedMsgIds.current.add(payload.id)

				// If this is a message for the currently selected chat, pass it directly
				setIncomingMessage({
					chatId: payload.chatId,
					message: {
						id: payload.id,
						chatId: payload.chatId,
						from: payload.from,
						to: payload.to,
						content: payload.content,
						timestamp: payload.timestamp,
						status: payload.status,
						type: payload.type,
						mediaUrl: payload.mediaUrl,
						isAutomatic: payload.isAutomatic,
					},
				})

				// Update chat list in-place with new message info
				setChatUpdate({
					chatId: payload.chatId,
					lastMsg: payload.content,
					lastTime: payload.timestamp,
					msgId: payload.id,
					senderName: payload.senderName,
					chatName: payload.chatName,
				})
				break
			}
			case "message_status":
				if (message.payload) {
					setStatusUpdate({
						id: message.payload.id,
						status: message.payload.status,
					})
				}
				break
			case "chat_name_update":
				if (message.payload) {
					setChatUpdate({
						chatId: message.payload.chatId,
						lastMsg: "", // Not used for name update
						lastTime: Date.now(),
						msgId: "name-update-" + Date.now(),
						chatName: message.payload.name,
						chatAvatar: message.payload.avatar,
					})
				}
				break
		}
	}, [])

	const { isConnected } = useWebSocket("user-1", handleWSMessage)

	const checkLoginStatus = useCallback(async () => {
		try {
			const status = await api.getStatus()
			setIsLoggedIn(status.isLoggedIn)
		} catch (error) {
			console.error("Failed to check login status:", error)
			setIsLoggedIn(false)
		}
	}, [])

	const confirmLogout = async () => {
		try {
			await api.logout()
			setIsLoggedIn(false)
			setQrCode(null)
			setIsLogoutDialogOpen(false)
		} catch (error) {
			console.error("Logout failed:", error)
		}
	}

	// Check login status on mount
	useEffect(() => {
		const init = async () => {
			await checkLoginStatus()
		}
		init()
	}, [checkLoginStatus])

	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 768
			setIsMobileView(mobile)
			if (!mobile) {
				setShowSidebar(true)
			}
		}

		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [])

	if (isLoggedIn === null) {
		return (
			<div className="h-screen w-full flex items-center justify-center bg-background">
				<Loader2 className="h-10 w-10 text-primary animate-spin" />
			</div>
		)
	}

	if (isLoggedIn === false) {
		return (
			<ThemeProvider defaultTheme="system" storageKey="wa-bot-theme">
				<LoginView qrCode={qrCode} isConnected={isConnected} />
			</ThemeProvider>
		)
	}

	const handleChatSelect = (chat: Chat) => {
		setSelectedChat(chat)
		if (isMobileView) {
			setShowSidebar(false)
		}
	}

	const handleBack = () => {
		setShowSidebar(true)
		setSelectedChat(null)
	}

	return (
		<ThemeProvider defaultTheme="system" storageKey="wa-bot-theme">
			<TooltipProvider>
				<div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
					{/* Floating Live Status */}
					<div className="fixed bottom-6 right-6 z-50 pointer-events-none md:bottom-8 md:right-8">
						<div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border shadow-xl backdrop-blur-md pointer-events-auto transition-all duration-500 ${isConnected
								? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
								: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
							}`}>
							<div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-orange-500"}`} />
							<span className="tracking-wide uppercase text-[10px]">{isConnected ? "Live" : "Reconnecting..."}</span>
						</div>
					</div>

					{/* Logout Confirmation Dialog */}
					<AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<div className="flex items-center gap-2 text-destructive mb-2">
									<AlertCircle className="h-5 w-5" />
									<AlertDialogTitle>Confirm Log Out</AlertDialogTitle>
								</div>
								<AlertDialogDescription>
									Are you sure you want to log out from this session? You will need to scan the QR code again to log back in.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={confirmLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
									Log Out
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					{/* Main Layout */}
					<div className="flex w-full relative">
						{/* Navigation Sidebar */}
						{!isMobileView && (
							<NavigationSidebar
								activeItem={activeNavItem}
								onNavItemSelect={setActiveNavItem}
								onLogout={() => setIsLogoutDialogOpen(true)}
							/>
						)}

						{/* Sidebar (Chat List) */}
						{activeNavItem === "chat" && (
							<div
								className={cn(
									"h-full transition-all duration-300 ease-in-out border-r border-border/40",
									isMobileView
										? (showSidebar ? "w-full absolute inset-0 z-40 bg-background" : "w-0 overflow-hidden")
										: "w-[380px] lg:w-[420px] flex-shrink-0"
								)}
							>
								<ChatSidebar
									selectedChatId={selectedChat?.id || null}
									onChatSelect={handleChatSelect}
									chatUpdate={chatUpdate}
								/>
							</div>
						)}

						{/* Chat Area, Bot Management, or Documentation */}
						<main
							className={cn(
								"flex-1 h-full relative overflow-hidden bg-muted/30",
								isMobileView && showSidebar && activeNavItem === "chat" ? "hidden" : "flex"
							)}
						>
							{activeNavItem === "chat" ? (
								selectedChat ? (
									<ChatArea
										chat={selectedChat}
										incomingMessage={incomingMessage}
										statusUpdate={statusUpdate}
										onBack={isMobileView ? handleBack : undefined}
										className="w-full h-full"
									/>
								) : (
									<div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
										<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
											<svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
											</svg>
										</div>
										<div className="space-y-2">
											<h3 className="text-xl font-semibold tracking-tight">WhatsApp Web Bot</h3>
											<p className="text-muted-foreground max-w-[280px]">
												Select a chat from the sidebar to start messaging. Your messages are synced in real-time.
											</p>
										</div>
									</div>
								)
							) : activeNavItem === "bot-management" ? (
								<BotManagementView
									onEditTrigger={(t) => {
										setEditingTrigger(t)
										setActiveNavItem("trigger-editor")
									}}
									onViewDocs={() => setActiveNavItem("documentation")}
								/>
							) : activeNavItem === "documentation" ? (
								<DocumentationView />
							) : (
								<TriggerEditorView
									trigger={editingTrigger}
									onBack={() => {
										setEditingTrigger(null)
										setActiveNavItem("bot-management")
									}}
									onViewDocs={() => setActiveNavItem("documentation")}
								/>
							)}
						</main>

						{/* Mobile Navigation */}
						{isMobileView && (
							<div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/40 flex items-center justify-around px-6 z-50 md:hidden">
								<button
									onClick={() => setActiveNavItem("chat")}
									className={cn(
										"flex flex-col items-center gap-1 p-2 transition-colors",
										activeNavItem === "chat" ? "text-primary" : "text-muted-foreground"
									)}
								>
									<MessageSquare className="h-5 w-5" />
									<span className="text-[10px] font-bold uppercase tracking-wider">Chats</span>
								</button>
								<button
									onClick={() => setActiveNavItem("bot-management")}
									className={cn(
										"flex flex-col items-center gap-1 p-2 transition-colors",
										activeNavItem === "bot-management" ? "text-primary" : "text-muted-foreground"
									)}
								>
									<Bot className="h-5 w-5" />
									<span className="text-[10px] font-bold uppercase tracking-wider">Bot</span>
								</button>
								<button
									onClick={() => setActiveNavItem("documentation")}
									className={cn(
										"flex flex-col items-center gap-1 p-2 transition-colors",
										activeNavItem === "documentation" ? "text-primary" : "text-muted-foreground"
									)}
								>
									<FileText className="h-5 w-5" />
									<span className="text-[10px] font-bold uppercase tracking-wider">Docs</span>
								</button>
							</div>
						)}
					</div>
					<Toaster position="top-center" />
				</div>
			</TooltipProvider>
		</ThemeProvider>
	)
}

export default App
