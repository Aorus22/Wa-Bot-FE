import { useEffect, useState, useRef, useCallback } from "react"
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
	const [zoom, setZoom] = useState(1)
	const [pan, setPan] = useState({ x: 0, y: 0 })
	const pinchRef = useRef<{ dist: number; zoom: number; pan: { x: number; y: number }; center: { x: number; y: number } } | null>(null)

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden"
			document.body.style.touchAction = "none"
			requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
		} else {
			document.body.style.overflow = ""
			document.body.style.touchAction = ""
			setReady(false)
			setZoom(1)
			setPan({ x: 0, y: 0 })
		}
		return () => {
			document.body.style.overflow = ""
			document.body.style.touchAction = ""
		}
	}, [open])

	const getTouchDist = (touches: TouchList) => {
		const dx = touches[0].clientX - touches[1].clientX
		const dy = touches[0].clientY - touches[1].clientY
		return Math.sqrt(dx * dx + dy * dy)
	}

	const getTouchCenter = (touches: TouchList) => ({
		x: (touches[0].clientX + touches[1].clientX) / 2,
		y: (touches[0].clientY + touches[1].clientY) / 2,
	})

	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			e.preventDefault()
			pinchRef.current = {
				dist: getTouchDist(e.touches),
				zoom: zoom,
				pan: { ...pan },
				center: getTouchCenter(e.touches),
			}
		}
	}, [zoom, pan])

	const handleTouchMove = useCallback((e: React.TouchEvent) => {
		if (e.touches.length === 2 && pinchRef.current) {
			e.preventDefault()
			const newDist = getTouchDist(e.touches)
			const newCenter = getTouchCenter(e.touches)
			const scale = (newDist / pinchRef.current.dist) * pinchRef.current.zoom
			const clamped = Math.max(0.5, Math.min(5, scale))

			// Calculate pan offset to zoom toward pinch center
			const dx = (newCenter.x - pinchRef.current.center.x) / clamped
			const dy = (newCenter.y - pinchRef.current.center.y) / clamped

			setZoom(clamped)
			setPan({
				x: pinchRef.current.pan.x + dx,
				y: pinchRef.current.pan.y + dy,
			})
		}
	}, [])

	const handleTouchEnd = useCallback(() => {
		pinchRef.current = null
	}, [])

	useEffect(() => {
		if (zoom <= 1) setPan({ x: 0, y: 0 })
	}, [zoom])

	const handleDoubleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation()
		if (zoom > 1) {
			setZoom(1)
			setPan({ x: 0, y: 0 })
		} else {
			setZoom(2.5)
		}
	}, [zoom])

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
		transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
		width: "auto",
		height: "auto",
		maxWidth: "95vw",
		maxHeight: "90vh",
		borderRadius: zoom > 1 ? "0px" : "12px",
		objectFit: "contain",
		zIndex: 60,
		boxShadow: zoom > 1 ? "none" : "0 25px 50px -12px rgba(0,0,0,0.5)",
		transition: pinchRef.current ? "none" : "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
	}

	const style: React.CSSProperties = {
		...fromStyle,
		...(ready ? toStyle : {}),
	}

	return (
		<div
			className="fixed inset-0 z-50"
			onClick={() => { if (zoom <= 1) onClose() }}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			style={{ touchAction: "none" }}
		>
			<div
				className="absolute inset-0 bg-black/80 transition-opacity duration-300"
				style={{ opacity: ready ? 1 : 0 }}
			/>
			<img
				src={imageUrl}
				alt="Full size"
				style={style}
				onClick={(e) => e.stopPropagation()}
				onDoubleClick={handleDoubleClick}
				draggable={false}
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
