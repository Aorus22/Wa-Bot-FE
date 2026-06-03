import { Check, Paintbrush } from 'lucide-react'
import { themes } from '@/data/themes'
import { useAppTheme, setAppTheme } from '@/components/AppThemeProvider'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

export function SettingsPage() {
	const [current, setCurrent] = useState(() => useAppTheme())

	useEffect(() => {
		const handler = () => setCurrent(useAppTheme())
		window.addEventListener('storage', handler)
		return () => window.removeEventListener('storage', handler)
	}, [])

	const handleSelect = (name: string) => {
		setAppTheme(name)
		setCurrent(name)
	}

	return (
		<div className="h-full w-full bg-background flex flex-col min-h-0">
			<div className="shrink-0 px-4 md:px-8 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-border/40 bg-muted/10">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-xl bg-primary/10 text-primary">
						<Paintbrush className="h-5 w-5" />
					</div>
					<div>
						<h1 className="text-xl md:text-2xl font-semibold tracking-tight">Settings</h1>
						<p className="text-xs md:text-sm text-muted-foreground">Choose a color theme for the interface.</p>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto w-full min-h-0">
				<div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-6 md:py-8 pb-12">
					<div className="space-y-4">
						<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearance</h2>
						<div className="bg-card rounded-lg border overflow-hidden">
							<div className="px-4 py-4 space-y-4">
								<div>
									<span className="text-sm font-medium">Color Theme</span>
									<p className="text-xs text-muted-foreground">{themes.length} themes available</p>
								</div>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
									{themes.map((theme) => {
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
		</div>
	)
}
