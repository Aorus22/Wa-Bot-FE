import { createContext, useContext } from "react"

export const ChatDetailContext = createContext<{ setChatDetailOpen: (v: boolean) => void }>({
	setChatDetailOpen: () => {},
})

export function useChatDetail() {
	return useContext(ChatDetailContext)
}
