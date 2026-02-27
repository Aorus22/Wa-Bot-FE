import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Play, Code, AlertCircle, CheckCircle2, Terminal, Info, Zap, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api, type Trigger } from '@/lib/api'
import { toast } from 'sonner'
import Editor from '@monaco-editor/react'
import { cn } from '@/lib/utils'

interface TriggerEditorViewProps {
  trigger: Trigger | null
  onBack: () => void
  onViewDocs: () => void
}

export function TriggerEditorView({ trigger, onBack, onViewDocs }: TriggerEditorViewProps) {
  const [formData, setFormData] = useState<Partial<Trigger>>({
    name: '',
    pattern: '',
    script: `-- Available: sender, content, matches, send_text(), fetch()...
local param = matches[1]
print("Simulating response for: " .. (param or "none"))
send_text(sender, "You said: " .. (param or "nothing"))`,
    is_active: true
  })

  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (trigger) {
      setFormData(trigger)
    }
  }, [trigger])

  const handleSave = async () => {
    if (!formData.name || !formData.pattern || !formData.script) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setIsSaving(true)
      if (formData.id) {
        await api.updateTrigger(formData.id, formData)
        toast.success('Trigger updated successfully')
      } else {
        await api.createTrigger(formData)
        toast.success('Trigger created successfully')
      }
      onBack()
    } catch (error) {
      toast.error('Failed to save trigger')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!formData.pattern || !formData.script || !testMessage) {
      toast.error('Pattern, script, and test message are required')
      return
    }

    try {
      setIsTesting(true)
      const result = await api.testTrigger({
        pattern: formData.pattern,
        script: formData.script,
        message: testMessage
      })
      setTestResult(result)
    } catch (error: any) {
      setTestResult({ error: error.message })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className='flex flex-col h-full w-full bg-background'>
      {/* Header */}
      <div className='p-6 border-b border-border/40 bg-muted/20 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={onBack} className='rounded-full'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-xl font-bold tracking-tight'>
              {formData.id ? 'Edit Trigger' : 'New Trigger'}
            </h1>
            <p className='text-xs text-muted-foreground'>Configure regex pattern and Lua script execution.</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='outline' onClick={onViewDocs} className='rounded-xl'>
            <FileText className='mr-2 h-4 w-4' /> Documentation
          </Button>
          <Button variant='outline' onClick={onBack} className='rounded-xl'>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className='rounded-xl px-6 font-bold shadow-lg shadow-primary/20'>
            {isSaving ? <span className='w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2' /> : <Save className='mr-2 h-4 w-4' />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className='flex-1 flex overflow-hidden'>
        {/* Left Side: Editor */}
        <div className='flex-1 flex flex-col border-r border-border/40 overflow-hidden'>
          <div className='p-6 space-y-6 flex-1 flex flex-col min-h-0'>
            <div className='grid grid-cols-2 gap-6 shrink-0'>
              <div className='space-y-2'>
                <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'>Trigger Name</Label>
                <Input 
                  placeholder='e.g., Auto Reply Greeting'
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className='rounded-xl h-11 border-border/40 bg-muted/30 focus-visible:ring-primary/20'
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1'>Regex Pattern</Label>
                <Input 
                  placeholder='^!test\s+(.*)'
                  value={formData.pattern}
                  onChange={e => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                  className='rounded-xl h-11 border-border/40 bg-muted/30 font-mono focus-visible:ring-primary/20'
                />
              </div>
            </div>
            
            <div className='space-y-3 flex-1 flex flex-col min-h-0'>
              <div className='flex items-center justify-between shrink-0'>
                <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2'>
                  <Code className='h-3 w-3 text-primary' />
                  Lua Script (Execution Logic)
                </Label>
                <div className='flex gap-2'>
                  <Badge variant='outline' className='text-[9px] font-mono py-0'>matches[n]</Badge>
                  <Badge variant='outline' className='text-[9px] font-mono py-0'>send_text(target, msg)</Badge>
                </div>
              </div>
              <div className='flex-1 rounded-2xl border border-border/40 overflow-hidden bg-[#1e1e1e]'>
                <Editor
                  height="100%"
                  defaultLanguage="lua"
                  theme="vs-dark"
                  value={formData.script}
                  onChange={(val) => setFormData(prev => ({ ...prev, script: val || '' }))}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Debugger */}
        <div className='w-[450px] bg-muted/10 flex flex-col'>
          <div className='p-6 border-b border-border/40 bg-muted/30'>
            <h2 className='text-sm font-bold flex items-center gap-2 mb-4'>
              <Terminal className='h-4 w-4 text-primary' />
              Trigger Debugger
            </h2>
            <div className='space-y-3'>
              <Label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Simulate Message</Label>
              <div className='flex gap-2'>
                <Input 
                  placeholder='Type a message to test...'
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTest()}
                  className='rounded-xl bg-background border-border/40'
                />
                <Button 
                  onClick={handleTest} 
                  disabled={isTesting}
                  className='rounded-xl px-4'
                >
                  {isTesting ? <span className='w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin' /> : <Play className='h-4 w-4' />}
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className='flex-1 p-6'>
            {testResult ? (
              <div className='space-y-6'>
                {/* Match Status */}
                <div className={cn(
                  'p-4 rounded-2xl flex items-center gap-3 border',
                  testResult.matched ? 'bg-green-500/5 border-green-500/20 text-green-600' : 'bg-destructive/5 border-destructive/20 text-destructive'
                )}>
                  {testResult.matched ? <CheckCircle2 className='h-5 w-5' /> : <AlertCircle className='h-5 w-5' />}
                  <div>
                    <p className='text-sm font-bold'>{testResult.matched ? 'Pattern Matched' : 'No Match'}</p>
                    <p className='text-[10px] opacity-80'>{testResult.matched ? 'Script would be executed' : 'Check your regex pattern'}</p>
                  </div>
                </div>

                {testResult.matched && (
                  <>
                    {/* Capture Groups */}
                    <div className='space-y-2'>
                      <Label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                        <Info className='h-3 w-3' /> Capture Groups (matches)
                      </Label>
                      <div className='p-3 rounded-xl bg-muted/50 border border-border/40 font-mono text-[11px] space-y-1'>
                        {testResult.matches?.map((m: string, i: number) => (
                          <div key={i} className='flex gap-2'>
                            <span className='text-muted-foreground'>[{i}]</span>
                            <span className='text-foreground'>{m || '""'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Output Logs */}
                    <div className='space-y-2'>
                      <Label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                        <Terminal className='h-3 w-3' /> Execution Logs (print)
                      </Label>
                      <div className='p-3 rounded-xl bg-black text-green-400 font-mono text-[11px] min-h-[100px] whitespace-pre-wrap leading-relaxed border border-white/5 shadow-inner'>
                        {testResult.logs?.length > 0 ? testResult.logs.join('\n') : '> No logs recorded'}
                        {testResult.error && <div className='text-destructive mt-2'>ERROR: {testResult.error}</div>}
                      </div>
                    </div>

                    {/* Resulting Actions */}
                    <div className='space-y-2'>
                      <Label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                        <Zap className='h-3 w-3' /> Simulated Actions
                      </Label>
                      <div className='space-y-2'>
                        {testResult.actions?.length > 0 ? (
                          testResult.actions.map((a: string, i: number) => (
                            <div key={i} className='p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-primary font-medium flex items-center gap-2'>
                              <div className='w-1 h-1 rounded-full bg-primary' />
                              {a}
                            </div>
                          ))
                        ) : (
                          <div className='p-3 rounded-xl bg-muted/50 border border-border/40 text-[11px] text-muted-foreground italic'>
                            No messaging actions performed.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className='h-full flex flex-col items-center justify-center text-center opacity-40 py-20'>
                <Play className='h-12 w-12 mb-4 text-muted-foreground' />
                <p className='text-sm font-medium'>Ready to debug</p>
                <p className='text-xs max-w-[200px] mt-1'>Enter a test message above and click Play to simulate execution.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
