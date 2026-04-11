import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Search, Code, Globe, Download, Upload, Copy, Activity, FileText, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { WebhookDeleteModal } from './WebhookDeleteModal'
import { WebhookDeleteAllModal } from './WebhookDeleteAllModal'
import { api, type Webhook } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WebhookManagementPageProps {
	onEditWebhook: (webhook: Webhook | null) => void
	onViewDocs: () => void
	onViewLogs: () => void
	isMobileView?: boolean
}

export function WebhookManagementPage({ onEditWebhook, onViewDocs, onViewLogs, isMobileView }: WebhookManagementPageProps) {
	const [webhooks, setWebhooks] = useState<Webhook[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [deleteId, setDeleteId] = useState<string | null>(null)
	const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		loadWebhooks()
	}, [])

	const loadWebhooks = async () => {
		try {
			setLoading(true)
			const data = await api.getWebhooks()
			setWebhooks(data || [])
		} catch (error) {
			console.error('Failed to load webhooks:', error)
			toast.error('Failed to load webhooks')
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteConfirm = async () => {
		if (!deleteId) return
		try {
			await api.deleteWebhook(deleteId)
			toast.success('Webhook deleted')
			setDeleteId(null)
			loadWebhooks()
		} catch (error) {
			toast.error('Failed to delete webhook')
		}
	}

	const handleDeleteAllConfirm = async () => {
		try {
			setLoading(true)
			setIsDeleteAllOpen(false)
			await api.deleteAllWebhooks()
			toast.success('All webhooks purged')
			loadWebhooks()
		} catch (error) {
			toast.error('Failed to purge webhooks')
		} finally {
			setLoading(false)
		}
	}

	const toggleStatus = async (webhook: Webhook) => {
		try {
			await api.updateWebhook(webhook.id, { ...webhook, is_active: !webhook.is_active })
			loadWebhooks()
		} catch (error) {
			toast.error('Failed to update status')
		}
	}

	const copyWebhookUrl = (path: string) => {
		const url = `${window.location.origin}/webhook/${path}`
		navigator.clipboard.writeText(url)
		toast.success('Webhook URL copied')
	}

	const handleExport = () => {
		if (webhooks.length === 0) {
			toast.error('No webhooks to export')
			return
		}
		const dataStr = JSON.stringify(webhooks, null, 2)
		const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
		const exportFileDefaultName = `wa-bot-webhooks-${new Date().toISOString().split('T')[0]}.json`
		const linkElement = document.createElement('a')
		linkElement.setAttribute('href', dataUri)
		linkElement.setAttribute('download', exportFileDefaultName)
		linkElement.click()
		toast.success('Export successful')
	}

	const handleImportClick = () => {
		fileInputRef.current?.click()
	}

	const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = async (event) => {
			try {
				const content = event.target?.result as string
				const importedWebhooks = JSON.parse(content)
				if (!Array.isArray(importedWebhooks)) throw new Error('Invalid format')

				setLoading(true)
				let count = 0
				for (const webhook of importedWebhooks) {
					try {
						const { id, created_at, updated_at, ...cleanWebhook } = webhook
						await api.createWebhook(cleanWebhook)
						count++
					} catch (err) { console.error(err) }
				}
				toast.success(`Imported ${count} webhooks`)
				loadWebhooks()
			} catch (error) {
				toast.error('Import failed')
			} finally {
				setLoading(false)
				if (e.target) e.target.value = ''
			}
		}
		reader.readAsText(file)
	}

	const filteredWebhooks = webhooks.filter(webhook =>
		webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		webhook.path.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<ScrollArea className='h-full w-full bg-background'>
			<div className='flex flex-col min-h-full w-full pb-20 md:pb-0'>
				<WebhookDeleteModal
					open={!!deleteId}
					onOpenChange={(open) => !open && setDeleteId(null)}
					onConfirm={handleDeleteConfirm}
				/>
				<WebhookDeleteAllModal
					open={isDeleteAllOpen}
					onOpenChange={setIsDeleteAllOpen}
					onConfirm={handleDeleteAllConfirm}
				/>

				<div className='p-4 md:p-8 border-b border-border/40 bg-muted/5'>
					<div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
						<div className='flex items-center gap-4 pl-1'>
							<div className='p-3 rounded-2xl bg-primary/10 text-primary shadow-sm'>
								<Globe className='h-6 w-6' />
							</div>
							<div>
								<h1 className='text-2xl md:text-3xl font-bold tracking-tight text-foreground'>Webhooks</h1>
								<p className='text-xs md:text-sm text-muted-foreground'>Create HTTP endpoints that trigger Lua scripts.</p>
							</div>
						</div>

						<div className='flex items-center gap-2 flex-wrap sm:flex-nowrap'>
							<div className='relative flex-1 sm:w-64 min-w-[180px]'>
								<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
								<Input
									placeholder='Search webhooks...'
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									className='pl-9 rounded-xl border-border/40 bg-background focus-visible:ring-primary/20 h-10'
								/>
							</div>

							<input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />

							<div className='flex items-center p-1 bg-muted/50 rounded-xl border border-border/40'>
								<Button
									variant='ghost'
									size='icon'
									onClick={onViewLogs}
									className='h-8 w-8 rounded-lg sm:hidden'
									title='View Request Logs'
								>
									<Activity className='h-4 w-4' />
								</Button>
								<Button
									variant='ghost'
									size='icon'
									onClick={() => setIsDeleteAllOpen(true)}
									className='h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10'
									title='Delete ALL Webhooks'
									disabled={webhooks.length === 0}
								>
									<Trash2 className='h-4 w-4' />
								</Button>
								<Button
									variant='ghost'
									size='icon'
									onClick={handleExport}
									className='h-8 w-8 rounded-lg'
									title='Export Webhooks'
								>
									<Download className='h-4 w-4' />
								</Button>
								<Button
									variant='ghost'
									size='icon'
									onClick={handleImportClick}
									className='h-8 w-8 rounded-lg'
									title='Import Webhooks'
								>
									<Upload className='h-4 w-4' />
								</Button>
							</div>

							<Button
								variant='outline'
								onClick={onViewLogs}
								className='rounded-xl h-10 px-4 border-border/40 hidden sm:flex'
							>
								<Activity className='mr-2 h-4 w-4' /> Logs
							</Button>

							<Button
								variant='outline'
								onClick={onViewDocs}
								className='rounded-xl h-10 px-4 border-border/40 hidden sm:flex'
							>
								<FileText className='mr-2 h-4 w-4' /> Docs
							</Button>

							{!isMobileView && (
								<Button
									onClick={() => onEditWebhook(null)}
									className='rounded-xl px-6 h-10 font-bold shadow-lg shadow-primary/20'
								>
									<Plus className='mr-2 h-4 w-4' /> New Webhook
								</Button>
							)}
						</div>
					</div>
				</div>

				<div className='p-4 md:p-8 w-full flex-1'>
					{loading ? (
						<div className='flex flex-col items-center justify-center py-24 gap-4 opacity-50'>
							<div className='w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin' />
							<p className='font-medium'>Loading webhooks...</p>
						</div>
					) : filteredWebhooks.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-20 md:py-32 border-2 border-dashed border-border/40 rounded-[2rem] md:rounded-[3rem] text-center space-y-6 bg-muted/5'>
							<div className='w-20 h-20 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground'>
								<Globe className='h-10 w-10' />
							</div>
							<div className='space-y-2 px-4'>
								<h3 className='text-xl font-bold'>No webhooks yet</h3>
								<p className='text-muted-foreground max-w-xs mx-auto'>Create your first webhook endpoint to receive HTTP triggers and run Lua scripts.</p>
							</div>
							<Button onClick={() => onEditWebhook(null)} className='rounded-xl px-8 h-11 font-bold'>
								<Plus className='mr-2 h-5 w-5' /> Create First Webhook
							</Button>
						</div>
					) : (
						<div className={cn(
							"grid gap-4 pb-10",
							isMobileView ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
						)}>
							{filteredWebhooks.map((webhook) => (
								<Card key={webhook.id} className="pb-0 group relative overflow-hidden border-border/40 bg-card/50 hover:bg-card hover:border-primary/30 transition-all rounded-[1.5rem]">
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1 overflow-hidden">
												<CardTitle className="text-base font-bold truncate">
													{webhook.name}
												</CardTitle>
												<div className="flex items-center gap-1.5">
													<Badge variant="outline" className="font-mono text-[10px] py-0 px-2 bg-muted/50 border-border/40 text-muted-foreground">
														/webhook/{webhook.path}
													</Badge>
													<button
														onClick={() => copyWebhookUrl(webhook.path)}
														className="inline-flex items-center justify-center rounded-md p-0.5 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
														title="Copy URL"
													>
														<Copy className="w-3 h-3" />
													</button>
													{webhook.secret && (
														<Lock className="h-3 w-3 text-muted-foreground" />
													)}
												</div>
											</div>
											<Switch
												checked={webhook.is_active}
												onCheckedChange={() => toggleStatus(webhook)}
												className="data-[state=checked]:bg-primary"
											/>
										</div>
									</CardHeader>

									<CardContent className="pb-4">
										<div className="flex items-center gap-2 text-muted-foreground">
											<div className="p-1.5 rounded-lg bg-primary/5 text-primary">
												<Code className="w-3.5 h-3.5" />
											</div>
											<span className="text-xs font-medium">Lua Engine</span>
										</div>

										<div className="mt-4 flex items-center text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider">
											<Activity className="w-3 h-3 mr-1.5 text-primary/60" />
											Updated {new Date(webhook.updated_at || webhook.created_at || '').toLocaleDateString()}
										</div>
									</CardContent>

									<div className="flex items-center justify-between p-2 px-3 border-t bg-muted/30">
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
												onClick={() => copyWebhookUrl(webhook.path)}
												title="Copy URL"
											>
												<Copy className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 rounded-lg"
												onClick={() => onEditWebhook(webhook)}
												title="Edit Script"
											>
												<Code className="w-4 h-4" />
											</Button>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
											onClick={() => setDeleteId(webhook.id)}
											title="Delete Webhook"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</Card>
							))}
						</div>
					)}
				</div>
			</div>
		</ScrollArea>
	)
}
