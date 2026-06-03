import { Check, Paintbrush } from 'lucide-react'
import { themes } from '@/data/themes'
import { useAppTheme, setAppTheme } from '@/components/AppThemeProvider'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

type ThemeMode = 'all' | 'dark' | 'light'

function getLuminance(hex: string) {
	const r = parseInt(hex.slice(1, 3), 16) / 255
	const g = parseInt(hex.slice(3, 5), 16) / 255
	const b = parseInt(hex.slice(5, 7), 16) / 255
	const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
	return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

export function SettingsPage() {
	const [current, setCurrent] = useState(() => useAppTheme())
	const [mode, setMode] = useState<ThemeMode>('dark')

	useEffect(() => {
		const handler = () => setCurrent(useAppTheme())
		window.addEventListener('storage', handler)
		return () => window.removeEventListener('storage', handler)
	}, [])

	const handleSelect = (name: string) => {
		setAppTheme(name)
		setCurrent(name)
	}

	const filtered = useMemo(() => {
		if (mode === 'all') return themes
		return themes.filter(t => {
			const lum = getLuminance(t.colors.background)
			return mode === 'dark' ? lum < 0.5 : lum >= 0.5
		})
	}, [mode])

	return (
		<div className="flex flex-col items-center justify-start min-h-full p-4 md:p-8 overflow-y-auto pt-12">
			<div className="w-full max-w-2xl space-y-8 pb-12">
				<h1 className="text-2xl font-bold tracking-tight">Settings</h1>

				{/* Appearance Section */}
				<div className="space-y-4">
					<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearance</h2>
					<div className="bg-card rounded-lg border divide-y overflow-hidden">
						{/* Theme Mode Filter */}
						<div className="flex items-center justify-between px-4 py-3">
							<div className="flex items-center gap-3">
								<Paintbrush className="h-4 w-4 text-muted-foreground" />
								<div className="flex flex-col">
									<span className="text-sm font-medium">Theme Mode</span>
									<span className="text-xs text-muted-foreground">Filter by dark or light appearance</span>
								</div>
							</div>
							<Select value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
								<SelectTrigger className="w-[110px] h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All themes</SelectItem>
									<SelectItem value="dark">Dark</SelectItem>
									<SelectItem value="light">Light</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Color Theme Picker */}
						<div className="px-4 py-4 space-y-4">
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-medium">Color Theme</span>
								<span className="text-xs text-muted-foreground">{filtered.length} themes available</span>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{filtered.map((theme) => {
									const isActive = current === theme.name
									const c = theme.colors
									return (
										<button
											key={theme.name}
											onClick={() => handleSelect(theme.name)}
											className={cn(
												"group relative flex flex-col gap-2 p-2 rounded-lg border-2 transition-all text-left",
												isActive
													? "border-primary/40 bg-accent"
													: "border-border/50 bg-secondary hover:bg-secondary/80"
											)}
										>
											<div
												className="h-14 w-full rounded-md flex flex-col p-2 gap-1 overflow-hidden"
												style={{ backgroundColor: c.background }}
											>
												<div className="flex gap-1">
													<div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.primary }} />
													<div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.accent }} />
													<div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.destructive }} />
												</div>
												<div className="flex-1 flex items-end gap-1">
													<div className="w-2/3 h-1 rounded-sm" style={{ backgroundColor: c.foreground }} />
													<div className="w-1/4 h-1 rounded-sm" style={{ backgroundColor: c.mutedForeground }} />
												</div>
											</div>
											<span className="text-xs font-medium truncate px-1 text-muted-foreground group-hover:text-foreground">
												{theme.label}
											</span>
											{isActive && (
												<Check className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />
											)}
										</button>
									)
								})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
