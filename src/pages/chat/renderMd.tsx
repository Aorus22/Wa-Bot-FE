import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"

const MD_PREFIX = "{{md:"
const MD_SUFFIX = "}}"

export const isMarkdownContent = (content: string): boolean => {
    if (!content) return false
    const t = content.trim()
    return t.startsWith(MD_PREFIX) && t.endsWith(MD_SUFFIX)
}

export const encodeMarkdown = (text: string): string => {
    return `${MD_PREFIX}${btoa(unescape(encodeURIComponent(text)))}${MD_SUFFIX}`
}

const RenderMarkdown = ({ content }: { content: string }) => (
    <div className="w-full min-w-0 overflow-x-auto scrollbar-none prose prose-sm dark:prose-invert max-w-none break-words">
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed break-words whitespace-pre-wrap">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm break-words">{children}</li>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline underline-offset-2 break-all">{children}</a>,
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeStr = String(children).replace(/\n$/, '')
                    return !inline && match ? (
                        <div className='rounded-lg my-2 border border-border/40 bg-black/50 group/code w-full min-w-0 flex flex-col overflow-hidden'>
                            <div className='flex items-center px-3 py-1.5 bg-muted/50 border-b border-border/40 shrink-0'>
                                <span className='text-[10px] font-bold uppercase text-muted-foreground'>{match[1]}</span>
                            </div>
                            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20">
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                        margin: 0,
                                        padding: '1rem',
                                        fontSize: '11px',
                                        background: 'transparent',
                                        width: 'max-content',
                                        minWidth: '100%'
                                    }}
                                    {...props}
                                >
                                    {codeStr}
                                </SyntaxHighlighter>
                            </div>
                        </div>
                    ) : (
                        <code className={cn("bg-black/20 px-1 py-0.5 rounded font-mono text-[0.9em] break-all whitespace-pre-wrap", className)} {...props}>
                            {children}
                        </code>
                    )
                }
            }}
        >
            {content}
        </ReactMarkdown>
    </div>
)

export const renderFormattedContent = (content: string) => {
    if (!content) return null

    if (isMarkdownContent(content)) {
        try {
            const t = content.trim()
            const base64 = t.slice(MD_PREFIX.length, -MD_SUFFIX.length)
            const decoded = decodeURIComponent(escape(atob(base64)))
            return <RenderMarkdown content={decoded} />
        } catch { /* invalid base64, fall through to WA format */ }
    }

    const parts = content.split(/(\*.*?\*|_.*?_|~.*?~|`.*?`|\n|https?:\/\/[^\s]+)/g)

    return parts.map((part, index) => {
        if (part.startsWith("*") && part.endsWith("*")) {
            return <strong key={index}>{part.slice(1, -1)}</strong>
        }
        if (part.startsWith("_") && part.endsWith("_")) {
            return <em key={index}>{part.slice(1, -1)}</em>
        }
        if (part.startsWith("~") && part.endsWith("~")) {
            return <del key={index}>{part.slice(1, -1)}</del>
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={index} className="bg-muted px-1 rounded">{part.slice(1, -1)}</code>
        }
        if (part === "\n") {
            return <br key={index} />
        }
        if (part.match(/^https?:\/\/[^\s]+$/)) {
            return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline underline-offset-2 break-all">{part}</a>
        }
        return part
    })
}
