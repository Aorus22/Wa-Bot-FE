import { useState, useEffect, useRef, useCallback } from "react"
import { NavigationSidebar, type NavItem } from "@/pages/layout/NavigationSidebar"
import { useWebSocket, type WSMessage } from "@/hooks/use-websocket"
import { api, type Message, type Trigger, type CronJob, type Webhook } from "@/lib/api"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Loader2, AlertCircle, MessageSquare, Bot, FileText, Clock, Globe } from "lucide-react"
import { LoginPage } from "@/pages/login/LoginPage"
import { ChatPage } from "@/pages/chat/ChatPage"
import { BotManagementPage } from "@/pages/bot/BotManagementPage"
import { TriggerEditorPage } from "@/pages/bot/TriggerEditorPage"
import { CronManagementPage } from "@/pages/bot/CronManagementPage"
import { CronEditorPage } from "@/pages/bot/CronEditorPage"
import { WebhookManagementPage } from "@/pages/bot/WebhookManagementPage"
import { WebhookEditorPage } from "@/pages/bot/WebhookEditorPage"
import { DocumentationPage } from "@/pages/documentation/DocumentationPage"
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
	const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)
	const [incomingMessage, setIncomingMessage] = useState<{ chatId: string; message: Message } | null>(null)
	const [chatUpdate, setChatUpdate] = useState<{ chatId: string; lastMsg: string; lastTime: number; msgId: string; status?: string; senderName?: string; chatName?: string; chatAvatar?: string } | null>(null)
	const [statusUpdate, setStatusUpdate] = useState<{ id: string; status: string } | null>(null)
	const [activeNavItem, setActiveNavItem] = useState<NavItem>("chat")
	const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null)
	const [editingCron, setEditingCron] = useState<CronJob | null>(null)
	const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
	const processedMsgIds = useRef<Set<string>>(new Set())

	const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
	const [qrCode, setQrCode] = useState<string | null>(null)
	const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

	const handleWSMessage = useCallback((message: WSMessage) => {
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
				if (processedMsgIds.current.has(payload.id)) break
				processedMsgIds.current.add(payload.id)
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
				setChatUpdate({
					chatId: payload.chatId,
					lastMsg: payload.content,
					lastTime: payload.timestamp,
					msgId: payload.id,
					status: payload.status,
					senderName: payload.senderName,
					chatName: payload.chatName,
				})
				break
			}
			case "message_deleted":
				if (message.payload) {
					setIncomingMessage({
						chatId: message.payload.chatId,
						message: { id: message.payload.id, type: "deleted" } as any,
					})
				}
				break
			case "message_edited":
				if (message.payload) {
					setIncomingMessage({
						chatId: message.payload.chatId,
						message: { id: message.payload.id, content: message.payload.content, type: "edited" } as any,
					})
				}
				break
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
						lastMsg: "",
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
			setIsLoggedIn(false)
		}
	}, [])

	const confirmLogout = async () => {
		try {
			await api.logout()
			setIsLoggedIn(false)
			setQrCode(null)
			setIsLogoutDialogOpen(false)
		} catch (error) {}
	}

	useEffect(() => {
		checkLoginStatus()
	}, [checkLoginStatus])

	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth < 768)
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
		return <LoginPage qrCode={qrCode} isConnected={isConnected} />
	}

	return (
		<ThemeProvider defaultTheme="system" storageKey="wa-bot-theme">
			<TooltipProvider>
				<div className={cn("flex h-[100dvh] bg-background text-foreground overflow-hidden", isMobileView && "flex-col")}>
					
					<AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<div className="flex items-center gap-2 text-destructive mb-2">
									<AlertCircle className="h-5 w-5" />
									<AlertDialogTitle>Confirm Log Out</AlertDialogTitle>
								</div>
								<AlertDialogDescription>
									Are you sure you want to log out? You will need to scan the QR code again.
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

					<div className="flex-1 flex w-full relative overflow-hidden min-h-0">
						{!isMobileView && (
							<NavigationSidebar
								activeItem={activeNavItem}
								onNavItemSelect={setActiveNavItem}
								onLogout={() => setIsLogoutDialogOpen(true)}
								isConnected={isConnected}
							/>
						)}

						<div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
							{activeNavItem === "chat" ? (
									<ChatPage isMobileView={isMobileView} incomingMessage={incomingMessage} chatUpdate={chatUpdate} statusUpdate={statusUpdate} />
							) : activeNavItem === "bot-management" ? (
									<BotManagementPage
											isMobileView={isMobileView}
											onEditTrigger={(t) => {
													setEditingTrigger(t)
													setActiveNavItem("trigger-editor")
											}}
											onViewDocs={() => setActiveNavItem("documentation")}
									/>
							) : activeNavItem === "cron-management" ? (
									<CronManagementPage
											isMobileView={isMobileView}
											onEditCron={(j) => {
													setEditingCron(j)
													setActiveNavItem("cron-editor")
											}}
											onViewDocs={() => setActiveNavItem("documentation")}
									/>
					) : activeNavItem === "webhook-management" ? (
							<WebhookManagementPage
									isMobileView={isMobileView}
									onEditWebhook={(w) => {
										setEditingWebhook(w)
										setActiveNavItem("webhook-editor")
									}}
									onViewDocs={() => setActiveNavItem("documentation")}
								/>
					) : activeNavItem === "webhook-editor" ? (
							<WebhookEditorPage
									isMobileView={isMobileView}
									webhook={editingWebhook}
									onBack={() => {
										setEditingWebhook(null)
										setActiveNavItem("webhook-management")
									}}
								/>
							) : activeNavItem === "documentation" ? (
									<DocumentationPage />
							) : activeNavItem === "trigger-editor" ? (
									<TriggerEditorPage
											isMobileView={isMobileView}
											trigger={editingTrigger}
											onBack={() => {
													setEditingTrigger(null)
													setActiveNavItem("bot-management")
											}}
									/>
							) : (
									<CronEditorPage
											isMobileView={isMobileView}
											job={editingCron}
											onBack={() => {
													setEditingCron(null)
													setActiveNavItem("cron-management")
											}}
									/>
							)}
						</div>
					</div>

					{isMobileView && (
						<div className="h-16 bg-background border-t border-border/40 flex items-center justify-around px-6 shrink-0 z-50">
								<button onClick={() => setActiveNavItem("chat")} className={cn("flex flex-col items-center gap-1 p-2", activeNavItem === "chat" ? "text-primary" : "text-muted-foreground")}>
									<MessageSquare className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Chats</span>
								</button>
								<button onClick={() => setActiveNavItem("bot-management")} className={cn("flex flex-col items-center gap-1 p-2", activeNavItem === "bot-management" || activeNavItem === "trigger-editor" ? "text-primary" : "text-muted-foreground")}>
									<Bot className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Triggers</span>
								</button>
								<button onClick={() => setActiveNavItem("cron-management")} className={cn("flex flex-col items-center gap-1 p-2", activeNavItem === "cron-management" || activeNavItem === "cron-editor" ? "text-primary" : "text-muted-foreground")}>
									<Clock className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Cron</span>
								</button>
								<button onClick={() => setActiveNavItem("documentation")} className={cn("flex flex-col items-center gap-1 p-2", activeNavItem === "documentation" ? "text-primary" : "text-muted-foreground")}>
						<button onClick={() => setActiveNavItem("webhook-management")} className={cn("flex flex-col items-center gap-1 p-2", activeNavItem === "webhook-management" || activeNavItem === "webhook-editor" ? "text-primary" : "text-muted-foreground")}>
							<Globe className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Webhooks</span>
						</button>
									<FileText className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Docs</span>
								</button>
						</div>
					)}
					<Toaster position="top-center" />
				</div>
			</TooltipProvider>
		</ThemeProvider>
	)
}

export default App
