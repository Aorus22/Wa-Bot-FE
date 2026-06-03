import { useEffect, useState } from "react"
import { X, Download, ExternalLink } from "lucide-react"

interface ChatImageViewerModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	imageUrl: string | null
	sourceRect: DOMRect | null
	onClose: () => void
}

export function ChatImageViewerModal({ open, onOpenChange, imageUrl, sourceRect, onClose }: ChatImageViewerModalProps) {
	const [ready, setReady] = useState(false)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
			requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
		} else {
			document.body.style.overflow = ""
			setReady(false)
		}
		return () => { document.body.style.overflow = "" }
	}, [open])

	if (!open || !imageUrl) return null

	const fromStyle: React.CSSProperties = sourceRect ? {
		position: "fixed",
		top: sourceRect.top,
		left: sourceRect.left,
		width: sourceRect.width,
		height: sourceRect.height,
		borderRadius: "12px",
		objectFit: "cover",
		zIndex: 60,
	} : {}

	const toStyle: React.CSSProperties = {
		position: "fixed",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		maxWidth: "95vw",
		maxHeight: "90vh",
		borderRadius: "12px",
		objectFit: "contain",
		zIndex: 60,
		boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
	}

	const style: React.CSSProperties = {
		...fromStyle,
		transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
		...(ready ? toStyle : {}),
	}

	return (
		<div className="fixed inset-0 z-50" onClick={onClose}>
			<div
				className="absolute inset-0 bg-black/80 transition-opacity duration-300"
				style={{ opacity: ready ? 1 : 0 }}
			/>
			<img
				src={imageUrl}
				alt="Full size"
				style={style}
				onClick={(e) => e.stopPropagation()}
			/>
			{ready && (
				<div className="fixed top-3 right-3 z-60 flex items-center gap-1.5 animate-in fade-in duration-200">
					<button
						onClick={() => window.open(imageUrl, '_blank')}
						className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-colors"
					>
						<ExternalLink className="h-4 w-4" />
					</button>
					<a
						href={imageUrl}
						download
						className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-colors"
						onClick={(e) => e.stopPropagation()}
					>
						<Download className="h-4 w-4" />
					</a>
					<button
						onClick={onClose}
						className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
			)}
		</div>
	)
}
