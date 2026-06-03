import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { ChatDetailContext } from "@/contexts/ChatDetailContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { NavigationSidebar } from "./NavigationSidebar"
import { cn } from "@/lib/utils"
import { MessageSquare, Bot, Clock, Globe, FileText, Settings } from "lucide-react"
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel,
	AlertDialogContent, AlertDialogDescription,
	AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle } from "lucide-react"

export function AppLayout() {
	const isMobileView = useIsMobile()
	const location = useLocation()
	const navigate = useNavigate()
	const [autoOpen, setAutoOpen] = useState(false)
	const [chatDetailOpen, setChatDetailOpen] = useState(false)
	const { isLogoutDialogOpen, setIsLogoutDialogOpen, logout } = useAuth()

	const isActive = (path: string) => location.pathname.startsWith(path)
	const isAutoActive = isActive("/triggers") || isActive("/cron") || isActive("/webhooks") || isActive("/documentation")

	const autoItems = [
		{ path: "/triggers", icon: <Bot className="h-5 w-5" />, label: "Triggers" },
		{ path: "/cron", icon: <Clock className="h-5 w-5" />, label: "Cron" },
		{ path: "/webhooks", icon: <Globe className="h-5 w-5" />, label: "Webhooks" },
		{ path: "/documentation", icon: <FileText className="h-5 w-5" />, label: "Docs" },
	]

	return (
		<>
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
						<AlertDialogAction onClick={logout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
							Log Out
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className={cn("flex h-[100dvh] bg-background text-foreground overflow-hidden", isMobileView && "flex-col")}>
				<div className="flex-1 flex w-full relative overflow-hidden min-h-0">
					{!isMobileView && (
						<NavigationSidebar />
					)}

					<div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
						<ChatDetailContext.Provider value={{ setChatDetailOpen }}>
							<Outlet />
						</ChatDetailContext.Provider>
					</div>
				</div>

				{isMobileView && !chatDetailOpen && (
					<>
						{/* Bottom Sheet Overlay */}
						{autoOpen && (
							<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={() => setAutoOpen(false)} />
						)}

						{/* Automation Popover */}
						{autoOpen && (
							<div className="fixed bottom-20 left-4 right-4 z-50 bg-card rounded-2xl border shadow-2xl p-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
								<div className="grid grid-cols-4 gap-2">
									{autoItems.map((item) => (
										<button
											key={item.path}
											onClick={() => { navigate(item.path); setAutoOpen(false) }}
											className={cn(
												"flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
												isActive(item.path)
													? "bg-primary text-primary-foreground shadow-sm"
													: "hover:bg-muted text-muted-foreground"
											)}
										>
											{item.icon}
											<span className="text-[10px] font-bold uppercase leading-none">{item.label}</span>
										</button>
									))}
								</div>
							</div>
						)}

						<div className="h-16 bg-background border-t border-border/40 flex items-center justify-around px-6 shrink-0 z-50">
							<button onClick={() => navigate("/chat")} className={cn("flex flex-col items-center gap-1 p-2", isActive("/chat") ? "text-primary" : "text-muted-foreground")}>
								<MessageSquare className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Chats</span>
							</button>
							<button onClick={() => setAutoOpen(prev => !prev)} className={cn("flex flex-col items-center gap-1 p-2", isAutoActive ? "text-primary" : "text-muted-foreground")}>
								<Bot className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Automation</span>
							</button>
							<button onClick={() => navigate("/settings")} className={cn("flex flex-col items-center gap-1 p-2", isActive("/settings") ? "text-primary" : "text-muted-foreground")}>
								<Settings className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Settings</span>
							</button>
						</div>
					</>
				)}
			</div>
		</>
	)
}
