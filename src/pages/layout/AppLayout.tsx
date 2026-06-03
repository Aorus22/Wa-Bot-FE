import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { NavigationSidebar } from "./NavigationSidebar"
import { cn } from "@/lib/utils"
import { MessageSquare, Bot, Clock, Globe, FileText } from "lucide-react"
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
	const { isLogoutDialogOpen, setIsLogoutDialogOpen, logout } = useAuth()

	const isActive = (path: string) => location.pathname.startsWith(path)

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
						<Outlet />
					</div>
				</div>

				{isMobileView && (
					<div className="h-16 bg-background border-t border-border/40 flex items-center justify-around px-6 shrink-0 z-50">
						<button onClick={() => navigate("/chat")} className={cn("flex flex-col items-center gap-1 p-2", isActive("/chat") ? "text-primary" : "text-muted-foreground")}>
							<MessageSquare className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Chats</span>
						</button>
						<button onClick={() => navigate("/triggers")} className={cn("flex flex-col items-center gap-1 p-2", isActive("/triggers") ? "text-primary" : "text-muted-foreground")}>
							<Bot className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Triggers</span>
						</button>
						<button onClick={() => navigate("/cron")} className={cn("flex flex-col items-center gap-1 p-2", isActive("/cron") ? "text-primary" : "text-muted-foreground")}>
							<Clock className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Cron</span>
						</button>
						<button onClick={() => navigate("/webhooks")} className={cn("flex flex-col items-center gap-1 p-2", isActive("/webhooks") ? "text-primary" : "text-muted-foreground")}>
							<Globe className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Webhooks</span>
						</button>
						<button onClick={() => navigate("/documentation")} className={cn("flex flex-col items-center gap-1 p-2", isActive("/documentation") ? "text-primary" : "text-muted-foreground")}>
							<FileText className="h-5 w-5" /><span className="text-[10px] font-bold uppercase">Docs</span>
						</button>
					</div>
				)}
			</div>
		</>
	)
}
