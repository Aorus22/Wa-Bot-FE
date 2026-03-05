import { useState } from "react"
import { ChatSidebar } from "./ChatSidebar"
import { ChatArea } from "./ChatArea"
import { cn } from "@/lib/utils"
import type { Chat, Message } from "@/lib/api"

interface ChatPageProps {
	isMobileView: boolean
	incomingMessage: { chatId: string; message: Message } | null
	chatUpdate: {
		chatId: string
		lastMsg: string
		lastTime: number
		msgId: string
		senderName?: string
		chatName?: string
		chatAvatar?: string
	} | null
	statusUpdate: { id: string; status: string } | null
}

export function ChatPage({ isMobileView, incomingMessage, chatUpdate, statusUpdate }: ChatPageProps) {
	const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
	const [showSidebar, setShowSidebar] = useState(true)

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
		<div className="flex w-full relative h-full">
			<div
				className={cn(
					"h-full transition-all duration-300 ease-in-out border-r border-border/40",
					isMobileView ? (showSidebar ? "w-full absolute inset-0 z-40 bg-background" : "w-0 overflow-hidden") : "w-[380px] lg:w-[420px] flex-shrink-0"
				)}
			>
				<ChatSidebar selectedChatId={selectedChat?.id || null} onChatSelect={handleChatSelect} chatUpdate={chatUpdate} />
			</div>

			<main className={cn("flex-1 h-full relative overflow-hidden bg-muted/30", isMobileView && showSidebar ? "hidden" : "flex")}>
				{selectedChat ? (
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
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
						</div>
						<div className="space-y-2">
							<h3 className="text-xl font-semibold tracking-tight">WhatsApp Web Bot</h3>
							<p className="text-muted-foreground max-w-[280px]">Select a chat from the sidebar to start messaging. Your messages are synced in real-time.</p>
						</div>
					</div>
				)}
			</main>
		</div>
	)
}
