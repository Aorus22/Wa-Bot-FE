import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Save, Play, Code, CheckCircle2, AlertCircle, Terminal, X, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, type CronJob } from '@/lib/api'
import { toast } from 'sonner'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { cn } from '@/lib/utils'
import { AIAssistant } from '@/components/AIAssistant'

interface CronEditorPageProps {
	job: CronJob | null
	onBack: () => void
	isMobileView?: boolean
}

export function CronEditorPage({ job, onBack, isMobileView }: CronEditorPageProps) {
	const [formData, setFormData] = useState<Partial<CronJob>>({
		name: '',
		schedule: '0 * * * *',
		script: `-- Scheduled Task\nprint("Executing sequence: " .. os.date())\nsend_text("628123456789@s.whatsapp.net", "Automatic scheduled broadcast")`,
		is_active: true
	})
	const [isSaving, setIsSaving] = useState(false)
	const [testResult, setTestResult] = useState<any>(null)
	const [isTesting, setIsTesting] = useState(false)
    const [activeTab, setActiveTab] = useState('editor')
    const [proposedCode, setProposedCode] = useState<string | null>(null)
    const diffEditorRef = useRef<any>(null)

	useEffect(() => {
		if (job) setFormData(job)
	}, [job])

    const handleApplyAIChange = (newCode: string) => {
        setProposedCode(newCode)
        if (isMobileView) setActiveTab('editor')
    }

    const handleAcceptChange = () => {
        if (proposedCode) {
            setFormData(prev => ({ ...prev, script: proposedCode }))
            setProposedCode(null)
        }
    }

    const handleRejectChange = () => setProposedCode(null)

	const handleSave = async () => {
		if (!formData.name || !formData.schedule || !formData.script) {
			toast.error('Please fill in all required fields')
			return
		}
		try {
			setIsSaving(true)
			if (formData.id) {
				await api.updateCronJob(formData.id, formData as CronJob)
				toast.success('Cron job updated successfully')
			} else {
				await api.createCronJob(formData as CronJob)
				toast.success('Cron job created successfully')
			}
			onBack()
		} catch (error) {
			toast.error('Failed to save cron job')
		} finally {
			setIsSaving(false)
		}
	}

	const handleTest = async () => {
		try {
			setIsTesting(true)
			const result = await api.testCronJob(formData.script || '')
			setTestResult(result)
            if (isMobileView) setActiveTab('debugger')
		} catch (error: any) {
			setTestResult({ error: error.message })
		} finally {
			setIsTesting(false)
		}
	}

    const editorContent = (
        <div className="p-4 md:p-6 space-y-6 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 shrink-0">
                <div className="space-y-2">
                    <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Task Name</Label>
                    <Input placeholder="e.g., Daily Broadcast" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl h-10 md:h-11 border-border/40 bg-muted/30 focus-visible:ring-primary/20" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Cron Schedule</Label>
                    <Input placeholder="0 * * * *" value={formData.schedule} onChange={e => setFormData(prev => ({ ...prev, schedule: e.target.value }))} className="rounded-xl h-10 md:h-11 border-border/40 bg-muted/30 font-mono focus-visible:ring-primary/20" />
                </div>
            </div>

            <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                    <Label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2">
                        <Code className="h-3 w-3 text-primary" /> Task Script Logic
                    </Label>
                    <div className="flex gap-1 md:gap-2">
                        <Badge variant="outline" className="text-[8px] md:text-[9px] font-mono py-0 px-1 md:px-2">os.date()</Badge>
                        <Badge variant="outline" className="text-[8px] md:text-[9px] font-mono py-0 px-1 md:px-2 hidden sm:inline-flex">send_text()</Badge>
                    </div>
                </div>
                <div className="rounded-2xl border border-border/40 overflow-hidden bg-[#1e1e1e] shadow-inner relative" style={{ height: '450px' }}>
                    {proposedCode ? (
                        <>
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 p-1.5 bg-background/60 backdrop-blur-xl border border-border/40 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-1.5 px-2 border-r border-border/40 mr-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Suggestion</span>
                                </div>
                                <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/20">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-background/50" onClick={() => diffEditorRef.current?.goToDiff('previous')} title="Previous change"><ArrowLeft className="h-3 w-3" /></Button>
                                    <div className="w-px h-3 bg-border/20 mx-0.5" />
                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-background/50" onClick={() => diffEditorRef.current?.goToDiff('next')} title="Next change"><Play className="h-3 w-3 rotate-90" /></Button>
                                </div>
                                <Button size="sm" variant="ghost" className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={handleRejectChange}><X className="mr-1.5 h-3 w-3" /> Reject</Button>
                                <Button size="sm" className="h-7 px-3.5 rounded-lg text-[11px] font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={handleAcceptChange}><CheckCircle2 className="mr-1.5 h-3 w-3" /> Accept</Button>
                            </div>
                            <DiffEditor height="100%" original={formData.script} modified={proposedCode} language="lua" theme="vs-dark" onMount={(editor) => {
                                diffEditorRef.current = editor;
                                editor.getModifiedEditor().updateOptions({ readOnly: false });
                                editor.getModifiedEditor().onDidChangeModelContent(() => { setProposedCode(editor.getModifiedEditor().getValue()); });
                            }} options={{ renderSideBySide: false, readOnly: false, fontSize: isMobileView ? 11 : 12, automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, useInlineViewWhenSpaceIsLimited: true, renderOverviewRuler: false }} />
                        </>
                    ) : (
                        <Editor height="100%" defaultLanguage="lua" theme="vs-dark" value={formData.script} onChange={(val) => setFormData(prev => ({ ...prev, script: val || '' }))} options={{ minimap: { enabled: false }, fontSize: isMobileView ? 12 : 13, lineNumbers: 'on', roundedSelection: true, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 16, bottom: 16 }, fixedOverflowWidgets: true }} />
                    )}
                </div>
            </div>
        </div>
    )

    const debuggerContent = (
        <div className="p-4 md:p-6 space-y-6 flex flex-col">
            <div className="p-4 md:p-6 border border-border/40 bg-muted/30 rounded-2xl">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <Terminal className="h-4 w-4 text-primary" /> Process Monitor
                </h2>
                <div className="space-y-3">
                    <Button onClick={handleTest} disabled={isTesting} className="w-full rounded-xl h-11 bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold">
                        {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Run Simulation
                    </Button>
                </div>
            </div>
            {testResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={cn('p-4 rounded-2xl border flex items-center gap-4 shadow-sm', testResult.success ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' : 'bg-destructive/10 border-destructive/20 text-destructive')}>
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner', testResult.success ? 'bg-green-500/20' : 'bg-destructive/20')}>
                            {testResult.success ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                        </div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wider">{testResult.success ? 'Execution Success' : 'Execution Failed'}</p>
                            <p className="text-xs opacity-80">{testResult.success ? 'The script ran without errors.' : 'Check the logs for details.'}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Terminal className="h-3 w-3" /> Output Logs</Label>
                        <div className="p-3 rounded-xl bg-black text-green-400 font-mono text-[10px] md:text-[11px] min-h-[120px] whitespace-pre-wrap leading-relaxed border border-white/5 shadow-inner">
                            {testResult.logs?.length > 0 ? testResult.logs.join('\n') : '> No output recorded'}
                            {testResult.error && <div className="text-destructive mt-2 font-bold">ERROR: {testResult.error}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

	return (
		<div className="h-full w-full bg-background flex flex-col overflow-hidden relative">
			<div className="p-4 md:p-6 border-b border-border/40 bg-muted/20 shrink-0 flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-8 w-8 md:h-10 md:w-10 shrink-0">
						<ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
					</Button>
					<h1 className="text-sm md:text-xl font-bold tracking-tight truncate max-w-[120px] sm:max-w-none">{formData.id ? 'Edit' : 'New'} <span className="hidden sm:inline">Sequence</span></h1>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={onBack} className="rounded-xl h-8 md:h-10 px-2 md:px-4 text-xs md:text-sm">Cancel</Button>
					<Button onClick={handleSave} disabled={isSaving} className="rounded-xl h-8 md:h-10 px-2 md:px-6 text-xs md:text-sm font-bold shadow-lg shadow-primary/20">
						{isSaving ? <span className="w-3 h-3 md:w-4 md:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1 md:mr-2" /> : <Save className="mr-1 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />}
						Save
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto w-full">
				<div className="flex flex-col min-h-full pb-32">
					{isMobileView ? (
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
							<div className="px-4 pt-4 shrink-0">
								<TabsList className="grid w-full grid-cols-2 rounded-xl h-10">
									<TabsTrigger value="editor" className="rounded-lg text-xs font-bold uppercase tracking-wider">Config</TabsTrigger>
									<TabsTrigger value="debugger" className="rounded-lg text-xs font-bold uppercase tracking-wider">Monitor</TabsTrigger>
								</TabsList>
							</div>
							<TabsContent value="editor" className="m-0 p-0 outline-none">{editorContent}</TabsContent>
							<TabsContent value="debugger" className="m-0 p-0 outline-none">{debuggerContent}</TabsContent>
						</Tabs>
					) : (
						<div className="flex flex-col md:flex-row divide-x divide-border/40">
							<div className="flex-1">{editorContent}</div>
							<div className="w-[400px] lg:w-[450px]">{debuggerContent}</div>
						</div>
					)}
				</div>
			</div>

            {isMobileView && activeTab === 'editor' && (
				<div className="fixed bottom-24 right-6 z-50">
					<AIAssistant currentCode={formData.script} onApplyCode={handleApplyAIChange} />
				</div>
			)}
			{!isMobileView && <AIAssistant currentCode={formData.script} onApplyCode={handleApplyAIChange} />}
		</div>
	)
}
